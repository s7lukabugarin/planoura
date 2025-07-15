import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

let logoutCallback: (() => void) | null = null;

export function registerLogoutCallback(fn: () => void) {
  logoutCallback = fn;
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
}

export async function getTokens() {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  const storedUser = await AsyncStorage.getItem("userInfo");

  return { accessToken, refreshToken, storedUser };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await AsyncStorage.removeItem("userInfo");
}

export async function refreshTokens(): Promise<boolean> {
  const { refreshToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/refresh-token/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    }
  );

  if (response.ok) {
    const { access, refresh } = await response.json();
    await saveTokens(access, refresh);
    return true;
  } else {
    console.log("Failed to refresh tokens. Logging out.");
    await clearTokens();
    logoutCallback?.();
    return false;
    // Redirect user to login screen
  }
}

export async function deleteUser(
  userEmail: string,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/delete-yourself/`,
      {
        email: userEmail,
      },
      {
        // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    Toast.show({
      type: "success",
      text1: "You are almost done!",
      text2: "Check your email for further instructions.",
    });

    setTimeout(() => {
      logoutCallback?.();
    }, 1000);

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to update user:", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    if (error.response.status === 401) {
      const refreshVal = await refreshTokens();

      if (refreshVal) {
        return deleteUser(userEmail, setLoading); // Retry request
      } else {
        return;
      }
    } else {
      console.error("An error occurred during course creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function getCurrentUser() {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/current-user/`,
    {
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.ok) {
    const data = await response.json();

    return data;
  } else if (response.status === 401) {
    const refreshVal = await refreshTokens();

    if (refreshVal) {
      return getCurrentUser();
    } else {
      return;
    }
  } else {
    console.error("Failed to retrieve user info:", response);
    return null;
  }
}

export interface ProfileImageInterface {
  id: number;
  file_path: string;
}
export interface UpdateUserInterface {
  first_name?: string;
  last_name?: string;
  profile_image_id?: number | null;
}

export async function updateCurrentUser(
  user: UpdateUserInterface,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/current-user/`,
      user,
      {
        // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to update user:", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    if (error.response.status === 401) {
      const refreshVal = await refreshTokens();

      if (refreshVal) {
        return updateCurrentUser(user, setLoading); // Retry request
      } else {
        return;
      }
    } else {
      console.error("An error occurred during course creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function resendVerificationLink(email: string) {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/resend-link/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      Toast.show({
        type: "error",
        text1: "Reset link failed!",
        text2: "Please try again.",
      });

      return;
    }

    Toast.show({
      type: "success",
      text1: "Verification link sent!",
      text2: "Check your email for further instructions.",
    });
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Reset link failed!",
      text2: "Please try again.",
    });
  }
}

export async function resetPassword(email: string) {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/forgot-password/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      Toast.show({
        type: "error",
        text1: "Reset password failed!",
        // @ts-ignore
        text2: (Object.values(data)[0][0] as string) ?? "",
      });

      return;
    }

    Toast.show({
      type: "success",
      text1: "Reset password link sent!",
      text2: "Check your email for further instructions.",
    });
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Reset password failed!",
      text2: "Please try again.",
    });
  }
}
