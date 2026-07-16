import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: '#F5F0EB',
    borderTopWidth: 0,
    shadowColor: '#4A3F3A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
    paddingTop: 8,
    paddingBottom: insets.bottom + 4,
    height: 60 + insets.bottom,
  };

  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto' as unknown as number,
    };
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: '#C4A0A0',
        tabBarInactiveTintColor: '#BEB5AD',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: '资产库',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="database" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="will"
        options={{
          title: '遗嘱',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="file-lines" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: '信任圈',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="users" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
