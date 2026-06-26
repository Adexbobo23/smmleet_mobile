import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash, faUser, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const Login = ({ navigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!username.trim()) { Alert.alert('Error', 'Please enter your username or email'); return; }
    if (!password.trim()) { Alert.alert('Error', 'Please enter your password'); return; }

    setLoading(true);
    try {
      const response = await ApiService.login({ username: username.trim(), password: password.trim() });
      console.log('Login response:', response);
      if (response.success || response.user) {
        navigate('Dashboard');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGotoSignUp = () => { Keyboard.dismiss(); navigate('SignUp'); };
  const handleGotoForgetPassword = () => { Keyboard.dismiss(); navigate('ForgetPassword'); };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" backgroundColor="#07040d" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Neon header */}
        <View style={styles.header}>
          <View style={styles.auroraA} />
          <View style={styles.auroraB} />
          <View style={styles.logoContainer}>
            <Image source={require('../assets/smmleetword.png')} style={styles.logoTop} resizeMode="contain" />
          </View>
          <Text style={styles.eyebrow}>// SECURE ACCESS</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.formCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.titleName}>Welcome back</Text>
              <Text style={styles.subtitle}>Log in to your growth control panel</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faUser} size={18} color="#da6bff" />
                </View>
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#6b5b85"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faLock} size={18} color="#da6bff" />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6b5b85"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size={18} color="#8a76a8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotWrap} onPress={handleGotoForgetPassword}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.9} onPress={handleLogin} disabled={loading}>
                <LinearGradient
                  colors={['#8b008b', '#c63dff']}
                  style={styles.loginButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Log in</Text>
                      <FontAwesomeIcon icon={faArrowRight} size={16} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.signupRow}>
              <Text style={styles.signupMuted}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleGotoSignUp}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerNote}>© 2026 SMMLEET // encrypted session</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#07040d' },
  scrollContainer: { flexGrow: 1 },
  header: {
    height: 240, backgroundColor: '#0d0818', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderColor: 'rgba(198,61,255,0.15)', overflow: 'hidden',
  },
  auroraA: { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(139,0,139,0.45)' },
  auroraB: { position: 'absolute', bottom: -70, right: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(34,211,238,0.20)' },
  logoContainer: { alignItems: 'center', justifyContent: 'center' },
  logoTop: { width: 200, height: 70 },
  eyebrow: { color: '#da6bff', fontSize: 11, letterSpacing: 3, marginTop: 10, fontWeight: '700' },
  container: { flex: 1, paddingHorizontal: 20, marginTop: -28 },
  formCard: {
    backgroundColor: '#140c24', borderRadius: 22, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10,
  },
  welcomeHeader: { marginBottom: 22 },
  titleName: { fontSize: 26, fontWeight: 'bold', color: '#f5f3ff', letterSpacing: 0.3 },
  subtitle: { fontSize: 13.5, color: '#a78bca', marginTop: 4 },
  inputGroup: { gap: 14 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0818',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 12, height: 54,
  },
  iconWrapper: { width: 30, alignItems: 'center' },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingHorizontal: 6 },
  eyeBtn: { padding: 6 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -2 },
  forgotText: { color: '#da6bff', fontSize: 12.5, fontWeight: '600' },
  loginButton: {
    height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6,
    shadowColor: '#c63dff', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  signupMuted: { color: '#a78bca', fontSize: 13.5 },
  signupLink: { color: '#da6bff', fontSize: 13.5, fontWeight: 'bold' },
  footerNote: { textAlign: 'center', color: '#5b4a78', fontSize: 11, marginTop: 22, marginBottom: 10 },
});

export default Login;
