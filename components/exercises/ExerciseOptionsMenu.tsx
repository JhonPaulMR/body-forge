import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { X, Pencil, Trash2 } from 'lucide-react-native';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useRouter } from 'expo-router';

interface ExerciseOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  onDelete: () => void;
}

export function ExerciseOptionsMenu({
  visible,
  onClose,
  exerciseId,
  exerciseName,
  onDelete
}: ExerciseOptionsMenuProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // When modal is closed from outside, reset state
  React.useEffect(() => {
    if (!visible) {
      setShowDeleteConfirm(false);
    }
  }, [visible]);

  if (showDeleteConfirm) {
    return (
      <BottomSheetModal
        visible={visible}
        title="Excluir Exercício?"
        description={`Isso removerá "${exerciseName}" de todas as suas rotinas e excluirá o histórico de treinos associado. Essa ação é irreversível.`}
        icon={<Trash2 size={28} color="#EF4444" />}
        iconBgColorClass="bg-red-500/10"
        confirmText="EXCLUIR"
        confirmButtonClass="bg-red-500"
        confirmTextClass="text-white"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={onDelete}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-base font-extrabold tracking-wide">OPÇÕES DO EXERCÍCIO</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-forge-border justify-center items-center"
            >
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-forge-border"
            onPress={() => {
              onClose();
              router.push(`/exercises/edit/${exerciseId}`);
            }}
          >
            <View className="w-10 h-10 rounded-xl bg-forge-accent/15 justify-center items-center mr-4">
              <Pencil size={18} color="#A0C4FF" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-bold">Editar Exercício</Text>
              <Text className="text-forge-muted text-[11px]">Modificar nome, músculos ou mídia</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={() => setShowDeleteConfirm(true)}
          >
            <View className="w-10 h-10 rounded-xl bg-red-500/15 justify-center items-center mr-4">
              <Trash2 size={18} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-400 text-sm font-bold">Excluir Exercício</Text>
              <Text className="text-forge-muted text-[11px]">Remover do aplicativo permanentemente</Text>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
