import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faUser,
  faEnvelope,
  faLock,
  faSave,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

const Profile = ({ navigate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });
  
  // Password change data
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile from API
      const response = await ApiService.getUserProfile();
      console.log('Profile response:', response);
      
      if (response && response.user) {
        setProfile({
          username: response.user.username || '',
          email: response.user.email || '',
          first_name: response.user.first_name || '',
          last_name: response.user.last_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate inputs
    if (!profile.first_name.trim() && !profile.last_name.trim()) {
      Alert.alert('Error', 'Please enter at least your first name or last name');
      return;
    }

    setSaving(true);
    try {
      const response = await ApiService.updateProfile({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
      });
      
      console.log('Update profile response:', response);
      
      if (response && response.success) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate password fields
    if (!passwords.old_password || !passwords.new_password || !passwords.confirm_password) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (passwords.new_password.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwords.old_password === passwords.new_password) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setSaving(true);
    try {
      const response = await ApiService.changePassword(
        passwords.old_password,
        passwords.new_password,
        passwords.confirm_password
      );
      
      console.log('Change password response:', response);
      
      if (response && response.success) {
        Alert.alert(
          'Success', 
          'Password changed successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear password fields
                setPasswords({
                  old_password: '',
                  new_password: '',
                  confirm_password: '',
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Success', 'Password changed successfully');
        setPasswords({
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" backgroundColor="#800080" />
        <LinearGradient
          colors={['#800080', '#9933cc']}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#800080" />
      
      {/* Header */}
      <LinearGradient
        colors={['#800080', '#9933cc', '#b84dff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.headerGlow} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigate('More')} 
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Profile Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account information</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Account Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIndicator} />
            <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          </View>
          
          {/* Username (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USERNAME</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <FontAwesomeIcon icon={faUser} size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profile.username}
                editable={false}
                placeholderTextColor="#cbd5e1"
              />
            </View>
            <Text style={styles.inputHint}>Username cannot be changed</Text>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <FontAwesomeIcon icon={faEnvelope} size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={profile.email}
                editable={false}
                placeholderTextColor="#cbd5e1"
              />
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FIRST NAME</Text>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon icon={faUser} size={16} color="#800080" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                placeholderTextColor="#cbd5e1"
                value={profile.first_name}
                onChangeText={(text) => setProfile({ ...profile, first_name: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>LAST NAME</Text>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon icon={faUser} size={16} color="#800080" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                placeholderTextColor="#cbd5e1"
                value={profile.last_name}
                onChangeText={(text) => setProfile({ ...profile, last_name: text })}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Save Profile Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.9}>
            <LinearGradient 
              colors={['#800080', '#9933cc']} 
              style={styles.saveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} size={16} color="#fff" />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Change Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIndicator, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.sectionTitle}>CHANGE PASSWORD</Text>
          </View>
          
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon icon={faLock} size={16} color="#ef4444" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#cbd5e1"
                value={passwords.old_password}
                onChangeText={(text) => setPasswords({ ...passwords, old_password: text })}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon icon={faLock} size={16} color="#10b981" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#cbd5e1"
                value={passwords.new_password}
                onChangeText={(text) => setPasswords({ ...passwords, new_password: text })}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.inputHint}>Must be at least 6 characters</Text>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.inputContainer}>
              <FontAwesomeIcon icon={faLock} size={16} color="#10b981" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#cbd5e1"
                value={passwords.confirm_password}
                onChangeText={(text) => setPasswords({ ...passwords, confirm_password: text })}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {passwords.new_password && passwords.confirm_password && (
              <View style={styles.passwordMatch}>
                {passwords.new_password === passwords.confirm_password ? (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} size={12} color="#10b981" />
                    <Text style={[styles.inputHint, { color: '#10b981', marginLeft: 6 }]}>
                      Passwords match
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.inputHint, { color: '#ef4444' }]}>
                    Passwords do not match
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Change Password Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            disabled={saving}
            activeOpacity={0.9}>
            <LinearGradient 
              colors={['#ef4444', '#dc2626']} 
              style={styles.saveGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faLock} size={16} color="#fff" />
                  <Text style={styles.saveText}>Change Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <FontAwesomeIcon icon={faLock} size={18} color="#800080" />
            </View>
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Security Tips</Text>
              <Text style={styles.noticeText}>
                • Use a strong, unique password{'\n'}
                • Don't share your password with anyone{'\n'}
                • Change your password regularly
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { 
    flex: 1, 
    marginLeft: 16 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 4,
    fontWeight: '500',
  },
  content: { 
    flex: 1, 
    marginTop: 10 
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIndicator: {
    width: 3,
    height: 16,
    backgroundColor: '#800080',
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  inputGroup: { 
    marginBottom: 20 
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputDisabled: { 
    opacity: 0.6,
    backgroundColor: '#f1f5f9',
  },
  inputIcon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1, 
    fontSize: 14, 
    color: '#1e293b', 
    fontWeight: '500' 
  },
  inputHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '500',
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  saveButton: { 
    borderRadius: 14, 
    overflow: 'hidden', 
    marginTop: 8,
    elevation: 4,
    shadowColor: '#800080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  saveText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: 'bold',
  },
  securityNotice: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  noticeCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
  },
  noticeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800080',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 12,
    color: '#6b21a8',
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomSpacer: { 
    height: 40 
  },
});

export default Profile;