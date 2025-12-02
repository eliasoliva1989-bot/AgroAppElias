/**
 * MONETIZATION-COMPONENTS.js
 * Sistema completo de monetización para AgroApp
 * - Premium: $10 USD/mes
 * - PayPal: paypal.me/AgroAppGt
 * - WhatsApp: +502 4174-1369
 * - Admin: admin@nadrika.com
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Linking, Alert } from 'react-native';

// ============ CONSTANTS ============

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Gestión básica de finca',
      'Hasta 50 árboles',
      'Reportes básicos',
      'Con publicidad',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 10,
    currency: 'USD',
    period: 'mes',
    features: [
      'Sin publicidad',
      'Árboles ilimitados',
      'Reportes avanzados y gráficas',
      'Exportar a PDF/Excel',
      'Múltiples fincas',
      'Pronóstico del clima',
      'Análisis de rentabilidad',
      'Soporte prioritario',
    ],
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Verifica si un usuario tiene premium activo
 */
export const checkIfPremium = async (userId, db) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData) return false;
    
    // Verificar si tiene premium activo
    if (userData.isPremium) {
      // Verificar si no ha expirado
      if (userData.premiumUntil) {
        const premiumUntil = userData.premiumUntil.toDate();
        const now = new Date();
        
        if (now < premiumUntil) {
          return true;
        } else {
          // Premium expirado, actualizar estado
          await db.collection('users').doc(userId).update({
            isPremium: false,
          });
          return false;
        }
      }
      return true; // Premium sin fecha de expiración (lifetime)
    }
    
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

/**
 * Obtiene el número de ads vistas hoy (para sistema de recompensas)
 */
export const getAdsWatchedToday = async (db, userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_watches')
      .where('date', '>=', today)
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Error getting ads watched:', error);
    return 0;
  }
};

/**
 * Limpia créditos expirados de ads
 */
export const cleanExpiredCredits = async (db, userId) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('ad_watches')
      .where('date', '<', yesterday)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error cleaning expired credits:', error);
  }
};

// ============ AD COMPONENTS (MOCK) ============

/**
 * Banner de publicidad (placeholder)
 */
export const AdBanner = ({ style }) => {
  return (
    <View style={[{ 
      backgroundColor: '#f0f0f0', 
      padding: 15, 
      borderRadius: 8, 
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
    }, style]}>
      <Text style={{ color: '#999', fontSize: 12 }}>📢 Espacio publicitario</Text>
      <Text style={{ color: '#666', fontSize: 10, marginTop: 5 }}>
        Upgrade a Premium para remover ads
      </Text>
    </View>
  );
};

/**
 * Mostrar ad intersticial (mock)
 */
export const showInterstitialAd = async () => {
  // En producción, aquí iría la integración con AdMob/Facebook Ads
  console.log('📢 Showing interstitial ad (mock)');
  return new Promise(resolve => setTimeout(resolve, 1000));
};

/**
 * Mostrar ad con recompensa (mock)
 */
export const showRewardedAd = async () => {
  // En producción, aquí iría la integración con AdMob/Facebook Ads
  console.log('📢 Showing rewarded ad (mock)');
  return new Promise(resolve => setTimeout(() => resolve(true), 2000));
};

// ============ REQUEST PREMIUM MODAL ============

export const RequestPremiumModal = ({ visible, onClose, userId, userEmail, db }) => {
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayPalPayment = () => {
    Linking.openURL('https://paypal.me/AgroAppGt/10');
    Alert.alert(
      'PayPal',
      'Después de completar el pago, regresa aquí y pega el ID de transacción de PayPal.',
      [{ text: 'OK' }]
    );
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa el plan Premium de AgroApp ($10/mes). Mi email: ${userEmail}`
    );
    Linking.openURL(`https://wa.me/50241741369?text=${message}`);
  };

  const handleSubmitRequest = async () => {
    if (paymentMethod === 'paypal' && !transactionId.trim()) {
      Alert.alert('Error', 'Por favor ingresa el ID de transacción de PayPal');
      return;
    }

    setLoading(true);
    try {
      await db.collection('premium_requests').add({
        userId,
        userEmail,
        paymentMethod,
        transactionId: transactionId.trim(),
        notes: notes.trim(),
        status: 'pending',
        requestDate: new Date(),
        amount: 10,
        currency: 'USD',
      });

      Alert.alert(
        '✅ Solicitud Enviada',
        'Tu solicitud ha sido enviada. Te notificaremos cuando se active tu plan Premium (usualmente en 24-48 horas).',
        [
          {
            text: 'OK',
            onPress: () => {
              setTransactionId('');
              setNotes('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>🌟 Upgrade a Premium</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 28, color: '#666' }}>✖️</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <View style={{ backgroundColor: '#E8F5E9', padding: 20, borderRadius: 12, marginBottom: 20 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center' }}>$10 USD/mes</Text>
              <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 }}>Desbloquea todas las funciones</Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>✨ Beneficios Premium:</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>• Sin publicidad</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>• Reportes ilimitados</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>• Múltiples fincas</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>• Soporte prioritario</Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>• Todas las funciones desbloqueadas</Text>
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>💳 Método de Pago</Text>

            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  backgroundColor: paymentMethod === 'paypal' ? '#0070BA' : '#f5f5f5',
                  marginRight: 10,
                  alignItems: 'center',
                }}
                onPress={() => setPaymentMethod('paypal')}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: paymentMethod === 'paypal' ? 'white' : '#666' }}>PayPal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 10,
                  backgroundColor: paymentMethod === 'whatsapp' ? '#25D366' : '#f5f5f5',
                  alignItems: 'center',
                }}
                onPress={() => setPaymentMethod('whatsapp')}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: paymentMethod === 'whatsapp' ? 'white' : '#666' }}>WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {paymentMethod === 'paypal' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
                  1. Haz clic en "Pagar con PayPal" para completar el pago de $10 USD{'\n'}
                  2. Después del pago, regresa aquí y pega el ID de transacción{'\n'}
                  3. Presiona "Enviar Solicitud"
                </Text>

                <TouchableOpacity
                  style={{ backgroundColor: '#0070BA', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 }}
                  onPress={handlePayPalPayment}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>💳 Pagar con PayPal</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#333' }}>ID de Transacción de PayPal:</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    backgroundColor: 'white',
                  }}
                  placeholder="Ej: 1AB23456CD789012E"
                  value={transactionId}
                  onChangeText={setTransactionId}
                />
              </View>
            )}

            {paymentMethod === 'whatsapp' && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 15 }}>
                  Contáctanos por WhatsApp para coordinar otras formas de pago (transferencia, depósito, etc.)
                </Text>

                <TouchableOpacity
                  style={{ backgroundColor: '#25D366', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 }}
                  onPress={handleWhatsAppContact}
                >
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>💬 Contactar por WhatsApp</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                  +502 4174-1369
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#333' }}>Notas (opcional):</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                backgroundColor: 'white',
                height: 80,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
              placeholder="Agrega cualquier comentario adicional..."
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              style={{
                backgroundColor: '#4CAF50',
                padding: 18,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 10,
                opacity: loading ? 0.6 : 1,
              }}
              onPress={handleSubmitRequest}
              disabled={loading}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                {loading ? '⏳ Enviando...' : '📤 Enviar Solicitud'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 15, alignItems: 'center', marginBottom: 20 }}
              onPress={onClose}
            >
              <Text style={{ color: '#666', fontSize: 16 }}>Cancelar</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 20 }}>
              Tu plan Premium se activará en 24-48 horas después de verificar el pago.{'\n'}
              Recibirás una notificación por email.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============ PAYWALL ============

export const Paywall = ({ feature, onRequestPremium, onClose }) => {
  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 30, width: '100%', maxWidth: 400 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>🔒 Función Premium</Text>
          
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            {feature} requiere una cuenta Premium
          </Text>

          <View style={{ backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, color: '#333', marginBottom: 5 }}>✨ Con Premium obtienes:</Text>
            <Text style={{ fontSize: 13, color: '#666' }}>• Sin publicidad</Text>
            <Text style={{ fontSize: 13, color: '#666' }}>• Todas las funciones desbloqueadas</Text>
            <Text style={{ fontSize: 13, color: '#666' }}>• Múltiples fincas</Text>
            <Text style={{ fontSize: 13, color: '#666' }}>• Soporte prioritario</Text>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', padding: 18, borderRadius: 12, marginBottom: 10 }}
            onPress={onRequestPremium}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
              🌟 Upgrade a Premium ($10/mes)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 15 }}
            onPress={onClose}
          >
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============ ADMIN COMPONENTS ============

/**
 * Dashboard de métricas de admin
 */
export const AdminMetricsDashboard = ({ onBack, db, userId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadPremiumRequests();
  }, []);

  const loadPremiumRequests = async () => {
    try {
      const snapshot = await db
        .collection('premium_requests')
        .orderBy('requestDate', 'desc')
        .limit(50)
        .get();
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePremium = async (request) => {
    Alert.alert(
      'Activar Premium',
      `¿Activar premium para ${request.userEmail}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Activar',
          onPress: async () => {
            try {
              const premiumUntil = new Date();
              premiumUntil.setMonth(premiumUntil.getMonth() + 1);

              await db.collection('users').doc(request.userId).update({
                isPremium: true,
                premiumUntil,
                premiumActivatedAt: new Date(),
              });

              await db.collection('premium_requests').doc(request.id).update({
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: userId,
              });

              Alert.alert('✅ Éxito', 'Premium activado correctamente');
              loadPremiumRequests();
            } catch (error) {
              console.error('Error activating premium:', error);
              Alert.alert('Error', 'No se pudo activar premium');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>Admin - Solicitudes Premium</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Cargando...</Text>
        </View>
      ) : (
        <ScrollView style={{ padding: 20 }}>
          {requests.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>
              No hay solicitudes pendientes
            </Text>
          ) : (
            requests.map(request => (
              <View key={request.id} style={{ backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>{request.userEmail}</Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 3 }}>
                  Método: {request.paymentMethod === 'paypal' ? '💳 PayPal' : '💬 WhatsApp'}
                </Text>
                {request.transactionId && (
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 3 }}>
                    ID: {request.transactionId}
                  </Text>
                )}
                {request.notes && (
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 3 }}>
                    Notas: {request.notes}
                  </Text>
                )}
                <Text style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>
                  {request.requestDate?.toDate().toLocaleDateString()}
                </Text>
                
                {request.status === 'pending' ? (
                  <TouchableOpacity
                    style={{ backgroundColor: '#4CAF50', padding: 12, borderRadius: 8 }}
                    onPress={() => handleActivatePremium(request)}
                  >
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                      ✅ Activar Premium
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8 }}>
                    <Text style={{ color: '#4CAF50', textAlign: 'center' }}>
                      ✅ Aprobado
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

/**
 * Panel para activar premium (legacy - ahora se usa AdminMetricsDashboard)
 */
export const ActivatePremiumPanel = ({ visible, onClose, onActivate }) => {
  if (!visible) return null;
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Activar Premium</Text>
          <Text>Este panel ha sido reemplazado por AdminMetricsDashboard</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#666', padding: 12, borderRadius: 8, marginTop: 15 }}
            onPress={onClose}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Dashboard de métricas de plataforma (legacy - ahora se usa AdminMetricsDashboard)
 */
export const PlatformMetricsDashboard = ({ onBack }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ fontSize: 24 }}>← Volver</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>Platform Metrics</Text>
      <Text style={{ color: '#666', marginTop: 10 }}>
        Este dashboard ha sido reemplazado por AdminMetricsDashboard
      </Text>
    </View>
  );
};

// ============ EXPORTS ============

export default {
  PLANS,
  checkIfPremium,
  getAdsWatchedToday,
  cleanExpiredCredits,
  AdBanner,
  showInterstitialAd,
  showRewardedAd,
  RequestPremiumModal,
  Paywall,
  AdminMetricsDashboard,
  ActivatePremiumPanel,
  PlatformMetricsDashboard,
};