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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faLayerGroup,
  faList,
  faReceipt,
  faTicketAlt,
  faBookOpen,
  faFileContract,
  faSignOutAlt,
  faChevronRight,
  faUser,
  faBell,
  faShieldAlt,
  faWallet,
  faShoppingBag,
  faChartLine,
  faCrown,
  faEdit,
  faLock,
  faQuestionCircle,
  faEnvelope,
  faKey,
  faRefresh,
  faMobileAlt,
  faCalendarAlt,
  faHistory,
  faSms,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const More = ({ navigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Load all data in parallel
      const [storedUser, profileData, dashboardStats, walletSummary] = await Promise.all([
        ApiService.getUser(),
        ApiService.getUserProfile().catch(() => null),
        ApiService.getDashboardStats().catch(() => null),
        ApiService.getWalletSummary().catch(() => null),
      ]);
      
      console.log('=== More Screen Data ===');
      console.log('Stored user:', storedUser);
      console.log('Profile data:', profileData);
      console.log('Dashboard stats:', dashboardStats);
      console.log('Wallet summary:', walletSummary);
      
      // Set user info from stored data or profile data
      let user = storedUser;
      if (profileData && profileData.user) {
        user = profileData.user;
        // Update stored user with fresh data
        await ApiService.saveUser(user);
      }
      
      if (user) {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() 
          || user.full_name 
          || user.username 
          || 'User';
        
        setUserName(fullName);
        setUserEmail(user.email || '');
        
        // Generate initials
        let initials = 'U';
        if (user.first_name && user.last_name) {
          initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
        } else if (user.first_name) {
          initials = user.first_name.charAt(0);
        } else if (user.username) {
          initials = user.username.charAt(0).toUpperCase();
        }
        setUserInitials(initials);
      }

      // Set dashboard stats
      if (dashboardStats) {
        setTotalOrders(dashboardStats.total_orders || 0);
        
        // Parse total_spent - could be string or number
        const spent = parseFloat(dashboardStats.total_spent || 0);
        setTotalSpent(spent);
        
        console.log('Parsed total spent:', spent);
      }

      // Set wallet data - prioritize wallet summary over dashboard
      if (walletSummary) {
        // Parse wallet data
        const balance = walletSummary.wallet?.balance 
          || walletSummary.balance 
          || 0;
        
        const deposits = walletSummary.total_deposits || 0;
        
        const spent = walletSummary.total_spent || 0;
        
        // Parse to float
        setWalletBalance(parseFloat(balance));
        setTotalDeposits(parseFloat(deposits));
        
        // Only update total spent if not already set from dashboard
        if (!dashboardStats || !dashboardStats.total_spent) {
          setTotalSpent(parseFloat(spent));
        }
        
        console.log('Wallet summary - Balance:', balance, 'Deposits:', deposits, 'Spent:', spent);
      } else if (dashboardStats && dashboardStats.wallet_balance) {
        // Fallback to dashboard wallet balance
        setWalletBalance(parseFloat(dashboardStats.wallet_balance || 0));
      } else if (profileData && profileData.wallet_balance) {
        // Fallback to profile wallet balance
        setWalletBalance(parseFloat(profileData.wallet_balance || 0));
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your account?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            try {
              await ApiService.logout();
              navigate('Login');
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate to login even if API call fails
              navigate('Login');
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const menuSections = [
    // ========== SMS SERVICES SECTION ==========
    {
      title: 'SMS Services',
      items: [
        { 
          name: 'SMS Activation', 
          icon: faMobileAlt, 
          screen: 'SMSActivation', 
          color: '#800080',
          description: 'Get verification codes instantly'
        },
        { 
          name: 'SMS Rental', 
          icon: faCalendarAlt, 
          screen: 'SMSRental', 
          color: '#3b82f6',
          description: 'Rent a number for extended use'
        },
        { 
          name: 'SMS History', 
          icon: faHistory, 
          screen: 'SMSHistory', 
          color: '#10b981',
          description: 'View all SMS transactions'
        },
      ],
    },
    // ========== END SMS SERVICES SECTION ==========
    {
      title: 'Orders & Services',
      items: [
        { 
          name: 'Mass Order', 
          icon: faLayerGroup, 
          screen: 'MassOrder', 
          color: '#3b82f6',
          description: 'Place multiple orders at once'
        },
        { 
          name: 'Services List', 
          icon: faList, 
          screen: 'ServicesList', 
          color: '#10b981',
          description: 'Browse all available services'
        },
        { 
          name: 'Transactions', 
          icon: faReceipt, 
          screen: 'Transactions', 
          color: '#f59e0b',
          description: 'View payment history'
        },
      ],
    },
    {
      title: 'Account Settings',
      items: [
        { 
          name: 'Profile Settings', 
          icon: faUser, 
          screen: 'Profile', 
          color: '#800080',
          description: 'Manage your profile'
        },
        { 
          name: 'Change Password', 
          icon: faLock, 
          screen: 'Profile', 
          color: '#ef4444',
          description: 'Update your password'
        },
        { 
          name: 'API Keys', 
          icon: faKey, 
          screen: 'ApiKeys', 
          color: '#0ea5e9',
          description: 'Manage API access'
        },
      ],
    },
    {
      title: 'Support & Help',
      items: [
        { 
          name: 'Support Tickets', 
          icon: faTicketAlt, 
          screen: 'Support', 
          color: '#ec4899',
          description: 'Get help from our team'
        },
        { 
          name: 'Help Center', 
          icon: faQuestionCircle, 
          screen: null, 
          color: '#0ea5e9',
          description: 'FAQs and guides'
        },
        { 
          name: 'Contact Us', 
          icon: faEnvelope, 
          screen: 'Support', 
          color: '#8b5cf6',
          description: 'Reach out to us'
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        { 
          name: 'How To Use', 
          icon: faBookOpen, 
          screen: null, 
          color: '#0ea5e9',
          description: 'Learn how to use the app'
        },
        { 
          name: 'Terms & Conditions', 
          icon: faFileContract, 
          screen: null, 
          color: '#64748b',
          description: 'Read our terms'
        },
      ],
    },
  ];

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
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>More</Text>
            <Text style={styles.headerSubtitle}>Manage your account & settings</Text>
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
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#800080']}
            tintColor="#800080"
          />
        }>
        
        {/* User Profile Card */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.userCard}
            onPress={() => navigate('Profile')}
            activeOpacity={0.9}>
            <LinearGradient
              colors={['#ffffff', '#fafbff']}
              style={styles.userCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}>
              <View style={styles.userCardGlow} />
              
              <View style={styles.userHeader}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#800080', '#9933cc', '#b84dff']}
                    style={styles.avatarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}>
                    <Text style={styles.avatarText}>{userInitials}</Text>
                    <View style={styles.avatarGlow} />
                  </LinearGradient>
                  <View style={styles.premiumBadge}>
                    <FontAwesomeIcon icon={faCrown} size={10} color="#fbbf24" />
                  </View>
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userEmail}>{userEmail}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigate('Profile')}>
                  <FontAwesomeIcon icon={faEdit} size={14} color="#800080" />
                </TouchableOpacity>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#f3e8ff' }]}>
                    <FontAwesomeIcon icon={faWallet} size={16} color="#800080" />
                  </View>
                  <Text style={styles.statValue}>${walletBalance.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Balance</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                    <FontAwesomeIcon icon={faShoppingBag} size={16} color="#3b82f6" />
                  </View>
                  <Text style={styles.statValue}>{totalOrders}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: '#d1fae5' }]}>
                    <FontAwesomeIcon icon={faChartLine} size={16} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Spent</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <View style={styles.sectionHeader}>
              <View style={[
                styles.sectionIndicator, 
                section.title === 'SMS Services' && { backgroundColor: '#800080' }
              ]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.title === 'SMS Services' && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
            
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => {
                    if (item.screen) {
                      navigate(item.screen);
                    } else {
                      Alert.alert('Coming Soon', `${item.name} feature is coming soon!`);
                    }
                  }}
                  activeOpacity={0.7}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                      <LinearGradient
                        colors={[item.color + '30', item.color + '15']}
                        style={styles.menuIconGradient}>
                        <FontAwesomeIcon icon={item.icon} size={20} color={item.color} />
                      </LinearGradient>
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuItemText}>{item.name}</Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <View style={styles.chevronContainer}>
                      <FontAwesomeIcon icon={faChevronRight} size={14} color="#cbd5e1" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <View style={styles.dangerIndicator} />
            <Text style={styles.dangerTitle}>Danger Zone</Text>
          </View>
          
          <View style={styles.dangerCard}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}>
              <View style={styles.logoutContent}>
                <View style={styles.logoutLeft}>
                  <View style={styles.logoutIconWrapper}>
                    <LinearGradient
                      colors={['#fee2e2', '#fef2f2']}
                      style={styles.logoutIconGradient}>
                      <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#ef4444" />
                    </LinearGradient>
                  </View>
                  <View style={styles.logoutTextContainer}>
                    <Text style={styles.logoutTitle}>Sign Out</Text>
                    <Text style={styles.logoutSubtitle}>Logout from your account</Text>
                  </View>
                </View>
                <View style={styles.logoutArrow}>
                  <FontAwesomeIcon icon={faChevronRight} size={14} color="#ef4444" />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.versionText}>SMMLEET v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 All rights reserved</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
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
  content: {
    flex: 1,
    marginTop: -15,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  userCard: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userCardGradient: {
    padding: 20,
    overflow: 'hidden',
  },
  userCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(128, 0, 128, 0.05)',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
    alignSelf: 'center',
  },
  menuSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIndicator: {
    width: 3,
    height: 14,
    backgroundColor: '#800080',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  newBadge: {
    backgroundColor: '#800080',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  menuIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerZone: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerIndicator: {
    width: 3,
    height: 14,
    backgroundColor: '#ef4444',
    borderRadius: 2,
    marginRight: 10,
  },
  dangerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dangerCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
  },
  logoutButton: {
    overflow: 'hidden',
  },
  logoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fffbfb',
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoutIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  logoutIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextContainer: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '500',
  },
  logoutArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 80,
  },
});

export default More;