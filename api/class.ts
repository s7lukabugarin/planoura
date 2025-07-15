import axios from "axios";
import { getTokens, refreshTokens } from "./auth";
import Toast from "react-native-toast-message";

export interface ClassDate {
  start_class: string;
  end_class: string;
  notification_id?: string | null;
}

export interface ClassDateWithDuration extends ClassDate {
  duration: number;
}

export interface CreateClassData {
  name: string;
  description: string;
  difficulty_level: string;
  class_type: number;
  exercises: number[];
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notification_id?: string | null;
  dates: ClassDate[];
  members: number[];
}

export interface UpdateClassData {
  name: string;
  description: string;
  difficulty_level: string;
  class_type: number;
  exercises: number[];
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notification_id?: number | null;
  class_sessions: ClassDateWithDuration[];
  client?: number;
  is_active?: boolean;
  status?: string;
}

export async function createClass(createClassData: CreateClassData) {
  const { accessToken } = await getTokens();

  try {
    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-class/`,
      createClassData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized (Token Refresh)
      if (error.response?.status === 401) {
        const refreshVal = await refreshTokens();
        if (refreshVal) {
          return createClass(createClassData); // Retry with new token
        } else {
          return;
        }
      }

      // Handle other errors
      const errors = error.response?.data
        ? Object.values(error.response.data)[0]
        : 'Unknown error';

      Toast.show({
        type: 'error',
        text1: 'Failed to create class!',
        text2: Array.isArray(errors) ? errors[0] : errors,
        position: 'top',
      });
    } else {
      // Non-Axios error (e.g., network failure)
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
        position: 'top',
      });
    }

    return null;
  }
}

export async function updateClass(
  classId: number,
  updateClassData: UpdateClassData
) {
  const { accessToken } = await getTokens();

  try {
    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/class-detail/${classId}/`,
      updateClassData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;

  } catch (error) {
    console.log(error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        const refreshVal = await refreshTokens();
        if (refreshVal) {
          return updateClass(classId, updateClassData); // Retry after refresh
        } else {
          return;
        }
      }

      const errors = error.response?.data
        ? Object.values(error.response.data)[0]
        : 'Unknown error';

      Toast.show({
        type: 'error',
        text1: 'Failed to update class!',
        text2: Array.isArray(errors) ? errors[0] : errors,
        position: 'top',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: 'Could not connect to the server.',
        position: 'top',
      });
    }

    return null;
  }
}

export async function getUserClasses() {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/classes-by-me/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data;
  } else if (response.status === 401) {
    const refreshVal = await refreshTokens();

    if (refreshVal) {
      return getUserClasses();
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch classes:", response);

    return null;
  }
}

export async function getClassById(classId: number) {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/class-detail/${classId}/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data;
  } else if (response.status === 401) {
    const refreshVal = await refreshTokens();

    if (refreshVal) {
      return getClassById(classId);
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch classes:", response);
    return null;
  }
}

export async function getUserClassSessions() {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/calendar/`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data;
  } else if (response.status === 401) {
    const refreshVal = await refreshTokens();

    if (refreshVal) {
      return getUserClassSessions();
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch sessions:", response);
    return null;
  }
}
