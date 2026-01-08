import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
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
  faRedo,
  faCheckCircle,
  faClock,
  faSearch,
  faWallet,
  faSms,
  faInfoCircle,
  faPhone,
  faBan,
  faRefresh,
  faCalendarAlt,
  faPlus,
  faMinus,
  faHourglass,
  faEnvelope,
  faHistory,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SMSRental = ({ navigate }) => {
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
  
  // Rental Options
  const [rentTime, setRentTime] = useState(4); // hours
  const [totalCost, setTotalCost] = useState(0);
  
  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  
  // Active Rental
  const [activeRental, setActiveRental] = useState(null);
  const [rentalStatus, setRentalStatus] = useState(null);
  const [smsCodes, setSmsCodes] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [polling, setPolling] = useState(false);
  const [renting, setRenting] = useState(false);
  
  // Extend rental
  const [extendHours, setExtendHours] = useState(4);
  const [extending, setExtending] = useState(false);
  
  // Active Rentals List
  const [activeRentals, setActiveRentals] = useState([]);
  
  // Refs
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    loadInitialData();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedService && selectedCountry) {
      loadPrice();
    } else {
      setPrice(null);
    }
  }, [selectedService, selectedCountry]);

  useEffect(() => {
    if (price) {
      setTotalCost(price.rental_rate * rentTime);
    } else {
      setTotalCost(0);
    }
  }, [price, rentTime]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [servicesData, countriesData, walletData, rentalsData] = await Promise.all([
        ApiService.getSmsServices(),
        ApiService.getSmsCountries(),
        ApiService.getWalletBalance().catch(() => ({ balance: 0 })),
        ApiService.getSmsRentals({ status: 'active' }).catch(() => ({ results: { rentals: [] } })),
      ]);
      
      setServices(servicesData?.services || []);
      setCountries(countriesData?.countries || []);
      setWalletBalance(parseFloat(walletData?.balance || walletData?.wallet?.balance || 0));
      
      const rentals = rentalsData?.results?.rentals || rentalsData?.rentals || [];
      setActiveRentals(rentals);
      
      // If there's an active rental, set it
      if (rentals.length > 0) {
        const active = rentals.find(r => r.status === 'active');
        if (active) {
          setActiveRental(active);
          setRentalStatus(active.status);
          calculateTimeRemaining(active.end_date);
          startPolling(active.rent_id);
          startCountdown(active.end_date);
        }
      }
      
    } catch (error) {
      console.error('Error loading rental data:', error);
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

  const calculateTimeRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) {
      setTimeRemaining('Expired');
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeRemaining(`${hours}h ${minutes}m`);
  };

  const startCountdown = (endDate) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    countdownRef.current = setInterval(() => {
      calculateTimeRemaining(endDate);
    }, 60000); // Update every minute
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleRent = async () => {
    if (!selectedService || !selectedCountry) {
      Alert.alert('Error', 'Please select a service and country');
      return;
    }

    if (totalCost > walletBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your balance ($${walletBalance.toFixed(2)}) is less than the rental cost ($${totalCost.toFixed(2)}). Please add funds to continue.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Funds', onPress: () => navigate('Wallet') }
        ]
      );
      return;
    }

    try {
      setRenting(true);
      
      const result = await ApiService.rentNumber(
        selectedService.code,
        selectedCountry.code,
        rentTime
      );
      
      if (result.status === 'success') {
        const rental = {
          rent_id: result.rent_id,
          phone_number: result.number,
          service_name: result.service_name || selectedService.name,
          country_name: result.country_name || selectedCountry.name,
          cost: result.cost,
          hourly_rate: result.hourly_rate,
          rent_time: result.rent_time,
          end_date: result.end_date,
          status: 'active',
        };
        
        setActiveRental(rental);
        setRentalStatus('active');
        setWalletBalance(parseFloat(result.new_balance));
        setSmsCodes([]);
        
        calculateTimeRemaining(result.end_date);
        startCountdown(result.end_date);
        startPolling(result.rent_id);
        
        Vibration.vibrate(100);
        
      } else {
        Alert.alert('Error', result.error || 'Failed to rent number');
      }
      
    } catch (error) {
      console.error('Rental error:', error);
      Alert.alert('Error', error.message || 'Failed to rent number. Please try again.');
    } finally {
      setRenting(false);
    }
  };

  const startPolling = (rentId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    setPolling(true);
    
    const poll = async () => {
      try {
        const result = await ApiService.checkRentalStatus(rentId);
        
        if (result.sms_codes && result.sms_codes.length > smsCodes.length) {
          setSmsCodes(result.sms_codes);
          Vibration.vibrate([0, 200, 100, 200]);
        }
        
        setRentalStatus(result.rental_status);
        
        if (result.rental_status === 'expired' || result.rental_status === 'finished') {
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };
    
    // Initial poll
    poll();
    
    // Continue polling every 30 seconds
    pollIntervalRef.current = setInterval(poll, 30000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setPolling(false);
  };

  const handleExtend = async () => {
    if (!activeRental) return;
    
    const extendCost = (price?.rental_rate || activeRental.hourly_rate || 0.65) * extendHours;
    
    if (extendCost > walletBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Extension cost ($${extendCost.toFixed(2)}) exceeds your balance ($${walletBalance.toFixed(2)}).`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Funds', onPress: () => navigate('Wallet') }
        ]
      );
      return;
    }
    
    try {
      setExtending(true);
      
      const result = await ApiService.continueRental(activeRental.rent_id, extendHours);
      
      if (result.status === 'success') {
        setActiveRental({
          ...activeRental,
          end_date: result.new_end_date,
          rent_time: activeRental.rent_time + extendHours,
          cost: parseFloat(activeRental.cost) + parseFloat(result.extension_cost),
        });
        
        setWalletBalance(parseFloat(result.new_balance));
        calculateTimeRemaining(result.new_end_date);
        startCountdown(result.new_end_date);
        
        setShowExtendModal(false);
        Alert.alert('Success', `Rental extended by ${extendHours} hours!`);
      }
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setExtending(false);
    }
  };

  const handleFinish = async () => {
    if (!activeRental) return;
    
    Alert.alert(
      'Finish Rental',
      'Are you sure you want to finish this rental early?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Finish',
          onPress: async () => {
            try {
              await ApiService.finishRental(activeRental.rent_id);
              
              stopPolling();
              
              Alert.alert('Success', 'Rental finished successfully.');
              
              setActiveRental(null);
              setRentalStatus(null);
              setSmsCodes([]);
              setTimeRemaining(null);
              
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleCancel = async () => {
    if (!activeRental) return;
    
    Alert.alert(
      'Cancel Rental',
      'Are you sure you want to cancel this rental? Refund is only available within 20 minutes if no SMS received.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ApiService.cancelRental(activeRental.rent_id);
              
              stopPolling();
              
              if (result.refunded) {
                Alert.alert('Canceled', `Rental canceled. $${result.refund_amount} refunded.`);
              } else {
                Alert.alert('Canceled', 'Rental canceled. No refund (past cancellation window).');
              }
              
              setActiveRental(null);
              setRentalStatus(null);
              setSmsCodes([]);
              setTimeRemaining(null);
              
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
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'expired':
      case 'finished':
        return { bg: '#f1f5f9', text: '#475569' };
      case 'canceled':
        return { bg: '#fee2e2', text: '#991b1b' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
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
          <Text style={styles.loadingText}>Loading Rental Services...</Text>
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
            <Text style={styles.headerTitle}>SMS Rental</Text>
            <Text style={styles.headerSubtitle}>Rent numbers for extended periods</Text>
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

        {/* Active Rental Card */}
        {activeRental && (
          <View style={styles.activeCard}>
            <LinearGradient
              colors={['#059669', '#10b981']}
              style={styles.activeCardHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <View style={styles.activeCardHeaderContent}>
                <FontAwesomeIcon icon={faCheckCircle} size={20} color="#fff" />
                <Text style={styles.activeCardTitle}>Active Rental</Text>
                <View style={styles.timeRemainingBadge}>
                  <FontAwesomeIcon icon={faStopwatch} size={12} color="#059669" />
                  <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.activeCardBody}>
              <View style={styles.numberDisplay}>
                <Text style={styles.numberLabel}>Phone Number</Text>
                <View style={styles.numberRow}>
                  <Text style={styles.numberText}>{activeRental.phone_number}</Text>
                  <TouchableOpacity 
                    style={styles.copyBtn}
                    onPress={() => copyToClipboard(activeRental.phone_number)}>
                    <FontAwesomeIcon icon={faCopy} size={16} color="#800080" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* SMS Messages */}
              <View style={styles.smsSection}>
                <View style={styles.smsSectionHeader}>
                  <Text style={styles.smsSectionTitle}>
                    <FontAwesomeIcon icon={faEnvelope} size={14} color="#1e293b" /> Received Messages ({smsCodes.length})
                  </Text>
                  {polling && (
                    <ActivityIndicator size="small" color="#800080" />
                  )}
                </View>
                
                {smsCodes.length === 0 ? (
                  <View style={styles.noMessages}>
                    <FontAwesomeIcon icon={faEnvelope} size={30} color="#e2e8f0" />
                    <Text style={styles.noMessagesText}>No messages yet</Text>
                    <Text style={styles.noMessagesSubtext}>Messages will appear here automatically</Text>
                  </View>
                ) : (
                  smsCodes.map((sms, index) => (
                    <View key={index} style={styles.smsItem}>
                      <View style={styles.smsHeader}>
                        <Text style={styles.smsFrom}>From: {sms.phone_from}</Text>
                        <Text style={styles.smsDate}>{new Date(sms.date).toLocaleTimeString()}</Text>
                      </View>
                      <View style={styles.smsBody}>
                        <Text style={styles.smsText}>{sms.text}</Text>
                        <TouchableOpacity 
                          style={styles.smsCopyBtn}
                          onPress={() => copyToClipboard(sms.text)}>
                          <FontAwesomeIcon icon={faCopy} size={14} color="#800080" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.activeDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{activeRental.service_name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Country</Text>
                  <Text style={styles.detailValue}>{activeRental.country_name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Cost</Text>
                  <Text style={styles.detailValue}>${parseFloat(activeRental.cost).toFixed(2)}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.extendBtn]}
                  onPress={() => setShowExtendModal(true)}>
                  <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Extend</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.finishBtn]}
                  onPress={handleFinish}>
                  <FontAwesomeIcon icon={faCheckCircle} size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Finish</Text>
                </TouchableOpacity>
                
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

        {/* New Rental Card */}
        {!activeRental && (
          <View style={styles.orderCard}>
            <LinearGradient
              colors={['#fafbff', '#ffffff']}
              style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardHeaderIcon}>
                  <LinearGradient
                    colors={['#f3e8ff', '#faf5ff']}
                    style={styles.cardHeaderIconGradient}>
                    <FontAwesomeIcon icon={faCalendarAlt} size={18} color="#800080" />
                  </LinearGradient>
                </View>
                <View style={styles.cardHeaderTitles}>
                  <Text style={styles.cardTitle}>New Rental</Text>
                  <Text style={styles.cardSubtitle}>Rent a number for 4-720 hours</Text>
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

              {/* Duration Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RENTAL DURATION (HOURS)</Text>
                <View style={styles.durationSelector}>
                  <TouchableOpacity 
                    style={styles.durationBtn}
                    onPress={() => setRentTime(Math.max(4, rentTime - 4))}
                    disabled={rentTime <= 4}>
                    <FontAwesomeIcon icon={faMinus} size={16} color={rentTime <= 4 ? '#cbd5e1' : '#800080'} />
                  </TouchableOpacity>
                  
                  <View style={styles.durationDisplay}>
                    <Text style={styles.durationValue}>{rentTime}</Text>
                    <Text style={styles.durationUnit}>hours</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.durationBtn}
                    onPress={() => setRentTime(Math.min(720, rentTime + 4))}
                    disabled={rentTime >= 720}>
                    <FontAwesomeIcon icon={faPlus} size={16} color={rentTime >= 720 ? '#cbd5e1' : '#800080'} />
                  </TouchableOpacity>
                </View>
                
                {/* Quick duration options */}
                <View style={styles.quickDurations}>
                  {[4, 12, 24, 48, 168].map(hours => (
                    <TouchableOpacity
                      key={hours}
                      style={[styles.quickDurationBtn, rentTime === hours && styles.quickDurationBtnActive]}
                      onPress={() => setRentTime(hours)}>
                      <Text style={[styles.quickDurationText, rentTime === hours && styles.quickDurationTextActive]}>
                        {hours < 24 ? `${hours}h` : `${hours/24}d`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                          <Text style={styles.priceLabel}>Hourly Rate</Text>
                          <Text style={styles.priceRate}>${price.rental_rate?.toFixed(2) || '0.65'}/hr</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                          <Text style={styles.totalLabel}>Total ({rentTime} hours)</Text>
                          <Text style={styles.priceValue}>${totalCost.toFixed(2)}</Text>
                        </View>
                      </>
                    ) : null}
                  </LinearGradient>
                </View>
              )}

              {/* Rent Button */}
              <TouchableOpacity
                style={[styles.submitButton, renting && styles.submitButtonDisabled]}
                onPress={handleRent}
                disabled={renting || !selectedService || !selectedCountry}>
                <LinearGradient
                  colors={renting || !selectedService || !selectedCountry 
                    ? ['#d1d5db', '#9ca3af'] 
                    : ['#800080', '#9933cc', '#b84dff']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  {renting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCalendarAlt} size={18} color="#fff" />
                      <Text style={styles.submitText}>Rent Number</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Rentals List */}
        {activeRentals.length > 0 && !activeRental && (
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Active Rentals</Text>
              <TouchableOpacity 
                style={styles.viewAllBtn}
                onPress={() => navigate('SMSHistory', { tab: 'rentals' })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {activeRentals.slice(0, 3).map((rental, index) => (
              <TouchableOpacity
                key={rental.rent_id || index}
                style={styles.listItem}
                onPress={() => {
                  setActiveRental(rental);
                  setRentalStatus(rental.status);
                  calculateTimeRemaining(rental.end_date);
                  startCountdown(rental.end_date);
                  startPolling(rental.rent_id);
                }}>
                <View style={styles.listItemLeft}>
                  <View style={styles.listItemIcon}>
                    <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#800080" />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemService}>{rental.service_name}</Text>
                    <Text style={styles.listItemNumber}>{rental.phone_number}</Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <Text style={styles.listItemTime}>{rental.time_remaining?.toFixed(1) || '0'}h left</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(rental.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(rental.status).text }]}>
                      {rental.status.toUpperCase()}
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
              <Text style={styles.infoTitle}>Rental Benefits</Text>
              <Text style={styles.infoText}>
                • Keep the same number for 4-720 hours{'\n'}
                • Receive unlimited SMS during rental{'\n'}
                • Extend rental time anytime{'\n'}
                • Refund available within 20 mins (if no SMS){'\n'}
                • Perfect for services that require multiple verifications
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

      {/* Extend Rental Modal */}
      <Modal
        visible={showExtendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExtendModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.extendModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extend Rental</Text>
              <TouchableOpacity 
                onPress={() => setShowExtendModal(false)}
                style={styles.modalCloseBtn}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.extendContent}>
              <Text style={styles.extendLabel}>Additional Hours</Text>
              
              <View style={styles.durationSelector}>
                <TouchableOpacity 
                  style={styles.durationBtn}
                  onPress={() => setExtendHours(Math.max(4, extendHours - 4))}
                  disabled={extendHours <= 4}>
                  <FontAwesomeIcon icon={faMinus} size={16} color={extendHours <= 4 ? '#cbd5e1' : '#800080'} />
                </TouchableOpacity>
                
                <View style={styles.durationDisplay}>
                  <Text style={styles.durationValue}>{extendHours}</Text>
                  <Text style={styles.durationUnit}>hours</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.durationBtn}
                  onPress={() => setExtendHours(Math.min(168, extendHours + 4))}>
                  <FontAwesomeIcon icon={faPlus} size={16} color="#800080" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.extendCostDisplay}>
                <Text style={styles.extendCostLabel}>Extension Cost</Text>
                <Text style={styles.extendCostValue}>
                  ${((price?.rental_rate || activeRental?.hourly_rate || 0.65) * extendHours).toFixed(2)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.extendSubmitBtn}
                onPress={handleExtend}
                disabled={extending}>
                <LinearGradient
                  colors={['#800080', '#9933cc']}
                  style={styles.extendSubmitGradient}>
                  {extending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.extendSubmitText}>Confirm Extension</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  timeRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeRemainingText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
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
  smsSection: {
    marginBottom: 16,
  },
  smsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  noMessages: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
  },
  noMessagesText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 12,
  },
  noMessagesSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  smsItem: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  smsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smsFrom: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  smsDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  smsBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  smsText: {
    fontSize: 13,
    color: '#15803d',
    flex: 1,
    lineHeight: 20,
  },
  smsCopyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
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
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
  },
  extendBtn: {
    backgroundColor: '#3b82f6',
  },
  finishBtn: {
    backgroundColor: '#10b981',
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
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  durationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  durationDisplay: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800080',
  },
  durationUnit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  quickDurations: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickDurationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  quickDurationBtnActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#800080',
  },
  quickDurationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  quickDurationTextActive: {
    color: '#800080',
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
  priceRate: {
    fontSize: 16,
    color: '#800080',
    fontWeight: 'bold',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#e9d5ff',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 24,
    color: '#800080',
    fontWeight: 'bold',
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
    alignItems: 'flex-end',
  },
  listItemTime: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
    marginBottom: 4,
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
  // Extend Modal
  extendModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 40,
    overflow: 'hidden',
  },
  extendContent: {
    padding: 20,
  },
  extendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  extendCostDisplay: {
    backgroundColor: '#f3e8ff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  extendCostLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  extendCostValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800080',
  },
  extendSubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  extendSubmitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  extendSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SMSRental;