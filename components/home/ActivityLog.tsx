import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Activity, MoreVertical, Dumbbell, Zap } from 'lucide-react-native';
import { ActivityStats } from '@/hooks/useHomeData';

interface ActivityLogProps {
  completedDays: number;
  weeklyStats: ActivityStats[];
}

export function ActivityLog({ completedDays, weeklyStats }: ActivityLogProps) {
  const [activityViewType, setActivityViewType] = useState<'volume' | 'rpe' | 'muscle'>('volume');
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [selectedBarStat, setSelectedBarStat] = useState<ActivityStats | null>(null);

  const getHeatmapColor = (rpe: number) => {
    if (rpe === 0) return '#353945';
    if (rpe < 7) return '#A5C9FF';
    return '#A0C4FF';
  };

  const getMuscleColor = (muscle: string | null) => {
    if (!muscle) return '#353945';
    const lower = muscle.toLowerCase();
    if (lower.includes('peito')) return '#A0C4FF';
    if (lower.includes('costa')) return '#4ADE80';
    if (lower.includes('perna') || lower.includes('quad')) return '#FFA07A';
    if (lower.includes('ombro')) return '#C084FC';
    if (lower.includes('bicep') || lower.includes('tricep')) return '#F472B6';
    return '#888';
  };

  return (
    <>
      {/* Container Principal do Gráfico */}
      <View className="bg-forge-surface rounded-2xl p-4 mb-4 mt-4 relative">
        <View className="flex-row justify-between items-center z-10">
          <Text className="text-white text-[11px] font-bold tracking-wide">
            REGISTRO DE ATIVIDADE: 
            {activityViewType === 'volume' ? ' VOLUME (LBS)' : activityViewType === 'rpe' ? ' INTENSIDADE' : ' MÚSCULOS'}
          </Text>
          <TouchableOpacity onPress={() => setShowActivityMenu(true)}>
            <MoreVertical size={20} color="#5F6368" />
          </TouchableOpacity>
        </View>
        
        {completedDays === 0 ? (
          <View className="items-center justify-center h-[100px] mt-4">
            <Activity size={24} color="#5F6368" className="mb-2" />
            <Text className="text-forge-muted text-sm font-semibold">Sem Registros de Treino</Text>
            <Text className="text-forge-muted-dark text-[11px]">Realize seu primeiro treino da semana</Text>
          </View>
        ) : (
          <View className="flex-row justify-around items-end h-[100px] mt-4 px-2">
            {weeklyStats.map((stat, i) => {
               let h = 0;
               let c = '#353945';
               
               if (activityViewType === 'volume') {
                 const maxVol = Math.max(...weeklyStats.map(s => s.volume), 10000);
                 h = (stat.volume / maxVol) * 80;
                 if (h > 0) h = Math.max(h, 15);
                 c = '#A0C4FF';
               } else if (activityViewType === 'rpe') {
                 h = stat.rpe > 0 ? 30 : 0;
                 c = getHeatmapColor(stat.rpe);
               } else {
                 h = stat.mainMuscle ? 60 : 0;
                 c = getMuscleColor(stat.mainMuscle);
               }

               return (
                 <TouchableOpacity 
                    key={i} 
                    className="items-center justify-end" style={{ width: 32, height: 80 }}
                    onPress={() => setSelectedBarStat(stat)}
                 >
                   <View className="w-full rounded-t-md transition-all" style={{ height: h, backgroundColor: c }} />
                 </TouchableOpacity>
               );
            })}
          </View>
        )}
      </View>

      {/* Tooltip de Informação */}
      {selectedBarStat && selectedBarStat.setsCompleted > 0 && (
        <View className="bg-forge-surface-hover rounded-xl p-3 mb-6 flex-row items-center gap-3">
           <Activity size={18} color="#A0C4FF" />
           <View className="flex-1">
             <Text className="text-white text-[13px] font-bold">
               {new Date(selectedBarStat.dateStr).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}
             </Text>
             <Text className="text-forge-muted text-[11px]">
               {selectedBarStat.workoutName} • {selectedBarStat.setsCompleted} séries • {selectedBarStat.volume} lbs
             </Text>
           </View>
        </View>
      )}

      {/* Modal de Configuração do Gráfico */}
      <Modal visible={showActivityMenu} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-center items-center" onPress={() => setShowActivityMenu(false)}>
          <View className="bg-forge-surface rounded-2xl w-[250px] overflow-hidden py-2">
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest px-5 py-2">VISUALIZAR GRÁFICO</Text>
            
            <TouchableOpacity 
              className={`px-5 py-3.5 flex-row items-center ${activityViewType === 'volume' ? 'bg-forge-accent-bg' : ''}`}
              onPress={() => { setActivityViewType('volume'); setShowActivityMenu(false); }}
            >
              <Dumbbell size={16} color={activityViewType === 'volume' ? '#A0C4FF' : '#5F6368'} />
              <Text className={`ml-3 text-sm font-semibold ${activityViewType === 'volume' ? 'text-forge-accent' : 'text-white'}`}>Volume de Carga (Lbs)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`px-5 py-3.5 flex-row items-center ${activityViewType === 'rpe' ? 'bg-forge-accent-bg' : ''}`}
              onPress={() => { setActivityViewType('rpe'); setShowActivityMenu(false); }}
            >
              <Zap size={16} color={activityViewType === 'rpe' ? '#A0C4FF' : '#5F6368'} />
              <Text className={`ml-3 text-sm font-semibold ${activityViewType === 'rpe' ? 'text-forge-accent' : 'text-white'}`}>Consistência (RPE)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`px-5 py-3.5 flex-row items-center ${activityViewType === 'muscle' ? 'bg-forge-accent-bg' : ''}`}
              onPress={() => { setActivityViewType('muscle'); setShowActivityMenu(false); }}
            >
              <Activity size={16} color={activityViewType === 'muscle' ? '#A0C4FF' : '#5F6368'} />
              <Text className={`ml-3 text-sm font-semibold ${activityViewType === 'muscle' ? 'text-forge-accent' : 'text-white'}`}>Foco Muscular</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
