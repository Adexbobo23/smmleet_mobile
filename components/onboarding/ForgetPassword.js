import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity, ScrollView} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation(); 

  const handleResetPassword = () => {
    console.log('Reset password button clicked');
    navigation.navigate('PasswordResetOtp');
  };

  const handleGotoLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/smmleetword.png')} style={styles.logoTop} />
        <Text style={styles.titleName}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your register email to reset your password</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

        <Text style={styles.signInText}>
          Remember your password? <Text style={styles.signInLink} onPress={handleGotoLogin}>Log In</Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoTop: {
    width: 200,
    height: 100,
    marginBottom: 20,
  },
  titleName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    marginTop: -30,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 20,
    color: '#333',
    textAlign:'center'
  },
  label: {
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#800080',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#800080',
    borderRadius: 20,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#800080',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signInText: {
    marginTop: 20,
    color: '#333',
  },
  signInLink: {
    color: '#800080',
    textDecorationLine: 'none',
  },
});

export default ForgetPassword;
