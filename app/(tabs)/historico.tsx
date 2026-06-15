import { AppHeader } from '@/components/AppHeader';
import { MonthCalendar } from '@/components/history/MonthCalendar';
import { SessionHistoryItem } from '@/components/history/SessionHistoryItem';
import { HistorySession, SessionRepository } from '@/database/repositories/SessionRepository';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoricoTab() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [sessions, setSessions] = useState<HistorySession[]>([]);

  const loadHistoryData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    try {
      const dates = SessionRepository.getHistoryDates(year, month);
      setMarkedDates(dates);

      const monthSessions = SessionRepository.getSessionsForMonth(year, month);
      setSessions(monthSessions);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistoryData(currentDate);
    }, [currentDate])
  );

  const handleChangeMonth = (amount: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1);
    setCurrentDate(newDate);
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <AppHeader />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="text-white text-3xl font-black tracking-tight mb-1">
          Histórico
        </Text>
        <Text className="text-forge-muted text-sm font-medium mb-6">
          Reveja seu progresso
        </Text>

        <View className="mb-8">
          <MonthCalendar
            currentDate={currentDate}
            onChangeMonth={handleChangeMonth}
            markedDates={markedDates}
          />
        </View>

        <View>
          {sessions.length > 0 ? (
            sessions.map((session, index) => (
              <SessionHistoryItem
                key={session.id}
                session={session}
                index={index}
                onPress={() => router.push(`/workout/history/${session.id}`)}
              />
            ))
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-forge-muted text-base font-medium">Nenhum treino neste mês.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
