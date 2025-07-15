import { getTokens, refreshTokens } from "./auth";

export async function fetchUserData() {
  const { accessToken } = await getTokens(); // Retrieve stored tokens

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/user/profile`,
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
      return fetchUserData(); // Retry request
    } else {
      return null;
    }
  } else {
    console.error("Failed to fetch user data:", response.status);
    return null;
  }
}
