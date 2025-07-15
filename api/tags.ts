import { getTokens, refreshTokens } from "./auth";

export interface Tag {}

export async function getAllTags() {
  const { accessToken } = await getTokens(); // Retrieve stored tokens

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercise-tags/`,
    {
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
      return getAllTags();
    } else {
      return null;
    }
  } else {
    console.error("Failed to fetch tags data:", response);
    return null;
  }
}

export async function getExerciseTagsPerGroup() {
  const { accessToken } = await getTokens(); // Retrieve stored tokens

  const response = await fetch(
    `https://pilatesapi.s7design.de/api_admin/exercise-tags-per-group/`,
    {
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/get-all-exercise-tags/`, {
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
      return getAllTags();
    } else {
      return null;
    }
  } else {
    console.error("Failed to fetch tags data:", response);
    return null;
  }
}
