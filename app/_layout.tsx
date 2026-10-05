import { AtkinsonHyperlegible_400Regular } from '@expo-google-fonts/atkinson-hyperlegible/400Regular';
import { AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible/700Bold';
import { BodoniModa_500Medium } from '@expo-google-fonts/bodoni-moda/500Medium';
import { BodoniModa_500Medium_Italic } from '@expo-google-fonts/bodoni-moda/500Medium_Italic';
import { CourierPrime_400Regular } from '@expo-google-fonts/courier-prime/400Regular';
import { CourierPrime_700Bold } from '@expo-google-fonts/courier-prime/700Bold';
import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PaywallModal } from '@/components/PaywallModal';
import { colors, fonts } from '@/constants/theme';
import { CollectionProvider } from '@/context/CollectionContext';
import { CreditsProvider } from '@/context/CreditsContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.paper,
    background: colors.prussian,
    card: colors.prussian,
    text: colors.paper,
    border: colors.line,
    notification: colors.ferric,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Feather.font,
    BodoniModa_500Medium,
    BodoniModa_500Medium_Italic,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    CourierPrime_400Regular,
    CourierPrime_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.prussian).catch(() => {});
  }, []);

  useEffect(() => {
    // A font failing to load shouldn't brick the app — fall back to system faces.
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
                headerStyle: { backgroundColor: colors.prussian },
                headerTintColor: colors.paper,
                headerTitleStyle: { fontFamily: fonts.bodyBold },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.prussian },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="result" options={{ title: '', headerBackTitle: 'Back' }} />
            </Stack>
            <PaywallModal />
          </CollectionProvider>
        </CreditsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
