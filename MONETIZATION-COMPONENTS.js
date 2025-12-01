// ============================================
// MONETIZATION-COMPONENTS.js
// Componentes básicos de monetización
// ============================================

import React from 'react';
import { View, Text } from 'react-native';

// ============ PLANES ============
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: ['Gestión básica', 'Hasta 100 árboles'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 9.99,
    features: ['Árboles ilimitados', 'Reportes avanzados', 'Sin anuncios'],
  },
};

// ============ FUNCIONES ============

/**
 * Verificar si el usuario tiene premium
 */
export const checkIfPremium = async (userId, db) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.isPremium || false;
    }
    return false;
  } catch (error) {
    console.error('Error verificando premium:', error);
    return false;
  }
};

/**
 * Obtener anuncios vistos hoy
 */
export const getAdsWatchedToday = async (db, userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection('adCredits')
      .doc(today)
      .get();
    
    if (doc.exists) {
      return doc.data().adsWatched || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error obteniendo anuncios:', error);
    return 0;
  }
};

/**
 * Limpiar créditos expirados
 */
export const cleanExpiredCredits = async (db, userId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('adCredits')
      .where('createdAt', '<', sevenDaysAgo)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Limpiados ${snapshot.docs.length} créditos expirados`);
  } catch (error) {
    console.error('Error limpiando créditos:', error);
  }
};

// ============ COMPONENTES MOCK ============

/**
 * Banner de anuncios (mock)
 */
export const AdBanner = ({ style }) => {
  return (
    <View style={[{ height: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text style={{ color: '#999', fontSize: 12 }}>[ Espacio para anuncio ]</Text>
    </View>
  );
};

/**
 * Mostrar anuncio intersticial (mock)
 */
export const showInterstitialAd = async () => {
  console.log('🎬 Mostrando anuncio intersticial (mock)');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('✅ Anuncio intersticial completado');
      resolve(true);
    }, 1000);
  });
};

/**
 * Mostrar anuncio con recompensa (mock)
 */
export const showRewardedAd = async () => {
  console.log('🎁 Mostrando anuncio con recompensa (mock)');
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('✅ Anuncio con recompensa completado');
      resolve(true);
    }, 1000);
  });
};

/**
 * Modal para solicitar premium (mock)
 */
export const RequestPremiumModal = ({ visible, onClose }) => {
  if (!visible) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Upgrade a Premium</Text>
        <Text>Desbloquea todas las funciones con Premium</Text>
      </View>
    </View>
  );
};

/**
 * Paywall (mock)
 */
export const Paywall = ({ visible, feature, onClose, onUpgrade }) => {
  if (!visible) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Función Premium</Text>
        <Text>{feature} requiere Premium</Text>
      </View>
    </View>
  );
};

/**
 * Dashboard de métricas de admin (mock)
 */
export const AdminMetricsDashboard = ({ visible, onClose }) => {
  if (!visible) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 20, padding: 20 }}>Admin Metrics Dashboard</Text>
    </View>
  );
};

/**
 * Panel para activar premium (mock)
 */
export const ActivatePremiumPanel = ({ visible, onClose, onActivate }) => {
  if (!visible) return null;
  
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Activar Premium</Text>
        <Text>Panel de activación de premium</Text>
      </View>
    </View>
  );
};

/**
 * Dashboard de métricas de plataforma (mock)
 */
export const PlatformMetricsDashboard = ({ onBack }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Platform Metrics</Text>
      <Text style={{ marginTop: 10 }}>Dashboard de métricas de la plataforma</Text>
    </View>
  );
};

// ============ EXPORT DEFAULT ============
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