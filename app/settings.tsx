import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { db } from '@/database/schema';
import { useSettingsStore } from '@/hooks/useSettingsStore';
import { createFullBackup, restoreFullBackup } from '@/services/backupService';
import { exportToCsv, importGymDayCsv } from '@/services/csvService';

import { AlertModal } from '@/components/ui/AlertModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { WorkoutPreferences } from '@/components/settings/WorkoutPreferences';
import { AppPreferences } from '@/components/settings/AppPreferences';
import { NotificationPreferences } from '@/components/settings/NotificationPreferences';
import { DataManagement } from '@/components/settings/DataManagement';

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [clearTimer, setClearTimer] = useState(5);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean, type: 'success' | 'error' | 'info', title: string, message: string }>({
    visible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showClearModal && clearTimer > 0) {
      interval = setInterval(() => {
        setClearTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showClearModal, clearTimer]);

  const handleExport = async () => {
    setIsLoading(true);
    const res = await exportToCsv();
    setIsLoading(false);
    if (!res.success) {
      showAlert('error', 'Erro', res.message || 'Falha ao exportar os dados.');
    } else {
      showAlert('success', 'Sucesso', 'Seus dados foram exportados com sucesso!');
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    const res = await importGymDayCsv();
    setIsLoading(false);
    if (res.success) {
      showAlert('success', 'Sucesso', res.message);
    } else {
      showAlert('error', 'Erro', res.message);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    const res = await createFullBackup();
    setIsLoading(false);
    if (res.success) {
      showAlert('success', 'Sucesso', res.message);
    } else {
      showAlert('error', 'Erro', res.message);
    }
  };

  const handleRestoreBackupRequest = () => {
    setShowRestoreModal(true);
  };

  const executeRestoreData = async () => {
    setShowRestoreModal(false);
    setIsLoading(true);
    const res = await restoreFullBackup();
    setIsLoading(false);
    if (res.success) {
      showAlert('success', 'Backup Restaurado', res.message);
    } else {
      showAlert('error', 'Erro na Restauração', res.message);
    }
  };

  const handleClearCache = () => {
    setClearTimer(5);
    setShowClearModal(true);
  };

  const executeClearData = () => {
    try {
      db.withTransactionSync(() => {
        db.runSync('DELETE FROM sets');
        db.runSync('DELETE FROM session_exercises');
        db.runSync('DELETE FROM sessions');
        db.runSync('DELETE FROM routine_exercises');
        db.runSync('DELETE FROM routine_days');
        db.runSync('DELETE FROM routines');
        db.runSync('DELETE FROM exercise_media');
        db.runSync('DELETE FROM exercise_notes');
        db.runSync('DELETE FROM body_metrics');
        db.runSync('DELETE FROM reminders');
        db.runSync('DELETE FROM exercises WHERE is_custom = 1');
      });
      setShowClearModal(false);
      showAlert('success', 'Sucesso', 'Todos os seus dados foram apagados.');
    } catch (error) {
      showAlert('error', 'Erro', 'Ocorreu um erro ao limpar os dados.');
    }
  };

  const renderSectionHeader = (title: string, iconName: keyof typeof Ionicons.glyphMap) => (
    <View className="flex-row items-center mb-3 mt-6">
      <Ionicons name={iconName} size={20} color="#A0C4FF" />
      <Text className="text-white text-lg font-bold ml-2">{title}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-forge-bg">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View className="flex-row items-center py-4 px-5 border-b border-forge-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Configurações</Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>

        {renderSectionHeader('Preferências de Treino', 'barbell-outline')}
        <WorkoutPreferences
          defaultRestTime={settings.defaultRestTime}
          setDefaultRestTime={settings.setDefaultRestTime}
          defaultSets={settings.defaultSets}
          setDefaultSets={settings.setDefaultSets}
          weightIncrement={settings.weightIncrement}
          setWeightIncrement={settings.setWeightIncrement}
          weightUnit={settings.weightUnit}
        />

        {renderSectionHeader('Aplicativo', 'phone-portrait-outline')}
        <AppPreferences
          weightUnit={settings.weightUnit}
          setWeightUnit={settings.setWeightUnit}
          measurementUnit={settings.measurementUnit}
          setMeasurementUnit={settings.setMeasurementUnit}
        />

        {renderSectionHeader('Notificações', 'notifications-outline')}
        <NotificationPreferences
          restTimerEnabled={settings.restTimerEnabled}
          toggleRestTimerEnabled={settings.toggleRestTimerEnabled}
          restTimerVibration={settings.restTimerVibration}
          toggleRestTimerVibration={settings.toggleRestTimerVibration}
          restTimerSound={settings.restTimerSound}
          toggleRestTimerSound={settings.toggleRestTimerSound}
          dailyReminders={settings.dailyReminders}
          toggleDailyReminders={settings.toggleDailyReminders}
        />

        {renderSectionHeader('Gerenciamento de Dados', 'server-outline')}
        <DataManagement
          isLoading={isLoading}
          onExport={handleExport}
          onImport={handleImport}
          onCreateBackup={handleCreateBackup}
          onRestoreBackup={handleRestoreBackupRequest}
          onClearData={handleClearCache}
        />
      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={showClearModal}
        title="Apagar Todos os Dados?"
        description={
          <>
            <Text className="text-forge-text-secondary text-center leading-5 mb-4">
              Esta ação é <Text className="text-[#FF6B6B] font-bold">IRREVERSÍVEL</Text>. Todos os seus treinos, rotinas customizadas, histórico e estatísticas serão permanentemente deletados do aplicativo.
            </Text>
            <View className="bg-forge-bg w-full rounded-xl p-4 border border-forge-border">
              <Text className="text-forge-text-secondary text-sm text-center">
                Recomendamos que você crie um <Text className="text-white font-bold">backup COMPLETO</Text> antes de prosseguir.
              </Text>
            </View>
          </>
        }
        iconName="alert-circle-outline"
        iconColor="#FF6B6B"
        iconBgColorClass="bg-red-500/10"
        confirmText={clearTimer > 0 ? `AGUARDE (${clearTimer}s)` : "APAGAR TUDO"}
        confirmButtonClass={clearTimer > 0 ? 'bg-forge-border' : 'bg-[#FF6B6B]'}
        confirmTextClass={clearTimer > 0 ? 'text-forge-muted' : 'text-white'}
        confirmDisabled={clearTimer > 0}
        onConfirm={executeClearData}
        onCancel={() => setShowClearModal(false)}
      />

      <ConfirmationModal
        visible={showRestoreModal}
        title="Restaurar Backup?"
        description={
          <Text className="text-forge-text-secondary text-center leading-5 mb-4">
            O arquivo de backup salvo será restaurado no seu dispositivo. Caso você tenha criado novos treinos que não estejam no backup, eles <Text className="text-white font-bold">NÃO</Text> serão apagados. Os dados serão mesclados.
          </Text>
        }
        iconName="refresh-circle-outline"
        iconColor="#FBBF24"
        iconBgColorClass="bg-yellow-500/10"
        confirmText="Restaurar"
        confirmButtonClass="bg-[#FBBF24]"
        confirmTextClass="text-[#2D3038]"
        onConfirm={executeRestoreData}
        onCancel={() => setShowRestoreModal(false)}
      />

      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
