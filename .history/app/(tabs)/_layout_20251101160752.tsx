import { Tabs } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs.Screen
      options={{
        headerShown: false,
        href: null
        
      }}
    />
  );
}
