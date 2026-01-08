import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faRocket } from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SplashScreen = ({ navigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;

  const slides = [
    {
      image: require('../assets/smm.png'),
      title: 'Boost Your Reach',
      subtitle: 'Expand your audience and grow your social media presence effortlessly',
    },
    {
      image: require('../assets/smm1.png'),
      title: 'Premium SMM Services',
      subtitle: 'Access high-quality social media marketing services at competitive prices',
    },
    {
      image: require('../assets/smm2.png'),
      title: 'Fast & Reliable',
      subtitle: 'Get instant delivery and 24/7 support for all your social media needs',
    },
  ];

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Animate logo while checking
      Animated.parallel([
        Animated.timing(logoFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Small delay for splash effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user is authenticated using ApiService
      const isAuthenticated = await ApiService.isAuthenticated();
      
      if (isAuthenticated) {
        // Verify the session is still valid by trying to get profile
        try {
          const profile = await ApiService.getUserProfile();
          if (profile && !profile.error) {
            // Session is valid, redirect to Dashboard
            console.log('User authenticated, redirecting to Dashboard');
            navigate('Dashboard');
            return;
          }
        } catch (profileError) {
          // Session might be expired, clear and show login
          console.log('Session validation failed:', profileError.message);
          await ApiService.clearAuthData();
        }
      }

      // User is not logged in, show onboarding
      setIsCheckingAuth(false);
      // Start content animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthError(error.message);
      // On error, show onboarding
      setIsCheckingAuth(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePaginationPress = (index) => {
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGetStarted = () => {
    navigate('Login');
  };

  const handleScroll = (event) => {
    const slideWidth = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offset / slideWidth);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Show loading splash while checking auth
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" backgroundColor="#fff" />
        <LinearGradient
          colors={['#ffffff', '#f8f4ff', '#ffffff']}
          style={styles.loadingGradient}>
          <Animated.View
            style={[
              styles.loadingContent,
              {
                opacity: logoFadeAnim,
                transform: [{ scale: logoScaleAnim }],
              },
            ]}>
            <Image
              source={require('../assets/smmleetword.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
            <View style={styles.loadingIndicatorContainer}>
              <ActivityIndicator size="large" color="#800080" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#fff" />
      
      <LinearGradient
        colors={['#ffffff', '#f8f4ff', '#ffffff']}
        style={styles.gradient}>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/smmleetword.png')}
            style={styles.logoTop}
            resizeMode="contain"
          />
        </View>

        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}>
            {slides.map((slide, index) => (
              <View key={index} style={styles.slide}>
                <View style={styles.imageWrapper}>
                  <Image source={slide.image} style={styles.slideImage} />
                  <View style={styles.imageOverlay} />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{slides[activeIndex].title}</Text>
            <Text style={styles.subtitle}>{slides[activeIndex].subtitle}</Text>
          </View>

          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePaginationPress(index)}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.dot,
                    activeIndex === index && styles.activeDot,
                  ]}>
                  {activeIndex === index && (
                    <LinearGradient
                      colors={['#800080', '#9933cc']}
                      style={styles.dotGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleGetStarted}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <FontAwesomeIcon
                  icon={faRocket}
                  size={22}
                  color="#fff"
                  style={styles.buttonIconLeft}
                />
                <Text style={styles.buttonText}>Get Started</Text>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  size={20}
                  color="#fff"
                  style={styles.buttonIconRight}
                />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleGetStarted}>
              <Text style={styles.skipText}>Skip to Login</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    width: screenWidth * 0.6,
    height: 120,
    marginBottom: 40,
  },
  loadingIndicatorContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#800080',
    fontWeight: '500',
  },
  // Main screen styles
  logoContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  logoTop: {
    width: screenWidth * 0.6,
    height: 100,
  },
  carouselContainer: {
    height: screenHeight * 0.35,
    marginBottom: 20,
  },
  slide: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: screenWidth - 60,
    height: screenHeight * 0.32,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(128, 0, 128, 0.05)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  title: {
    fontSize: 26,
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
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  activeDot: {
    width: 32,
    height: 12,
    borderRadius: 6,
  },
  dotGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
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
    marginBottom: 15,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  buttonIconLeft: {
    marginRight: 5,
  },
  buttonIconRight: {
    marginLeft: 5,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipText: {
    color: '#800080',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SplashScreen;