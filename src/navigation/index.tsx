import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";

import PatientsListScreen from "../screens/Patients/PatientsListScreen";
import PatientNewScreen from "../screens/Patients/PatientNewScreen";
import PatientDetailScreen from "../screens/Patients/PatientDetailScreen";
import PlanDetailScreen from "../screens/Plans/PlanDetailScreen";
import PlanCreateScreen from "../screens/Plans/PlanCreateScreen";
import DashboardScreen from "../screens/Patients/DashboardScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen
        name="PatientsList"
        component={PatientsListScreen}
        options={{ title: "Pacientes" }}
      />
      <Stack.Screen
        name="PatientNew"
        component={PatientNewScreen}
        options={{ title: "Novo Paciente" }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlanCreate"
        component={PlanCreateScreen}
        options={{ title: "Novo Plano" }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
