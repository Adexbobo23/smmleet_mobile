import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faReceipt,
  faArrowUp,
  faArrowDown,
  faCalendar,
  faDownload,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const Transactions = ({ navigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalDebit, setTotalDebit] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [filterType, transactions]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getTransactions(null, 100);
      
      console.log('Transactions response:', response);
      
      let txns = [];
      if (response && response.success !== false) {
        txns = response.transactions || response.results || response || [];
      }

      if (!Array.isArray(txns)) {
        txns = [];
      }

      setTransactions(txns);
      
      // Calculate totals
      const credit = txns
        .filter(t => {
          const type = (t.transaction_type || '').toLowerCase();
          return (type.includes('deposit') || type.includes('credit') || type.includes('bonus')) && 
                 t.status === 'completed';
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      const debit = txns
        .filter(t => {
          const type = (t.transaction_type || '').toLowerCase();
          return (type.includes('purchase') || type.includes('debit') || type.includes('withdrawal')) && 
                 t.status === 'completed';
        })
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

      setTotalCredit(credit);
      setTotalDebit(debit);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions: ' + error.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (filterType === 'credit') {
      filtered = filtered.filter(t => {
        const type = (t.transaction_type || '').toLowerCase();
        return type.includes('deposit') || type.includes('credit') || type.includes('bonus');
      });
    } else if (filterType === 'debit') {
      filtered = filtered.filter(t => {
        const type = (t.transaction_type || '').toLowerCase();
        return type.includes('purchase') || type.includes('debit') || type.includes('withdrawal');
      });
    }

    setFilteredTransactions(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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
      return { bg: '#dcfce7', border: '#bbf7d0', text: '#15803d' };
    }
    return { bg: '#fee2e2', border: '#fecaca', text: '#991b1b' };
  };

  const getStatusColor = (status) => {
    const normalizedStatus = (status || 'pending').toLowerCase();
    if (normalizedStatus === 'completed') {
      return { bg: '#dcfce7', text: '#15803d' };
    } else if (normalizedStatus === 'pending') {
      return { bg: '#fed7aa', text: '#9a3412' };
    } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      return { bg: '#fee2e2', text: '#991b1b' };
    }
    return { bg: '#f1f5f9', text: '#475569' };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <ActivityIndicator size="large" color="#800080" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
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
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <FontAwesomeIcon icon={faReceipt} size={28} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Transactions</Text>
            <Text style={styles.headerSubtitle}>{transactions.length} total transactions</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faArrowUp} size={16} color="#fff" />
            </View>
            <Text style={styles.statLabel}>Total Credits</Text>
            <Text style={styles.statValue}>${totalCredit.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faArrowDown} size={16} color="#fff" />
            </View>
            <Text style={styles.statLabel}>Total Debits</Text>
            <Text style={styles.statValue}>${totalDebit.toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'credit', 'debit'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                filterType === type && styles.activeFilterTab,
              ]}
              onPress={() => setFilterType(type)}
              activeOpacity={0.7}>
              {filterType === type ? (
                <LinearGradient
                  colors={['#800080', '#9933cc']}
                  style={styles.filterGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  <Text style={styles.activeFilterText}>
                    {type === 'all' ? 'All' : type === 'credit' ? 'Credits' : 'Debits'}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterText}>
                  {type === 'all' ? 'All' : type === 'credit' ? 'Credits' : 'Debits'}
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
        
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#f3e8ff', '#faf5ff']}
                style={styles.emptyIconGradient}>
                <FontAwesomeIcon icon={faReceipt} size={60} color="#800080" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {filterType !== 'all' ? 'Try changing the filter' : 'Transactions will appear here'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => {
            const colors = getTransactionColor(transaction.transaction_type);
            const statusColors = getStatusColor(transaction.status);
            
            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionCardGlow} />
                
                <View style={styles.transactionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <FontAwesomeIcon
                      icon={getTransactionIcon(transaction.transaction_type)}
                      size={18}
                      color={colors.text}
                    />
                  </View>

                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionId}>
                        {transaction.transaction_id ? `#${transaction.transaction_id.slice(0, 8)}` : `#${transaction.id}`}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {(transaction.status || 'pending').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.transactionDesc} numberOfLines={2}>
                      {transaction.description || transaction.transaction_type_display || transaction.transaction_type}
                    </Text>
                    
                    <View style={styles.transactionMeta}>
                      <View style={styles.transactionMetaItem}>
                        <FontAwesomeIcon icon={faClock} size={10} color="#94a3b8" />
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.created_at)}
                        </Text>
                      </View>
                      {transaction.crypto_currency && (
                        <View style={styles.transactionMetaItem}>
                          <Text style={styles.transactionCrypto}>• {transaction.crypto_currency}</Text>
                          {transaction.network && (
                            <Text style={styles.transactionNetwork}>({transaction.network})</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.transactionRight}>
                  <View style={[styles.amountContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.transactionAmount, { color: colors.text }]}>
                      {colors.text === '#15803d' ? '+' : '-'}
                      ${parseFloat(transaction.amount || 0).toFixed(2)}
                    </Text>
                  </View>
                  
                  {transaction.balance_after && (
                    <Text style={styles.balanceAfter}>
                      Balance: ${parseFloat(transaction.balance_after || 0).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
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
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
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
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScroll: {
    flexGrow: 1,
  },
  filterTab: {
    marginRight: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  filterGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  transactionCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(128, 0, 128, 0.02)',
  },
  transactionLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  transactionId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  transactionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  transactionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 4,
    fontWeight: '500',
  },
  transactionCrypto: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  transactionNetwork: {
    fontSize: 10,
    color: '#cbd5e1',
    marginLeft: 3,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  balanceAfter: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default Transactions;