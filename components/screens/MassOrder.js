import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faFileUpload,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';
import BottomNav from '../BottomNav';

const MassOrder = ({ navigate }) => {
  const [orderData, setOrderData] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePlaceMassOrder = async () => {
    if (!orderData.trim()) {
      Alert.alert('Error', 'Please enter order data');
      return;
    }

    const lines = orderData.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      Alert.alert('Error', 'No valid orders found');
      return;
    }

    const orders = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 3) return null;
      return {
        service_id: parseInt(parts[0]),
        link: parts[1],
        quantity: parseInt(parts[2]),
      };
    }).filter(o => o !== null);

    if (orders.length === 0) {
      Alert.alert('Error', 'Invalid order format. Use: service_id|link|quantity');
      return;
    }

    setProcessing(true);
    try {
      const response = await ApiService.createMassOrder(orders);
      if (response.success) {
        Alert.alert('Success', `${orders.length} orders placed successfully!`, [
          { text: 'OK', onPress: () => navigate('Orders') }
        ]);
        setOrderData('');
      } else {
        Alert.alert('Error', response.message || 'Failed to place orders');
      }
    } catch (error) {
      console.error('Mass order error:', error);
      Alert.alert('Error', error.message || 'Failed to place mass orders');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      <LinearGradient
        colors={['#800080', '#9933cc', '#b84dff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Dashboard')} activeOpacity={0.8}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Mass Order</Text>
            <Text style={styles.headerSubtitle}>Place multiple orders at once</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Format</Text>
          <Text style={styles.infoText}>service_id|link|quantity</Text>
          <Text style={styles.infoExample}>Example:{'\n'}123|https://example.com|1000{'\n'}124|https://example.com|2000</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.textArea}
            placeholder="Enter orders (one per line)"
            placeholderTextColor="#cbd5e1"
            value={orderData}
            onChangeText={setOrderData}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handlePlaceMassOrder}
            disabled={processing}
            activeOpacity={0.9}>
            <LinearGradient colors={['#800080', '#9933cc']} style={styles.submitGradient}>
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.submitText}>Place Orders</Text>
                  <FontAwesomeIcon icon={faPaperPlane} size={16} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav navigate={navigate} currentScreen="More" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  content: { flex: 1, marginTop: 10 },
  infoCard: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e40af', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#3b82f6', marginBottom: 8, fontFamily: 'monospace' },
  infoExample: { fontSize: 12, color: '#64748b', fontFamily: 'monospace', lineHeight: 20 },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 3,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    fontSize: 13,
    color: '#1e293b',
    fontFamily: 'monospace',
    minHeight: 200,
    marginBottom: 20,
  },
  submitButton: { borderRadius: 14, overflow: 'hidden', elevation: 6 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
});

export default MassOrder;
