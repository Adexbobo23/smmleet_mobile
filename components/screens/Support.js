import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTicketAlt,
  faPlus,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faComment,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import ApiService from '../services/api';

const Support = ({ navigate }) => {
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getTickets();
      
      if (response && response.results) {
        setTickets(response.results);
      } else if (Array.isArray(response)) {
        setTickets(response);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      // Don't show error alert, just set empty tickets
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const ticketData = {
        subject: subject.trim(),
        message: message.trim(),
      };

      await ApiService.createTicket(ticketData);
      
      Alert.alert(
        'Ticket Created! ✅',
        'Your support ticket has been submitted. We will respond within 24 hours.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setShowNewTicketModal(false);
            setSubject('');
            setMessage('');
            onRefresh();
          }
        }]
      );
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', error.message || 'Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
      case 'pending':
        return { bg: '#dbeafe', text: '#1e40af', icon: faClock };
      case 'closed':
      case 'resolved':
        return { bg: '#dcfce7', text: '#15803d', icon: faCheckCircle };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', icon: faTimesCircle };
      default:
        return { bg: '#f1f5f9', text: '#64748b', icon: faClock };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <ActivityIndicator size="large" color="#800080" />
        <Text style={styles.loadingText}>Loading tickets...</Text>
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
          <FontAwesomeIcon icon={faTicketAlt} size={28} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Support Tickets</Text>
            <Text style={styles.headerSubtitle}>{tickets.length} total tickets</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newTicketButton}
          onPress={() => setShowNewTicketModal(true)}
          activeOpacity={0.9}>
          <FontAwesomeIcon icon={faPlus} size={16} color="#800080" />
          <Text style={styles.newTicketText}>New Ticket</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesomeIcon icon={faTicketAlt} size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>No support tickets yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowNewTicketModal(true)}>
              <Text style={styles.emptyButtonText}>Create Your First Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map((ticket) => {
            const statusStyle = getStatusColor(ticket.status);
            return (
              <TouchableOpacity 
                key={ticket.id} 
                style={styles.ticketCard} 
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    ticket.subject,
                    `Status: ${ticket.status}\n\n${ticket.message || 'No message'}`,
                    [{ text: 'OK' }]
                  );
                }}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketId}>#{ticket.ticket_id || ticket.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg },
                    ]}>
                    <FontAwesomeIcon icon={statusStyle.icon} size={10} color={statusStyle.text} />
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {ticket.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                <Text style={styles.ticketMessage} numberOfLines={2}>
                  {ticket.message || 'No message'}
                </Text>

                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketDate}>📅 {formatDate(ticket.created_at)}</Text>
                  {ticket.replies_count !== undefined && (
                    <View style={styles.repliesContainer}>
                      <FontAwesomeIcon icon={faComment} size={12} color="#800080" />
                      <Text style={styles.repliesText}>{ticket.replies_count} replies</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        visible={showNewTicketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewTicketModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Ticket</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SUBJECT</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter ticket subject..."
                placeholderTextColor="#cbd5e1"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MESSAGE</Text>
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#cbd5e1"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowNewTicketModal(false);
                  setSubject('');
                  setMessage('');
                }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleCreateTicket}
                disabled={submitting}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={['#800080', '#9933cc']}
                  style={styles.modalSubmitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} size={14} color="#fff" />
                      <Text style={styles.modalSubmitText}>Submit Ticket</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTextContainer: {
    marginLeft: 15,
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
  },
  newTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
  },
  newTicketText: {
    color: '#800080',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  ticketCard: {
    backgroundColor: '#fff',
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ticketMessage: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  repliesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  repliesText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#800080',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#800080',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1e293b',
  },
  messageInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubmitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default Support;