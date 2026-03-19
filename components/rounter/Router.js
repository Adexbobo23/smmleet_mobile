import React, { useState, useEffect } from 'react';
import { BackHandler } from 'react-native';

import Login from '../onboarding/Login';
import ForgetPassword from '../onboarding/ForgetPassword';
import SplashScreen from '../onboarding/SplashScreen';
import SignUp from '../onboarding/SignUp';
import PasswordResetOtp from '../onboarding/PasswordResetOtp';
import PasswordReset from '../onboarding/PasswordReset';
import PasswordResetSuccessful from '../onboarding/PasswordResetSuccessful';
import Dashboard from '../screens/Dashboard';
import NewOrder from '../screens/NewOrder';
import Orders from '../screens/Orders';
import Wallet from '../screens/Wallet';
import More from '../screens/More';
import ServicesList from '../screens/ServicesList';
import MassOrder from '../screens/MassOrder';
import Transactions from '../screens/Transactions';
import Support from '../screens/Support';
import Profile from '../screens/Profile';
import ComingSoon from '../screens/ComingSoon';
import ApiKeys from '../screens/Apikeys';
import OrderDetails from '../screens/Orderdetails';

// SMS Screens
import SMSActivation from '../screens/SMSActivation';
import SMSRental from '../screens/SMSRental';
import SMSHistory from '../screens/SMSHistory';

const Router = () => {
  const [currentScreen, setCurrentScreen] = useState('SplashScreen');
  const [history, setHistory] = useState([]);
  const [comingSoonTitle, setComingSoonTitle] = useState('Feature');
  const [routeParams, setRouteParams] = useState({});

  const navigate = (screenName, params = {}) => {
    setHistory((prev) => [...prev, currentScreen]);
    if (screenName === 'ComingSoon') {
      setComingSoonTitle(params.title || 'Feature');
    }
    setRouteParams(params);
    setCurrentScreen(screenName);
  };

  const goBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentScreen(previous);
      return true;
    }
    return false;
  };

  // 🔥 Handle Android Back Button
  useEffect(() => {
    const onBackPress = () => {
      if (goBack()) {
        return true; // prevent app exit
      }
      return false; // allow exit only if no history
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [history]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SplashScreen':
        return <SplashScreen navigate={navigate} />;
      case 'Login':
        return <Login navigate={navigate} />;
      case 'SignUp':
        return <SignUp navigate={navigate} />;
      case 'ForgetPassword':
        return <ForgetPassword navigate={navigate} />;
      case 'PasswordResetOtp':
        return <PasswordResetOtp navigate={navigate} />;
      case 'PasswordReset':
        return <PasswordReset navigate={navigate} />;
      case 'PasswordResetSuccessful':
        return <PasswordResetSuccessful navigate={navigate} />;

      case 'Dashboard':
        return <Dashboard navigate={navigate} />;
      case 'NewOrder':
        return <NewOrder navigate={navigate} />;
      case 'Orders':
        return <Orders navigate={navigate} />;
      case 'Wallet':
        return <Wallet navigate={navigate} />;
      case 'More':
        return <More navigate={navigate} />;

      case 'ServicesList':
        return <ServicesList navigate={navigate} />;
      case 'MassOrder':
        return <MassOrder navigate={navigate} />;
      case 'Transactions':
        return <Transactions navigate={navigate} />;
      case 'Support':
        return <Support navigate={navigate} />;
      case 'Profile':
        return <Profile navigate={navigate} />;
      case 'ApiKeys':
        return <ApiKeys navigate={navigate} />;
      case 'OrderDetails':
        return <OrderDetails navigate={navigate} orderId={routeParams?.orderId} />;

      case 'SMSActivation':
        return <SMSActivation navigate={navigate} />;
      case 'SMSRental':
        return <SMSRental navigate={navigate} />;
      case 'SMSHistory':
        return <SMSHistory navigate={navigate} route={{ params: routeParams }} />;

      case 'ComingSoon':
        return <ComingSoon navigate={navigate} title={comingSoonTitle} />;
      case 'ChildPanel':
        return <ComingSoon navigate={navigate} title="Child Panel" />;
      case 'Referrals':
        return <ComingSoon navigate={navigate} title="Referrals" />;
      case 'API':
        return <ComingSoon navigate={navigate} title="API Documentation" />;
      case 'HowToUse':
        return <ComingSoon navigate={navigate} title="How To Use" />;
      case 'FreeServices':
        return <ComingSoon navigate={navigate} title="Free Services" />;
      case 'Terms':
        return <ComingSoon navigate={navigate} title="Terms & Conditions" />;
      case 'Notifications':
        return <ComingSoon navigate={navigate} title="Notifications" />;
      case 'Privacy':
        return <ComingSoon navigate={navigate} title="Privacy & Security" />;
      case 'Settings':
        return <ComingSoon navigate={navigate} title="App Settings" />;

      default:
        return <SplashScreen navigate={navigate} />;
    }
  };

  return renderScreen();
};

export default Router;