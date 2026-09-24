import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { ElderlyHomeScreen } from '../screens/ElderlyHomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RootStackParamList } from '../types/navigation';
import { THEME } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="ElderlyHome" component={ElderlyHomeScreen} />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ headerShown: true, title: 'Dose History' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
