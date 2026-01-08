import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  FlatList,
  Clipboard,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMobileAlt,
  faGlobe,
  faChevronDown,
  faChevronLeft,
  faCopy,
  faCheck,
  faTimes,
  faSpinner,
  faRedo,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faSearch,
  faWallet,
  faSms,
  faInfoCircle,
  faPhone,
  faBan,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SMSActivation = ({ navigate }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Services & Countries
  const [services, setServices] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [price, setPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  
  // Active Activation
  const [activeActivation, setActiveActivation] = useState(null);
  const [activationStatus, setActivationStatus] = useState(null);
  const [smsCode, setSmsCode] = useState(null);
  const [polling, setPolling] = useState(false);
  const [activating, setActivating] = useState(false);
  
  // Active Activations List
  const [activeActivations, setActiveActivations] = useState([]);
  
  // Refs
  const pollIntervalRef = useRef(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    loadInitialData();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedService && selectedCountry) {
      loadPrice();
    } else {
      setPrice(null);
    }
  }, [selectedService, selectedCountry]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [servicesData, countriesData, walletData, activationsData] = await Promise.all([
        ApiService.getSmsServices(),
        ApiService.getSmsCountries(),
        ApiService.getWalletBalance().catch(() => ({ balance: 0 })),
        ApiService.getSmsActivations({ status: 'waiting_code' }).catch(() => ({ results: { activations: [] } })),
      ]);
      
      console.log('Services:', servicesData);
      console.log('Countries:', countriesData);
      
      setServices(servicesData?.services || []);
      setCountries(countriesData?.countries || []);
      setWalletBalance(parseFloat(walletData?.balance || walletData?.wallet?.balance || 0));
      
      const activations = activationsData?.results?.activations || activationsData?.activations || [];
      setActiveActivations(activations);
      
      // If there's an active activation, set it
      if (activations.length > 0) {
        const active = activations.find(a => a.status === 'waiting_code' || a.status === 'waiting_retry');
        if (active) {
          setActiveActivation(active);
          setActivationStatus(active.status);
          startPolling(active.activation_id);
        }
      }
      
    } catch (error) {
      console.error('Error loading SMS data:', error);
      Alert.alert('Error', 'Failed to load SMS services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPrice = async () => {
    if (!selectedService || !selectedCountry) return;
    
    try {
      setLoadingPrice(true);
      const data = await ApiService.getSmsPrices(selectedService.code, selectedCountry.code);
      
      if (data?.data?.[selectedCountry.code]?.[selectedService.code]) {
        setPrice(data.data[selectedCountry.code][selectedService.code]);
      } else {
        setPrice(null);
      }
    } catch (error) {
      console.error('Error loading price:', error);
      setPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleActivate = async () => {
    if (!selectedService || !selectedCountry) {
      Alert.alert('Error', 'Please select a service and country');
      return;
    }

    if (price && walletBalance < price.cost) {
      Alert.alert(
        'Insufficient Balance',
        `Your balance ($${walletBalance.toFixed(2)}) is less than the activation cost ($${price.cost.toFixed(2)}). Please add funds to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Funds', onPress: () => navigate('Wallet') }
        ]
      );
      return;
    }

    try {
      setActivating(true);
      
      const result = await ApiService.activateNumber(
        selectedService.code,
        selectedCountry.code,
        price?.cost
      );
      
      if (result.status === 'success') {
        setActiveActivation({
          activation_id: result.activation_id,
          phone_number: result.number,
          service_name: result.service_name || selectedService.name,
          country_name: result.country_name || selectedCountry.name,
          cost: result.cost,
          status: 'waiting_code',
        });
        setActivationStatus('waiting_code');
        setWalletBalance(parseFloat(result.new_balance));
        setSmsCode(null);
        
        // Start polling
        startPolling(result.activation_id);
        
        Vibration.vibrate(100);
        
      } else {
        Alert.alert('Error', result.error || 'Failed to activate number');
      }
      
    } catch (error) {
      console.error('Activation error:', error);
      Alert.alert('Error', error.message || 'Failed to activate number. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  const startPolling = (activationId) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollCountRef.current = 0;
    setPolling(true);
    
    const poll = async () => {
      pollCountRef.current++;
      
      if (pollCountRef.current > 60) { // 5 min max (60 * 5 sec)
        stopPolling();
        Alert.alert('Timeout', 'No SMS code received. You can retry or cancel.');
        return;
      }
      
      try {
        const result = await ApiService.checkActivationStatus(activationId);
        
        if (result.activation_status === 'code_received') {
          setSmsCode(result.sms_code);
          setActivationStatus('code_received');
          stopPolling();
          Vibration.vibrate([0, 200, 100, 200]);
        } else if (result.activation_status === 'canceled') {
          setActivationStatus('canceled');
          stopPolling();
        } else {
          setActivationStatus(result.activation_status);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Initial poll
    poll();
    
    // Continue polling every 5 seconds
    pollIntervalRef.current = setInterval(poll, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  };

  const handleMarkReady = async () => {
    if (!activeActivation) return;
    
    try {
      await ApiService.markActivationReady(activeActivation.activation_id);
      Alert.alert('Success', 'Marked as ready. Waiting for SMS...');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRetry = async () => {
    if (!activeActivation) return;
    
    try {
      await ApiService.retryActivation(activeActivation.activation_id);
      setActivationStatus('waiting_retry');
      setSmsCode(null);
      startPolling(activeActivation.activation_id);
      Alert.alert('Success', 'Retry requested. Waiting for new code...');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleComplete = async () => {
    if (!activeActivation) return;
    
    try {
      await ApiService.completeActivation(activeActivation.activation_id);
      
      Alert.alert('Success', 'Activation completed successfully!');
      
      // Reset
      setActiveActivation(null);
      setActivationStatus(null);
      setSmsCode(null);
      stopPolling();
      
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancel = async () => {
    if (!activeActivation) return;
    
    Alert.alert(
      'Cancel Activation',
      'Are you sure you want to cancel this activation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ApiService.cancelActivation(activeActivation.activation_id);
              
              stopPolling();
              
              if (result.refunded) {
                setWalletBalance(parseFloat(result.new_balance));
                Alert.alert('Canceled', `Activation canceled. $${result.refund_amount} refunded.`);
              } else {
                Alert.alert('Canceled', 'Activation canceled.');
              }
              
              setActiveActivation(null);
              setActivationStatus(null);
              setSmsCode(null);
              
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Vibration.vibrate(50);
    Alert.alert('Copied!', 'Code copied to clipboard');
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const getStatusDisplay = () => {
    switch (activationStatus) {
      case 'waiting_code':
        return { text: 'Waiting for SMS...', color: '#f59e0b', icon: faClock };
      case 'waiting_retry':
        return { text: 'Waiting for retry code...', color: '#f59e0b', icon: faClock };
      case 'code_received':
        return { text: 'Code Received!', color: '#10b981', icon: faCheckCircle };
      case 'canceled':
        return { text: 'Canceled', color: '#ef4444', icon: faBan };
      case 'completed':
        return { text: 'Completed', color: '#10b981', icon: faCheck };
      default:
        return { text: 'Processing...', color: '#6b7280', icon: faSpinner };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading SMS Services...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      {/* Header */}
      <LinearGradient
        colors={['#800080', '#9933cc', '#b84dff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.headerGlow} />
        
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigate('More')}>
            <FontAwesomeIcon icon={faChevronLeft} size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>SMS Activation</Text>
            <Text style={styles.headerSubtitle}>Get verification codes instantly</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}>
            <FontAwesomeIcon 
              icon={faRefresh} 
              size={18} 
              color="#fff"
              style={refreshing ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletInfo}>
            <FontAwesomeIcon icon={faWallet} size={20} color="#fff" />
            <Text style={styles.walletLabel}>Balance:</Text>
            <Text style={styles.walletAmount}>${walletBalance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addFundsBtn}
            onPress={() => navigate('Wallet')}>
            <Text style={styles.addFundsText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>

        {/* Active Activation Card */}
        {activeActivation && (
          <View style={styles.activeCard}>
            <LinearGradient
              colors={activationStatus === 'code_received' ? ['#059669', '#10b981'] : ['#f59e0b', '#fbbf24']}
              style={styles.activeCardHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <View style={styles.activeCardHeaderContent}>
                <FontAwesomeIcon 
                  icon={getStatusDisplay().icon} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.activeCardTitle}>{getStatusDisplay().text}</Text>
                {polling && (
                  <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 10 }} />
                )}
              </View>
            </LinearGradient>

            <View style={styles.activeCardBody}>
              <View style={styles.numberDisplay}>
                <Text style={styles.numberLabel}>Phone Number</Text>
                <View style={styles.numberRow}>
                  <Text style={styles.numberText}>{activeActivation.phone_number}</Text>
                  <TouchableOpacity 
                    style={styles.copyBtn}
                    onPress={() => copyToClipboard(activeActivation.phone_number)}>
                    <FontAwesomeIcon icon={faCopy} size={16} color="#800080" />
                  </TouchableOpacity>
                </View>
              </View>

              {smsCode && (
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeLabel}>SMS Code</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{smsCode}</Text>
                    <TouchableOpacity 
                      style={styles.copyBtnLarge}
                      onPress={() => copyToClipboard(smsCode)}>
                      <LinearGradient
                        colors={['#800080', '#9933cc']}
                        style={styles.copyBtnGradient}>
                        <FontAwesomeIcon icon={faCopy} size={18} color="#fff" />
                        <Text style={styles.copyBtnText}>Copy</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.activeDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{activeActivation.service_name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Country</Text>
                  <Text style={styles.detailValue}>{activeActivation.country_name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cost</Text>
                  <Text style={styles.detailValue}>${parseFloat(activeActivation.cost).toFixed(2)}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {activationStatus === 'waiting_code' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.readyBtn]}
                      onPress={handleMarkReady}>
                      <FontAwesomeIcon icon={faCheck} size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Ready</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.retryBtn]}
                      onPress={handleRetry}>
                      <FontAwesomeIcon icon={faRedo} size={16} color="#fff" />
                      <Text style={styles.actionBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {activationStatus === 'code_received' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.completeBtn]}
                    onPress={handleComplete}>
                    <FontAwesomeIcon icon={faCheckCircle} size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Complete</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={handleCancel}>
                  <FontAwesomeIcon icon={faTimes} size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* New Activation Card */}
        {!activeActivation && (
          <View style={styles.orderCard}>
            <LinearGradient
              colors={['#fafbff', '#ffffff']}
              style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardHeaderIcon}>
                  <LinearGradient
                    colors={['#f3e8ff', '#faf5ff']}
                    style={styles.cardHeaderIconGradient}>
                    <FontAwesomeIcon icon={faSms} size={18} color="#800080" />
                  </LinearGradient>
                </View>
                <View style={styles.cardHeaderTitles}>
                  <Text style={styles.cardTitle}>New Activation</Text>
                  <Text style={styles.cardSubtitle}>Get a temporary number for SMS</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.formContainer}>
              {/* Service Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SERVICE</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowServiceModal(true)}>
                  <View style={styles.selectContent}>
                    <FontAwesomeIcon icon={faMobileAlt} size={18} color="#800080" style={{ marginRight: 12 }} />
                    <Text style={[styles.selectButtonText, !selectedService && { color: '#94a3b8' }]}>
                      {selectedService ? selectedService.name : 'Select a service...'}
                    </Text>
                    <View style={styles.selectIconWrapper}>
                      <FontAwesomeIcon icon={faChevronDown} size={12} color="#800080" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Country Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>COUNTRY</Text>
                <TouchableOpacity 
                  style={styles.selectButton}
                  onPress={() => setShowCountryModal(true)}>
                  <View style={styles.selectContent}>
                    <FontAwesomeIcon icon={faGlobe} size={18} color="#800080" style={{ marginRight: 12 }} />
                    <Text style={[styles.selectButtonText, !selectedCountry && { color: '#94a3b8' }]}>
                      {selectedCountry ? `${selectedCountry.name} (${selectedCountry.phone_code})` : 'Select a country...'}
                    </Text>
                    <View style={styles.selectIconWrapper}>
                      <FontAwesomeIcon icon={faChevronDown} size={12} color="#800080" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Price Display */}
              {(loadingPrice || price) && (
                <View style={styles.priceCard}>
                  <LinearGradient
                    colors={['#f3e8ff', '#faf5ff']}
                    style={styles.priceGradient}>
                    {loadingPrice ? (
                      <ActivityIndicator size="small" color="#800080" />
                    ) : price ? (
                      <>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Activation Cost</Text>
                          <Text style={styles.priceValue}>${price.cost.toFixed(2)}</Text>
                        </View>
                        {price.markup && (
                          <View style={styles.priceRow}>
                            <Text style={styles.priceNote}>Provider: ${price.provider_cost.toFixed(2)}</Text>
                          </View>
                        )}
                      </>
                    ) : null}
                  </LinearGradient>
                </View>
              )}

              {/* Activate Button */}
              <TouchableOpacity
                style={[styles.submitButton, activating && styles.submitButtonDisabled]}
                onPress={handleActivate}
                disabled={activating || !selectedService || !selectedCountry}>
                <LinearGradient
                  colors={activating || !selectedService || !selectedCountry 
                    ? ['#d1d5db', '#9ca3af'] 
                    : ['#800080', '#9933cc', '#b84dff']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  {activating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPhone} size={18} color="#fff" />
                      <Text style={styles.submitText}>Get Number</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Activations List */}
        {activeActivations.length > 0 && !activeActivation && (
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Active Activations</Text>
              <TouchableOpacity 
                style={styles.viewAllBtn}
                onPress={() => navigate('SMSHistory')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {activeActivations.slice(0, 3).map((activation, index) => (
              <TouchableOpacity
                key={activation.activation_id || index}
                style={styles.listItem}
                onPress={() => {
                  setActiveActivation(activation);
                  setActivationStatus(activation.status);
                  if (activation.status === 'waiting_code' || activation.status === 'waiting_retry') {
                    startPolling(activation.activation_id);
                  }
                }}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listItemIcon}>
                    <FontAwesomeIcon icon={faMobileAlt} size={16} color="#800080" />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemService}>{activation.service_name}</Text>
                    <Text style={styles.listItemNumber}>{activation.phone_number}</Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(activation.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(activation.status).text }]}>
                      {activation.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#1e293b', '#334155']}
            style={styles.infoGradient}>
            <FontAwesomeIcon icon={faInfoCircle} size={24} color="#a78bfa" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                1. Select a service and country{'\n'}
                2. Click "Get Number" to receive a phone number{'\n'}
                3. Use the number on the service{'\n'}
                4. Wait for the SMS code (auto-refreshes){'\n'}
                5. Copy the code and complete activation
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav navigate={navigate} currentScreen="More" />

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
            
            <View style={styles.searchContainer}>
              <FontAwesomeIcon icon={faSearch} size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search services..."
                placeholderTextColor="#94a3b8"
                value={serviceSearch}
                onChangeText={setServiceSearch}
              />
            </View>
            
            <FlatList
              data={filteredServices}
              keyExtractor={(item, index) => `service_${item.code}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedService?.code === item.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedService(item);
                    setShowServiceModal(false);
                    setServiceSearch('');
                  }}>
                  <Text style={[
                    styles.modalItemText,
                    selectedService?.code === item.code && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={styles.modalItemCode}>{item.code}</Text>
                  {selectedService?.code === item.code && (
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

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity 
                onPress={() => setShowCountryModal(false)}
                style={styles.modalCloseBtn}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <FontAwesomeIcon icon={faSearch} size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor="#94a3b8"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />
            </View>
            
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => `country_${item.code}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedCountry?.code === item.code && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryModal(false);
                    setCountrySearch('');
                  }}>
                  <View style={styles.countryItemContent}>
                    <Text style={[
                      styles.modalItemText,
                      selectedCountry?.code === item.code && styles.modalItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={styles.countryPhoneCode}>{item.phone_code}</Text>
                  </View>
                  {selectedCountry?.code === item.code && (
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
    </View>
  );
};

// Add missing TextInput import
import { TextInput } from 'react-native';

const getStatusColor = (status) => {
  switch (status) {
    case 'code_received':
    case 'completed':
      return { bg: '#dcfce7', text: '#15803d' };
    case 'waiting_code':
    case 'waiting_retry':
      return { bg: '#fef3c7', text: '#92400e' };
    case 'canceled':
    case 'failed':
      return { bg: '#fee2e2', text: '#991b1b' };
    default:
      return { bg: '#f1f5f9', text: '#475569' };
  }
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  walletAmount: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  addFundsBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addFundsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  activeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activeCardHeader: {
    padding: 16,
  },
  activeCardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  activeCardBody: {
    padding: 20,
  },
  numberDisplay: {
    marginBottom: 16,
  },
  numberLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
  },
  numberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDisplay: {
    marginBottom: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  codeLabel: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#15803d',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  copyBtnLarge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  copyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  activeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  readyBtn: {
    backgroundColor: '#10b981',
  },
  retryBtn: {
    backgroundColor: '#3b82f6',
  },
  completeBtn: {
    backgroundColor: '#10b981',
    flex: 2,
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 25,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
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
  },
  selectContent: {
    flexDirection: 'row',
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
  },
  priceCard: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  priceGradient: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    color: '#800080',
    fontWeight: 'bold',
  },
  priceNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
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
    marginLeft: 12,
  },
  listCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  viewAllBtn: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#800080',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemService: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  listItemNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  listItemRight: {
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoCard: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
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
    maxHeight: screenHeight * 0.75,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginVertical: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1e293b',
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
  modalItemCode: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 10,
    textTransform: 'uppercase',
  },
  modalCheckIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#800080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryItemContent: {
    flex: 1,
  },
  countryPhoneCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});

export default SMSActivation;