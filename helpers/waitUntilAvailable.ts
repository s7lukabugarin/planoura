export const waitUntilAvailable = async (
  url: string,
  isVideo = false,
  retries = 10,
  delayMs = 500
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(
        url,
        isVideo
          ? { method: "GET", headers: { Range: "bytes=0-0" } }
          : { method: "HEAD" }
      );
      if (res.ok || res.status === 206) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("File not available.");
};
