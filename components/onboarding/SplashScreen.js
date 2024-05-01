import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 
const { width: screenWidth } = Dimensions.get('window');

const SplashScreen = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [
    require('../../assets/smm.png'),
    require('../../assets/smm1.png'),
    require('../../assets/smm2.png'),
  ];

  const handlePaginationPress = (index) => {
    setActiveIndex(index);
    scrollViewRef.current.scrollTo({ x: index * screenWidth, animated: true });
  };

  const scrollViewRef = React.createRef();
  const navigation = useNavigation(); 

  const handleGetStarted = () => {
    navigation.navigate('Login'); 
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/smmleetword.png')} style={styles.logoTop} />
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        onScroll={(event) => {
          const slideWidth = event.nativeEvent.layoutMeasurement.width;
          const offset = event.nativeEvent.contentOffset.x;
          setActiveIndex(Math.floor(offset / slideWidth));
        }}
      >
        {images.map((image, index) => (
          <Image key={index} source={image} style={styles.logoImage} />
        ))}
      </ScrollView>
      <Text style={styles.title}>Grow Your Social Media Presence</Text>
      <Text style={styles.subtitle}>Unlock the potential of your business with our powerful social media solutions</Text>
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
            onPress={() => handlePaginationPress(index)}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  logoTop: {
    width: '100%',
    height: 150, 
    resizeMode: 'contain',
    marginBottom: 40,
    marginTop: 50,
  },
  logoImage: {
    width: screenWidth - 40, 
    height: 230, 
    resizeMode: 'cover',
    marginBottom: 0,
    marginHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
    marginTop: 20,
  },
  activeDot: {
    backgroundColor: '#800080',
  },
  button: {
    backgroundColor: '#800080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '80%',
    height: 55,
    marginBottom: 80,
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SplashScreen;
