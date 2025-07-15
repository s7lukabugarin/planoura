export const convertSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const remainingSecondsAfterHours = seconds % 3600;
  const minutes = Math.floor(remainingSecondsAfterHours / 60);
  const remainingSeconds = remainingSecondsAfterHours % 60;

  return {
    hours,
    minutes,
    seconds: remainingSeconds,
  };
};
