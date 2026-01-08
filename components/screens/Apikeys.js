import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faKey,
  faPlus,
  faEye,
  faEyeSlash,
  faCopy,
  faTrash,
  faCheckCircle,
  faCircle,
  faClock,
  faTimes,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

const ApiKeys = ({ navigate }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await ApiService.getApiKeys();
      setApiKeys(Array.isArray(keys) ? keys : keys?.results || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      Alert.alert('Error', 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApiKeys();
    setRefreshing(false);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      Alert.alert('Error', 'Please enter a name for the API key');
      return;
    }

    setCreating(true);
    try {
      const newKey = await ApiService.createApiKey({ name: newKeyName.trim() });
      
      if (newKey) {
        Alert.alert(
          'API Key Created! 🎉',
          'Your new API key has been created. Make sure to copy it now as you won\'t be able to see it again!',
          [
            {
              text: 'Copy Key',
              onPress: () => {
                Clipboard.setString(newKey.key);
                Alert.alert('Copied!', 'API key copied to clipboard');
              },
            },
            { text: 'OK' },
          ]
        );
        
        setNewKeyName('');
        setShowCreateModal(false);
        await loadApiKeys();
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      Alert.alert('Error', error.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId, keyName) => {
    Alert.alert(
      'Delete API Key',
      `Are you sure you want to delete "${keyName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteApiKey(keyId);
              Alert.alert('Success', 'API key deleted successfully');
              await loadApiKeys();
            } catch (error) {
              console.error('Error deleting API key:', error);
              Alert.alert('Error', 'Failed to delete API key');
            }
          },
        },
      ]
    );
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const copyToClipboard = (key, keyName) => {
    Clipboard.setString(key);
    Alert.alert('Copied!', `API key "${keyName}" copied to clipboard`);
  };

  const maskKey = (key) => {
    if (!key) return '••••••••••••••••';
    const visibleChars = 8;
    return key.substring(0, visibleChars) + '•'.repeat(Math.max(16, key.length - visibleChars));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading API keys...</Text>
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
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigate('More')}
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>API Keys</Text>
            <Text style={styles.headerSubtitle}>Manage your API access</Text>
          </View>

          <TouchableOpacity 
            style={styles.addBtn} 
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.addBtnGradient}>
              <FontAwesomeIcon icon={faPlus} size={18} color="#800080" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#800080']} />
        }>
        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <FontAwesomeIcon icon={faExclamationCircle} size={20} color="#3b82f6" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>API Keys for Programmatic Access</Text>
            <Text style={styles.infoText}>
              Use API keys to access our services programmatically. Keep your keys secure and never share them publicly.
            </Text>
          </View>
        </View>

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['#f3e8ff', '#faf5ff']}
                style={styles.emptyIconGradient}>
                <FontAwesomeIcon icon={faKey} size={48} color="#800080" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No API Keys Yet</Text>
            <Text style={styles.emptyText}>
              Create your first API key to start using our API services
            </Text>
            <TouchableOpacity 
              style={styles.createFirstBtn} 
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.9}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.createFirstGradient}>
                <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                <Text style={styles.createFirstText}>Create API Key</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          apiKeys.map((apiKey) => (
            <View key={apiKey.id} style={styles.keyCard}>
              <View style={styles.keyHeader}>
                <View style={styles.keyIconContainer}>
                  <LinearGradient
                    colors={['#f3e8ff', '#faf5ff']}
                    style={styles.keyIconGradient}>
                    <FontAwesomeIcon icon={faKey} size={20} color="#800080" />
                  </LinearGradient>
                </View>
                <View style={styles.keyHeaderInfo}>
                  <Text style={styles.keyName}>{apiKey.name}</Text>
                  <View style={styles.statusBadge}>
                    <FontAwesomeIcon 
                      icon={apiKey.is_active ? faCheckCircle : faCircle} 
                      size={8} 
                      color={apiKey.is_active ? '#10b981' : '#94a3b8'} 
                    />
                    <Text style={[
                      styles.statusText,
                      { color: apiKey.is_active ? '#10b981' : '#94a3b8' }
                    ]}>
                      {apiKey.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.keyBody}>
                <View style={styles.keyValueContainer}>
                  <Text style={styles.keyLabel}>API KEY</Text>
                  <View style={styles.keyValueRow}>
                    <Text style={styles.keyValue} numberOfLines={1}>
                      {visibleKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    </Text>
                    <View style={styles.keyActions}>
                      <TouchableOpacity 
                        style={styles.keyActionBtn}
                        onPress={() => toggleKeyVisibility(apiKey.id)}
                        activeOpacity={0.7}>
                        <FontAwesomeIcon 
                          icon={visibleKeys[apiKey.id] ? faEyeSlash : faEye} 
                          size={16} 
                          color="#64748b" 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.keyActionBtn}
                        onPress={() => copyToClipboard(apiKey.key, apiKey.name)}
                        activeOpacity={0.7}>
                        <FontAwesomeIcon icon={faCopy} size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.keyMeta}>
                  <View style={styles.keyMetaItem}>
                    <FontAwesomeIcon icon={faClock} size={12} color="#94a3b8" />
                    <Text style={styles.keyMetaText}>
                      Created: {formatDate(apiKey.created_at)}
                    </Text>
                  </View>
                  {apiKey.last_used_at && (
                    <View style={styles.keyMetaItem}>
                      <FontAwesomeIcon icon={faClock} size={12} color="#94a3b8" />
                      <Text style={styles.keyMetaText}>
                        Last used: {formatDate(apiKey.last_used_at)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.keyFooter}>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteKey(apiKey.id, apiKey.name)}
                  activeOpacity={0.8}>
                  <FontAwesomeIcon icon={faTrash} size={14} color="#ef4444" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <LinearGradient
                  colors={['#f3e8ff', '#faf5ff']}
                  style={styles.modalHeaderIconGradient}>
                  <FontAwesomeIcon icon={faKey} size={24} color="#800080" />
                </LinearGradient>
              </View>
              <Text style={styles.modalTitle}>Create New API Key</Text>
              <Text style={styles.modalSubtitle}>
                Give your API key a descriptive name
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setShowCreateModal(false)}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>KEY NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Production API Key"
                placeholderTextColor="#cbd5e1"
                value={newKeyName}
                onChangeText={setNewKeyName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateKey}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => setShowCreateModal(false)}
                  activeOpacity={0.8}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.createBtn}
                  onPress={handleCreateKey}
                  disabled={creating}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={['#800080', '#9933cc']}
                    style={styles.createBtnGradient}>
                    {creating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
                        <Text style={styles.createBtnText}>Create Key</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#3b82f6',
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  createFirstBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  createFirstGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  createFirstText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  keyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  keyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14,
  },
  keyIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyHeaderInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  keyBody: {
    padding: 18,
  },
  keyValueContainer: {
    marginBottom: 16,
  },
  keyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  keyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
  },
  keyValue: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  keyActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  keyActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  keyMeta: {
    gap: 8,
  },
  keyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyMetaText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
    fontWeight: '500',
  },
  keyFooter: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
  },
  modalHeaderIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#64748b',
  },
  createBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
});

export default ApiKeys;
