import React, { createContext, useState, useEffect, ReactNode } from "react";
import {
  getTokens,
  saveTokens,
  clearTokens,
  refreshTokens,
  getCurrentUser,
  registerLogoutCallback,
} from "../api/auth";
import { jwtDecode } from "jwt-decode";
import { router, useNavigation } from "expo-router";
import { StackActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserInfo {
  id: number;
  last_login: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  date_joined: string;
  role: "client" | "admin" | "superuser";
  profile_image: string | null;
  groups: any[];
  user_permissions: any[];
}

interface AuthContextType {
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userEmail: string | null;
  userId: string | null;
  setUserEmail: (email: string) => void;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  splashLoaded: boolean;
  setSplashLoaded: (loaded: boolean) => void;
  handleUserInfoUpdate?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [splashLoaded, setSplashLoaded] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState(null);

  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const { accessToken, refreshToken, storedUser } = await getTokens();
      if (accessToken && refreshToken) {
        setIsLoggedIn(true);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        storedUser && setUserInfo(JSON.parse(storedUser));
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    await saveTokens(accessToken, refreshToken);

    setIsLoggedIn(true);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    handleUserInfoUpdate();
  };

  const handleUserInfoUpdate = async () => {
    const fetchedUserData = await getCurrentUser();
    await AsyncStorage.setItem("userInfo", JSON.stringify(fetchedUserData));

    setUserInfo(fetchedUserData);
  };

  const logout = async () => {
    await clearTokens();
    setIsLoggedIn(false);
    setAccessToken(null);
    setRefreshToken(null);

    router.replace("/");
  };

  useEffect(() => {
    registerLogoutCallback(logout);
  }, []);

  useEffect(() => {
    if (accessToken) {
      const userIdJwt = (jwtDecode(accessToken) as any)?.user_id;

      setUserId(userIdJwt);
    }
  }, [accessToken]);

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        accessToken,
        refreshToken,
        userEmail,
        userId,
        setUserEmail,
        login,
        logout,
        isAuthenticated,
        userInfo,
        splashLoaded,
        setSplashLoaded,
        handleUserInfoUpdate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
