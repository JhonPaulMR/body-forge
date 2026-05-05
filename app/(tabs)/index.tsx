import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Play, Plus, Droplet, Utensils } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <View className="flex-row items-center justify-between mb-7">
          <TouchableOpacity>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-black tracking-wide">BODY FORGE</Text>
          <View className="w-9 h-9 rounded-full bg-forge-border justify-center items-center">
             <View className="w-8 h-8 bg-forge-avatar rounded-2xl overflow-hidden">
               <View className="flex-1 bg-forge-skin mt-2 mx-1.5 rounded-t-[10px]" />
             </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-forge-text-tertiary text-[13px] font-semibold tracking-wide">JUNHO 2024</Text>
          <View className="flex-row items-center justify-between mt-1.5 mb-4">
            <Text className="text-forge-orange text-[11px] font-bold tracking-tight">2/5 DIAS CONCLUÍDOS</Text>
            <View className="w-[60px] h-1 bg-forge-border rounded-sm">
              <View className="w-6 h-1 bg-forge-green rounded-sm" />
            </View>
          </View>

          <View className="flex-row justify-between">
            {['SEG\n17', 'TER\n18', 'QUA\n19', 'QUI\n20', 'SEX\n21', 'SÁB\n22', 'DOM\n23'].map((day, i) => {
              const acts = day.split('\n');
              const isToday = acts[1] === '19';
              return (
                <View key={i} className={`py-2.5 px-3 rounded-lg items-center ${isToday ? 'bg-forge-accent' : 'bg-[#1A1C23]'}`}>
                  <Text className={`text-[11px] mb-1 font-semibold ${isToday ? 'text-forge-bg' : 'text-forge-muted'}`}>{acts[0]}</Text>
                  <Text className={`text-base font-bold ${isToday ? 'text-forge-bg' : 'text-forge-text-secondary'}`}>{acts[1]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-4">SESSÕES DE HOJE</Text>
        
        <View className="h-[120px] rounded-2xl overflow-hidden mb-4 bg-forge-surface-hover">
           <Image
             source={{ uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000' }}
             className="w-full h-full absolute opacity-40"
           />
           <View className="flex-1 p-4 flex-row justify-between items-end" style={{ backgroundColor: 'rgba(26,28,35,0.4)' }}>
             <View>
               <Text className="text-forge-accent text-[10px] font-bold tracking-wide mb-1">HIPERTROFIA</Text>
               <Text className="text-white text-xl font-black mb-1">TREINO ABC</Text>
               <Text className="text-forge-text-secondary text-[11px]">⏱ 45 min   🔥 320 kcal</Text>
             </View>
             <TouchableOpacity className="w-10 h-10 rounded-xl bg-forge-accent justify-center items-center">
               <Play size={20} color="#1A1C23" fill="#1A1C23" />
             </TouchableOpacity>
           </View>
        </View>

        <View className="h-[120px] rounded-2xl overflow-hidden mb-4 bg-forge-surface-hover">
           <Image
             source={{ uri: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000' }}
             className="w-full h-full absolute opacity-40"
           />
           <View className="flex-1 p-4 flex-row justify-between items-end" style={{ backgroundColor: 'rgba(26,28,35,0.7)' }}>
             <View>
               <Text className="text-forge-orange text-[10px] font-bold tracking-wide mb-1">CARDIO INTENSITY</Text>
               <Text className="text-white text-xl font-black mb-1">TREINO ABC 2</Text>
               <Text className="text-forge-text-secondary text-[11px]">⏱ 60 min   🔥 510 kcal</Text>
             </View>
             <TouchableOpacity className="w-10 h-10 rounded-xl bg-forge-border-light justify-center items-center">
               <Plus size={20} color="#FFF" />
             </TouchableOpacity>
           </View>
        </View>

        <View className="bg-forge-surface rounded-2xl p-4 mb-4 mt-4">
          <View className="flex-row justify-between">
            <Text className="text-white text-[11px] font-bold tracking-wide">REGISTRO DE ATIVIDADE</Text>
            <Text className="text-forge-muted font-bold">...</Text>
          </View>
          
          <View className="flex-row justify-around items-end h-[90px] mt-4 px-5">
             <View className="w-8 rounded-t" style={{ height: 60, backgroundColor: '#A0C4FF' }} />
             <View className="w-8 rounded-t" style={{ height: 35, backgroundColor: '#4ADE80' }} />
             <View className="w-8 rounded-t" style={{ height: 70, backgroundColor: '#FFA07A' }} />
          </View>
        </View>

        <View className="flex-row justify-between mb-6">
           <View className="w-[48%] bg-forge-surface rounded-2xl p-4">
             <Text className="text-forge-muted text-[11px] font-bold">PESO</Text>
             <View className="flex-row items-baseline mt-3">
               <Text className="text-white text-[26px] font-bold">84.2</Text>
               <Text className="text-forge-muted text-sm font-bold"> KG</Text>
             </View>
             <Text className="text-forge-green text-[10px] font-bold mt-3">📉 -0.5kg esta semana</Text>
           </View>

           <View className="w-[48%] bg-forge-surface rounded-2xl p-4">
             <Text className="text-forge-muted text-[11px] font-bold">IMC</Text>
             <Text className="text-white text-[26px] font-bold mt-3">23.8</Text>
             <View className="w-full h-1 bg-forge-border-light rounded-sm mt-4 mb-2">
                <View className="w-[40%] h-1 bg-forge-accent rounded-sm" />
             </View>
             <Text className="text-forge-text-secondary text-[10px]">Faixa Saudável</Text>
           </View>
        </View>

        <Text className="text-forge-muted text-[11px] font-bold tracking-wide mb-4">LEMBRETES</Text>
        <View className="bg-forge-surface rounded-2xl p-4">
           <View className="flex-row items-center py-3">
             <Droplet size={18} color="#A0C4FF" />
             <View className="flex-1 ml-4">
                <Text className="text-white text-[13px] font-semibold mb-1">Meta de Água</Text>
                <Text className="text-forge-muted text-[11px]">Próximo: 15:30</Text>
             </View>
             <Text className="text-white text-[13px] font-bold">2.1 / 3.0L</Text>
           </View>
           <View className="flex-row items-center py-3">
             <Utensils size={18} color="#FFA07A" />
             <View className="flex-1 ml-4">
                <Text className="text-white text-[13px] font-semibold mb-1">Suplementação</Text>
                <Text className="text-forge-muted text-[11px]">Pós-treino</Text>
             </View>
             <View className="w-5 h-5 rounded-full bg-forge-green justify-center items-center">
               <Text className="text-forge-bg text-[10px] font-bold">✓</Text>
             </View>
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
