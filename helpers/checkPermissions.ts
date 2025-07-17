import * as Notifications from 'expo-notifications';

export const checkPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  console.log('Current permissions:', settings);
};