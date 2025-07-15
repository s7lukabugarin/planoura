import { getTokens, refreshTokens } from "./auth";
import axios from "axios";

interface CreatedBy {
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  role: string;
}

interface TagGroup {
  [key: string]: any;
}

export interface ExerciseTag {
  created_by: CreatedBy;
  id: number;
  name: string;
  parent: null | number;
  tag_group: TagGroup;
}

export interface ImageInterface {
  description: string;
  file_path: string;
  id: number;
  thumbnail: boolean;
  title: string;
}

export interface VideoInterface {
  description: string;
  file_path: string;
  id: number;
  title: string;
  item_id: string;
}

export interface Exercise {
  created_at: string;
  created_by: CreatedBy;
  description: string;
  duration_in_seconds: number;
  exercise_tags: ExerciseTag[];
  id: number;
  images: ImageInterface[];
  is_active: boolean;
  is_public: boolean;
  name: string;
  updated_at: string;
  videos: VideoInterface[];
  thumbnail_image: number | null;
  exercise_group: number;
  status?: number;
}

export interface ImageToSend {
  id: number;
  thumbnail: boolean;
}

export interface VideoToSend {
  id: number;
}

export interface CreateExerciseData {
  name: string;
  description: string;
  duration_in_seconds: number;
  exercise_tags?: number[] | ExerciseTag[];
  videos?: Array<any>;
  images?: Array<any>;
  is_public: boolean;
  thumbnail_image?: number | null;
  exercise_group: number;
}

export interface ExerciseGroup {
  description: string;
  id: number;
  name: string;
}

export interface EditExerciseData extends CreateExerciseData {
  id: number;
  created_by: CreatedBy;
  // videos?: Array<any>;
  // images?: Array<any>;
  // exercise_tags?: ExerciseTag[];
}

export async function getAllExercicesGroups(): Promise<
  Array<ExerciseGroup> | undefined | null
> {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercise-groups/`,
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
      return getAllExercicesGroups(); // Retry request
    } else {
      return;
    }
  } else {
    // console.error("Failed to fetch group data:", response);
    return null;
  }
}

export async function getAllExercisesForGroup(
  groupId: number,
): Promise<any> {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-exercises-based-on-group-id/${groupId}/`,
    {
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache'
      },
    }
  );

  if (response.ok) {
    const data = await response.json();

    return data;
  } else if (response.status === 401) {
    const refreshVal = await refreshTokens();

    if (refreshVal) {
      return getAllExercisesForGroup(groupId); // Retry request
    } else {
      return;
    }
  } else {
    // console.error("Failed to fetch group data:", response);
    return null;
  }
}

export async function getAllExercices(): Promise<any> {
  const { accessToken } = await getTokens();

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercises/`,
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
      return getAllExercices(); // Retry request
    } else {
      return;
    }
  } else {
    console.error("Failed to fetch exercises data:", response);
    return null;
  }
}

export async function createExercise(
  createExerciseData: CreateExerciseData,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-exercise/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createExerciseData),
      }
    );

    const data = await response.json();

    return data;
  } catch (error: any) {
    if (error.response) {
      console.error("Failed to upload image:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return createExercise(createExerciseData, setLoading); // Retry request
        } else {
          return;
        }
      }
    } else {
      console.error(
        "An error occurred during exercise creation:",
        error.message
      );
    }
  } finally {
    setLoading?.(false);
  }
}

export async function getExerciseById(
  exerciseId: number,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/exercise-detail/${exerciseId}/`,
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
      console.error("Failed to upload image:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return getExerciseById(exerciseId, setLoading);
        } else {
          return;
        }
      }
    } else {
      console.error("An error occurred during exercise fetch:", error.message);
    }
  } finally {
    setLoading?.(false);
  }
}

export async function editExercise(
  exerciseId: number,
  editExerciseData: EditExerciseData,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await axios.put(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/exercise-detail/${exerciseId}/`,
      editExerciseData,
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
      console.error("Failed to update exercise:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return editExercise(exerciseId, editExerciseData, setLoading); // Retry request
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

export async function submitExerciseForReview(
  exerciseId: number,
  setLoading?: (state: boolean) => void
) {
  try {
    setLoading?.(true);
    const { accessToken } = await getTokens();

    const response = await axios.patch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/submit-exercise-for-review/${exerciseId}/`,
      {
        status: 3
      },
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
      console.error("Failed to update exercise:", {
        status: error.response.status,
        data: error.response.data,
      });

      if (error.response.status === 401) {
        const refreshVal = await refreshTokens();

        if (refreshVal) {
          return submitExerciseForReview(exerciseId, setLoading); // Retry request
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

// export async function editExercise(
//   exerciseId: number,
//   editExerciseData: CreateExerciseData,
//   setLoading?: (state: boolean) => void
// ) {
//   try {
//     setLoading?.(true);
//     const { accessToken } = await getTokens();

//     const response = await fetch(
//       `${process.env.EXPO_PUBLIC_API_BASE_URL}/exercise-detail/${exerciseId}/`,
//       {
//         method: "PUT",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(editExerciseData),
//       }
//     );

//     const data = await response.json();

//     return data;
//   } catch (error: any) {
//     if (error.response) {
//       console.error("Failed to upload image:", {
//         status: error.response.status,
//         data: error.response.data,
//       });

//       if (error.response.status === 401) {
//         await refreshTokens(); // Refresh tokens if expired
//         return editExercise(exerciseId, editExerciseData, setLoading); // Retry request
//       }
//     } else {
//       console.error("An error occurred during exercise update:", error.message);
//     }
//   } finally {
//     setLoading?.(false);
//   }
// }
