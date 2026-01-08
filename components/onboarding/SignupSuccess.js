import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheckCircle, faArrowRight, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SignupSuccessful = ({ navigate }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Success icon animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Content slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGoToLogin = () => {
    navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />
      
      <LinearGradient
        colors={['#f8f4ff', '#ffffff', '#f8f4ff']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/smmleetword.png')}
              style={styles.logoTop}
              resizeMode="contain"
            />
          </View>

          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <View style={styles.successCircle}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <FontAwesomeIcon icon={faUserCheck} size={80} color="#fff" />
              </LinearGradient>
            </View>
            
            {/* Animated pulsing rings */}
            <Animated.View
              style={[
                styles.pulseCircle1,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0.2],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseCircle2,
                {
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.1],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1.1, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            <Text style={styles.title}>Account Created!</Text>
            <Text style={styles.subtitle}>
              Your account has been created successfully. Welcome to SMMLEET! You can now sign in to access all features.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGoToLogin}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Continue to Login</Text>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.checkCircle}>
                  <FontAwesomeIcon icon={faCheckCircle} size={16} color="#800080" />
                </View>
                <Text style={styles.featureText}>Access to all SMM services</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.checkCircle}>
                  <FontAwesomeIcon icon={faCheckCircle} size={16} color="#800080" />
                </View>
                <Text style={styles.featureText}>Secure payment options</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.checkCircle}>
                  <FontAwesomeIcon icon={faCheckCircle} size={16} color="#800080" />
                </View>
                <Text style={styles.featureText}>24/7 customer support</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  logoTop: {
    width: 180,
    height: 80,
  },
  iconContainer: {
    marginBottom: 40,
    position: 'relative',
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 3,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#800080',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  pulseCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#9933cc',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 30,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
});

export default SignupSuccessful;