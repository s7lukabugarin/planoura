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
} from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import Button from "@/components/Button";
import { Ionicons } from "@expo/vector-icons";
import { resetPassword, saveTokens } from "@/api/auth";
import { useAuth } from "@/context/authContext";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
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

    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateFields()) return;
    setLoading(true);
    try {
      await resetPassword(email);
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "(profile)" as never }],
      }); // Prevent logged-in users from accessing login
    }
  }, [isLoggedIn, navigation]);

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
            Forgot Password?
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
      contentStyles={{
        backgroundColor: "#fff",
      }}
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
          {/* <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>Email</ThemedText>
            <TextInput
              style={styles.input}
              value={email}
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(""); // Clear error as user types
              }}
              keyboardType="email-address"
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View> */}
          <Button
            loading={loading}
            buttonStyle={{
              backgroundColor: "#12a28d",
              // width: "60%",
              marginTop: 30,
            }}
            text="Send instructions"
            icon={<Ionicons name="send-outline" size={20} color={"#fff"} />}
            onPress={handleResetPassword}
          />
          <Button
            buttonStyle={{
              backgroundColor: "transparent",
              borderColor: "#12a28d",
              borderWidth: 1,
              marginTop: 10,
            }}
            icon={
              <Ionicons color="#12a28d" name="arrow-undo-outline" size={24} />
            }
            text="Back to login"
            textColor="#12a28d"
            link={"/"}
          />
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
    right: 15,
    top: 15,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    width: 24,
    height: 24,
  },
});
