import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ResetOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const navigation = useNavigation();

  useEffect(() => {
    let timer = null;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prevTimer => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleResendOTP = () => {
    // Logic to resend OTP
    console.log('Resend OTP button clicked');
    setResendTimer(60); // Reset resend timer
  };

  const handleVerifyOTP = () => {
    // Logic to verify OTP
    console.log('Verify OTP button clicked');
    navigation.navigate('PasswordReset');
  };

  const handleChangeOtp = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/smmleetword.png')} style={styles.logoTop} />
        <Text style={styles.titleName}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 4-digit OTP sent to your email</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpInput}
              value={digit}
              onChangeText={value => handleChangeOtp(value, index)}
              maxLength={1}
              keyboardType="numeric"
            />
          ))}
        </View>

        <Text style={styles.resendText}>
          Resend OTP in {resendTimer} seconds
        </Text>
        <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP}>
          <Text style={styles.verifyButtonText}>Verify OTP</Text>
        </TouchableOpacity>
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
    marginTop: -30
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'normal',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    width: 60,
    height: 65,
    borderWidth: 1,
    borderColor: '#800080',
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  resendText: {
    marginBottom: 10,
    color: '#333',
  },
  resendButton: {
    backgroundColor: '#800080',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#800080',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ResetOTP;
