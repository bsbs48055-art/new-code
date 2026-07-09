import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSettingsStore } from './src/store/settingsStore';
import { darkColors, lightColors } from './src/theme/colors';

export default function App() {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const hydrated = useSettingsStore((s) => s.hydrated);
  const theme = useSettingsStore((s) => s.settings.theme);
  const colors = theme === 'dark' ? darkColors : lightColors;

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} size="large" />
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
