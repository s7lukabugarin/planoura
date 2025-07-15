 import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "smaller"
    | "smallest";
};

export function ThemedText({
  style,
  lightColor = "#222222",
  darkColor = "#e3e3e3",
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        styles.defaultStyles,
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "smaller" ? styles.smaller : undefined,
        type === "smallest" ? styles.smallest : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  defaultStyles: {
    fontFamily: "Default-Regular",
  },
  default: {
    fontSize: 18,
    lineHeight: 24,
  },
  smaller: {
    fontSize: 14,
    lineHeight: 16,
  },
  smallest: {
    fontSize: 10,
    lineHeight: 13,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Default-SemiBold",
    // fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontFamily: "Default-SemiBold",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "Default-SemiBold",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
