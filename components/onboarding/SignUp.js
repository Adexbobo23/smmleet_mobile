import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Image,
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
  faEye,
  faEyeSlash,
  faUser,
  faEnvelope,
  faLock,
  faArrowLeft,
  faUserPlus,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const SignUp = ({ navigate }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const password1Ref = useRef(null);
  const password2Ref = useRef(null);

  const handleSignUp = async () => {
    Keyboard.dismiss();

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password1.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password1 !== password2) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.register({
        username: username.trim(),
        email: email.trim(),
        password: password1,
        password_confirm: password2,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      console.log('Registration response:', response);

      if (response.success || response.user) {
        Alert.alert(
          'Success! ✅',
          'Account created successfully. You can now login.',
          [{ text: 'OK', onPress: () => navigate('Login') }]
        );
      } else {
        Alert.alert('Registration Failed', response.message || 'Please try again');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleGotoLogin = () => {
    Keyboard.dismiss();
    navigate('Login');
  };

  const handleGoBack = () => {
    Keyboard.dismiss();
    navigate('Login');
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
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/smmleetword.png')}
              style={styles.logoTop}
              resizeMode="contain"
            />
          </View>

          <View style={styles.iconCircle}>
            <FontAwesomeIcon icon={faUserPlus} size={36} color="#800080" />
          </View>
        </LinearGradient>

        <View style={styles.container}>
          <View style={styles.formCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.titleName}>Create Account</Text>
              <Text style={styles.subtitle}>Join SMMLEET today</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.rowInputs}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <View style={styles.iconWrapper}>
                    <FontAwesomeIcon icon={faUser} size={18} color="#800080" />
                  </View>
                  <TextInput
                    ref={firstNameRef}
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#94a3b8"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                  <View style={styles.iconWrapper}>
                    <FontAwesomeIcon icon={faUser} size={18} color="#800080" />
                  </View>
                  <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#94a3b8"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faUser} size={18} color="#800080" />
                </View>
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faEnvelope} size={18} color="#800080" />
                </View>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => password1Ref.current?.focus()}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faLock} size={18} color="#800080" />
                </View>
                <TextInput
                  ref={password1Ref}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  value={password1}
                  onChangeText={setPassword1}
                  secureTextEntry={!showPassword1}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => password2Ref.current?.focus()}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword1(!showPassword1)}
                  style={styles.eyeIcon}>
                  <FontAwesomeIcon
                    icon={showPassword1 ? faEye : faEyeSlash}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}>
                  <FontAwesomeIcon icon={faLock} size={18} color="#800080" />
                </View>
                <TextInput
                  ref={password2Ref}
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPassword2}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword2(!showPassword2)}
                  style={styles.eyeIcon}>
                  <FontAwesomeIcon
                    icon={showPassword2 ? faEye : faEyeSlash}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.9}>
              <LinearGradient
                colors={['#800080', '#9933cc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create Account</Text>
                    <FontAwesomeIcon icon={faArrowRight} size={18} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleGotoLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 60,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoTop: {
    width: 200,
    height: 90,
  },
  iconCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    position: 'absolute',
    bottom: -42.5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    marginTop: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  titleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  inputGroup: {
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 56,
    backgroundColor: '#f8fafc',
  },
  halfInput: {
    width: '48%',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 0, 128, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  termsContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#800080',
    fontWeight: '600',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#64748b',
    fontSize: 15,
  },
  loginLink: {
    color: '#800080',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default SignUp;