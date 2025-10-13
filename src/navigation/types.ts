export type RootStackParamList = {
  PatientsList: undefined;
  PatientNew: undefined;
  PatientDetail: { id: string; nome?: string };
  PlanDetail: { planId: string };
  PlanCreate: { patientId: string }; // NOVA
};

export type PatientDetailTabParamList = {
  Plans: { id: string };
  Sessions: { id: string };
  History: { id: string };
  Report: { id: string };
};
