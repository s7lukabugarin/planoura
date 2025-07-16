export default {
  expo: {
    jsEngine: "hermes",
    name: "Planoura",
    slug: "planoura",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",

    reactNativeNewArchitectureIos: true,
    reactNativeNewArchitectureAndroid: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.planoura",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        NSPhotoLibraryUsageDescription: "Allow access to save videos",
        NSCameraUsageDescription: "Allow access to camera",
        NSMicrophoneUsageDescription: "Allow access to microphone"
      }
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.luka.bugarin.pilatesapp"
    },

    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "@react-native-community/datetimepicker",
        {
          android: {
            datePicker: {
              colorAccent: {
                light: "#FF5722"
              },
              textColorPrimary: {
                light: "#FF5722"
              }
            },
            timePicker: {
              background: {
                light: "#FF5722",
                dark: "#383838"
              },
              numbersBackgroundColor: {
                light: "#FF5722",
                dark: "#383838"
              }
            }
          }
        }
      ],
      "expo-secure-store",
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true
        }
      ],
      "expo-font",
      "expo-web-browser"
    ],

    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "5047bf16-ceb2-4dec-8d95-5c1caefdec9d",
      },
    }
  }
}
