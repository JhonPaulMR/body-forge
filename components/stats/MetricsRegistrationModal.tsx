import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { useSettingsStore } from '@/hooks/useSettingsStore';

interface MetricsRegistrationModalProps {
  showAddMetricModal: boolean;
  setShowAddMetricModal: (val: boolean) => void;
  newWeight: string;
  setNewWeight: (val: string) => void;
  newHeight: string;
  setNewHeight: (val: string) => void;
  newBf: string;
  setNewBf: (val: string) => void;
  newNotes: string;
  setNewNotes: (val: string) => void;
  handleAddMetric: () => void;
}

export function MetricsRegistrationModal({
  showAddMetricModal,
  setShowAddMetricModal,
  newWeight,
  setNewWeight,
  newHeight,
  setNewHeight,
  newBf,
  setNewBf,
  newNotes,
  setNewNotes,
  handleAddMetric
}: MetricsRegistrationModalProps) {
  const { weightUnit, measurementUnit } = useSettingsStore();

  return (
    <Modal visible={showAddMetricModal} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowAddMetricModal(false)}>
        <Pressable className="bg-forge-surface rounded-t-3xl p-6 pb-10">
          <Text className="text-white text-xl font-extrabold mb-5">Registrar Medição</Text>

          <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">Peso ({weightUnit}) *</Text>
          <TextInput
            className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border"
            placeholder="Ex: 84.5"
            placeholderTextColor="#5F6368"
            keyboardType="decimal-pad"
            value={newWeight}
            onChangeText={setNewWeight}
          />

          <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">Altura ({measurementUnit})</Text>
          <TextInput
            className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border"
            placeholder="Ex: 175"
            placeholderTextColor="#5F6368"
            keyboardType="decimal-pad"
            value={newHeight}
            onChangeText={setNewHeight}
          />

          <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">% Gordura Corporal</Text>
          <TextInput
            className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border"
            placeholder="Ex: 15.0"
            placeholderTextColor="#5F6368"
            keyboardType="decimal-pad"
            value={newBf}
            onChangeText={setNewBf}
          />

          <Text className="text-forge-muted text-[11px] font-bold tracking-tight mb-1.5 mt-3">Notas</Text>
          <TextInput
            className="bg-forge-accent-bg rounded-xl p-3.5 text-white text-sm font-semibold border border-forge-border h-[60px]"
            style={{ textAlignVertical: 'top' }}
            placeholder="Observações opcionais..."
            placeholderTextColor="#5F6368"
            multiline
            value={newNotes}
            onChangeText={setNewNotes}
          />

          <TouchableOpacity className="bg-forge-accent rounded-2xl p-4 items-center mt-6" onPress={handleAddMetric}>
            <Text className="text-forge-bg text-sm font-extrabold tracking-wide">REGISTRAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="p-4 items-center mt-2"
            onPress={() => setShowAddMetricModal(false)}
          >
            <Text className="text-forge-muted text-[13px] font-bold">CANCELAR</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
