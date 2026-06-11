import { Feather } from '@expo/vector-icons';
import { Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface MediaOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddMedia: () => void;
  onReplaceMedia?: () => void;
  onDelete?: () => void;
  canReplace: boolean;
  canDelete: boolean;
}

export function MediaOptionsMenu({
  visible,
  onClose,
  onAddMedia,
  onReplaceMedia,
  onDelete,
  canReplace,
  canDelete,
}: MediaOptionsMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleClose = () => {
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={handleClose}>
        <Pressable className="bg-forge-surface rounded-t-3xl px-5 pt-5 pb-10">
          {!showDeleteConfirm ? (
            <>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-white text-base font-extrabold tracking-wide">GERENCIAR MÍDIA</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full bg-forge-border justify-center items-center"
                >
                  <X size={16} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <TouchableOpacity
                className="flex-row items-center py-4 border-b border-forge-border"
                onPress={() => { onAddMedia(); handleClose(); }}
              >
                <View className="w-10 h-10 rounded-xl bg-forge-accent/15 justify-center items-center mr-4">
                  <Feather name="plus-circle" size={18} color="#A0C4FF" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold">Adicionar Mídia</Text>
                  <Text className="text-forge-muted text-[11px]">Imagem ou vídeo do dispositivo</Text>
                </View>
              </TouchableOpacity>

              {canReplace && (
                <TouchableOpacity
                  className="flex-row items-center py-4 border-b border-forge-border"
                  onPress={() => { onReplaceMedia?.(); handleClose(); }}
                >
                  <View className="w-10 h-10 rounded-xl bg-forge-green/15 justify-center items-center mr-4">
                    <Feather name="refresh-cw" size={18} color="#4ADE80" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-bold">Trocar Mídia</Text>
                    <Text className="text-forge-muted text-[11px]">Substituir a mídia atual</Text>
                  </View>
                </TouchableOpacity>
              )}

              {canDelete && (
                <TouchableOpacity
                  className="flex-row items-center py-4"
                  onPress={() => setShowDeleteConfirm(true)}
                >
                  <View className="w-10 h-10 rounded-xl bg-red-500/15 justify-center items-center mr-4">
                    <Trash2 size={18} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-400 text-sm font-bold">Apagar Mídia</Text>
                    <Text className="text-forge-muted text-[11px]">Remover a mídia selecionada</Text>
                  </View>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="items-center px-4 py-2">
              <View className="w-16 h-16 rounded-full bg-red-500/10 justify-center items-center mb-5">
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-black mb-2 text-center">Apagar Mídia?</Text>
              <Text className="text-forge-muted text-sm text-center mb-8 leading-5">
                Esta ação não pode ser desfeita. A mídia será removida permanentemente deste exercício.
              </Text>
              
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-forge-surface border border-forge-border items-center"
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">CANCELAR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 py-4 rounded-xl bg-red-500 items-center"
                  onPress={handleConfirmDelete}
                >
                  <Text className="text-white text-sm font-bold tracking-wide">APAGAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
