export const calculateDuration = (start: string, end: string): string => {
  const startTime = new Date(start);
  const endTime = new Date(end);

  const diffMs = endTime.getTime() - startTime.getTime(); // difference in ms

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`); // show 0s if total diff is zero

  return parts.join(" ");
};