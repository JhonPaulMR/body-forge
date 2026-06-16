import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AlertModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
}

export function AlertModal({ visible, type, title, message, onClose, confirmText = 'OK' }: AlertModalProps) {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle-outline' as const, color: '#4ADE80', bg: 'bg-[#4ADE80]/10' };
      case 'error':
        return { name: 'close-circle-outline' as const, color: '#FF6B6B', bg: 'bg-[#FF6B6B]/10' };
      case 'info':
        return { name: 'information-circle-outline' as const, color: '#A0C4FF', bg: 'bg-[#A0C4FF]/10' };
      default:
        return { name: 'information-circle-outline' as const, color: '#A0C4FF', bg: 'bg-[#A0C4FF]/10' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <View className="bg-forge-surface w-full rounded-3xl p-6 border border-forge-border items-center">
          <View className={`w-16 h-16 ${iconConfig.bg} rounded-full items-center justify-center mb-4`}>
            <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
          </View>
          <Text className="text-white text-xl font-black text-center mb-2">{title}</Text>
          <Text className="text-forge-text-secondary text-center leading-5 mb-6">
            {message}
          </Text>
          <TouchableOpacity 
            className="w-full py-4 bg-forge-bg rounded-xl border border-forge-border items-center active:bg-forge-border"
            onPress={onClose}
          >
            <Text className="text-white font-bold">{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
