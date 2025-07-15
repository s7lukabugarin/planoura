import { Tabs } from "expo-router";
import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/authContext";

export default function ProfileTabLayout() {
  const colorScheme = useColorScheme();
  const currentDate = new Date();
  const day = currentDate.getDate();

  const mainColor = useThemeColor({}, "main");
  const navigationBarIcon = useThemeColor({}, "navigationBarIcon");

  const { userEmail, userInfo, handleUserInfoUpdate } = useAuth();

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: mainColor }}
    >
      <Tabs
        // safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          tabBarActiveTintColor: "#12a28d",
          headerShown: false,
          // tabBarItemStyle: {
          //   alignItems: "center",
          //   justifyContent: "center",
          // },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            shadowColor: "transparent",
            height: 60,
            paddingBottom: 5,
            paddingTop: 5,
            backgroundColor: mainColor,
            borderColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.4)"
                : "rgba(0, 0, 0, 0.2)",
            borderTopWidth: 0.2,
            position: "absolute",
            overflow: "hidden",
          },
          tabBarButton: (props: any) => (
            <Pressable
              {...props}
              // style={props.style}
              android_ripple={{
                color:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.1)",
                borderless: true,
              }}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="excercise"
          options={{
            title: "Exercises",
            tabBarIcon: ({ color, focused }) => {
              return (
                <TabBarIcon
                  name={focused ? "barbell" : "barbell-outline"}
                  color={focused ? "#12a28d" : navigationBarIcon}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: "Classes",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "clipboard" : "clipboard-outline"}
                color={focused ? "#12a28d" : navigationBarIcon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Schedule",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  display: "flex",
                  position: "relative",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? "calendar-clear" : "calendar-clear-outline"}
                  size={24}
                  color={focused ? "#12a28d" : navigationBarIcon}
                />
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 6,
                  }}
                >
                  <Text
                    style={{
                      color: focused ? mainColor : navigationBarIcon,
                      fontSize: 9,
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: "Clients",
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name={focused ? "people" : "people-outline"}
                color={focused ? "#12a28d" : navigationBarIcon}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) =>
              userInfo?.profile_image ? (
                <Image
                  source={{
                    uri: (userInfo?.profile_image as any)?.file_path,
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6
                  }}
                />
              ) : (
                <TabBarIcon
                  name={focused ? "person" : "person-outline"}
                  color={focused ? "#12a28d" : navigationBarIcon}
                />
              ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
