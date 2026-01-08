import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { 
  faArrowRight, 
  faArrowLeft, 
  faLock, 
  faEye, 
  faEyeSlash,
  faCheckCircle,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const PasswordReset = ({ navigate, route }) => {
  const email = route?.params?.email || '';
  const otp = route?.params?.otp || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Password validation rules
  const passwordRules = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword },
  ];

  const isPasswordValid = passwordRules.every((rule) => rule.valid);

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!email || !otp) {
      Alert.alert('Error', 'Session expired. Please start the password reset process again.');
      navigate('ForgetPassword');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.confirmPasswordReset(
        email,
        otp,
        password,
        confirmPassword
      );

      console.log('Password reset response:', response);

      if (response.success) {
        Alert.alert(
          'Success!',
          response.message || 'Your password has been reset successfully. Please login with your new password.',
          [
            {
              text: 'Login',
              onPress: () => navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || response.error || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Check if OTP expired or invalid
      if (error.message?.toLowerCase().includes('otp') || 
          error.message?.toLowerCase().includes('expired') ||
          error.message?.toLowerCase().includes('invalid')) {
        Alert.alert(
          'Session Expired',
          'Your verification code has expired. Please request a new one.',
          [
            {
              text: 'OK',
              onPress: () => navigate('ForgetPassword'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to reset password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    Keyboard.dismiss();
    navigate('PasswordResetOtp', { email });
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" backgroundColor="#800080" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#800080', '#9933cc', '#800080']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <FontAwesomeIcon icon={faLock} size={40} color="#fff" />
            </View>
            <View style={styles.glowEffect} />
          </View>
        </LinearGradient>

        <View style={styles.container}>
          <View style={styles.formCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.titleName}>Create New Password</Text>
              <Text style={styles.subtitle}>
                Your new password must be different from previously used passwords.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faLock} size={20} color="#800080" />
                </View>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}>
                  <FontAwesomeIcon
                    icon={showPassword ? faEye : faEyeSlash}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faLock} size={20} color="#800080" />
                </View>
                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}>
                  <FontAwesomeIcon
                    icon={showConfirmPassword ? faEye : faEyeSlash}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              {passwordRules.map((rule, index) => (
                <View key={index} style={styles.requirementRow}>
                  <FontAwesomeIcon
                    icon={rule.valid ? faCheckCircle : faCircle}
                    size={14}
                    color={rule.valid ? '#10b981' : '#cbd5e1'}
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      rule.valid && styles.requirementTextValid,
                    ]}>
                    {rule.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, !isPasswordValid && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading || !isPasswordValid}
              activeOpacity={0.9}>
              <LinearGradient
                colors={isPasswordValid ? ['#800080', '#9933cc'] : ['#cbd5e1', '#94a3b8']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Reset Password</Text>
                    <FontAwesomeIcon icon={faArrowRight} size={18} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>🔒 Secure Password Reset</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 50,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 45,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -25,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 58,
    backgroundColor: '#f8fafc',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 0, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 10,
  },
  requirementsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 10,
  },
  requirementTextValid: {
    color: '#10b981',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default PasswordReset;