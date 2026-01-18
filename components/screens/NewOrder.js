// FIXED: Services now load correctly with proper API parsing
// Enhanced UI matching Dashboard.js design
// Updated: Alert messages replaced with custom modal

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronDown,
  faLink,
  faInfoCircle,
  faPaperPlane,
  faCheck,
  faTimes,
  faPlus,
  faShoppingBag,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NewOrder = ({ navigate }) => {
  const [loading, setLoading] = useState(true);
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Order Result Modal State
  const [orderResultModal, setOrderResultModal] = useState({
    visible: false,
    success: false,
    title: '',
    message: '',
    orderId: '',
    charge: '',
    showViewOrders: false,
  });

  const linkRef = useRef(null);
  const quantityRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [quantity, selectedService]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await ApiService.getCategories();
      
      const cats = categoriesData.results || categoriesData || [];
      setCategories(Array.isArray(cats) ? cats : []);
      
      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
        await loadServicesByCategory(cats[0].id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Error',
        message: 'Failed to load categories',
        orderId: '',
        charge: '',
        showViewOrders: false,
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // *** CRITICAL FIX: Same service loading logic as Dashboard.js ***
  const loadServicesByCategory = async (categoryId) => {
    try {
      const servicesData = await ApiService.getServicesByCategory(categoryId);
      console.log('Services API Response:', servicesData);
      
      // API returns { services: [...] } format - THIS IS THE FIX!
      const svcs = servicesData?.services || servicesData?.results || servicesData || [];
      
      console.log('Parsed services:', svcs.length);
      
      if (Array.isArray(svcs) && svcs.length > 0) {
        setServices(svcs);
      } else {
        setServices([]);
        setSelectedService(null);
        setShowServiceDesc(false);
        if (categoryId) {
          setOrderResultModal({
            visible: true,
            success: false,
            title: 'No Services',
            message: 'No services available for this category',
            orderId: '',
            charge: '',
            showViewOrders: false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setOrderResultModal({
        visible: true,
        success: false,
        title: 'Error',
        message: 'Failed to load services: ' + error.message,
        orderId: '',
        charge: '',
        showViewOrders: false,
      });
      setServices([]);
    }
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

  const handleOrderResultClose = (action) => {
    const wasSuccess = orderResultModal.success;
    setOrderResultModal({
      visible: false,
      success: false,
      title: '',
      message: '',
      orderId: '',
      charge: '',
      showViewOrders: false,
    });
    
    if (action === 'viewOrders') {
      navigate('Orders');
    } else if (wasSuccess || action === 'newOrder') {
      setLink('');
      setQuantity(minMax.min.toString());
      setSelectedService(null);
      setShowServiceDesc(false);
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
        showViewOrders: false,
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
        showViewOrders: false,
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
        showViewOrders: false,
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
          showViewOrders: true,
        });
      } else {
        setOrderResultModal({
          visible: true,
          success: false,
          title: 'Order Failed',
          message: response.message || 'Failed to place order',
          orderId: '',
          charge: '',
          showViewOrders: false,
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
        showViewOrders: false,
      });
    } finally {
      setPlacingOrder(false);
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
        <StatusBar style="light" backgroundColor="#800080" />
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading...</Text>
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
            <Text style={styles.headerTitle}>New Order</Text>
            <View style={styles.headerSubtitleContainer}>
              <FontAwesomeIcon icon={faShoppingBag} size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerSubtitle}>Place your order instantly</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        
        {/* Order Form Card */}
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
                <Text style={styles.cardTitle}>Order Details</Text>
                <Text style={styles.cardSubtitle}>Fill in the details below</Text>
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
                      showViewOrders: false,
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#eff6ff', '#ffffff']}
            style={styles.infoGradient}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon icon={faInfoCircle} size={20} color="#3b82f6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Order Information</Text>
              <Text style={styles.infoText}>
                • Select a category and service{'\n'}
                • Enter the link you want to boost{'\n'}
                • Choose your desired quantity{'\n'}
                • Review total charge and place order
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
        onRequestClose={() => handleOrderResultClose()}>
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

            {/* Buttons */}
            {orderResultModal.showViewOrders ? (
              <View style={styles.resultButtonsRow}>
                <TouchableOpacity
                  style={styles.resultSecondaryBtn}
                  onPress={() => handleOrderResultClose('newOrder')}
                  activeOpacity={0.9}>
                  <Text style={styles.resultSecondaryBtnText}>New Order</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.resultPrimaryBtn}
                  onPress={() => handleOrderResultClose('viewOrders')}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={['#800080', '#9933cc', '#b84dff']}
                    style={styles.resultPrimaryBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}>
                    <Text style={styles.resultPrimaryBtnText}>View Orders</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.resultCloseBtn}
                onPress={() => handleOrderResultClose()}
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
            )}
          </View>
        </View>
      </Modal>

      <BottomNav navigate={navigate} currentScreen="NewOrder" />
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
    paddingBottom: 30,
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
    marginBottom: 0,
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
  content: {
    flex: 1,
    marginTop: -10,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
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
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoGradient: {
    padding: 20,
    flexDirection: 'row',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },
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
  bottomSpacer: {
    height: 120,
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
  resultButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  resultSecondaryBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  resultSecondaryBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultPrimaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  resultPrimaryBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPrimaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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

export default NewOrder;