import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

interface MonthCalendarProps {
  currentDate: Date;
  onChangeMonth: (amount: number) => void;
  markedDates: string[]; // Formato YYYY-MM-DD
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export function MonthCalendar({ currentDate, onChangeMonth, markedDates }: MonthCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo

  const daysGrid = useMemo(() => {
    const grid = [];
    let currentDay = 1;
    
    // Até 6 semanas por mês
    for (let row = 0; row < 6; row++) {
      const week = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDayOfWeek) {
          week.push(null);
        } else if (currentDay <= daysInMonth) {
          week.push(currentDay);
          currentDay++;
        } else {
          week.push(null);
        }
      }
      grid.push(week);
      if (currentDay > daysInMonth) break;
    }
    return grid;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View className="bg-forge-surface rounded-2xl p-4 w-full border border-forge-border">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={() => onChangeMonth(-1)} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color="#5F6368" />
        </TouchableOpacity>
        
        <Text className="text-white text-base font-bold">
          {MONTH_NAMES[month]} {year}
        </Text>
        
        <TouchableOpacity onPress={() => onChangeMonth(1)} className="p-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronRight size={20} color="#5F6368" />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View className="flex-row justify-between w-full mb-3 px-1">
        {WEEK_DAYS.map((day, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest">{day}</Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View className="w-full px-1">
        {daysGrid.map((week, rIndex) => (
          <View key={rIndex} className="flex-row justify-between w-full mb-1">
            {week.map((day, cIndex) => {
              if (day === null) {
                return <View key={cIndex} className="flex-1 items-center justify-center py-2 h-10" />;
              }

              const mStr = (month + 1).toString().padStart(2, '0');
              const dStr = day.toString().padStart(2, '0');
              const dateStr = `${year}-${mStr}-${dStr}`;

              const isToday = dateStr === todayStr;
              const hasWorkout = markedDates.includes(dateStr);

              return (
                <View key={cIndex} className="flex-1 items-center justify-center py-1">
                  <View 
                    className="w-8 h-8 items-center justify-center"
                    style={{ 
                      borderRadius: 12, 
                      backgroundColor: isToday ? '#2D3038' : 'transparent' 
                    }}
                  >
                    <Text className={`text-[13px] font-medium ${isToday ? 'text-[#A0C4FF]' : 'text-forge-text-secondary'}`}>
                      {day}
                    </Text>
                  </View>
                  
                  {/* Green dot container */}
                  <View className="h-1.5 mt-0.5">
                    {hasWorkout && (
                      <View className="w-1 h-1 rounded-full bg-forge-green" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
