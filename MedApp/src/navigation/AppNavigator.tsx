import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { ElderlyHomeScreen } from '../screens/ElderlyHomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AddMedicationScreen } from '../screens/AddMedicationScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { RootStackParamList } from '../types/navigation';
import { THEME } from '../constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.background }}>
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
              options={{
                headerShown: true,
                title: 'Dose History',
                headerStyle: { backgroundColor: THEME.colors.surface },
                headerTintColor: THEME.colors.text,
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen
              name="AddMedication"
              component={AddMedicationScreen}
              options={{
                headerShown: true,
                title: 'New Medication',
                headerStyle: { backgroundColor: THEME.colors.surface },
                headerTintColor: THEME.colors.text,
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen
              name="ProfileSettings"
              component={ProfileSettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                headerStyle: { backgroundColor: THEME.colors.surface },
                headerTintColor: THEME.colors.text,
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
