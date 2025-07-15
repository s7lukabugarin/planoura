import React, { useEffect } from "react";
import {
  StyleSheet,
  ImageBackground,
  View,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";

type SplashScreenProps = {
  progress: number;
};

const { width: screenWidth } = Dimensions.get("window");

const SplashScreen: React.FC<SplashScreenProps> = ({ progress }) => {
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(progress, {
      duration: 1000,
    });
  }, [progress]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnim.value * 100}%`,
    };
  });

  return (
    <ImageBackground
      source={require("../assets/images/splash-background.png")}
      style={styles.background}
    >
      <Image
        source={require("../assets/images/splash-logo-new.png")}
        style={styles.logo}
      />
      <View style={styles.overlay} />

      {/* <Text style={styles.appName}>Training Center App</Text> */}

      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, progressBarStyle]} />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(214, 214, 214, 0.3)",
  },

  progressContainer: {
    position: "absolute",
    bottom: 50,
    width: screenWidth * 0.65,
    height: 8,
    backgroundColor: "rgba(214, 214, 214, 0.8)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 4,
  },
  logo: {
    position: "absolute",
    top: 50,
    right: 30,
    width: 130,
    height: 152,
    resizeMode: "contain",
  },
  appName: {
    position: "absolute",
    bottom: 140,
    fontSize: 40,
    color: "#ffffff",
    fontFamily: "Roboto",
    textAlign: "right",
    fontWeight: "700",
    right: 30,
    paddingLeft: 20
  },
});

export default SplashScreen;
