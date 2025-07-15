import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/authContext";
import Button from "@/components/Button";
import { resendVerificationLink } from "@/api/auth";

export default function SuccessRegisteredScreen() {
  const { isLoggedIn, userEmail } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "(profile)" as never }],
      });
    }
  }, [isLoggedIn, navigation]);

  const handleResendVerification = async () => {
    if (userEmail) {
    //   setIsResending(true);
    //   setResendError(null);
    //   setResendSuccess(false);
      try {
        await resendVerificationLink(userEmail);
      } catch (error) {
      } finally {
      }
    }
  };

  if (isLoggedIn) return;

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
      // overlayText={
      //   <View style={styles.overlayTextContainer}>
      //     <ThemedText type="title" style={{ textAlign: "center" }}>
      //       E-mail
      //     </ThemedText>
      //     <ThemedText
      //       lightColor="#07CFB1"
      //       darkColor="#07CFB1"
      //       type="title"
      //       style={{ textAlign: "center" }}
      //     >
      //       PRO!
      //     </ThemedText>
      //   </View>
      // }
    >
      <View style={styles.stepContainer}>
        <ThemedText style={{ textAlign: "center" }}>
          Success! Your registration was successful. A verification link has
          been sent to your email address. Please check your inbox to confirm
          your account. If you didn’t receive the email, click the button below
          to resend the verification link. Thank you for joining us!
        </ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={{ backgroundColor: "rgba(217, 217, 217, 0.8)" }}
          //   icon={<Ionicons color="#fff" name="mail" size={24} />}
          text="Login"
          link="/"
          // onPress={() => console.log("Email button pressed")}
        />
      </View>
      <TouchableOpacity
        style={{
          marginTop: "auto",
        }}
        activeOpacity={0.7}
        onPress={handleResendVerification}
      >
        <ThemedText
          type="smaller"
          style={{ textAlign: "center", marginTop: "auto", textDecorationLine: "underline" }}
        >
          If you didn&apos;t receive the verification link, click here to resend
        </ThemedText>
      </TouchableOpacity>
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
    width: "90%",
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
