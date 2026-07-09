import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PositionsScreen } from '../screens/PositionsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignalDetailScreen } from '../screens/SignalDetailScreen';
import { TradeExecutionScreen } from '../screens/TradeExecutionScreen';
import { useSettingsStore } from '../store/settingsStore';
import { darkColors, lightColors, fonts } from '../theme/colors';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: focused ? 11 : 10, fontFamily: fonts.sansMedium }}>{label}</Text>
  );
}

function MainTabs() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.sansBold },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'SMC Signal',
          tabBarIcon: ({ focused, color }) => <TabIcon label="Home" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Positions"
        component={PositionsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon label="Pos" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon label="Hist" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => <TabIcon label="Set" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;
  const navTheme = theme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.bgElevated,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.bgElevated,
          text: colors.text,
          border: colors.border,
          primary: colors.accent,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.sansBold },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="SignalDetail" component={SignalDetailScreen} options={{ title: 'Signal Detail' }} />
        <Stack.Screen name="TradeExecution" component={TradeExecutionScreen} options={{ title: 'Execute Trade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
