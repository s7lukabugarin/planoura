import * as Notifications from 'expo-notifications';

/**
 * Schedules a notification at a specific time.
 * @param alertTime - The time to trigger the notification.
 * @param title - The title of the notification.
 * @param body - The body of the notification.
 * @returns The notification ID.
 */
export const scheduleNotification = async (
  alertTime: Date,
  title: string,
  body: string
): Promise<string> => {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: body,
      sound: true,
    },
    trigger: alertTime,
  });
  return notificationId;
};

/**
 * Cancels a scheduled notification.
 * @param notificationId - The ID of the notification to cancel.
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};
