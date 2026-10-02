import { AppRegistry } from 'react-native';
import App from './App';

// Enable Chrome DevTools Network Tab inspection for React Native Hermes
if (__DEV__) {
  // @ts-ignore
  global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
  // @ts-ignore
  global.FormData = global.originalFormData || global.FormData;
}

AppRegistry.registerComponent('ElderlyMedicineReminderMobile', () => App);
