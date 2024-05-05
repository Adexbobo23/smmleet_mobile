import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, SafeAreaView } from 'react-native';

const Web = () => {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: 'https://smmleet.com/login' }}
        style={styles.webview}
        scalesPageToFit={true}
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
    marginTop: 20,
  },
});

export default Web;
