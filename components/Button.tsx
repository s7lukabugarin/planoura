import { ReactElement } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";

type ButtonProps = {
  icon?: ReactElement;
  text?: string;
  textColor?: string;
  iconColor?: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
  link?: "/" | "/register-options" | "signup";
  loading?: boolean;
  spinnerColor?: string;
  disabled?: boolean;
};

export default function Button({
  icon,
  text,
  textColor = "white",
  buttonStyle = {},
  textStyle = {},
  iconColor = "white",
  onPress,
  link,
  loading = false,
  spinnerColor = "white",
  disabled = false,
}: ButtonProps) {
  const navigation = useNavigation();
  const router = useRouter();

  const handlePress = link
  ? () => {
      if (link === "/") {
        router.replace("/");

      } else {
        router.replace(link);
      }
    }
  : onPress;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.button, buttonStyle]}
      // @ts-ignore
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          {text && (
            <Text style={[styles.text, { color: textColor }, textStyle]}>
              {text}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(217, 217, 217, 0.8)",
    borderRadius: 6,
    width: "100%",
    height: 50,
    paddingHorizontal: 15,
    position: "relative",
  },
  text: {
    fontSize: 16,
    // marginLeft: 8,
  },
  iconWrapper: {
    position: "absolute",
    height: "100%",
    left: 20,
    top: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
