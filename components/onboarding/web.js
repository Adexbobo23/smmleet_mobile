import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const Web = () => {
  const [isLoading, setIsLoading] = useState(true); 

  return (
    <SafeAreaView style={styles.container}>
      <Spinner
        visible={isLoading}
        textContent={'Loading...'}
        textStyle={styles.spinnerText}
      />

      <WebView
        source={{ uri: 'https://smmleet.com/login' }}
        style={styles.webview}
        scalesPageToFit={true}
        onLoad={() => setIsLoading(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    marginTop: 0,
  },
  spinnerText: {
    color: '#fff',
  },
});

export default Web;
