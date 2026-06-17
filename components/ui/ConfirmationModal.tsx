import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: React.ReactNode;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColorClass: string;
  confirmText: string;
  cancelText?: string;
  confirmButtonClass: string;
  confirmTextClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

export function ConfirmationModal({
  visible,
  title,
  description,
  iconName,
  iconColor,
  iconBgColorClass,
  confirmText,
  cancelText = 'Cancelar',
  confirmButtonClass,
  confirmTextClass,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  children
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <View className="bg-forge-surface w-full rounded-3xl p-6 border border-forge-border">
          <View className="items-center mb-4">
            <View className={`w-16 h-16 ${iconBgColorClass} rounded-full items-center justify-center mb-3`}>
              <Ionicons name={iconName} size={32} color={iconColor} />
            </View>
            <Text className="text-white text-xl font-black text-center mb-2">{title}</Text>
            {typeof description === 'string' ? (
              <Text className="text-forge-text-secondary text-center leading-5 mb-4">{description}</Text>
            ) : (
              <View className="mb-4">{description}</View>
            )}
            {children}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 py-4 bg-forge-bg rounded-xl border border-forge-border items-center"
              onPress={onCancel}
            >
              <Text className="text-white font-bold">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl items-center justify-center ${confirmDisabled ? 'opacity-50' : ''} ${confirmButtonClass}`}
              disabled={confirmDisabled}
              onPress={onConfirm}
            >
              <Text className={`font-bold ${confirmTextClass}`}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
