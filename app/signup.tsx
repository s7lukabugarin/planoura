import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Text,
  Linking,
  Alert,
  useColorScheme,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import Button from "@/components/Button";
import Checkbox from "expo-checkbox";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/authContext";
import Toast from "react-native-toast-message";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function SignupForm() {
  const colorScheme = useColorScheme();

  const mainTextColor = useThemeColor({}, "mainText");
  const mainColor = useThemeColor({}, "main");

  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn, setUserEmail } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Error States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [termsError, setTermsError] = useState("");

  const navigation = useNavigation();

  const validateFields = () => {
    let isValid = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email Validation
    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }

    // Password Validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      isValid = false;
    } else {
      setPasswordError("");
    }

    // Confirm Password Validation
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    // Name Validation
    if (!firstName) {
      setFirstNameError("First name is required.");
      isValid = false;
    } else {
      setFirstNameError("");
    }

    if (!lastName) {
      setLastNameError("Last name is required.");
      isValid = false;
    } else {
      setLastNameError("");
    }

    // Terms Validation
    if (!acceptedTerms) {
      setTermsError("You must accept the terms to proceed.");
      isValid = false;
    } else {
      setTermsError("");
    }

    return isValid;
  };

  const handleSignup = async () => {
    if (!validateFields()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/client-register/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            password2: confirmPassword,
            first_name: firstName,
            last_name: lastName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: "Register Failed!",
          // @ts-ignore
          text2: (Object.values(data)[0][0] as string) ?? "",
        });
        return;
      } else {
        setUserEmail(email);
        navigation.reset({
          index: 0,
          routes: [{ name: "success-registered" as never }],
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
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

  return (
    <View
      style={{
        backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
        flex: 1,
      }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="subtitle" style={{ marginBottom: 30 }}>
          CREATE ACCOUNT
        </ThemedText>
                <View
          style={{
            ...styles.inputWrapper,
            marginBottom: 12,
          }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="person-outline" size={20} color={mainTextColor} />
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
            placeholder="First Name"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              if (firstName) setFirstNameError("");
            }}
          />
          {firstNameError ? (
            <ThemedText style={styles.errorText}>{firstNameError}</ThemedText>
          ) : null}
        </View>
        <View
          style={{
            ...styles.inputWrapper,
            marginBottom: 12
          }}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="people-outline" size={20} color={mainTextColor} />
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
            placeholder="Last Name"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (lastName) setLastNameError("");
            }}
          />
          {lastNameError ? (
            <ThemedText style={styles.errorText}>{lastNameError}</ThemedText>
          ) : null}
        </View>
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
            onPress={() => setPasswordVisible((prevState) => !prevState)}
          >
            <Ionicons
              name={passwordVisible ? "eye" : "eye-off"}
              size={18}
              color="#12a28d"
            />
          </TouchableOpacity>
          {/* )} */}
        </View>
        {/* <View style={{ position: "relative", width: "100%" }}>
          <TextInput
                 style={{
                ...styles.input,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
                color: mainTextColor,
              }}
            placeholder="Password"
            value={password}
            autoCapitalize="none"
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.eyeIcon}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? "eye" : "eye-off"}
              size={20}
              color="#12a28d"
            />
          </TouchableOpacity>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View> */}
        <View
          style={{
            ...styles.inputWrapper,
            // marginBottom: 12,
          }}
        >
          <View
            style={{
              ...styles.iconWrapper,
              position: "relative",
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={mainTextColor}
            />
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 7,
              }}
            >
              <Ionicons
                name="checkmark-outline"
                size={10}
                color={mainTextColor}
              />
            </View>
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
            secureTextEntry={!confirmPasswordVisible}
            placeholder="Confirm Password"
            placeholderTextColor={
              colorScheme === "dark"
                ? "rgb(170, 170, 170)"
                : "rgb(105, 105, 105)"
            }
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPassword) setConfirmPasswordError("");
            }}
          />
          {confirmPasswordError ? (
            <ThemedText style={styles.errorText}>
              {confirmPasswordError}
            </ThemedText>
          ) : null}
          {/* {!confirmPasswordError && ( */}
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setConfirmPasswordVisible((prevState) => !prevState)}
          >
            <Ionicons
              name={confirmPasswordVisible ? "eye" : "eye-off"}
              size={18}
              color="#12a28d"
            />
          </TouchableOpacity>
          {/* )} */}
        </View>
        {/* <View style=
        {{ position: "relative", width: "100%" }}>
          <TextInput
                 style={{
                ...styles.input,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
                color: mainTextColor,
              }}
            placeholder="Confirm Password"
            value={confirmPassword}
            autoCapitalize="none"
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPassword) setConfirmPasswordError("");
            }}
            secureTextEntry={!confirmPasswordVisible}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.eyeIcon}
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
          >
            <Ionicons
              name={confirmPasswordVisible ? "eye" : "eye-off"}
              size={20}
              color="#12a28d"
            />
          </TouchableOpacity>
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
        </View> */}
        {/* <View style={{ position: "relative", width: "100%" }}>
          <TextInput
                 style={{
                ...styles.input,
                borderColor:
                  colorScheme === "dark"
                    ? "rgb(80, 80, 80)"
                    : "rgb(204, 204, 204)",
                color: mainTextColor,
              }}
            placeholder="Last Name"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              if (lastName) setLastNameError("");
            }}
          />
          {lastNameError ? (
            <Text style={styles.errorText}>{lastNameError}</Text>
          ) : null}
        </View> */}
        <View style={styles.termsContainer}>
          <Checkbox
            style={styles.checkbox}
            value={acceptedTerms}
            onValueChange={(val) => {
              setAcceptedTerms(val);
              if (val) setTermsError("");
            }}
            color={acceptedTerms ? "#12a28d" : undefined}
          />
          <ThemedText
            type="smallest"
            // style={{
            //   color: "rgba(0, 0, 0, 0.6)",
            // }}
          >
            By continuing, you accept our{" "}
            <Text
              style={{
                textDecorationLine: "underline",
                color: "#12a28d",
              }}
              onPress={() =>
                Linking.openURL("https://your-privacy-policy-url.com")
              }
            >
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text
              style={{
                textDecorationLine: "underline",
                color: "#12a28d",
              }}
              onPress={() =>
                Linking.openURL("https://your-terms-of-use-url.com")
              }
            >
              Terms of Use
            </Text>
          </ThemedText>
          {termsError ? (
            <Text
              style={{
                ...styles.errorText,
                bottom: -14,
                // right: "auto",
                // left: 0
              }}
            >
              {termsError}
            </Text>
          ) : null}
        </View>
        <Button
          loading={loading}
          buttonStyle={{
            backgroundColor: "#12a28d",
            // width: "60%",
            marginTop: 30,
          }}
          icon={<Ionicons name="log-in-outline" size={22} color={"#fff"} />}
          text="Sign Up"
          onPress={handleSignup}
        />
        <Button
          buttonStyle={{
            backgroundColor: "transparent",
            borderColor: "#12a28d",
            borderWidth: 1,
            marginTop: 10
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
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    backgroundColor: "white",
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingTop: 110,
  },
  // input: {
  //   width: "100%",
  //   height: 50,
  //   borderWidth: 1,
  //   borderColor: "#ccc",
  //   borderRadius: 50,
  //   paddingHorizontal: 16,
  //   marginVertical: 10,
  // },
  input: {
    flexGrow: 1,
    maxWidth: "90%",
    height: 50,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  // errorText: {
  //   color: "red",
  //   fontSize: 10,
  //   marginTop: 4,
  //   marginLeft: 16,
  //   position: "absolute",
  //   bottom: -8,
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
  },
  passwordContainer: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: -5,
    top: 5,
    padding: 10,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 4,
    paddingRight: 60,
    paddingLeft: 20,
    marginTop: 20,
    position: "relative",
  },
  checkbox: {
    margin: 8,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 9999,
  },
  profileImagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 9999,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlusIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 9999,
    padding: 4,
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
