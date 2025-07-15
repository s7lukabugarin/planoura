import { useColorScheme } from "react-native";

const lightColors = {
  background: "#FFFFFF",
  text: "#000000",
  primary: "#007AFF",
};

const darkColors = {
  background: "#000000",
  text: "#FFFFFF",
  primary: "#0A84FF",
};

export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
};