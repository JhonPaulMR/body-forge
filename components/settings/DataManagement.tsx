import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DataManagementProps {
  isLoading: boolean;
  onExport: () => void;
  onImport: () => void;
  onCreateBackup: () => void;
  onRestoreBackup: () => void;
  onClearData: () => void;
}

export function DataManagement({
  isLoading,
  onExport,
  onImport,
  onCreateBackup,
  onRestoreBackup,
  onClearData
}: DataManagementProps) {
  return (
    <View className="bg-forge-surface rounded-2xl overflow-hidden border border-forge-border">
      <TouchableOpacity 
        onPress={onExport}
        disabled={isLoading}
        className="flex-row items-center p-4 border-b border-forge-border active:bg-forge-bg"
      >
        <Ionicons name="download-outline" size={20} color="#A0C4FF" />
        <Text className="text-white font-medium text-base ml-3 flex-1">Exportar Histórico (CSV)</Text>
        {isLoading && <ActivityIndicator color="#A0C4FF" size="small" />}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onImport}
        disabled={isLoading}
        className="flex-row items-center p-4 border-b border-forge-border active:bg-forge-bg"
      >
        <Ionicons name="cloud-upload-outline" size={20} color="#A0C4FF" />
        <Text className="text-white font-medium text-base ml-3 flex-1">Importar Dados (CSV)</Text>
        {isLoading && <ActivityIndicator color="#A0C4FF" size="small" />}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onCreateBackup}
        disabled={isLoading}
        className="flex-row items-center p-4 border-b border-forge-border active:bg-forge-bg"
      >
        <Ionicons name="save-outline" size={20} color="#4ADE80" />
        <Text className="text-white font-medium text-base ml-3 flex-1">Criar Backup Completo (JSON)</Text>
        {isLoading && <ActivityIndicator color="#4ADE80" size="small" />}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onRestoreBackup}
        disabled={isLoading}
        className="flex-row items-center p-4 border-b border-forge-border active:bg-forge-bg"
      >
        <Ionicons name="refresh-circle-outline" size={20} color="#FBBF24" />
        <Text className="text-white font-medium text-base ml-3 flex-1">Restaurar Backup Completo</Text>
        {isLoading && <ActivityIndicator color="#FBBF24" size="small" />}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={onClearData}
        className="flex-row items-center p-4 active:bg-red-900/20"
      >
        <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        <Text className="text-[#FF6B6B] font-medium text-base ml-3">Apagar Todos os Dados</Text>
      </TouchableOpacity>
    </View>
  );
}
