import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { WebView } from 'react-native-webview';

const Web = () => {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const webViewRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (initialLoading) {
      // Fade in and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation for outer ring
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [initialLoading]);

  const handleReload = () => {
    setLoadError(false);
    setInitialLoading(true);
    setHasLoadedOnce(false);
    setProgress(0);
    webViewRef.current?.reload();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6b0f7a" />
      
      {/* Gradient Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>SMMLEET</Text>
            <Text style={styles.headerSubtitle}>Social Media Management</Text>
          </View>
          <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
            <Text style={styles.reloadIcon}>⟳</Text>
          </TouchableOpacity>
        </View>
        
        {/* Thin Progress Bar - Only show for initial load */}
        {initialLoading && !hasLoadedOnce && progress > 0 && (
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progress * 100}%`,
                }
              ]} 
            />
          </View>
        )}
      </View>

      {/* Premium Loading Screen - Only on initial load */}
      {initialLoading && !hasLoadedOnce && (
        <Animated.View 
          style={[
            styles.loadingOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={styles.loadingContent}>
            {/* Animated Loader */}
            <Animated.View 
              style={[
                styles.loaderContainer,
                { 
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              {/* Outer rotating ring */}
              <Animated.View 
                style={[
                  styles.outerRing,
                  { transform: [{ rotate: spin }] }
                ]}
              >
                <View style={styles.ringSegment1} />
                <View style={styles.ringSegment2} />
              </Animated.View>

              {/* Middle pulsing circle */}
              <Animated.View 
                style={[
                  styles.middleCircle,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              />

              {/* Inner logo area */}
              <View style={styles.innerCircle}>
                <Text style={styles.logoText}>SM</Text>
              </View>

              {/* Spinner */}
              <ActivityIndicator 
                size="large" 
                color="#fff" 
                style={styles.spinner}
              />
            </Animated.View>

            {/* Loading Text */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.loadingTitle}>Loading SMMLEET</Text>
              <Text style={styles.loadingSubtitle}>Please wait while we prepare everything...</Text>
              
              {/* Progress Percentage */}
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* Premium Error State */}
      {loadError && (
        <View style={styles.errorContainer}>
          <Animated.View 
            style={[
              styles.errorContent,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>📡</Text>
            </View>
            <Text style={styles.errorTitle}>Connection Lost</Text>
            <Text style={styles.errorMessage}>
              We couldn't connect to SMMLEET servers.{'\n'}
              Please check your internet connection and try again.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleReload}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry Connection</Text>
              <Text style={styles.retryIcon}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* WebView */}
      {!loadError && (
        <WebView
          ref={webViewRef}
          source={{ uri: 'https://smmleet.com/login' }}
          style={styles.webview}
          onLoadStart={() => {
            // Only show loader if this is the first load
            if (!hasLoadedOnce) {
              setInitialLoading(true);
            }
          }}
          onLoadEnd={() => {
            setInitialLoading(false);
            setHasLoadedOnce(true);
            setProgress(1);
          }}
          onLoadProgress={({ nativeEvent }) => {
            // Only track progress on initial load
            if (!hasLoadedOnce) {
              setProgress(nativeEvent.progress);
            }
          }}
          onError={() => {
            setLoadError(true);
            setInitialLoading(false);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={true}
          allowsBackForwardNavigationGestures={true}
          mixedContentMode="compatibility"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#800080',
    paddingTop: 45,
    paddingBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    letterSpacing: 1,
  },
  reloadButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reloadIcon: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loaderContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  ringSegment1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#800080',
    borderRightColor: '#a020f0',
  },
  ringSegment2: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'transparent',
    borderBottomColor: '#800080',
    borderLeftColor: '#a020f0',
    transform: [{ rotate: '180deg' }],
  },
  middleCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(128, 0, 128, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(128, 0, 128, 0.3)',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#800080',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#a020f0',
    elevation: 10,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  spinner: {
    position: 'absolute',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTextContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(128, 0, 128, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(128, 0, 128, 0.3)',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a020f0',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorContent: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(128, 0, 128, 0.3)',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(128, 0, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#800080',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#a020f0',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginRight: 8,
  },
  retryIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Web;