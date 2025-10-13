import React from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { listPlanosByPaciente } from "../../services/api/plans";

import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  RootStackParamList,
  PatientDetailTabParamList,
} from "../../navigation/types";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";
import { typography } from "../../theme/tokens";
import { colors } from "../../theme/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PatientDetailTabParamList, "Plans">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function PatientPlansTab({ route, navigation }: Props) {
  const { id } = route.params; // pacienteId

  const planosQ = useQuery({
    queryKey: ["planos", id],
    queryFn: () => listPlanosByPaciente(id),
  });

  const planos = planosQ.data || [];
  const isLoading = planosQ.isLoading;
  const isRefetching = !!planosQ.isRefetching;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Bloco de título + botão “Novo” mais próximo do header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8, // menor distância
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[typography.h1]}>Planos</Text>
          <Text style={{ ...typography.muted, marginTop: 2 }}>
            {planos.length > 0
              ? `${planos.length} ${planos.length === 1 ? "plano" : "planos"} para este paciente`
              : "Nenhum plano cadastrado ainda"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("PlanCreate", { patientId: id })}
          activeOpacity={0.9}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 14,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "700" }}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de planos */}
      <FlatList
        data={planos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isLoading}
            onRefresh={planosQ.refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <Card style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
              <Text style={[typography.h2]}>Nenhum plano ainda</Text>
              <Text style={{ ...typography.muted, textAlign: "center" }}>
                Crie um plano para organizar objetivos, diagnóstico e atividades
                do paciente.
              </Text>
              <View style={{ height: 8 }} />
              <TouchableOpacity
                onPress={() => navigation.navigate("PlanCreate", { patientId: id })}
                activeOpacity={0.9}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "700" }}>
                  Criar primeiro plano
                </Text>
              </TouchableOpacity>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("PlanDetail", { planId: item.id })}
          >
            <Card style={{ padding: 14, gap: 10 }}>
              {/* Header do card */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h2]} numberOfLines={2}>
                    {item.objetivoGeral}
                  </Text>
                  <Text style={{ ...typography.muted }} numberOfLines={2}>
                    {item.diagnosticoRelacionado}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <StatusBadge status={item.status as any} />
                </View>
              </View>

              {/* Rodapé com contagens */}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <BadgeChip label={`${item.atividades?.length || 0} atividades`} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/** Chip estilizado */
function BadgeChip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
