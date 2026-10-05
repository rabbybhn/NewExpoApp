import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PaywallModal } from '@/components/PaywallModal';
import { colors } from '@/constants/theme';
import { CollectionProvider } from '@/context/CollectionContext';
import { CreditsProvider } from '@/context/CreditsContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.leaf,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.bloom,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(Feather.font);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, []);

  useEffect(() => {
    // Icon fonts failing to load shouldn't brick the app — fall through and render anyway.
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <CreditsProvider>
          <CollectionProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="result"
                options={{ title: 'Analysis', presentation: 'card', headerBackTitle: 'Back' }}
              />
            </Stack>
            <PaywallModal />
          </CollectionProvider>
        </CreditsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
