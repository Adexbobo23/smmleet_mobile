// ENHANCED: Beautiful Orders screen with modern design and appropriate icons
// FIXED: Icon errors - replaced non-existent icons with valid ones
// FIXED: Alert replaced with custom modal

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSearch,
  faCircleNotch,
  faClock,
  faTimes,
  faEye,
  faChartLine,
  faStar,
  faLink,
  faShoppingBag,
  faHourglassHalf,
  faCheckCircle,
  faTimesCircle,
  faHashtag,
  faCubes,
  faDollarSign,
  faCalendarAlt,
  faChartBar,
  faPlayCircle,
  faPlus,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

// Fallback icon to prevent undefined errors
const FALLBACK_ICON = faClock;

// Safe icon wrapper to prevent crashes from undefined icons
const SafeIcon = ({ icon, size, color, style }) => {
  const safeIcon = icon || FALLBACK_ICON;
  
  if (!safeIcon) {
    console.warn('⚠️ SafeIcon: No icon provided, skipping render');
    return null;
  }
  
  return <FontAwesomeIcon icon={safeIcon} size={size} color={color} style={style} />;
};

const { width: screenWidth } = Dimensions.get('window');

const Orders = ({ navigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    pending: 0,
  });

  // Modal States
  const [alertModal, setAlertModal] = useState({
    visible: false,
    success: true,
    title: '',
    message: '',
  });

  const [orderDetailModal, setOrderDetailModal] = useState({
    visible: false,
    order: null,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [searchQuery, filterStatus, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getOrders();
      
      if (response && response.results) {
        setOrders(response.results);
      } else if (Array.isArray(response)) {
        setOrders(response);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setAlertModal({
        visible: true,
        success: false,
        title: 'Error',
        message: 'Failed to load orders',
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const completed = orders.filter(o => (o.status || '').toLowerCase() === 'completed').length;
    const processing = orders.filter(o => {
      const status = (o.status || '').toLowerCase();
      return status === 'processing' || status === 'in_progress';
    }).length;
    const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;

    setStats({
      total: orders.length,
      completed,
      processing,
      pending,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order => {
        const orderId = (order.order_id || order.id || '').toString().toLowerCase();
        const serviceName = (order.service_name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return orderId.includes(query) || serviceName.includes(query);
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => {
        const orderStatus = (order.status || '').toLowerCase();
        return orderStatus === filterStatus.toLowerCase();
      });
    }

    setFilteredOrders(filtered);
  };

  const getStatusStyle = (status) => {
    // Default/fallback style with guaranteed icon
    const defaultStyle = {
      bg: '#f1f5f9',
      border: '#cbd5e1',
      text: '#475569',
      icon: FALLBACK_ICON,
    };
    
    // Safety check - return default if no status
    if (!status) {
      return defaultStyle;
    }
    
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'completed':
        return {
          bg: '#dcfce7',
          border: '#bbf7d0',
          text: '#15803d',
          icon: faCheckCircle,
        };
      case 'processing':
      case 'in_progress':
        return {
          bg: '#dbeafe',
          border: '#bfdbfe',
          text: '#1e40af',
          icon: faCircleNotch,
        };
      case 'pending':
        return {
          bg: '#fed7aa',
          border: '#fdba74',
          text: '#9a3412',
          icon: faHourglassHalf,
        };
      case 'failed':
      case 'cancelled':
      case 'canceled':
        return {
          bg: '#fee2e2',
          border: '#fecaca',
          text: '#991b1b',
          icon: faTimesCircle,
        };
      default:
        return defaultStyle;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getProgressPercentage = (order) => {
    if (!order.quantity || order.quantity === 0) return 0;
    const delivered = order.quantity - (order.remains || 0);
    return Math.min(100, Math.round((delivered / order.quantity) * 100));
  };

  const showOrderDetails = (order) => {
    setOrderDetailModal({
      visible: true,
      order: order,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      <LinearGradient
        colors={['#800080', '#9933cc', '#b84dff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.headerGlow} />
        
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Order History</Text>
            <View style={styles.headerSubtitleContainer}>
              <FontAwesomeIcon icon={faShoppingBag} size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerSubtitle}>{orders.length} total orders</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrapper}>
            <FontAwesomeIcon icon={faSearch} size={16} color="#800080" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID or service..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <FontAwesomeIcon icon={faTimes} size={14} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Stats Summary Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statMiniCard}>
          <LinearGradient
            colors={['#dcfce7', '#f0fdf4']}
            style={styles.statMiniGradient}>
            <View style={styles.statMiniIcon}>
              <SafeIcon icon={faCheckCircle} size={16} color="#15803d" />
            </View>
            <Text style={styles.statMiniValue}>{stats.completed}</Text>
            <Text style={styles.statMiniLabel}>Completed</Text>
          </LinearGradient>
        </View>

        <View style={styles.statMiniCard}>
          <LinearGradient
            colors={['#dbeafe', '#eff6ff']}
            style={styles.statMiniGradient}>
            <View style={styles.statMiniIcon}>
              <SafeIcon icon={faCircleNotch} size={16} color="#1e40af" />
            </View>
            <Text style={styles.statMiniValue}>{stats.processing}</Text>
            <Text style={styles.statMiniLabel}>Processing</Text>
          </LinearGradient>
        </View>

        <View style={styles.statMiniCard}>
          <LinearGradient
            colors={['#fed7aa', '#ffedd5']}
            style={styles.statMiniGradient}>
            <View style={styles.statMiniIcon}>
              <SafeIcon icon={faHourglassHalf} size={16} color="#9a3412" />
            </View>
            <Text style={styles.statMiniValue}>{stats.pending}</Text>
            <Text style={styles.statMiniLabel}>Pending</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <LinearGradient
          colors={['#ffffff', '#fafbff']}
          style={styles.filterGradientBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['all', 'completed', 'processing', 'pending', 'failed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  filterStatus === status && styles.activeFilterTab,
                ]}
                activeOpacity={0.8}
                onPress={() => setFilterStatus(status)}>
                {filterStatus === status ? (
                  <LinearGradient
                    colors={['#800080', '#9933cc']}
                    style={styles.filterActiveGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}>
                    <View style={styles.filterGlow} />
                    <Text style={styles.activeFilterText}>
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterInactive}>
                    <Text style={styles.filterText}>
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#f3e8ff', '#faf5ff']}
                style={styles.emptyIconGradient}>
                <FontAwesomeIcon icon={faStar} size={40} color="#800080" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Place your first order to get started'}
            </Text>
            {!searchQuery && filterStatus === 'all' && (
              <TouchableOpacity 
                style={styles.emptyButton}
                activeOpacity={0.9}
                onPress={() => navigate('Dashboard')}>
                <LinearGradient
                  colors={['#800080', '#9933cc']}
                  style={styles.emptyButtonGradient}>
                  <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                  <Text style={styles.emptyButtonText}>Place Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map((order, index) => {
            const statusStyle = getStatusStyle(order.status);
            const progress = getProgressPercentage(order);
            
            return (
              <View key={order.id || index} style={styles.orderCard}>
                <View style={styles.orderGlow} />
                
                {/* Card Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdSection}>
                    <View style={styles.orderIconBadge}>
                      <LinearGradient
                        colors={['#f3e8ff', '#faf5ff']}
                        style={styles.orderIconGradient}>
                        <FontAwesomeIcon icon={faShoppingBag} size={14} color="#800080" />
                      </LinearGradient>
                    </View>
                    <View>
                      <View style={styles.orderIdBadge}>
                        <FontAwesomeIcon icon={faHashtag} size={8} color="#64748b" />
                        <Text style={styles.orderId}>{order.order_id || order.id}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                        ]}>
                        <SafeIcon
                          icon={statusStyle.icon}
                          size={10}
                          color={statusStyle.text}
                        />
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {order.status ? order.status.toUpperCase() : 'PENDING'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.chargeContainer}>
                    <LinearGradient
                      colors={['#f3e8ff', '#faf5ff']}
                      style={styles.chargeGradient}>
                      <FontAwesomeIcon icon={faDollarSign} size={12} color="#800080" />
                      <Text style={styles.orderCharge}>
                        {parseFloat(order.charge || 0).toFixed(2)}
                      </Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* Service Name */}
                <View style={styles.serviceSection}>
                  <View style={styles.serviceIconWrapper}>
                    <FontAwesomeIcon icon={faChartLine} size={12} color="#800080" />
                  </View>
                  <Text style={styles.orderService} numberOfLines={2}>
                    {order.service_name || order.service || 'Service'}
                  </Text>
                </View>

                {/* Link */}
                <View style={styles.orderLinkContainer}>
                  <View style={styles.linkIconWrapper}>
                    <FontAwesomeIcon icon={faLink} size={10} color="#fff" />
                  </View>
                  <Text style={styles.orderLink} numberOfLines={1}>
                    {order.link || 'N/A'}
                  </Text>
                </View>

                {/* Progress Bar (for processing/pending orders) */}
                {(order.status === 'processing' || order.status === 'in_progress') && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <View style={styles.progressIconWrapper}>
                        <FontAwesomeIcon icon={faChartBar} size={10} color="#1e40af" />
                      </View>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{progress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={['#3b82f6', '#60a5fa']}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}>
                        <View style={styles.progressBarGlow} />
                      </LinearGradient>
                    </View>
                  </View>
                )}

                {/* Order Details */}
                <LinearGradient
                  colors={['#fafbff', '#ffffff']}
                  style={styles.orderDetails}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <FontAwesomeIcon icon={faCubes} size={12} color="#800080" />
                    </View>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{order.quantity || 0}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <FontAwesomeIcon icon={faPlayCircle} size={12} color="#059669" />
                    </View>
                    <Text style={styles.detailLabel}>Start</Text>
                    <Text style={styles.detailValue}>{order.start_count || 0}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconWrapper}>
                      <FontAwesomeIcon 
                        icon={faHourglassHalf} 
                        size={12} 
                        color={(order.remains || 0) === 0 ? '#15803d' : '#f59e0b'} 
                      />
                    </View>
                    <Text style={styles.detailLabel}>Remains</Text>
                    <Text style={[
                      styles.detailValue, 
                      { color: (order.remains || 0) === 0 ? '#15803d' : '#f59e0b' }
                    ]}>
                      {order.remains || 0}
                    </Text>
                  </View>
                </LinearGradient>

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <View style={styles.dateBadge}>
                    <View style={styles.dateIconWrapper}>
                      <FontAwesomeIcon icon={faCalendarAlt} size={9} color="#fff" />
                    </View>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton} 
                    activeOpacity={0.8}
                    onPress={() => showOrderDetails(order)}>
                    <LinearGradient
                      colors={['#f3e8ff', '#faf5ff']}
                      style={styles.viewButtonGradient}>
                      <FontAwesomeIcon icon={faEye} size={13} color="#800080" />
                      <Text style={styles.viewButtonText}>Details</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Alert Modal */}
      <Modal
        visible={alertModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertModal({ ...alertModal, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={[
              styles.alertIconContainer,
              { backgroundColor: alertModal.success ? '#dcfce7' : '#fee2e2' }
            ]}>
              <LinearGradient
                colors={alertModal.success 
                  ? ['#22c55e', '#16a34a'] 
                  : ['#ef4444', '#dc2626']}
                style={styles.alertIconGradient}>
                <FontAwesomeIcon 
                  icon={alertModal.success ? faCheckCircle : faTimesCircle} 
                  size={32} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>

            <Text style={[
              styles.alertTitle,
              { color: alertModal.success ? '#15803d' : '#991b1b' }
            ]}>
              {alertModal.title}
            </Text>

            <Text style={styles.alertMessage}>
              {alertModal.message}
            </Text>

            <TouchableOpacity
              style={styles.alertCloseBtn}
              onPress={() => setAlertModal({ ...alertModal, visible: false })}
              activeOpacity={0.9}>
              <LinearGradient
                colors={alertModal.success 
                  ? ['#800080', '#9933cc', '#b84dff']
                  : ['#64748b', '#475569']}
                style={styles.alertCloseBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.alertCloseBtnText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        visible={orderDetailModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderDetailModal({ visible: false, order: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            {orderDetailModal.order && (
              <>
                {/* Modal Header */}
                <View style={styles.detailModalHeader}>
                  <View style={styles.detailModalIcon}>
                    <LinearGradient
                      colors={['#f3e8ff', '#faf5ff']}
                      style={styles.detailModalIconGradient}>
                      <FontAwesomeIcon icon={faInfoCircle} size={20} color="#800080" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.detailModalTitle}>Order Details</Text>
                  <TouchableOpacity 
                    onPress={() => setOrderDetailModal({ visible: false, order: null })}
                    style={styles.detailModalCloseBtn}>
                    <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {/* Order Info */}
                <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>
                  {/* Order ID & Status */}
                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faHashtag} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Order ID</Text>
                    </View>
                    <Text style={styles.detailModalValue}>
                      {orderDetailModal.order.order_id || orderDetailModal.order.id}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faChartLine} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Service</Text>
                    </View>
                    <Text style={styles.detailModalValueSmall} numberOfLines={2}>
                      {orderDetailModal.order.service_name || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon 
                        icon={getStatusStyle(orderDetailModal.order.status).icon} 
                        size={12} 
                        color={getStatusStyle(orderDetailModal.order.status).text} 
                      />
                      <Text style={styles.detailModalLabel}>Status</Text>
                    </View>
                    <View style={[
                      styles.detailModalStatusBadge,
                      { 
                        backgroundColor: getStatusStyle(orderDetailModal.order.status).bg,
                        borderColor: getStatusStyle(orderDetailModal.order.status).border,
                      }
                    ]}>
                      <Text style={[
                        styles.detailModalStatusText,
                        { color: getStatusStyle(orderDetailModal.order.status).text }
                      ]}>
                        {orderDetailModal.order.status?.toUpperCase() || 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faCubes} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Quantity</Text>
                    </View>
                    <Text style={styles.detailModalValue}>
                      {orderDetailModal.order.quantity || 0}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faDollarSign} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Charge</Text>
                    </View>
                    <Text style={styles.detailModalValueHighlight}>
                      ${parseFloat(orderDetailModal.order.charge || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faLink} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Link</Text>
                    </View>
                    <Text style={styles.detailModalValueSmall} numberOfLines={2}>
                      {orderDetailModal.order.link || 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faPlayCircle} size={12} color="#059669" />
                      <Text style={styles.detailModalLabel}>Start Count</Text>
                    </View>
                    <Text style={styles.detailModalValue}>
                      {orderDetailModal.order.start_count || 0}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faHourglassHalf} size={12} color="#f59e0b" />
                      <Text style={styles.detailModalLabel}>Remains</Text>
                    </View>
                    <Text style={[
                      styles.detailModalValue,
                      { color: (orderDetailModal.order.remains || 0) === 0 ? '#15803d' : '#f59e0b' }
                    ]}>
                      {orderDetailModal.order.remains || 0}
                    </Text>
                  </View>

                  <View style={styles.detailModalDivider} />

                  <View style={styles.detailModalRow}>
                    <View style={styles.detailModalLabelContainer}>
                      <FontAwesomeIcon icon={faCalendarAlt} size={12} color="#800080" />
                      <Text style={styles.detailModalLabel}>Created</Text>
                    </View>
                    <Text style={styles.detailModalValue}>
                      {formatDate(orderDetailModal.order.created_at)}
                    </Text>
                  </View>
                </ScrollView>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.detailModalCloseButton}
                  onPress={() => setOrderDetailModal({ visible: false, order: null })}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={['#800080', '#9933cc', '#b84dff']}
                    style={styles.detailModalCloseButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}>
                    <Text style={styles.detailModalCloseButtonText}>Close</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomNav navigate={navigate} currentScreen="Orders" />
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
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTop: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  statMiniCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statMiniGradient: {
    padding: 12,
    alignItems: 'center',
  },
  statMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statMiniValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  statMiniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    overflow: 'hidden',
  },
  filterGradientBg: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterTab: {
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterActiveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  filterGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterInactive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  orderGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(128, 0, 128, 0.03)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  orderIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  chargeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chargeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  orderCharge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800080',
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  serviceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderService: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    lineHeight: 20,
  },
  orderLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  linkIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#800080',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderLink: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  progressLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#800080',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dateIconWrapper: {
    width: 16,
    height: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  orderDate: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  viewButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#800080',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 120,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // Alert Modal
  alertModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  alertIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  alertCloseBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  alertCloseBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Order Detail Modal
  detailModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafbff',
  },
  detailModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14,
  },
  detailModalIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  detailModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalContent: {
    padding: 20,
  },
  detailModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailModalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 10,
  },
  detailModalValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
  },
  detailModalValueSmall: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
  detailModalValueHighlight: {
    fontSize: 16,
    color: '#800080',
    fontWeight: 'bold',
  },
  detailModalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  detailModalStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  detailModalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  detailModalCloseButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  detailModalCloseButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Orders;