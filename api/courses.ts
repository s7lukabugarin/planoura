import { getTokens, refreshTokens } from "./auth";
import axios from "axios";

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

export interface CreateCourseSession {
  session_title: string;
  session_description: string;
  notification_id: string; // or `number` if your system returns numeric IDs
  start: string;           // ISO string, e.g., "2025-07-05T08:00:00Z"
  end: string;             // ISO string
  course_day_id: number;
  members: number[];       // array of user IDs
  location_name: string;
  longitude: number | null;
  latitude: number | null;
}
// export interface EditCourseData extends CreateCourseData {
//     id: number;
// }

export async function getAllCourses(): Promise<any> {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-courses/`,
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
      return getAllCourses(); // Retry request
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch courses data:", response);
    return null;
  }
}

export async function createCourseSessions(
  createCourseSessionsData: CreateCourseSession[],
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-course-sessions/`,
      createCourseSessionsData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to create course:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return createCourseSessions(createCourseSessionsData, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during course creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function getCourseSessionDetails(
  courseSessionId: number,
  setLoading?: (state: boolean) => void
): Promise<any> {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/course-session-detail/${courseSessionId}/`,
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
      console.error("Failed to fetch course session:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return getCourseSessionDetails(courseSessionId, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during fetch of course:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function updateCourseSession(
  courseSessionId: number,
  courseData: any,
  setLoading?: (state: boolean) => void
): Promise<any> {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/course-session-detail/${courseSessionId}/`,
      courseData,
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
      console.error("Failed to fetch course session:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return updateCourseSession(courseSessionId, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during fetch of course:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}


export async function createCourse(
  createCourseData: CreateCourseData,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);

    const { accessToken } = await getTokens();

    const response = await axios.post(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-course/`,
      createCourseData,
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
      console.error("Failed to create course:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return createCourse(createCourseData, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during course creation:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function getCourseById(
  courseId: number,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/course-detail/${courseId}/`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to fetch course:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return getCourseById(courseId, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during course fetch:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function editCourse(
  courseId: number,
  editCourseData: CreateCourseData,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await axios.put(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/update-course/${courseId}/`,
      editCourseData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data; // Axios automatically parses JSON responses
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to update course:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return editCourse(courseId, editCourseData, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during exercise update:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}
