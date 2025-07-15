import { getTokens, refreshTokens } from "./auth";
import axios from "axios";

export interface Client {
  first_name: string;
  last_name: string;
  profile_image: null | string;
  updated_at: Date;
  created_at: Date;
  client: number;
  id?: number;
}

export interface CourseDay {
  day_number: number;
  exercise_ids: number[];
}

export interface CreateCourseData {
  created_by: number;
  title: string;
  difficulty: string;
  number_of_days: number;
  days: CourseDay[];
}

export interface CreateClientData {
  first_name: string;
  last_name: string;
  profile_image_id: null | string;
}

export interface UpdateClientData {
  first_name?: string;
  last_name?: string;
  profile_image_id?: null | string;
}

// export interface EditCourseData extends CreateCourseData {
//     id: number;
// }

export async function getAllClients(): Promise<any> {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-client-members/`,
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
      return getAllClients(); // Retry request
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch courses data:", response);
    return null;
  }
}

export async function createClient(
  createClientData: CreateClientData,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/add-member/`,
      createClientData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to create client:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return createClient(createClientData, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during client creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function updateClient(
  updateClientData: UpdateClientData,
  memberId: number,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/member-detail/${memberId}/`,
      updateClientData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to create client:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return updateClient(updateClientData, memberId, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during client creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}
