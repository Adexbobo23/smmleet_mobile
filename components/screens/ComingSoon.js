import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faRocket,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';

const ComingSoon = ({ navigate, title = 'Feature' }) => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      {/* Header */}
      <LinearGradient
        colors={['#800080', '#9933cc']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigate('More')}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#800080', '#9933cc']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <FontAwesomeIcon icon={faRocket} size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Coming Soon!</Text>
        <Text style={styles.subtitle}>
          {title} feature is currently under development.{'\n'}
          We're working hard to bring you this feature soon.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎉 What to Expect:</Text>
          <Text style={styles.infoText}>
            • Enhanced user experience{'\n'}
            • Powerful new features{'\n'}
            • Seamless integration{'\n'}
            • Premium quality service
          </Text>
        </View>

        <TouchableOpacity
          style={styles.notifyButton}
          activeOpacity={0.8}>
          <LinearGradient
            colors={['#800080', '#9933cc']}
            style={styles.notifyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Text style={styles.notifyText}>Notify Me When Ready</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToHomeButton}
          onPress={() => navigate('Dashboard')}>
          <Text style={styles.backToHomeText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <BottomNav navigate={navigate} currentScreen="More" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  iconContainer: {
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 24,
  },
  notifyButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  notifyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  notifyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToHomeButton: {
    paddingVertical: 12,
  },
  backToHomeText: {
    color: '#800080',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ComingSoon;