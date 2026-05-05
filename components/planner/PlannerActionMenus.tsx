import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Copy, Trash2, Link, Unlink, Dumbbell } from 'lucide-react-native';

interface ExerciseMenuProps {
  visible: boolean;
  onClose: () => void;
  inSuperset: boolean;
  onReplace?: () => void;
  onRemoveFromSuperset?: () => void;
  onCreateSuperset?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function ExerciseMenu({ visible, onClose, inSuperset, onReplace, onRemoveFromSuperset, onCreateSuperset, onDuplicate, onDelete }: ExerciseMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={onClose}>
        <View className="bg-forge-surface rounded-[16px] w-[220px] py-2 overflow-hidden">
          {inSuperset ? (
            <>
              {onReplace && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onReplace}>
                  <Dumbbell size={16} color="#A0C4FF" />
                  <Text className="text-white text-sm font-semibold">Substituir</Text>
                </TouchableOpacity>
              )}
              <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
              {onRemoveFromSuperset && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onRemoveFromSuperset}>
                  <Unlink size={16} color="#A0C4FF" />
                  <Text className="text-white text-sm font-semibold">Remover do superset</Text>
                </TouchableOpacity>
              )}
              <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
              {onDelete && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDelete}>
                  <Trash2 size={16} color="#EF4444" />
                  <Text className="text-red-400 text-sm font-semibold">Excluir</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {onCreateSuperset && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onCreateSuperset}>
                  <Link size={16} color="#A0C4FF" />
                  <Text className="text-white text-sm font-semibold">Criar superset</Text>
                </TouchableOpacity>
              )}
              {onDuplicate && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDuplicate}>
                  <Copy size={16} color="#A0C4FF" />
                  <Text className="text-white text-sm font-semibold">Duplicar</Text>
                </TouchableOpacity>
              )}
              <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
              {onDelete && (
                <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDelete}>
                  <Trash2 size={16} color="#EF4444" />
                  <Text className="text-red-400 text-sm font-semibold">Excluir</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

interface SupersetMenuProps {
  visible: boolean;
  onClose: () => void;
  onDissolve?: () => void;
  onDelete?: () => void;
}

export function SupersetMenu({ visible, onClose, onDissolve, onDelete }: SupersetMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={onClose}>
        <View className="bg-forge-surface rounded-[16px] w-[220px] py-2 overflow-hidden">
          {onDissolve && (
            <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDissolve}>
              <Unlink size={16} color="#A0C4FF" />
              <Text className="text-white text-sm font-semibold">Desfazer superset</Text>
            </TouchableOpacity>
          )}
          <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
          {onDelete && (
            <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDelete}>
              <Trash2 size={16} color="#EF4444" />
              <Text className="text-red-400 text-sm font-semibold">Excluir superset</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

interface DayMenuProps {
  visible: boolean;
  onClose: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function DayMenu({ visible, onClose, onDuplicate, onDelete }: DayMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={onClose}>
        <View className="bg-forge-surface rounded-[16px] w-[200px] py-2 overflow-hidden">
          {onDuplicate && (
            <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDuplicate}>
              <Copy size={16} color="#A0C4FF" />
              <Text className="text-white text-sm font-semibold">Duplicar dia</Text>
            </TouchableOpacity>
          )}
          <View className="h-[1px] bg-forge-border mx-3 my-0.5" />
          {onDelete && (
            <TouchableOpacity className="flex-row items-center px-4 py-3.5 gap-3" onPress={onDelete}>
              <Trash2 size={16} color="#EF4444" />
              <Text className="text-red-400 text-sm font-semibold">Excluir dia</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
