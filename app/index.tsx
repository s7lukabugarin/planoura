import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Text,
  Alert,
  useColorScheme,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import Button from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { saveTokens } from "@/api/auth";
import { useAuth } from "@/context/authContext";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import Toast from "react-native-toast-message";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as NavigationBar from "expo-navigation-bar";
import SplashScreenCustomComponent from "@/components/SplashScreen";
import * as AppleAuthentication from "expo-apple-authentication";
import axios from "axios";

export default function LoginScreen() {
  const [appleLoading, setAppleLoading] = useState(false);

  const [appIsReady, setAppIsReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn, splashLoaded, setSplashLoaded } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigation = useNavigation();

  const validateFields = () => {
    let isValid = true;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleAppleLogin = async (
    idToken: string,
    first_name: string,
    last_name: string,
    setLoading?: (state: boolean) => void
  ) => {
    setLoading?.(true);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/login-apple/`,
        {
          id_token: idToken,
          first_name,
          last_name,
        },
        {
          // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`, {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // return response.data;

      const { access, refresh } = response.data;
      await login(access, refresh);

      navigation.navigate("(profile)" as never);
    } catch (error) {
      console.log("Login Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading?.(false);
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        handleAppleLogin(
          credential.identityToken,
          credential.fullName?.givenName ?? "",
          credential.fullName?.familyName ?? "",
          setAppleLoading
        );
      }
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") {
        Toast.show({
          type: "error",
          text1: "Apple Sign-Up",
          text2: "Sign-Up canceled.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Apple Sign-Up",
          text2: "An error occurred. Please try again.",
        });
      }
    }
  };

  const handleLogin = async () => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/login/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: data.message || "Invalid credentials",
        });
        return;
      }

      const { access, refresh } = data;
      await login(access, refresh);

      // if (data.hasMembership) {
      // Navigate to the dashboard or home screen
      navigation.navigate("(profile)" as never);
      // } else {
      // Navigate to the membership screen if the user lacks a membership
      // navigation.navigate("membership" as never);
      // }
    } catch (error) {
      console.log("Login Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "(profile)" as never }],
      });
    }
  }, [isLoggedIn, navigation]);

  useEffect(() => {
    if (splashLoaded) {
      setAppIsReady(true);
      setProgress(1);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 1) {
          clearInterval(interval);
          setAppIsReady(true);
          return 1;
        }
        return prevProgress + 0.2;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [splashLoaded]);

  useEffect(() => {
    if (appIsReady && !splashLoaded) {
      setSplashLoaded(true);
    }
  }, [appIsReady]);

  useEffect(() => {
    if (isLoggedIn && appIsReady) {
      navigation.reset({
        index: 0,
        routes: [{ name: "(profile)" as never }],
      });
      NavigationBar.setVisibilityAsync("visible");
    } else {
      NavigationBar.setVisibilityAsync("hidden");
    }
  }, [isLoggedIn, navigation, appIsReady]);

  if (!appIsReady) {
    return <SplashScreenCustomComponent progress={progress} />;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/login-image.png")}
          style={styles.loginImage}
        />
      }
      overlay={<View style={styles.overlay} />}
      logo={
        <Image
          source={require("@/assets/images/splash-logo.png")}
          style={styles.logoStyles}
        />
      }
      overlayText={
        <View style={styles.overlayTextContainer}>
          <ThemedText
            type="title"
            style={{ textAlign: "center", color: "#fff" }}
          >
            Welcome!
          </ThemedText>
          {/* <ThemedText
            lightColor="#07CFB1"
            darkColor="#07CFB1"
            type="title"
            style={{ textAlign: "center" }}
          >
            PRO!
          </ThemedText> */}
        </View>
      }
      contentStyles={
        {
          // backgroundColor: "#fff",
        }
      }
    >
      {/* <TouchableOpacity
        activeOpacity={0.7}
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="rgba(22, 22, 22, 1)" />
      </TouchableOpacity> */}
      <View style={styles.containerWrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          <View
            style={{
              ...styles.inputWrapper,
              marginBottom: 12,
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="mail-outline" size={20} color={mainTextColor} />
            </View>
            <TextInput
              style={{
                ...styles.input,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
                color: mainTextColor,
              }}
              placeholder="Email"
              placeholderTextColor={
                colorScheme === "dark"
                  ? "rgb(170, 170, 170)"
                  : "rgb(105, 105, 105)"
              }
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(""); // Clear error as user types
              }}
            />
            {emailError ? (
              <ThemedText style={styles.errorText}>{emailError}</ThemedText>
            ) : null}
          </View>

          <View
            style={{
              ...styles.inputWrapper,
              marginBottom: 12,
            }}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={mainTextColor}
              />
            </View>
            <TextInput
              style={{
                ...styles.input,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
                color: mainTextColor,
              }}
              autoCapitalize="none"
              secureTextEntry={!passwordVisible}
              placeholder="Password"
              placeholderTextColor={
                colorScheme === "dark"
                  ? "rgb(170, 170, 170)"
                  : "rgb(105, 105, 105)"
              }
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError(""); // Clear error as user types
              }}
            />
            {passwordError ? (
              <ThemedText style={styles.errorText}>{passwordError}</ThemedText>
            ) : null}
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Ionicons
                name={passwordVisible ? "eye" : "eye-off"}
                size={18}
                color="#12a28d"
              />
            </TouchableOpacity>
          </View>
          <Button
            loading={loading}
            buttonStyle={{
              backgroundColor: "#12a28d",
              // width: "60%",
              marginTop: 20,
            }}
            text="Log in"
            onPress={handleLogin}
            icon={<Ionicons name="log-in-outline" size={24} color={"#fff"} />}
          />
          {Platform.OS === "ios" && (
            <Button
              buttonStyle={{ backgroundColor: "#12a28d", marginTop: 10 }}
              icon={<Ionicons color="#fff" name="logo-apple" size={24} />}
              text="Log in with Apple"
              onPress={handleAppleSignIn}
              loading={appleLoading}
            />
          )}
          <Button
            buttonStyle={{
              borderColor: "#12a28d",
              borderWidth: 1,
              backgroundColor: "transparent",
              // width: "60%",
              marginTop: 10,
            }}
            icon={<Ionicons name="mail" size={22} color={"#12a28d"} />}
            textColor="#12a28d"
            text="Register"
            link="/register-options"
          />
          <TouchableOpacity
            style={{
              marginTop: "auto",
            }}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate("forgot-password" as never);
            }}
          >
            <ThemedText
              type="smaller"
              style={{
                textAlign: "center",
                marginTop: 30,
                textDecorationLine: "underline",
                color: "#12a28d",
              }}
            >
              Forgot password? Reset it here
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    // backgroundColor: "white",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 20,
    zIndex: 1,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 40,
    // paddingTop: 120,
  },
  // inputWrapper: {
  //   width: "100%",
  //   marginVertical: 12,
  // },
  // input: {
  //   width: "100%",
  //   height: 50,
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 50,
  //   paddingHorizontal: 16,
  // },
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: -5,
    top: 5,
    padding: 10,
  },
  // errorText: {
  //   color: "red",
  //   fontSize: 10,
  //   marginTop: 4,
  //   marginLeft: 16,
  //   position: "absolute",
  //   bottom: -16,
  //   left: 0,
  // },
  inputLabel: {
    alignSelf: "flex-start",
    marginBottom: 0,
    color: "rgba(0, 0, 0, 0.6)",
    paddingLeft: 12,
    fontSize: 13,
    lineHeight: 15,
  },
  loginImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  logoStyles: {
    width: 55,
    height: 46,
    position: "absolute",
    top: 30,
    left: 30,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 178, 190, 0.38)",
  },
  overlayTextContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    width: 24,
    height: 24,
  },
  errorText: {
    color: "red",
    fontSize: 10,
    position: "absolute",
    bottom: -4,
    right: 0,
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
});
