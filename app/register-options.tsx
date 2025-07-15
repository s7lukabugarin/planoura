import { StyleSheet, View, Platform, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import Button from "@/components/Button";
import { Link, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import SplashScreenCustomComponent from "@/components/SplashScreen";
import { useAuth } from "@/context/authContext";
import * as AppleAuthentication from "expo-apple-authentication";
import Toast from "react-native-toast-message";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import * as NavigationBar from "expo-navigation-bar";
import axios from "axios";

export default function SignupScreen() {
  const [appleLoading, setAppleLoading] = useState(false);

  const colorScheme = useColorScheme();

  const [requestFb, responseFb, promptAsyncFb] = Facebook.useAuthRequest({
    clientId: "YOUR_FACEBOOK_APP_ID",
  });

  const [requestGoogle, responseGoogle, promptAsyncGoogle] =
    Google.useAuthRequest({
      clientId: Platform.select({
        ios: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
        android: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
        web: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
      }),
    });

  const { login, isLoggedIn } = useAuth();
  const navigation = useNavigation();

  if (isLoggedIn) return;

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
          last_name
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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
  const handleAppleSignUp = async () => {
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
        )
      }

    } catch (error: any) {
      console.log(error);

      if (error.code === "ERR_CANCELED") {

      } else {
        Toast.show({
          type: "error",
          text1: "Apple Sign-Up",
          text2: `An error occurred. Please try again ${error}.`,
        });
      }
    }
  };

  const handleFacebookSignUp = async () => {
    if (requestFb) {
      const result = await promptAsyncFb();
      if (result.type === "success") {
        Toast.show({
          type: "success",
          text1: "Facebook Sign-Up",
          text2: "Signed in successfully.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Facebook Sign-Up",
          text2: "Sign-In canceled.",
        });
      }
    }
  };

  const handleGoogleSignUp = async () => {
    if (requestGoogle) {
      const result = await promptAsyncGoogle();
      if (result.type === "success") {
        Toast.show({
          type: "success",
          text1: "Google Sign-Up",
          text2: "Signed in successfully.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Google Sign-Up",
          text2: "Sign-In canceled.",
        });
      }
    }
  };

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
            style={{ textAlign: "center", color: "#e3e3e3" }}
          >
            Become a Pilates
          </ThemedText>
          <ThemedText
            lightColor="#07CFB1"
            darkColor="#07CFB1"
            type="title"
            style={{ textAlign: "center" }}
          >
            PRO!
          </ThemedText>
        </View>
      }
    >
      <View style={styles.stepContainer}>
        <ThemedText
          style={{
            textAlign: "center",
            fontSize: 16,
            lineHeight: 20,
            color: colorScheme === "dark" ? "#a6a6a6" : "#7c7c7c",
            fontFamily: "Default-Medium",
          }}
        >
          Empower lives, inspire change – your journey as a coach starts here.
        </ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={{ backgroundColor: "#12a28d" }}
          icon={<Ionicons color="#fff" name="mail" size={24} />}
          text="Sign up with Email"
          link="signup"
          // onPress={() => console.log("Email button pressed")}
        />
        {Platform.OS === "ios" && (
          <Button
            buttonStyle={{ backgroundColor: "#12a28d" }}
            icon={<Ionicons color="#fff" name="logo-apple" size={24} />}
            text="Sign up with Apple"
            onPress={handleAppleSignUp}
            loading={appleLoading}
          />
        )}

        <Button
          buttonStyle={{ backgroundColor: "#12a28d" }}
          icon={<Ionicons color="#fff" name="logo-facebook" size={24} />}
          text="Sign up with Facebook"
          onPress={handleFacebookSignUp}
        />
        <Button
          buttonStyle={{ backgroundColor: "#12a28d" }}
          icon={<Ionicons color="#fff" name="logo-google" size={24} />}
          text="Sign up with Google"
          onPress={handleGoogleSignUp}
        />
        <Button
          buttonStyle={{
            backgroundColor: "transparent",
            borderColor: "#12a28d",
            borderWidth: 1,
          }}
          icon={
            <Ionicons color="#12a28d" name="arrow-undo-outline" size={24} />
          }
          text="Back to login"
          textColor="#12a28d"
          link={"/"}
        />
      </View>
      {/* <ThemedText
        type="smaller"
        style={{
          textAlign: "center",
          marginTop: "auto",
          fontSize: 12,
          color: colorScheme === "dark" ? "#a6a6a6" : "#7c7c7c",
          fontFamily: "Default-Medium",
        }}
      >
        Already have an account?{" "}
        <Link
          style={{
            textDecorationLine: "underline",
            color: "#12a28d",
          }}
          href="/index"
        >
          Log in
        </Link>
      </ThemedText> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    // marginTop: 30,
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
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    gap: 10,
    width: "100%",
    marginLeft: "auto",
    marginRight: "auto",
  },
  buttonGradient: {
    borderRadius: 50,
    width: "100%",
    padding: 1,
  },
  transparentButton: {
    backgroundColor: "transparent",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
