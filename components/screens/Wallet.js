import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faWallet,
  faReceipt,
  faArrowUp,
  faArrowDown,
  faChartLine,
  faClock,
  faExternalLinkAlt,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

// Wallet funding is handled exclusively on the web. Update this if the
// public site URL ever changes.
const WEB_FUNDING_URL = 'https://smmleet.com';

const Wallet = ({ navigate }) => {
  const [balance, setBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const openWebFunding = () => {
    Linking.openURL(WEB_FUNDING_URL).catch(() => {
      Alert.alert(
        'Add funds on the web',
        `To top up your wallet, please visit ${WEB_FUNDING_URL} in your browser and log in.`
      );
    });
  };

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Load wallet summary and transactions
      const [walletData, transactionsData] = await Promise.all([
        ApiService.getWalletSummary(),
        ApiService.getTransactions(null, 10),
      ]);

      console.log('Wallet Data:', walletData);
      console.log('Transactions Data:', transactionsData);

      // Set wallet balance and totals
      if (walletData && walletData.success !== false) {
        const walletInfo = walletData.wallet || walletData;
        setBalance(parseFloat(walletInfo.balance || walletData.balance || 0));
        setTotalDeposits(parseFloat(walletData.total_deposits || 0));
        setTotalSpent(parseFloat(walletData.total_spent || 0));
      }

      // Set transactions
      if (transactionsData && transactionsData.success !== false) {
        const txns = transactionsData.transactions || transactionsData.results || transactionsData || [];
        setTransactions(Array.isArray(txns) ? txns : []);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
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

  const getTransactionIcon = (type) => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType.includes('deposit') || normalizedType.includes('credit') || normalizedType.includes('bonus')) {
      return faArrowUp;
    }
    return faArrowDown;
  };

  const getTransactionColor = (type) => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType.includes('deposit') || normalizedType.includes('credit') || normalizedType.includes('bonus')) {
      return { bg: '#dcfce7', text: '#15803d' };
    }
    return { bg: '#fee2e2', text: '#991b1b' };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <ActivityIndicator size="large" color="#da6bff" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
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
            <Text style={styles.headerTitle}>Wallet</Text>
            <View style={styles.headerSubtitleContainer}>
              <FontAwesomeIcon icon={faChartLine} size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerSubtitle}>Manage your balance</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#800080', '#9933cc', '#b84dff']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.balanceCardGlow} />
            <View style={styles.balanceCardGlow2} />
            
            <View style={styles.balanceHeader}>
              <View style={styles.walletIconContainer}>
                <View style={styles.walletIconGlow} />
                <FontAwesomeIcon icon={faWallet} size={28} color="#fff" />
              </View>
              <View style={styles.balanceBadge}>
                <View style={styles.balanceBadgeDot} />
                <Text style={styles.balanceBadgeText}>ACTIVE</Text>
              </View>
            </View>
            
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>

            <TouchableOpacity
              style={styles.addFundsButton}
              onPress={openWebFunding}
              activeOpacity={0.9}>
              <LinearGradient
                colors={['#140c24', '#0d0818']}
                style={styles.addFundsGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}>
                <FontAwesomeIcon icon={faExternalLinkAlt} size={15} color="#da6bff" />
                <Text style={styles.addFundsButtonText}>Add Funds on Web</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Fund on web notice */}
        <View style={styles.webNoticeCard}>
          <View style={styles.webNoticeIcon}>
            <FontAwesomeIcon icon={faInfoCircle} size={18} color="#da6bff" />
          </View>
          <View style={styles.webNoticeTextWrap}>
            <Text style={styles.webNoticeTitle}>Funding is available on the web</Text>
            <Text style={styles.webNoticeBody}>
              To add money to your wallet, please visit our website and log in.
              Your balance updates automatically once your payment is confirmed.
            </Text>
            <TouchableOpacity onPress={openWebFunding} activeOpacity={0.8}>
              <Text style={styles.webNoticeLink}>{WEB_FUNDING_URL}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statCardGlow} />
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <FontAwesomeIcon icon={faArrowUp} size={20} color="#15803d" />
            </View>
            <Text style={styles.statValue}>${totalDeposits.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
            <View style={styles.statBar}>
              <LinearGradient
                colors={['#10b981', '#34d399']}
                style={[styles.statBarFill, { width: '75%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statCardGlow} />
            <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
              <FontAwesomeIcon icon={faArrowDown} size={20} color="#991b1b" />
            </View>
            <Text style={styles.statValue}>${totalSpent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
            <View style={styles.statBar}>
              <LinearGradient
                colors={['#ef4444', '#f87171']}
                style={[styles.statBarFill, { width: '45%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <LinearGradient
            colors={['#0d0818', '#140c24']}
            style={styles.transactionsHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <View style={styles.transactionsTitleContainer}>
              <View style={styles.transactionsIcon}>
                <LinearGradient
                  colors={['#1c1232', '#140c24']}
                  style={styles.transactionsIconGradient}>
                  <FontAwesomeIcon icon={faReceipt} size={14} color="#da6bff" />
                </LinearGradient>
              </View>
              <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              activeOpacity={0.8}
              onPress={() => navigate('Transactions')}>
              <LinearGradient
                colors={['#1c1232', '#140c24']}
                style={styles.viewAllGradient}>
                <Text style={styles.viewAllText}>View All</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <FontAwesomeIcon icon={faReceipt} size={40} color="#e2e8f0" />
                <Text style={styles.emptyTransactionsText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.slice(0, 5).map((transaction, index) => {
                const colors = getTransactionColor(transaction.transaction_type);
                return (
                  <View key={transaction.id || index} style={styles.transactionItem}>
                    <View style={styles.transactionItemGlow} />
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: colors.bg }]}>
                        <FontAwesomeIcon
                          icon={getTransactionIcon(transaction.transaction_type)}
                          size={16}
                          color={colors.text}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionDesc} numberOfLines={1}>
                          {transaction.description || transaction.transaction_type}
                        </Text>
                        <View style={styles.transactionDateContainer}>
                          <FontAwesomeIcon icon={faClock} size={9} color="#8a76a8" />
                          <Text style={styles.transactionDate}>
                            {formatDate(transaction.created_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.transactionAmountContainer, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.transactionAmount, { color: colors.text }]}>
                        {colors.text === '#15803d' ? '+' : '-'}
                        ${parseFloat(transaction.amount || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav navigate={navigate} currentScreen="Wallet" />
    </View>
  );
};

const styles = StyleSheet.create({
  webNoticeCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#140c24',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(198,61,255,0.25)',
  },
  webNoticeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#140c24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  webNoticeTextWrap: {
    flex: 1,
  },
  webNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e89bff',
    marginBottom: 4,
  },
  webNoticeBody: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#e89bff',
  },
  webNoticeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#da6bff',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
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
  balanceCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  balanceGradient: {
    padding: 28,
    overflow: 'hidden',
  },
  balanceCardGlow: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  balanceCardGlow2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  walletIconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  balanceBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  balanceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
    letterSpacing: -1,
  },
  addFundsButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addFundsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addFundsButtonText: {
    color: '#da6bff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0d0818',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  statCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(128, 0, 128, 0.03)',
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f5f3ff',
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 12,
    color: '#a78bca',
    fontWeight: '600',
    marginBottom: 12,
  },
  statBar: {
    width: '100%',
    height: 5,
    backgroundColor: '#140c24',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  transactionsCard: {
    backgroundColor: '#0d0818',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  transactionsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionsIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionsTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f5f3ff',
    letterSpacing: 0.2,
  },
  viewAllButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  viewAllGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#da6bff',
    letterSpacing: 0.3,
  },
  transactionsList: {
    padding: 20,
  },
  emptyTransactions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: '#8a76a8',
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    overflow: 'hidden',
  },
  transactionItemGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 0, 128, 0.02)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f3ff',
    marginBottom: 6,
  },
  transactionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07040d',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  transactionDate: {
    fontSize: 10,
    color: '#a78bca',
    marginLeft: 5,
    fontWeight: '600',
  },
  transactionAmountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d0818',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f5f3ff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#a78bca',
    marginBottom: 24,
    fontWeight: '500',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07040d',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#da6bff',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f5f3ff',
    paddingVertical: 18,
  },
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  bonusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  bonusAmount: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: '#07040d',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 70,
  },
  quickAmountGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeQuickAmount: {
    borderColor: 'rgba(198,61,255,0.45)',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a78bca',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textAlign: 'center',
  },
  activeQuickAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  paymentMethodsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#a78bca',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentMethodsScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#07040d',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  activePaymentMethod: {
    borderColor: 'rgba(198,61,255,0.45)',
    backgroundColor: '#140c24',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  paymentMethodTextContainer: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5f3ff',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 11,
    color: '#a78bca',
    fontWeight: '500',
  },
  checkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#140c24',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#07040d',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a78bca',
    letterSpacing: 0.3,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  modalConfirmGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalConfirmGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default Wallet;