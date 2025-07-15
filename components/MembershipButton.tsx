import React, { ReactElement } from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type MembershipButtonProps = {
  icon?: ReactElement;
  firstRowText: string;  // First line of the text
  secondRowText: string; // Second line of the text
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  iconColor?: string;
  textColor?: string;
  onPress: () => void;
};

export default function MembershipButton({
  icon,
  firstRowText,
  secondRowText,
  buttonStyle = {},
  textStyle = {},
  iconColor = "rgba(46, 161, 174, 1)",
  textColor = "#000",
  onPress,
}: MembershipButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.button, buttonStyle]}
      onPress={onPress}
    >
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.firstRowText, { color: textColor }, textStyle]}>
          {firstRowText}
        </Text>
        <Text style={[styles.secondRowText, { color: textColor }, textStyle]}>
          {secondRowText}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 217, 217, 0.8)", // Modify based on membership choice
    borderRadius: 10,
    width: "100%",
    height: 86,
    paddingHorizontal: 15,
  },
  iconWrapper: {
    position: "absolute",
    height: "100%",
    right: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  firstRowText: {
    fontSize: 16, // Slightly larger font size for the first row
    textAlign: "left",
    lineHeight: 20,
  },
  secondRowText: {
    fontSize: 14, // Smaller font size for the second row
    textAlign: "left",
    lineHeight: 20,
    marginTop: 0, // Space between first and second row
  },
});
