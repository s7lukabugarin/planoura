import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/authContext";
import { TagsProvider } from "@/context/tagsContext";
import { ExercisesProvider } from "@/context/excersisesContext";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CoursesProvider } from "@/context/coursesContext";
import { View, Platform, Text } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import { useThemeColor } from "@/hooks/useThemeColor";
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();
// SplashScreen.setOptions({
//   duration: 1000,
//   fade: true,
// });

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const mainColor = useThemeColor({}, "main");

  const [fontsLoaded] = useFonts({
    "Default-Regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
    "Default-Medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Default-SemiBold": require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    "Default-Bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(mainColor);
      SystemUI.setBackgroundColorAsync(mainColor);

      colorScheme === "dark"
        ? NavigationBar.setButtonStyleAsync("light")
        : NavigationBar.setButtonStyleAsync("dark");
    }
  }, [colorScheme]);

    useEffect(() => {
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('Notification permission status:', newStatus);
      }
    };

    requestNotificationPermissions();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: mainColor }}>
        {/* <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        > */}
        <AuthProvider>
          <CoursesProvider>
            <ExercisesProvider>
              <TagsProvider>
                <RootNavigator />
              </TagsProvider>
            </ExercisesProvider>
          </CoursesProvider>
          <StatusBar
            style={"light"}
            translucent
            backgroundColor="transparent"
          />
        </AuthProvider>
        <Toast />
        {/* </ThemeProvider> */}
      </View>
    </SafeAreaProvider>
  );
}

const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(profile)" />
        <Stack.Screen name="single-workout" />
        <Stack.Screen name="single-course" />
        <Stack.Screen name="membership" />
      </Stack.Protected>

      <Stack.Screen name="index" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="signup" />
        <Stack.Screen name="register-options" />
        <Stack.Screen name="success-registered" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="+not-found" />
      </Stack.Protected>
    </Stack>
  );
};
