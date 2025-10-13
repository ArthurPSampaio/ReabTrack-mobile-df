import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPaciente } from "../../services/api/patients";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { typography } from "../../theme/tokens";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "PatientNew">;

type CreatePacienteDto = {
  nome: string;
  idade: number;
  genero: string;
  diagnostico: string;
  sintomas: string;
};

export default function PatientNewScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreatePacienteDto>({
    nome: "",
    idade: 0,
    genero: "",
    diagnostico: "",
    sintomas: "",
  });

  const set = (k: keyof CreatePacienteDto, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: createPaciente,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["pacientes"] });
      navigation.goBack();
    },
    onError: (e: any) => {
      Alert.alert(
        "Erro",
        e?.response?.data?.message || "Falha ao salvar paciente"
      );
    },
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={[typography.h1]}>Novo Paciente</Text>
      <Card style={{ gap: 12 }}>
        <Input label="Nome" onChangeText={(t) => set("nome", t)} />
        <Input
          label="Idade"
          keyboardType="numeric"
          onChangeText={(t) => set("idade", Number(t || 0))}
        />
        <Input label="Gênero" onChangeText={(t) => set("genero", t)} />
        <Input
          label="Diagnóstico"
          onChangeText={(t) => set("diagnostico", t)}
        />
        <Input
          label="Sintomas"
          multiline
          onChangeText={(t) => set("sintomas", t)}
        />
        <Button
          title={isPending ? "Salvando..." : "Salvar"}
          onPress={() => mutate(form)}
          disabled={isPending}
        />
      </Card>
    </ScrollView>
  );
}

function Field({ label, children }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>
      {children}
    </View>
  );
}
const input = { borderWidth: 1, borderRadius: 10, padding: 10 } as const;
