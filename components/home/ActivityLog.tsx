import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Activity, MoreVertical, Dumbbell, Zap } from 'lucide-react-native';
import { ActivityStats, WeeklyMuscleData } from '@/hooks/useHomeData';
import { DonutChart } from '@/components/ui/DonutChart';

interface ActivityLogProps {
  completedDays: number;
  weeklyStats: ActivityStats[];
  weeklyMuscleData?: WeeklyMuscleData[];
}

export function ActivityLog({ completedDays, weeklyStats, weeklyMuscleData = [] }: ActivityLogProps) {
  const [activityViewType, setActivityViewType] = useState<'volume' | 'rpe' | 'muscle'>('volume');
  const [showActivityMenu, setShowActivityMenu] = useState(false);
  const [selectedBarStat, setSelectedBarStat] = useState<ActivityStats | null>(null);

  const getHeatmapColor = (rpe: number) => {
    if (rpe === 0) return '#FCA5A5'; // Salmão padrão caso não haja RPE avaliado ainda
    if (rpe < 7) return '#FCA5A5';
    return '#EF4444'; // Vermelho mais forte
  };

  const dayLabels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

  const renderBarChart = () => {
    return (
      <View>
        <View className="flex-row justify-around items-end h-[100px] mt-4 px-2">
          {weeklyStats.map((stat, i) => {
            let h = 0;
            let c = '#353945';
            
            if (activityViewType === 'volume') {
              const maxVol = Math.max(...weeklyStats.map(s => s.volume), 1);
              h = stat.volume > 0 ? (stat.volume / maxVol) * 80 : 0;
              if (h > 0) h = Math.max(h, 15);
              c = '#A0C4FF';
            } else if (activityViewType === 'rpe') {
              const maxSets = Math.max(...weeklyStats.map(s => s.setsCompleted), 1);
              h = stat.setsCompleted > 0 ? (stat.setsCompleted / maxSets) * 80 : 0;
              if (h > 0) h = Math.max(h, 15);
              c = getHeatmapColor(stat.rpe);
            }

            const isSelected = selectedBarStat?.dateStr === stat.dateStr;

            return (
              <View key={i} className="items-center">
                <TouchableOpacity 
                  className="items-center justify-end" style={{ width: 32, height: 80 }}
                  onPress={() => setSelectedBarStat(stat)}
                >
                  <View className={`w-full rounded-t-md transition-all ${isSelected ? 'opacity-100' : 'opacity-80'}`} style={{ height: h, backgroundColor: c }} />
                </TouchableOpacity>
                <Text className={`text-[10px] font-bold mt-2 ${isSelected ? 'text-white' : 'text-forge-muted'}`}>
                  {dayLabels[i]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Tooltip de Informação */}
        {selectedBarStat && selectedBarStat.setsCompleted > 0 && (
          <View className="bg-forge-surface-hover rounded-xl p-3 mt-6 flex-row items-center gap-3">
            <Activity size={18} color="#A0C4FF" />
            <View className="flex-1">
              <Text className="text-white text-[13px] font-bold capitalize">
                {(() => {
                  const [y, m, d] = selectedBarStat.dateStr.split('-');
                  const localDate = new Date(Number(y), Number(m) - 1, Number(d));
                  return localDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' });
                })()}
              </Text>
              <Text className="text-forge-muted text-[11px] mt-0.5">
                {selectedBarStat.workoutName} • {selectedBarStat.setsCompleted} séries • {selectedBarStat.volume} kg
              </Text>
            </View>
          </View>
        )}
        {selectedBarStat && selectedBarStat.setsCompleted === 0 && (
          <View className="bg-forge-surface-hover rounded-xl p-3 mt-6 items-center">
            <Text className="text-forge-muted text-xs font-semibold">Nenhum treino neste dia</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMuscleChart = () => {
    let totalSets = 0;
    weeklyStats.forEach(s => totalSets += s.setsCompleted);

    return (
      <View className="mt-4">
        <View className="items-center mb-6">
          <DonutChart
            data={weeklyMuscleData}
            size={160}
            strokeWidth={18}
            centerLabel={totalSets.toString()}
            centerSubLabel="SÉRIES"
          />
        </View>

        {/* 2-column list */}
        <View className="flex-row flex-wrap px-2">
          {weeklyMuscleData.map((m, i) => (
            <View key={i} className="w-1/2 flex-row items-center mb-3 pr-2">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: m.color }} />
              <Text className="text-white text-xs font-bold w-8">{m.value}%</Text>
              <Text className="text-forge-muted text-xs font-semibold flex-1" numberOfLines={1}>{m.label}</Text>
            </View>
          ))}
          {weeklyMuscleData.length === 0 && (
            <View className="w-full items-center py-4">
              <Text className="text-forge-muted text-xs font-semibold">Nenhum músculo trabalhado na semana.</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <View className="bg-forge-surface rounded-2xl p-4 mb-4 mt-4 relative">
        <View className="flex-row justify-between items-center z-10">
          <Text className="text-white text-[11px] font-bold tracking-wide">
            REGISTRO DE ATIVIDADE: 
            {activityViewType === 'volume' ? ' VOLUME (KG)' : activityViewType === 'rpe' ? ' CONSISTÊNCIA' : ' MÚSCULOS'}
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
          <>
            {activityViewType === 'muscle' ? renderMuscleChart() : renderBarChart()}
          </>
        )}
      </View>

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
              <Text className={`ml-3 text-sm font-semibold ${activityViewType === 'volume' ? 'text-forge-accent' : 'text-white'}`}>Volume de Carga (KG)</Text>
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
