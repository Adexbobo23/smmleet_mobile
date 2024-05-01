import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SignupSuccessful = () => {
  const navigation = useNavigation();

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/smmleetword.png')} style={styles.logoTop} />
      <Image source={require('../../assets/success.png')} style={styles.image} />
      <Text style={styles.title}>Signup successful, kindly proceed to login</Text>
      <TouchableOpacity style={styles.button} onPress={handleGoToLogin}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'normal',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center'
  },
  image: {
    width: 300,
    height: 270,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#800080',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '80%'
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: "center"
  },
});

export default SignupSuccessful;
