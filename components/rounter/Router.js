import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../onboarding/SplashScreen';
import SignUp from '../onboarding/SignUp';
import Login from '../onboarding/Login';
import ForgetPassword from '../onboarding/ForgetPassword';
import PasswordReset from '../onboarding/PasswordReset';
import ResetOTP from '../onboarding/PasswordResetOtp';
import PasswordResetSuccessful from '../onboarding/PasswordResetSuccessful';
import SignupSuccessful from '../onboarding/SignupSuccess';
import Web from '../onboarding/web';

const Stack = createStackNavigator();

const Router = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
        <Stack.Screen name="PasswordReset" component={PasswordReset} />
        <Stack.Screen name="PasswordResetOtp" component={ResetOTP} />
        <Stack.Screen name="PasswordResetSuccess" component={PasswordResetSuccessful} />
        <Stack.Screen name="SignupSuccess" component={SignupSuccessful} />
        <Stack.Screen name="Web" component={Web} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Router;
