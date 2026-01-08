import React, { useState, useEffect } from 'react';
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
  FlatList,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faSearch,
  faMobileAlt,
  faCalendarAlt,
  faCheckCircle,
  faClock,
  faTimes,
  faBan,
  faFilter,
  faRefresh,
  faHistory,
  faChartPie,
  faSms,
  faPhone,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SMSHistory = ({ navigate, route }) => {
  // Initial tab from navigation params
  const initialTab = route?.params?.tab || 'activations';
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Activations
  const [activations, setActivations] = useState([]);
  const [activationStats, setActivationStats] = useState({ total: 0, completed: 0, total_spent: '0.00' });
  const [activationPage, setActivationPage] = useState(1);
  const [activationHasMore, setActivationHasMore] = useState(true);
  const [activationFilter, setActivationFilter] = useState('all');
  const [activationSearch, setActivationSearch] = useState('');
  
  // Rentals
  const [rentals, setRentals] = useState([]);
  const [rentalStats, setRentalStats] = useState({ total: 0, active: 0, total_spent: '0.00', total_hours: 0 });
  const [rentalPage, setRentalPage] = useState(1);
  const [rentalHasMore, setRentalHasMore] = useState(true);
  const [rentalFilter, setRentalFilter] = useState('all');
  const [rentalSearch, setRentalSearch] = useState('');
  
  // Loading states
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'activations') {
      loadActivations(1, true);
    } else {
      loadRentals(1, true);
    }
  }, [activationFilter, rentalFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActivations(1, true),
        loadRentals(1, true),
      ]);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivations = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setActivationPage(1);
      }
      
      const params = { page };
      if (activationFilter !== 'all') {
        params.status = activationFilter;
      }
      if (activationSearch) {
        params.search = activationSearch;
      }
      
      const data = await ApiService.getSmsActivationHistory(params);
      
      const items = data?.results?.activations || data?.activations || [];
      const stats = data?.results?.stats || data?.stats || {};
      
      if (reset) {
        setActivations(items);
      } else {
        setActivations(prev => [...prev, ...items]);
      }
      
      setActivationStats(stats);
      setActivationHasMore(!!data?.next);
      setActivationPage(page);
      
    } catch (error) {
      console.error('Error loading activations:', error);
    }
  };

  const loadRentals = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setRentalPage(1);
      }
      
      const params = { page };
      if (rentalFilter !== 'all') {
        params.status = rentalFilter;
      }
      if (rentalSearch) {
        params.search = rentalSearch;
      }
      
      const data = await ApiService.getSmsRentalHistory(params);
      
      const items = data?.results?.rentals || data?.rentals || [];
      const stats = data?.results?.stats || data?.stats || {};
      
      if (reset) {
        setRentals(items);
      } else {
        setRentals(prev => [...prev, ...items]);
      }
      
      setRentalStats(stats);
      setRentalHasMore(!!data?.next);
      setRentalPage(page);
      
    } catch (error) {
      console.error('Error loading rentals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadMoreActivations = async () => {
    if (loadingMore || !activationHasMore) return;
    setLoadingMore(true);
    await loadActivations(activationPage + 1, false);
    setLoadingMore(false);
  };

  const loadMoreRentals = async () => {
    if (loadingMore || !rentalHasMore) return;
    setLoadingMore(true);
    await loadRentals(rentalPage + 1, false);
    setLoadingMore(false);
  };

  const handleSearch = () => {
    if (activeTab === 'activations') {
      loadActivations(1, true);
    } else {
      loadRentals(1, true);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'code_received':
        return { bg: '#dcfce7', text: '#15803d', icon: faCheckCircle };
      case 'waiting_code':
      case 'waiting_retry':
      case 'active':
        return { bg: '#fef3c7', text: '#92400e', icon: faClock };
      case 'canceled':
      case 'failed':
        return { bg: '#fee2e2', text: '#991b1b', icon: faTimes };
      case 'expired':
      case 'finished':
        return { bg: '#f1f5f9', text: '#475569', icon: faBan };
      default:
        return { bg: '#f1f5f9', text: '#475569', icon: faHistory };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderActivationItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => navigate('SMSActivation', { activationId: item.activation_id })}
        activeOpacity={0.7}>
        <View style={styles.historyItemLeft}>
          <View style={[styles.historyItemIcon, { backgroundColor: '#f3e8ff' }]}>
            <FontAwesomeIcon icon={faMobileAlt} size={18} color="#800080" />
          </View>
          <View style={styles.historyItemInfo}>
            <Text style={styles.historyItemService}>{item.service_name}</Text>
            <Text style={styles.historyItemNumber}>{item.phone_number}</Text>
            <Text style={styles.historyItemDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        
        <View style={styles.historyItemRight}>
          <Text style={styles.historyItemCost}>${parseFloat(item.cost || 0).toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <FontAwesomeIcon icon={statusStyle.icon} size={10} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {item.sms_code && (
            <View style={styles.codePreview}>
              <Text style={styles.codePreviewText}>Code: {item.sms_code}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRentalItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => navigate('SMSRental', { rentId: item.rent_id })}
        activeOpacity={0.7}>
        <View style={styles.historyItemLeft}>
          <View style={[styles.historyItemIcon, { backgroundColor: '#dbeafe' }]}>
            <FontAwesomeIcon icon={faCalendarAlt} size={18} color="#2563eb" />
          </View>
          <View style={styles.historyItemInfo}>
            <Text style={styles.historyItemService}>{item.service_name}</Text>
            <Text style={styles.historyItemNumber}>{item.phone_number}</Text>
            <Text style={styles.historyItemDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        
        <View style={styles.historyItemRight}>
          <Text style={styles.historyItemCost}>${parseFloat(item.cost || 0).toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <FontAwesomeIcon icon={statusStyle.icon} size={10} color={statusStyle.text} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.rentalDuration}>{item.rent_time}h rental</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const activationFilters = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'waiting_code', label: 'Waiting' },
    { key: 'canceled', label: 'Canceled' },
  ];

  const rentalFilters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'canceled', label: 'Canceled' },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading History...</Text>
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
            <Text style={styles.headerTitle}>SMS History</Text>
            <Text style={styles.headerSubtitle}>View all your SMS transactions</Text>
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

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'activations' && styles.tabActive]}
            onPress={() => setActiveTab('activations')}>
            <FontAwesomeIcon 
              icon={faSms} 
              size={16} 
              color={activeTab === 'activations' ? '#800080' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.tabText, activeTab === 'activations' && styles.tabTextActive]}>
              Activations
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rentals' && styles.tabActive]}
            onPress={() => setActiveTab('rentals')}>
            <FontAwesomeIcon 
              icon={faCalendarAlt} 
              size={16} 
              color={activeTab === 'rentals' ? '#800080' : 'rgba(255,255,255,0.7)'} 
            />
            <Text style={[styles.tabText, activeTab === 'rentals' && styles.tabTextActive]}>
              Rentals
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {activeTab === 'activations' ? (
          <>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                <FontAwesomeIcon icon={faPhone} size={16} color="#800080" />
              </View>
              <Text style={styles.statValue}>{activationStats.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <FontAwesomeIcon icon={faCheckCircle} size={16} color="#15803d" />
              </View>
              <Text style={styles.statValue}>{activationStats.completed || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <FontAwesomeIcon icon={faDollarSign} size={16} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>${parseFloat(activationStats.total_spent || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#800080" />
              </View>
              <Text style={styles.statValue}>{rentalStats.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                <FontAwesomeIcon icon={faClock} size={16} color="#15803d" />
              </View>
              <Text style={styles.statValue}>{rentalStats.active || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                <FontAwesomeIcon icon={faDollarSign} size={16} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>${parseFloat(rentalStats.total_spent || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </>
        )}
      </View>

      {/* Search and Filters */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by number..."
            placeholderTextColor="#94a3b8"
            value={activeTab === 'activations' ? activationSearch : rentalSearch}
            onChangeText={activeTab === 'activations' ? setActivationSearch : setRentalSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}>
          {(activeTab === 'activations' ? activationFilters : rentalFilters).map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                (activeTab === 'activations' ? activationFilter : rentalFilter) === filter.key && styles.filterChipActive
              ]}
              onPress={() => {
                if (activeTab === 'activations') {
                  setActivationFilter(filter.key);
                } else {
                  setRentalFilter(filter.key);
                }
              }}>
              <Text style={[
                styles.filterChipText,
                (activeTab === 'activations' ? activationFilter : rentalFilter) === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'activations' ? activations : rentals}
        renderItem={activeTab === 'activations' ? renderActivationItem : renderRentalItem}
        keyExtractor={(item) => item.activation_id || item.rent_id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }
        onEndReached={activeTab === 'activations' ? loadMoreActivations : loadMoreRentals}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#800080" />
            </View>
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <FontAwesomeIcon 
              icon={activeTab === 'activations' ? faSms : faCalendarAlt} 
              size={50} 
              color="#e2e8f0" 
            />
            <Text style={styles.emptyText}>
              No {activeTab} found
            </Text>
            <Text style={styles.emptySubtext}>
              Your {activeTab} history will appear here
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigate(activeTab === 'activations' ? 'SMSActivation' : 'SMSRental')}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>
                  {activeTab === 'activations' ? 'Get a Number' : 'Rent a Number'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      />

      <BottomNav navigate={navigate} currentScreen="More" />
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
    paddingBottom: 10,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  tabTextActive: {
    color: '#800080',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: -15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchFilterContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1e293b',
  },
  filterScroll: {
    maxHeight: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#800080',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#800080',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyItemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  historyItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  historyItemService: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  historyItemNumber: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  historyItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  historyItemCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800080',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  codePreview: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codePreviewText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  rentalDuration: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SMSHistory;