import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, ChevronDown } from 'lucide-react-native';

interface BodyMetricsProps {
  currentWeight: number | null;
  weightDiff: number | null;
  imc: number | null;
}

export function BodyMetrics({ currentWeight, weightDiff, imc }: BodyMetricsProps) {
  const getImcLabel = (val: number) => {
    if (val < 18.5) return { label: 'Abaixo do Peso', color: '#A0C4FF', p: 20 };
    if (val < 25) return { label: 'Faixa Saudável', color: '#4ADE80', p: 40 };
    if (val < 30) return { label: 'Sobrepeso', color: '#FFA07A', p: 60 };
    return { label: 'Obesidade', color: '#EF4444', p: 85 };
  };

  return (
    <View className="flex-row justify-between mb-6">
       <View className="w-[48%] bg-forge-surface rounded-2xl p-4">
         <Text className="text-forge-muted text-[11px] font-bold">PESO</Text>
         {currentWeight ? (
           <>
             <View className="flex-row items-baseline mt-3">
               <Text className="text-white text-[26px] font-bold">{currentWeight.toFixed(1)}</Text>
               <Text className="text-forge-muted text-sm font-bold"> KG</Text>
             </View>
             {weightDiff !== null && weightDiff !== 0 && (
               <View className="flex-row items-center gap-1 mt-3">
                {weightDiff < 0 ? <ChevronDown size={12} color="#4ADE80" /> : <TrendingUp size={12} color="#FFA07A" />}
                <Text className={`text-[10px] font-bold ${weightDiff < 0 ? 'text-forge-green' : 'text-forge-orange'}`}>
                  {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}kg
                </Text>
              </View>
             )}
           </>
         ) : (
            <Text className="text-forge-muted text-[11px] mt-4">S/ Registro</Text>
         )}
       </View>

       <View className="w-[48%] bg-forge-surface rounded-2xl p-4">
         <Text className="text-forge-muted text-[11px] font-bold">IMC</Text>
         {imc ? (
           <>
             <Text className="text-white text-[26px] font-bold mt-3">{imc.toFixed(1)}</Text>
             <View className="w-full h-1 bg-forge-border-light rounded-sm mt-4 mb-2">
                <View className="h-1 rounded-sm" style={{ width: `${getImcLabel(imc).p}%`, backgroundColor: getImcLabel(imc).color }} />
             </View>
             <Text className="text-[10px] font-semibold" style={{ color: getImcLabel(imc).color }}>{getImcLabel(imc).label}</Text>
           </>
         ) : (
            <Text className="text-forge-muted text-[11px] mt-4">Cadastre Altura nas Estatísticas</Text>
         )}
       </View>
    </View>
  );
}
