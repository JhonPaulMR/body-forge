import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { Droplet, Minus, Plus } from 'lucide-react-native';

interface WaterTrackerProps {
  waterIntake: number;
  waterGoal: number;
  updateWater: (amount: number) => void;
  showWaterModal: boolean;
  setShowWaterModal: (val: boolean) => void;
  waterGoalInput: string;
  setWaterGoalInput: (val: string) => void;
  saveWaterGoal: () => void;
  /** null = ainda a verificar; false = módulo indisponível (ex.: Expo Go Android); true = alertas ao bater a meta podem funcionar */
  localNotificationsAvailable?: boolean | null;
}

export function WaterTracker({
  waterIntake,
  waterGoal,
  updateWater,
  showWaterModal,
  setShowWaterModal,
  waterGoalInput,
  setWaterGoalInput,
  saveWaterGoal,
  localNotificationsAvailable,
}: WaterTrackerProps) {
  return (
    <>
      {/* Widget */}
      <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-4 mt-6">LEMBRETES</Text>
      <View className="bg-forge-surface rounded-2xl p-4 mb-10">
         <View className="flex-row items-center py-2">
           <Droplet size={18} color="#A0C4FF" />
           <View className="flex-1 ml-4">
              <Text className="text-white text-[13px] font-semibold mb-1">Meta de Água</Text>
              <Text className="text-forge-muted text-[11px]">Reseta à meia-noite</Text>
           </View>
           
           <View className="flex-row items-center gap-3">
             <TouchableOpacity onPress={() => updateWater(-0.1)} className="w-7 h-7 bg-forge-border rounded-full justify-center items-center">
               <Minus size={14} color="#FFF" />
             </TouchableOpacity>
             
             <TouchableOpacity onPress={() => { setWaterGoalInput(waterGoal.toString()); setShowWaterModal(true); }}>
               <Text className="text-white text-[13px] font-bold">{waterIntake.toFixed(1)} / {waterGoal.toFixed(1)}L</Text>
             </TouchableOpacity>

             <TouchableOpacity onPress={() => updateWater(0.1)} className="w-7 h-7 bg-[#A0C4FF] rounded-full justify-center items-center">
               <Plus size={14} color="#1A1D24" />
             </TouchableOpacity>
           </View>
         </View>
         <View className="w-full h-1.5 bg-forge-border mt-3 rounded-full overflow-hidden">
           <View className="h-full" style={{ width: `${Math.min((waterIntake/waterGoal)*100, 100)}%`, backgroundColor: waterIntake >= waterGoal ? '#4ADE80' : '#A0C4FF' }} />
         </View>
         {/* Notificação indisponível removida a pedido do usuário */}
      </View>

      {/* Modal de Configuração */}
      <Modal visible={showWaterModal} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowWaterModal(false)}>
          <Pressable className="bg-forge-surface rounded-t-3xl p-6 pb-10">
            <Text className="text-white text-xl font-extrabold mb-5">Meta Diária de Água (L)</Text>
            
            <TextInput
              className="bg-forge-accent-bg rounded-xl p-4 text-white text-base font-bold border border-forge-border mb-6"
              placeholder="Ex: 3.0"
              placeholderTextColor="#5F6368"
              keyboardType="decimal-pad"
              value={waterGoalInput}
              onChangeText={setWaterGoalInput}
              autoFocus
            />

            <TouchableOpacity 
              className="bg-forge-accent rounded-2xl py-4 items-center mb-2"
              onPress={saveWaterGoal}
            >
              <Text className="text-forge-bg text-sm font-extrabold">SALVAR META</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4 items-center"
              onPress={() => setShowWaterModal(false)}
            >
              <Text className="text-forge-muted text-[13px] font-bold">CANCELAR</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
