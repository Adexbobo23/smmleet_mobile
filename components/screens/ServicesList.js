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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSearch,
  faFilter,
  faChevronRight,
  faStar,
  faClock,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const ServicesList = ({ navigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchQuery, selectedCategory, allServices]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories and services in parallel
      const [categoriesData, servicesData] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getServices(),
      ]);

      // Set categories
      if (categoriesData && categoriesData.results) {
        setCategories([
          { id: 'all', name: 'All Services' },
          ...categoriesData.results
        ]);
      } else if (Array.isArray(categoriesData)) {
        setCategories([
          { id: 'all', name: 'All Services' },
          ...categoriesData
        ]);
      }

      // Set services
      if (servicesData && servicesData.results) {
        setAllServices(servicesData.results);
      } else if (Array.isArray(servicesData)) {
        setAllServices(servicesData);
      } else {
        setAllServices([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load services');
      setAllServices([]);
      setCategories([{ id: 'all', name: 'All Services' }]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterServices = () => {
    let filtered = [...allServices];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(service => {
        const name = (service.name || '').toLowerCase();
        const serviceId = (service.service_id || service.id || '').toString().toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || serviceId.includes(query);
      });
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => 
        service.category === parseInt(selectedCategory) || 
        service.category_id === parseInt(selectedCategory)
      );
    }

    setFilteredServices(filtered);
  };

  const getCategoryIcon = (categoryName) => {
    if (categoryName.toLowerCase().includes('instagram')) return '📸';
    if (categoryName.toLowerCase().includes('tiktok')) return '🎵';
    if (categoryName.toLowerCase().includes('youtube')) return '📹';
    if (categoryName.toLowerCase().includes('facebook')) return '👍';
    if (categoryName.toLowerCase().includes('twitter')) return '🐦';
    return '⭐';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <ActivityIndicator size="large" color="#da6bff" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      {/* Header */}
      <LinearGradient
        colors={['#800080', '#9933cc']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSubtitle}>{allServices.length} services available</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={16} color="#da6bff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#6b5b85"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id.toString() && styles.activeCategoryTab,
              ]}
              onPress={() => setSelectedCategory(category.id.toString())}>
              {selectedCategory === category.id.toString() ? (
                <LinearGradient
                  colors={['#800080', '#9933cc']}
                  style={styles.categoryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <Text style={styles.activeCategoryText}>
                    {category.id !== 'all' ? `${getCategoryIcon(category.name)} ` : ''}{category.name}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.categoryText}>
                  {category.id !== 'all' ? `${getCategoryIcon(category.name)} ` : ''}{category.name}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {filteredServices.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No services found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Services will appear here'}
            </Text>
          </View>
        ) : (
          filteredServices.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard} 
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  service.name,
                  `Service ID: ${service.service_id || service.id}\nRate: $${service.rate}/1000\nMin: ${service.min} - Max: ${service.max}\n\n${service.description || 'No description'}`,
                  [
                    { text: 'Cancel' },
                    { text: 'Order Now', onPress: () => navigate('NewOrder') }
                  ]
                );
              }}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIdBadge}>
                  <Text style={styles.serviceIdText}>#{service.service_id || service.id}</Text>
                </View>
                {service.rating && (
                  <View style={styles.serviceRating}>
                    <FontAwesomeIcon icon={faStar} size={12} color="#f59e0b" />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description && (
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {service.description}
                </Text>
              )}

              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={styles.detailValue}>${service.rate}/1K</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Min/Max</Text>
                  <Text style={styles.detailValue}>{service.min}/{service.max}</Text>
                </View>
                {service.average_time && (
                  <View style={styles.detailItem}>
                    <FontAwesomeIcon icon={faClock} size={12} color="#a78bca" />
                    <Text style={styles.deliveryText}>{service.average_time}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.orderButton}
                onPress={() => navigate('NewOrder')}>
                <Text style={styles.orderButtonText}>Order Now</Text>
                <FontAwesomeIcon icon={faChevronRight} size={14} color="#da6bff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav navigate={navigate} currentScreen="More" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07040d',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a78bca',
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0818',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#f5f3ff',
  },
  categoryContainer: {
    backgroundColor: '#0d0818',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  categoryScroll: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeCategoryText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a78bca',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: '#0d0818',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceIdBadge: {
    backgroundColor: '#140c24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceIdText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#da6bff',
    fontFamily: 'monospace',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginLeft: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f5f3ff',
    marginBottom: 6,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#a78bca',
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#07040d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#8a76a8',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#f5f3ff',
    fontWeight: 'bold',
  },
  deliveryText: {
    fontSize: 11,
    color: '#a78bca',
    marginLeft: 4,
    fontWeight: '600',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#140c24',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(198,61,255,0.25)',
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#da6bff',
    marginRight: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8a76a8',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ServicesList;