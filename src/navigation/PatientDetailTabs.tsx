import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import PatientPlansTab from '../screens/tabs/PatientPlansTab';
import PatientSessionsTab from '../screens/tabs/PatientSessionsTab';
import PatientHistoryTab from '../screens/tabs/PatientHistoryTab';
import PatientReportTab from '../screens/tabs/PatientReportTab';

import type { PatientDetailTabParamList } from './types';
import { colors } from '../theme/colors';

const Tabs = createBottomTabNavigator<PatientDetailTabParamList>();

type Props = {
  id: string;
};

export default function PatientDetailTabs({ id }: Props) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Plans') return <Ionicons name="clipboard-outline" size={size} color={color} />;
          if (route.name === 'Sessions') return <Ionicons name="calendar-outline" size={size} color={color} />;
          if (route.name === 'History') return <Ionicons name="time-outline" size={size} color={color} />;
          if (route.name === 'Report') return <Ionicons name="document-text-outline" size={size} color={color} />;
          return null;
        },
      })}
      initialRouteName="Plans"
    >
      <Tabs.Screen
        name="Plans"
        component={PatientPlansTab}
        initialParams={{ id }}
        options={{ title: 'Planos' }}
      />
      <Tabs.Screen
        name="Sessions"
        component={PatientSessionsTab}
        initialParams={{ id }}
        options={{ title: 'Sessões' }}
      />
      <Tabs.Screen
        name="History"
        component={PatientHistoryTab}
        initialParams={{ id }}
        options={{ title: 'Histórico' }}
      />
      <Tabs.Screen
        name="Report"
        component={PatientReportTab}
        initialParams={{ id }}
        options={{ title: 'Relatório' }}
      />
    </Tabs.Navigator>
  );
}