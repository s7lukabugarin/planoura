import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
  Text,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import MembershipButton from "@/components/MembershipButton";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";

export default function MembershipScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  // const { loggedUserWithoutMembershipName } = route.params;

  const openPrivacyPolicy = () => {
    // Replace with your privacy policy URL
    Linking.openURL("https://yourwebsite.com/privacy-policy");
  };

  const openTermsOfUse = () => {
    // Replace with your terms of use URL
    Linking.openURL("https://yourwebsite.com/terms-of-use");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/membership-image.png")}
          style={styles.membershipImage}
        />
      }
      overlay={<View style={styles.overlay} />}
      logo={
        <Image
          source={require("@/assets/images/splash-logo.png")}
          style={styles.logoStyles}
        />
      }
      contentStyles={{
        backgroundColor: "#fff",
      }}
    >
      <View style={styles.overlayTextContainer}>
        <ThemedText type="title" lightColor="#07CFB1" darkColor="#07CFB1">
          Hello Anna
        </ThemedText>
        <ThemedText
          lightColor="#000"
          darkColor="#000"
          type="smaller"
          style={{ marginTop: 12 }}
        >
          Get access to the world’s largest fitness community, daily workouts
          plans and more!
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        <MembershipButton
          icon={<Ionicons name="chevron-forward" size={20} color="#fff" />}
          firstRowText="Yearly > 8,84 € / months"
          secondRowText="106,18 € / year billed annually"
          buttonStyle={{
            backgroundColor: "rgba(46, 161, 174, 1)",
            marginBottom: 15,
          }}
          textStyle={{
            color: "#fff",
          }}
          onPress={() => {
            navigation.navigate("(profile)" as never);
          }}
        />
        <MembershipButton
          buttonStyle={{
            backgroundColor: "#F0F0F0",
          }}
          icon={<Ionicons name="chevron-forward" size={20} color="#000" />}
          firstRowText="7 Days FREE Trial > 17,25 € / month"
          secondRowText="billed monthly after FREE 7-day trial"
          onPress={() => {
            // console.log("Free trial selected")
          }}
        />
      </View>

      <ThemedText style={styles.disclaimerText}>
        This free trial is not valid if you have previously redeemed a trial
        offer
      </ThemedText>

      <TouchableOpacity onPress={() => {
        // console.log("Restore Purchase clicked")
      }}>
        <ThemedText style={styles.linkText}>Restore Purchase</ThemedText>
      </TouchableOpacity>

      <ThemedText
        style={{
          ...styles.subscriptionTerms,
          margin: 0,
        }}
      >
        Subscription Terms
      </ThemedText>
      <ThemedText
        style={{
          ...styles.subscriptionTerms,
          marginTop: 0,
        }}
      >
        All payments made through iTunes are controlled and managed by Apple.
        Payments will be charged to your iTunes Account at confirmation of
        purchase. Subscription automatically renews, unless auto-renew is turned
        off at least 24 hours before the end of the current period.
      </ThemedText>

      <ThemedText
        type="smallest"
        style={{
          color: "rgba(0, 0, 0, 0.6)",
        }}
      >
        By continuing, you accept our{" "}
        <Text
          style={{
            textDecorationLine: "underline",
            color: "rgba(46, 161, 174, 1)",
          }}
          onPress={() => Linking.openURL("https://your-privacy-policy-url.com")}
        >
          Privacy Policy
        </Text>{" "}
        and{" "}
        <Text
          style={{
            textDecorationLine: "underline",
            color: "rgba(46, 161, 174, 1)",
          }}
          onPress={() => Linking.openURL("https://your-terms-of-use-url.com")}
        >
          Terms of Use
        </Text>
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  membershipImage: {
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
  overlayTextContainer: {},
  buttonContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 30,
  },
  buttonStyle: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  membershipText: {
    textAlign: "center",
    fontSize: 14,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 10,
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 10,
    lineHeight: 11,
    textAlign: "center",
    textDecorationLine: "underline",
    color: "rgba(0, 0, 0, 0.6)",
  },
  subscriptionTerms: {
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
    color: "rgba(0, 0, 0, 0.4)",
  },
  privacyPolicy: {
    fontSize: 10,
    lineHeight: 11,
    color: "rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
});
