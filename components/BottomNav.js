import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faTableCells,
  faPlusCircle,
  faWallet,
  faHistory,
  faEllipsisH,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BottomNav = ({ navigate, currentScreen }) => {
  const navItems = [
    { name: 'Dashboard', icon: faTableCells, screen: 'Dashboard' },
    { name: 'New Order', icon: faPlusCircle, screen: 'NewOrder' },
    { name: 'Wallet', icon: faWallet, screen: 'Wallet' },
    { name: 'Orders', icon: faHistory, screen: 'Orders' },
    { name: 'More', icon: faEllipsisH, screen: 'More' },
  ];

  return (
    <View style={styles.container}>
      {/* Floating shadow effect */}
      <View style={styles.shadowLayer} />
      
      <LinearGradient
        colors={['#ffffff', '#faf8ff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}>
        
        {/* Decorative top border with gradient */}
        <LinearGradient
          colors={['#e9d5ff', '#f3e8ff', '#ffffff']}
          style={styles.topBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        <View style={styles.navContent}>
          {navItems.map((item, index) => {
            const isActive = currentScreen === item.screen;
            return (
              <TouchableOpacity
                key={index}
                style={styles.navItem}
                onPress={() => navigate(item.screen)}
                activeOpacity={0.8}>
                {isActive ? (
                  <View style={styles.activeContainer}>
                    <LinearGradient
                      colors={['#800080', '#9933cc']}
                      style={styles.activeButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}>
                      {/* Glow effect inside button */}
                      <View style={styles.glowEffect} />
                      <FontAwesomeIcon icon={item.icon} size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.activeText}>{item.name}</Text>
                    {/* Active indicator dot */}
                    <View style={styles.activeDot} />
                  </View>
                ) : (
                  <View style={styles.inactiveContainer}>
                    <View style={styles.inactiveButton}>
                      <FontAwesomeIcon icon={item.icon} size={20} color="#94a3b8" />
                    </View>
                    <Text style={styles.inactiveText}>{item.name}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shadowLayer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  gradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  topBorder: {
    height: 3,
    width: '100%',
  },
  navContent: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  activeContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  activeButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  activeText: {
    color: '#800080',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#800080',
    marginTop: 4,
  },
  inactiveContainer: {
    alignItems: 'center',
  },
  inactiveButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  inactiveText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});

export default BottomNav;