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
import { faEye, faEyeSlash, faUser, faLock, faEnvelope, faAt, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
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

  const handleSignUp = async () => {
    Keyboard.dismiss();
    if (!firstName.trim() || !lastName.trim()) { Alert.alert('Error', 'Please enter your full name'); return; }
    if (!username.trim()) { Alert.alert('Error', 'Please enter a username'); return; }
    if (username.trim().length < 3) { Alert.alert('Error', 'Username must be at least 3 characters'); return; }
    if (!/\S+@\S+\.\S+/.test(email.trim())) { Alert.alert('Error', 'Please enter a valid email address'); return; }
    if (password1.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters long'); return; }
    if (password1 !== password2) { Alert.alert('Error', 'Passwords do not match'); return; }

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
        Alert.alert('Success! ✅', 'Account created successfully. You can now login.',
          [{ text: 'OK', onPress: () => navigate('Login') }]);
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

  const handleGotoLogin = () => { Keyboard.dismiss(); navigate('Login'); };
  const handleGoBack = () => { Keyboard.dismiss(); navigate('Login'); };

  const Field = ({ icon, ...props }) => (
    <View style={styles.inputContainer}>
      <View style={styles.iconWrapper}><FontAwesomeIcon icon={icon} size={17} color="#da6bff" /></View>
      <TextInput style={styles.input} placeholderTextColor="#6b5b85" {...props} />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" backgroundColor="#07040d" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.auroraA} />
          <View style={styles.auroraB} />
          <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
            <FontAwesomeIcon icon={faArrowLeft} size={18} color="#f5f3ff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/smmleetword.png')} style={styles.logoTop} resizeMode="contain" />
          </View>
          <Text style={styles.eyebrow}>// CREATE ACCOUNT</Text>
        </View>

        <View style={styles.container}>
          <View style={styles.formCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.titleName}>Join the engine</Text>
              <Text style={styles.subtitle}>Start scaling your social reach on autopilot</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.row}>
                <View style={styles.half}>
                  <View style={styles.inputContainer}>
                    <View style={styles.iconWrapper}><FontAwesomeIcon icon={faUser} size={16} color="#da6bff" /></View>
                    <TextInput style={styles.input} placeholder="First name" placeholderTextColor="#6b5b85" value={firstName} onChangeText={setFirstName} />
                  </View>
                </View>
                <View style={styles.half}>
                  <View style={styles.inputContainer}>
                    <TextInput style={[styles.input, { paddingLeft: 12 }]} placeholder="Last name" placeholderTextColor="#6b5b85" value={lastName} onChangeText={setLastName} />
                  </View>
                </View>
              </View>

              <Field icon={faAt} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
              <Field icon={faEnvelope} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}><FontAwesomeIcon icon={faLock} size={17} color="#da6bff" /></View>
                <TextInput style={styles.input} placeholder="Create password" placeholderTextColor="#6b5b85"
                  value={password1} onChangeText={setPassword1} secureTextEntry={!showPassword1} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword1(!showPassword1)}>
                  <FontAwesomeIcon icon={showPassword1 ? faEyeSlash : faEye} size={17} color="#8a76a8" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.iconWrapper}><FontAwesomeIcon icon={faLock} size={17} color="#da6bff" /></View>
                <TextInput style={styles.input} placeholder="Confirm password" placeholderTextColor="#6b5b85"
                  value={password2} onChangeText={setPassword2} secureTextEntry={!showPassword2} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword2(!showPassword2)}>
                  <FontAwesomeIcon icon={showPassword2 ? faEyeSlash : faEye} size={17} color="#8a76a8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={handleSignUp} disabled={loading}>
                <LinearGradient colors={['#8b008b', '#c63dff']} style={styles.signupButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Text style={styles.signupButtonText}>Create account</Text>
                      <FontAwesomeIcon icon={faArrowRight} size={16} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginMuted}>Already have an account? </Text>
              <TouchableOpacity onPress={handleGotoLogin}><Text style={styles.loginLink}>Sign In</Text></TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerNote}>© 2026 SMMLEET // encrypted onboarding</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#07040d' },
  scrollContainer: { flexGrow: 1, paddingBottom: 24 },
  header: {
    height: 210, backgroundColor: '#0d0818', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderColor: 'rgba(198,61,255,0.15)', overflow: 'hidden',
  },
  auroraA: { position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(139,0,139,0.45)' },
  auroraB: { position: 'absolute', bottom: -70, left: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(34,211,238,0.20)' },
  backBtn: { position: 'absolute', top: 48, left: 18, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center' },
  logoTop: { width: 180, height: 60 },
  eyebrow: { color: '#da6bff', fontSize: 11, letterSpacing: 3, marginTop: 8, fontWeight: '700' },
  container: { flex: 1, paddingHorizontal: 20, marginTop: -28 },
  formCard: {
    backgroundColor: '#140c24', borderRadius: 22, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24, elevation: 10,
  },
  welcomeHeader: { marginBottom: 18 },
  titleName: { fontSize: 24, fontWeight: 'bold', color: '#f5f3ff', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: '#a78bca', marginTop: 4 },
  inputGroup: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0818',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 10, height: 52,
  },
  iconWrapper: { width: 28, alignItems: 'center' },
  input: { flex: 1, color: '#fff', fontSize: 14.5, paddingHorizontal: 4 },
  eyeBtn: { padding: 6 },
  signupButton: {
    height: 54, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
    shadowColor: '#c63dff', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  signupButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginMuted: { color: '#a78bca', fontSize: 13 },
  loginLink: { color: '#da6bff', fontSize: 13, fontWeight: 'bold' },
  footerNote: { textAlign: 'center', color: '#5b4a78', fontSize: 11, marginTop: 18 },
});

export default SignUp;
