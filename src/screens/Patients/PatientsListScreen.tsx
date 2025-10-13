import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { listPacientes } from "../../services/api/patients";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/tokens";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "PatientsList">;

export default function PatientsListScreen({ navigation }: Props) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // debounce simples (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pacientes", debounced],
    queryFn: () => listPacientes(debounced || undefined),
  });

  // filtro local se o backend não suportar ?q=
  const pacientes = useMemo(() => {
    const base = data || [];
    if (!debounced) return base;
    const term = debounced.toLowerCase();
    return base.filter((p) =>
      `${p.nome ?? ""} ${p.diagnostico ?? ""} ${p.sintomas ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [data, debounced]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Erro ao carregar pacientes.</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ textDecorationLine: "underline", marginTop: 8 }}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {/* Header + Busca */}
      <View style={{ gap: 8 }}>
        <Text style={[typography.h1]}>Pacientes</Text>

        {/* Campo de busca com ícone “por fora” */}
        <View style={{ position: "relative" }}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textMuted}
            style={{ position: "absolute", left: 10, top: 14, zIndex: 1 }}
          />
          <Input
            placeholder="Buscar por nome ou diagnóstico..."
            value={search}
            onChangeText={setSearch}
            // dá espaço para o ícone
            style={{ paddingLeft: 36 }}
          />
        </View>
      </View>

      {/* Botão novo */}
      <Button
        title="Novo Paciente"
        onPress={() => navigation.navigate("PatientNew")}
      />

      {/* Lista */}
      <FlatList
        data={pacientes || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
        ListEmptyComponent={
          <Card style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
            <MaterialCommunityIcons
              name="account-question"
              size={26}
              color={colors.textMuted}
            />
            <Text style={[typography.h2]}>Nenhum paciente encontrado</Text>
            <Text
              style={{
                ...typography.muted,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              {debounced
                ? "Tente outro termo de busca."
                : "Cadastre o primeiro paciente para começar."}
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <MaterialCommunityIcons
                  name="account-heart-outline"
                  size={22}
                  color={colors.brown}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h2]}>{item.nome}</Text>
                <Text style={typography.muted} numberOfLines={2}>
                  {item.diagnostico}
                </Text>
              </View>
              <Button
                title="Abrir"
                variant="outline"
                onPress={() =>
                  navigation.navigate("PatientDetail", {
                    id: item.id,
                    nome: item.nome,
                  })
                }
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
}
