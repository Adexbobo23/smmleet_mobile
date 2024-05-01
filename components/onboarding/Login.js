import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity, ScrollView} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation(); 

  const handleLogin = () => {
    console.log('Login button clicked');
  };

  const handleGotoSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleGotoForgetPassword = () => {
    navigation.navigate('ForgetPassword');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
    <View style={styles.container}>
      <Image source={require('../../assets/smmleetword.png')} style={styles.logoTop} />
      <Text style={styles.titleName}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <Text style={styles.signInText}>
        Forget your password? <Text style={styles.forgetInLink} onPress={handleGotoForgetPassword}>Reset</Text>
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <Text style={styles.signInText}>
        Don't have an account? <Text style={styles.signInLink} onPress={handleGotoSignUp}>Sign Up</Text>
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
  forgetInLink: {
    color: '#800080',
    textDecorationLine: 'none',
    textAlign: 'left',
  },
});

export default Login;
