/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Enable Chrome DevTools Network Tab inspection
if (__DEV__) {
  // @ts-ignore
  global.XMLHttpRequest = global.originalXMLHttpRequest || global.XMLHttpRequest;
  // @ts-ignore
  global.FormData = global.originalFormData || global.FormData;
}

AppRegistry.registerComponent(appName, () => App);
