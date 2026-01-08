import React, { useState } from 'react';
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

const Router = () => {
  const [currentScreen, setCurrentScreen] = useState('SplashScreen');
  const [comingSoonTitle, setComingSoonTitle] = useState('Feature');

  const navigate = (screenName, params = {}) => {
    if (screenName === 'ComingSoon') {
      setComingSoonTitle(params.title || 'Feature');
    }
    setCurrentScreen(screenName);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      // Onboarding Screens
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

      // Main App Screens
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

      // Additional Screens
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
        return <OrderDetails navigate={navigate} orderId={params?.orderId} />;

      // Coming Soon Screens
      case 'ComingSoon':
        return <ComingSoon navigate={navigate} title={comingSoonTitle} />;
      case 'RentSMS':
        return <ComingSoon navigate={navigate} title="Rent SMS" />;
      case 'ActivateSMS':
        return <ComingSoon navigate={navigate} title="Activate SMS" />;
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