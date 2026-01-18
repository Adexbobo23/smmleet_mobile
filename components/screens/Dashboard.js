// FIXED: Wallet balance, total deposits, and total spent now display correctly
// The issue was improper parsing of the wallet summary API response

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Keyboard,
  Modal,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faShoppingBag,
  faWallet,
  faChartLine,
  faHeadset,
  faBell,
  faSearch,
  faPlus,
  faBullhorn,
  faLifeRing,
  faPaperPlane,
  faLink,
  faChevronDown,
  faInfoCircle,
  faArrowUp,
  faCircleNotch,
  faClock,
  faCheckCircle,
  faTimes,
  faCheck,
  faTimesCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Dashboard = ({ navigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0); // Added this
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('1000');
  const [totalCharge, setTotalCharge] = useState('0.00');
  const [serviceDescription, setServiceDescription] = useState('');
  const [minMax, setMinMax] = useState({ min: 100, max: 10000 });
  const [showServiceDesc, setShowServiceDesc] = useState(false);
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [orderResultModal, setOrderResultModal] = useState({
    visible: false,
    success: false,
    title: '',
    message: '',
    orderId: '',
    charge: '',
  });

  const searchRef = useRef(null);
  const linkRef = useRef(null);
  const quantityRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [quantity, selectedService]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const results = await Promise.allSettled([
        ApiService.getDashboardStats(),
        ApiService.getCategories(),
        ApiService.getOrders({ limit: 3 }),
        ApiService.getAnnouncements(),
        ApiService.getWalletSummary(),
      ]);

      console.log('Dashboard API Results:', results);

      // Process dashboard stats
      const dashboardStats = results[0].status === 'fulfilled' ? results[0].value : null;
      console.log('Dashboard Stats:', dashboardStats);
      
      if (dashboardStats && dashboardStats.success !== false) {
        setTotalOrders(dashboardStats.total_orders || 0);
        setTotalSpent(parseFloat(dashboardStats.total_spent || 0));
        
        // Try to get wallet balance from dashboard stats first
        if (dashboardStats.wallet_balance !== undefined) {
          setWalletBalance(parseFloat(dashboardStats.wallet_balance || 0));
        }
      }

      // Process categories
      const categoriesData = results[1].status === 'fulfilled' ? results[1].value : null;
      if (categoriesData) {
        const cats = categoriesData.results || categoriesData || [];
        setCategories(Array.isArray(cats) ? cats : []);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
          await loadServicesByCategory(cats[0].id);
        }
      }

      // Process orders
      const ordersData = results[2].status === 'fulfilled' ? results[2].value : null;
      if (ordersData) {
        const orders = ordersData.results || ordersData || [];
        setRecentOrders(Array.isArray(orders) ? orders.slice(0, 3) : []);
      }

      // Process announcements
      const announcementsData = results[3].status === 'fulfilled' ? results[3].value : null;
      if (announcementsData) {
        const anns = announcementsData.results || announcementsData || [];
        setAnnouncements(Array.isArray(anns) ? anns.slice(0, 2) : []);
      }

      // *** CRITICAL FIX: Process wallet summary properly ***
      const walletData = results[4].status === 'fulfilled' ? results[4].value : null;
      console.log('Wallet Summary Response:', walletData);
      
      if (walletData && walletData.success !== false) {
        // The API can return wallet data in different formats:
        // 1. { wallet: { balance: "..." }, total_deposits: "...", total_spent: "..." }
        // 2. { balance: "...", total_deposits: "...", total_spent: "..." }
        
        const walletInfo = walletData.wallet || walletData;
        
        // Set wallet balance (prioritize wallet summary over dashboard stats)
        const balance = parseFloat(walletInfo.balance || walletData.balance || 0);
        setWalletBalance(balance);
        console.log('Wallet Balance:', balance);
        
        // Set total deposits
        const deposits = parseFloat(walletData.total_deposits || 0);
        setTotalDeposits(deposits);
        console.log('Total Deposits:', deposits);
        
        // Set total spent (use wallet summary if available, otherwise use dashboard stats)
        const spent = parseFloat(walletData.total_spent || dashboardStats?.total_spent || 0);
        setTotalSpent(spent);
        console.log('Total Spent:', spent);
      } else {
        console.warn('Failed to load wallet summary');
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServicesByCategory = async (categoryId) => {
    try {
      const servicesData = await ApiService.getServicesByCategory(categoryId);
      console.log('Services API Response:', servicesData);
      
      // API returns { services: [...] } format
      const svcs = servicesData?.services || servicesData?.results || servicesData || [];
      
      console.log('Parsed services:', svcs.length);
      
      if (Array.isArray(svcs) && svcs.length > 0) {
        setServices(svcs);
      } else {
        setServices([]);
        setSelectedService(null);
        setShowServiceDesc(false);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services: ' + error.message);
      setServices([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setSelectedService(null);
    setShowServiceDesc(false);
    setShowCategoryModal(false);
    await loadServicesByCategory(category.id);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    
    if (service) {
      setServiceDescription(service.description || '');
      setMinMax({ 
        min: parseInt(service.min) || parseInt(service.min_order) || 100, 
        max: parseInt(service.max) || parseInt(service.max_order) || 10000 
      });
      setQuantity((service.min || service.min_order || 1000).toString());
      setShowServiceDesc(true);
    } else {
      setShowServiceDesc(false);
    }
    
    setShowServiceModal(false);
  };

  const calculateTotal = () => {
    if (selectedService) {
      const qty = parseFloat(quantity) || 0;
      const rate = parseFloat(selectedService.rate) || parseFloat(selectedService.our_rate_per_1000) || 0;
      const total = (qty / 1000) * rate;
      setTotalCharge(total.toFixed(2));
    } else {
      setTotalCharge('0.00');
    }
  };

  const handleOrderResultClose = () => {
    const wasSuccess = orderResultModal.success;
    setOrderResultModal({
      visible: false,
      success: false,
      title: '',
      message: '',
      orderId: '',
      charge: '',
    });
    
    if (wasSuccess) {
      setLink('');
      setQuantity(minMax.min.toString());
      onRefresh();
    }
  };

  const handlePlaceOrder = async () => {
    Keyboard.dismiss();

    if (!selectedService) {
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Error',
        message: 'Please select a service',
        orderId: '',
        charge: '',
      });
      return;
    }
    
    if (!link.trim()) {
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Error',
        message: 'Please enter a link',
        orderId: '',
        charge: '',
      });
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < minMax.min || qty > minMax.max) {
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Error',
        message: `Quantity must be between ${minMax.min} and ${minMax.max}`,
        orderId: '',
        charge: '',
      });
      return;
    }

    setPlacingOrder(true);
    try {
      const orderData = {
        service_id: selectedService.id,
        link: link.trim(),
        quantity: qty,
      };

      const response = await ApiService.createOrder(orderData);
      
      if (response.success || response.order_id) {
        setOrderResultModal({
          visible: true,
          success: true,
          title: 'Order Placed Successfully!',
          message: 'Your order has been placed and is being processed.',
          orderId: response.order_id || response.display_id || response.id,
          charge: response.charge || totalCharge,
        });
      } else {
        setOrderResultModal({
          visible: true,
          success: false,
          title: 'Order Failed',
          message: response.message || 'Failed to place order',
          orderId: '',
          charge: '',
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Order Failed',
        message: error.message || 'Failed to place order. Please try again.',
        orderId: '',
        charge: '',
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || 'pending').toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d', icon: faCheckCircle };
      case 'processing':
      case 'in_progress':
        return { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', icon: faCircleNotch };
      case 'pending':
        return { bg: '#fed7aa', border: '#fdba74', text: '#9a3412', icon: faClock };
      case 'failed':
      case 'cancelled':
        return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: faTimes };
      default:
        return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', icon: faInfoCircle };
    }
  };

  const clearOrder = () => {
    Keyboard.dismiss();
    setLink('');
    setQuantity(minMax.min.toString());
    setSelectedService(null);
    setShowServiceDesc(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <View style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} size={16} color="#fff" style={styles.searchIcon} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search orders, services..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.notificationBtn}
            activeOpacity={0.8}
            onPress={() => {
              Keyboard.dismiss();
            }}>
            <FontAwesomeIcon icon={faBell} size={20} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletGlow} />
          <View style={styles.walletInfo}>
            <View style={styles.walletIconContainer}>
              <FontAwesomeIcon icon={faWallet} size={24} color="#fff" />
            </View>
            <View style={styles.walletTextContainer}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <Text style={styles.walletAmount}>${walletBalance.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addFundsBtn} 
            activeOpacity={0.9}
            onPress={() => {
              Keyboard.dismiss();
              navigate('Wallet');
            }}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.addFundsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}>
              <FontAwesomeIcon icon={faPlus} size={14} color="#800080" />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCard1]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <FontAwesomeIcon icon={faShoppingBag} size={22} color="#1e40af" />
              </View>
              <View style={[styles.statBadge, { backgroundColor: '#dcfce7' }]}>
                <FontAwesomeIcon icon={faArrowUp} size={8} color="#15803d" />
                <Text style={[styles.statBadgeText, { color: '#15803d' }]}>Active</Text>
              </View>
            </View>
            <Text style={styles.statValue}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>

          <View style={[styles.statCard, styles.statCard2]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <FontAwesomeIcon icon={faArrowUp} size={22} color="#15803d" />
              </View>
            </View>
            <Text style={styles.statValue}>${totalDeposits.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
          </View>

          <View style={[styles.statCard, styles.statCard3]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                <FontAwesomeIcon icon={faWallet} size={22} color="#059669" />
              </View>
            </View>
            <Text style={styles.statValue}>${walletBalance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </View>

          <View style={[styles.statCard, styles.statCard4]}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                <FontAwesomeIcon icon={faChartLine} size={22} color="#7c3aed" />
              </View>
            </View>
            <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>

          <TouchableOpacity 
            style={styles.supportCard} 
            activeOpacity={0.9}
            onPress={() => {
              Keyboard.dismiss();
              navigate('Support');
            }}>
            <LinearGradient
              colors={['#800080', '#9933cc', '#b84dff']}
              style={styles.supportGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.supportHeader}>
                <View style={styles.supportIcon}>
                  <FontAwesomeIcon icon={faHeadset} size={22} color="#fff" />
                </View>
                <View style={styles.support24Badge}>
                  <Text style={styles.support24Text}>24/7</Text>
                </View>
              </View>
              <Text style={styles.supportTitle}>Support</Text>
              <Text style={styles.supportSubtitle}>Need help?</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* New Order Card */}
        <View style={styles.orderCard}>
          <LinearGradient
            colors={['#fafbff', '#ffffff']}
            style={styles.cardHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}>
            <View style={styles.cardHeaderContent}>
              <View style={styles.cardHeaderIcon}>
                <LinearGradient
                  colors={['#f3e8ff', '#faf5ff']}
                  style={styles.cardHeaderIconGradient}>
                  <FontAwesomeIcon icon={faPlus} size={16} color="#800080" />
                </LinearGradient>
              </View>
              <View style={styles.cardHeaderTitles}>
                <Text style={styles.cardTitle}>New Order</Text>
                <Text style={styles.cardSubtitle}>Place a new order instantly</Text>
              </View>
              {(link || selectedService) && (
                <TouchableOpacity 
                  style={styles.clearBtn}
                  onPress={clearOrder}
                  activeOpacity={0.7}>
                  <FontAwesomeIcon icon={faTimes} size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          <View style={styles.formContainer}>
            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <TouchableOpacity 
                style={styles.selectButton} 
                activeOpacity={0.7}
                onPress={() => setShowCategoryModal(true)}>
                <View style={styles.selectContent}>
                  <Text style={styles.selectButtonText}>
                    {selectedCategory ? selectedCategory.name : 'Select Category'}
                  </Text>
                  <View style={styles.selectIconWrapper}>
                    <FontAwesomeIcon icon={faChevronDown} size={12} color="#800080" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Service Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SERVICE</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                activeOpacity={0.7}
                onPress={() => {
                  if (services.length > 0) {
                    setShowServiceModal(true);
                  } else {
                    setOrderResultModal({
                      visible: true,
                      success: false,
                      title: 'No Services',
                      message: 'No services available for this category. Please select a different category.',
                      orderId: '',
                      charge: '',
                    });
                  }
                }}>
                <View style={styles.selectContent}>
                  <Text style={[styles.selectButtonText, !selectedService && { color: '#94a3b8' }]} numberOfLines={1}>
                    {selectedService 
                      ? `${selectedService.service_id || selectedService.id} - ${selectedService.name}` 
                      : services.length > 0 ? 'Select a service...' : 'No services available'}
                  </Text>
                  <View style={styles.selectIconWrapper}>
                    <FontAwesomeIcon icon={faChevronDown} size={12} color="#800080" />
                  </View>
                </View>
              </TouchableOpacity>
              
              {showServiceDesc && serviceDescription && (
                <View style={styles.serviceDescContainer}>
                  <View style={styles.serviceDescIcon}>
                    <FontAwesomeIcon icon={faInfoCircle} size={14} color="#3b82f6" />
                  </View>
                  <Text style={styles.serviceDescText}>{serviceDescription}</Text>
                </View>
              )}
            </View>

            {/* Link Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LINK</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrapper}>
                  <FontAwesomeIcon icon={faLink} size={16} color="#94a3b8" />
                </View>
                <TextInput
                  ref={linkRef}
                  style={styles.textInput}
                  placeholder="https://..."
                  placeholderTextColor="#cbd5e1"
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="next"
                  onSubmitEditing={() => quantityRef.current?.focus()}
                />
              </View>
            </View>

            {/* Quantity and Total */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>QUANTITY</Text>
                <View style={styles.quantityContainer}>
                  <TextInput
                    ref={quantityRef}
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handlePlaceOrder}
                  />
                  <View style={styles.minMaxBadge}>
                    <Text style={styles.minMaxText}>Min: {minMax.min}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>TOTAL CHARGE</Text>
                <LinearGradient
                  colors={['#faf5ff', '#ffffff']}
                  style={styles.totalContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}>
                  <Text style={styles.dollarSign}>$</Text>
                  <Text style={styles.totalAmount}>{totalCharge}</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handlePlaceOrder}
              disabled={placingOrder}
              activeOpacity={0.9}>
              <LinearGradient
                colors={['#800080', '#9933cc', '#b84dff']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {placingOrder ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Place Order</Text>
                    <FontAwesomeIcon icon={faPaperPlane} size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <TouchableOpacity 
              style={styles.viewAllBtn} 
              activeOpacity={0.8}
              onPress={() => navigate('Orders')}>
              <LinearGradient
                colors={['#f3e8ff', '#faf5ff']}
                style={styles.viewAllGradient}>
                <Text style={styles.viewAllText}>View All</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesomeIcon icon={faShoppingBag} size={40} color="#e2e8f0" />
              <Text style={styles.emptyText}>No recent orders</Text>
              <Text style={styles.emptySubtext}>Your recent orders will appear here</Text>
            </View>
          ) : (
            recentOrders.map((order, index) => {
              const statusStyle = getStatusColor(order.status);
              return (
                <TouchableOpacity 
                  key={order.id || index} 
                  style={styles.orderItem}
                  activeOpacity={0.7}
                  onPress={() => navigate('OrderDetails', { orderId: order.order_id || order.id })}>
                  <View style={styles.orderItemHeader}>
                    <Text style={styles.orderId}>#{order.order_id || order.display_id || order.id}</Text>
                    <Text style={styles.orderCharge}>${parseFloat(order.charge || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.orderService} numberOfLines={1}>
                    {order.service_name || 'Service'}
                  </Text>
                  <Text style={styles.orderLink} numberOfLines={1}>
                    {order.link}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <FontAwesomeIcon icon={statusStyle.icon} size={8} color={statusStyle.text} />
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {(order.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Announcements */}
        <View style={styles.announcementsCard}>
          <LinearGradient
            colors={['#fafbff', '#ffffff']}
            style={styles.announcementsHeader}>
            <View style={styles.announcementsIcon}>
              <LinearGradient
                colors={['#f3e8ff', '#faf5ff']}
                style={styles.announcementsIconGradient}>
                <FontAwesomeIcon icon={faBullhorn} size={14} color="#800080" />
              </LinearGradient>
            </View>
            <Text style={styles.announcementsTitle}>Updates & News</Text>
          </LinearGradient>

          {announcements.length === 0 ? (
            <View style={styles.announcementEmpty}>
              <FontAwesomeIcon icon={faBullhorn} size={30} color="#e2e8f0" />
              <Text style={styles.announcementEmptyText}>No announcements</Text>
            </View>
          ) : (
            announcements.map((announcement, index) => (
              <View key={announcement.id || index} style={styles.announcementItem}>
                <View style={styles.announcementDot}>
                  <View style={styles.announcementDotInner} />
                </View>
                <View style={styles.announcementContent}>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  <Text style={styles.announcementText}>{announcement.content || announcement.message}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Help Card */}
        <View style={styles.helpCard}>
          <LinearGradient
            colors={['#1e293b', '#334155', '#475569']}
            style={styles.helpGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.helpIcon}>
              <LinearGradient
                colors={['rgba(192, 132, 252, 0.2)', 'rgba(192, 132, 252, 0.1)']}
                style={styles.helpIconGradient}>
                <FontAwesomeIcon icon={faLifeRing} size={24} color="#c084fc" />
              </LinearGradient>
            </View>
            <Text style={styles.helpTitle}>Have questions?</Text>
            <Text style={styles.helpSubtitle}>
              Our team is ready to help you with any issues.
            </Text>
            <TouchableOpacity 
              style={styles.helpButton} 
              activeOpacity={0.9}
              onPress={() => navigate('Support')}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.helpButtonGradient}>
                <Text style={styles.helpButtonText}>Open Ticket</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav navigate={navigate} currentScreen="Dashboard" />

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity 
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseBtn}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedCategory?.id === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => handleCategorySelect(item)}
                  activeOpacity={0.7}>
                  <Text style={[
                    styles.modalItemText,
                    selectedCategory?.id === item.id && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {item.service_count !== undefined && (
                    <Text style={styles.modalItemCount}>{item.service_count} services</Text>
                  )}
                  {selectedCategory?.id === item.id && (
                    <View style={styles.modalCheckIcon}>
                      <FontAwesomeIcon icon={faCheck} size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service</Text>
              <TouchableOpacity 
                onPress={() => setShowServiceModal(false)}
                style={styles.modalCloseBtn}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={services}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedService?.id === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => handleServiceSelect(item)}
                  activeOpacity={0.7}>
                  <View style={styles.serviceModalContent}>
                    <Text style={[
                      styles.modalItemText,
                      selectedService?.id === item.id && styles.modalItemTextSelected
                    ]} numberOfLines={2}>
                      {item.service_id || item.id} - {item.name}
                    </Text>
                    <View style={styles.serviceModalRate}>
                      <Text style={styles.serviceRateText}>${parseFloat(item.rate || item.our_rate_per_1000 || 0).toFixed(2)}/1k</Text>
                    </View>
                  </View>
                  {selectedService?.id === item.id && (
                    <View style={styles.modalCheckIcon}>
                      <FontAwesomeIcon icon={faCheck} size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>

      {/* Order Result Modal */}
      <Modal
        visible={orderResultModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleOrderResultClose}>
        <View style={styles.resultModalOverlay}>
          <View style={styles.resultModalContainer}>
            {/* Icon */}
            <View style={[
              styles.resultIconContainer,
              { backgroundColor: orderResultModal.success ? '#dcfce7' : '#fee2e2' }
            ]}>
              <LinearGradient
                colors={orderResultModal.success 
                  ? ['#22c55e', '#16a34a'] 
                  : ['#ef4444', '#dc2626']}
                style={styles.resultIconGradient}>
                <FontAwesomeIcon 
                  icon={orderResultModal.success ? faCheckCircle : faTimesCircle} 
                  size={40} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[
              styles.resultTitle,
              { color: orderResultModal.success ? '#15803d' : '#991b1b' }
            ]}>
              {orderResultModal.title}
            </Text>

            {/* Message */}
            <Text style={styles.resultMessage}>
              {orderResultModal.message}
            </Text>

            {/* Order Details (only for success) */}
            {orderResultModal.success && orderResultModal.orderId && (
              <View style={styles.orderDetailsContainer}>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Order ID</Text>
                  <Text style={styles.orderDetailValue}>#{orderResultModal.orderId}</Text>
                </View>
                <View style={styles.orderDetailDivider} />
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Total Charge</Text>
                  <Text style={styles.orderDetailValueHighlight}>${orderResultModal.charge}</Text>
                </View>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.resultCloseBtn}
              onPress={handleOrderResultClose}
              activeOpacity={0.9}>
              <LinearGradient
                colors={orderResultModal.success 
                  ? ['#800080', '#9933cc', '#b84dff']
                  : ['#64748b', '#475569']}
                style={styles.resultCloseBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.resultCloseBtnText}>
                  {orderResultModal.success ? 'Continue' : 'Try Again'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles remain exactly the same as the original file...
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  announcementEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  announcementEmptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
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
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  walletCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  walletGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTextContainer: {
    marginLeft: 14,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  walletAmount: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  addFundsBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addFundsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addFundsText: {
    color: '#800080',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginBottom: 20,
    marginTop: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: (screenWidth - 45) / 2,
    marginRight: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statCard1: {
    marginRight: 15, // First card in row 1
  },
  statCard2: {
    marginRight: 0, // Second card in row 1 (no right margin)
  },
  statCard3: {
    marginRight: 15, // First card in row 2
  },
  statCard4: {
    marginRight: 0, // Second card in row 2 (no right margin)
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  supportCard: {
    width: (screenWidth - 45) / 2,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  supportGradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  support24Badge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  support24Text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  supportTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  supportSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  cardHeaderIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  selectButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  selectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  selectIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  serviceDescContainer: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  serviceDescIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceDescText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: (screenWidth - 70) / 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  quantityInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  minMaxBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  minMaxText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f3e8ff',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800080',
    marginRight: 6,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#800080',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  activityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewAllBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewAllGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#800080',
  },
  orderItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  orderCharge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#800080',
  },
  orderService: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 5,
  },
  orderLink: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  announcementsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  announcementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  announcementsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  announcementsIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  announcementItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#f1f5f9',
  },
  announcementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 3,
    borderColor: '#f8fafc',
    marginLeft: -20,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  announcementContent: {
    flex: 1,
    marginLeft: 12,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  announcementText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  helpCard: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  helpGradient: {
    padding: 28,
  },
  helpIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  helpIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500',
  },
  helpButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  helpButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 120,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.7,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalItemSelected: {
    backgroundColor: '#f3e8ff',
    borderColor: '#800080',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#800080',
  },
  modalItemCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 10,
  },
  modalCheckIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#800080',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  serviceModalContent: {
    flex: 1,
  },
  serviceModalRate: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  serviceRateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  // Order Result Modal Styles
  resultModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModalContainer: {
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
  resultIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  orderDetailsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  orderDetailValueHighlight: {
    fontSize: 18,
    color: '#800080',
    fontWeight: 'bold',
  },
  orderDetailDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  resultCloseBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  resultCloseBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Dashboard;