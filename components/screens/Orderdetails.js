import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faCheckCircle,
  faCircleNotch,
  faClock,
  faTimes,
  faInfoCircle,
  faLink,
  faHashtag,
  faLayerGroup,
  faCalendar,
  faChartLine,
  faRotate,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const OrderDetails = ({ navigate, orderId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await ApiService.getOrderStatus(orderId);
      
      if (orderData) {
        setOrder(orderData);
      } else {
        Alert.alert('Error', 'Order not found');
        navigate('Orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  const getStatusInfo = (status) => {
    const normalizedStatus = (status || 'pending').toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return {
          color: '#10b981',
          bgColor: '#dcfce7',
          borderColor: '#bbf7d0',
          icon: faCheckCircle,
          title: 'Completed',
          description: 'Your order has been completed successfully',
          progress: 100,
        };
      case 'processing':
      case 'in_progress':
        return {
          color: '#3b82f6',
          bgColor: '#dbeafe',
          borderColor: '#bfdbfe',
          icon: faCircleNotch,
          title: 'Processing',
          description: 'Your order is being processed',
          progress: 50,
        };
      case 'pending':
        return {
          color: '#f59e0b',
          bgColor: '#fed7aa',
          borderColor: '#fdba74',
          icon: faClock,
          title: 'Pending',
          description: 'Your order is waiting to be processed',
          progress: 25,
        };
      case 'failed':
      case 'cancelled':
        return {
          color: '#ef4444',
          bgColor: '#fee2e2',
          borderColor: '#fecaca',
          icon: faTimes,
          title: 'Failed',
          description: 'Your order could not be completed',
          progress: 0,
        };
      case 'partial':
        return {
          color: '#f59e0b',
          bgColor: '#fed7aa',
          borderColor: '#fdba74',
          icon: faExclamationTriangle,
          title: 'Partial',
          description: 'Order partially completed',
          progress: 75,
        };
      default:
        return {
          color: '#64748b',
          bgColor: '#f1f5f9',
          borderColor: '#cbd5e1',
          icon: faInfoCircle,
          title: 'Unknown',
          description: 'Status unknown',
          progress: 0,
        };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('Orders')}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const startCount = parseInt(order.start_count || 0);
  const remains = parseInt(order.remains || order.quantity || 0);
  const quantity = parseInt(order.quantity || 0);
  const delivered = quantity - remains;
  const progressPercentage = quantity > 0 ? Math.round((delivered / quantity) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      {/* Header */}
      <LinearGradient
        colors={['#800080', '#9933cc', '#b84dff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigate('Orders')}
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <Text style={styles.headerSubtitle}>#{order.order_id || order.display_id || order.id}</Text>
          </View>

          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={onRefresh}
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faRotate} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={[statusInfo.bgColor, '#ffffff']}
            style={styles.statusGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}>
            <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.bgColor }]}>
              <FontAwesomeIcon icon={statusInfo.icon} size={32} color={statusInfo.color} />
            </View>
            
            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
              {statusInfo.title}
            </Text>
            <Text style={styles.statusDescription}>{statusInfo.description}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>Progress</Text>
                <Text style={[styles.progressPercentage, { color: statusInfo.color }]}>
                  {progressPercentage}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={[statusInfo.color, statusInfo.color + '88']}
                  style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressStat}>
                  Delivered: <Text style={styles.progressStatValue}>{delivered}</Text>
                </Text>
                <Text style={styles.progressStat}>
                  Remaining: <Text style={styles.progressStatValue}>{remains}</Text>
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Order Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Order Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faHashtag} size={16} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>#{order.order_id || order.display_id || order.id}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faLayerGroup} size={16} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{order.service_name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faLink} size={16} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Link</Text>
              <Text style={styles.infoValueLink} numberOfLines={2}>{order.link}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faChartLine} size={16} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Quantity</Text>
              <Text style={styles.infoValue}>{quantity.toLocaleString()}</Text>
            </View>
          </View>

          {startCount > 0 && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FontAwesomeIcon icon={faChartLine} size={16} color="#64748b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Start Count</Text>
                <Text style={styles.infoValue}>{startCount.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faCalendar} size={16} color="#64748b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>
                {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
              </Text>
            </View>
          </View>

          {order.completed_at && (
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FontAwesomeIcon icon={faCalendar} size={16} color="#64748b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Completed</Text>
                <Text style={styles.infoValue}>
                  {new Date(order.completed_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Charge Card */}
        <View style={styles.chargeCard}>
          <LinearGradient
            colors={['#800080', '#9933cc']}
            style={styles.chargeGradient}>
            <Text style={styles.chargeLabel}>Total Charge</Text>
            <Text style={styles.chargeAmount}>${parseFloat(order.charge || 0).toFixed(2)}</Text>
          </LinearGradient>
        </View>

        {/* Additional Info */}
        {order.refill_button && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <FontAwesomeIcon icon={faInfoCircle} size={16} color="#3b82f6" />
            </View>
            <Text style={styles.noticeText}>
              Refill available for this order
            </Text>
          </View>
        )}

        {order.cancel_button && (
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <FontAwesomeIcon icon={faInfoCircle} size={16} color="#f59e0b" />
            </View>
            <Text style={styles.noticeText}>
              This order can be cancelled
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#800080',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  statusCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressStat: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  progressStatValue: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  infoValueLink: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  chargeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  chargeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  chargeLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chargeAmount: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  noticeCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default OrderDetails;
