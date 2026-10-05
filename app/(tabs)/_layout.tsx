import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';

type IconName = ComponentProps<typeof Feather>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} size={size - 2} color={color} />;
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.paper,
        tabBarInactiveTintColor: colors.washDim,
        // Atkinson's tall line metrics need a little more room than the default 49pt bar.
        tabBarStyle: { backgroundColor: colors.prussian, borderTopColor: colors.line, height: 58 + insets.bottom },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14 },
        headerStyle: { backgroundColor: colors.prussian },
        headerTintColor: colors.paper,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 26 },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.prussian },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Identify', headerShown: false, tabBarIcon: tabIcon('aperture') }} />
      <Tabs.Screen name="collection" options={{ title: 'Collection', tabBarIcon: tabIcon('book-open') }} />
      <Tabs.Screen name="store" options={{ title: 'Scans', tabBarIcon: tabIcon('layers') }} />
    </Tabs>
  );
}
