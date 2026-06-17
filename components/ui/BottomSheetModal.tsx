import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';

interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColorClass: string;
  confirmText: string;
  cancelText?: string;
  confirmButtonClass: string;
  confirmTextClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BottomSheetModal({
  visible,
  title,
  description,
  icon,
  iconBgColorClass,
  confirmText,
  cancelText = 'CANCELAR',
  confirmButtonClass,
  confirmTextClass,
  onConfirm,
  onCancel,
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onCancel}>
        <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
          <View className="items-center px-4 py-2">
            <View className={`w-16 h-16 rounded-full ${iconBgColorClass} justify-center items-center mb-5`}>
              {icon}
            </View>
            <Text className="text-white text-xl font-black mb-2 text-center">{title}</Text>
            <Text className="text-forge-muted text-sm text-center mb-8 leading-5">
              {description}
            </Text>
            
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity 
                className="flex-1 py-4 rounded-xl bg-forge-bg border border-forge-border items-center"
                onPress={onCancel}
              >
                <Text className="text-white text-sm font-bold tracking-wide">{cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-1 py-4 rounded-xl items-center ${confirmButtonClass}`}
                onPress={onConfirm}
              >
                <Text className={`text-sm font-bold tracking-wide ${confirmTextClass}`}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
