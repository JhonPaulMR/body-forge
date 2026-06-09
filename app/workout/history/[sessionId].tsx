import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MessageSquare, Dumbbell, List } from 'lucide-react-native';
import { db } from '@/database/schema';

import { historyService, HistorySession } from '@/services/historyService';
import { HistoryExerciseList } from '@/components/history/HistoryExerciseList';
import { useWorkoutStore } from '@/hooks/useWorkoutStore';

export default function SessionDetailsScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<HistorySession | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionId) {
      const data = historyService.getSessionDetails(sessionId);
      if (data) {
        setSession(data);
        setNotes(data.session_notes || '');
      }
    }
  }, [sessionId]);

  // Salvar no banco toda vez que o componente for desmontado (se houver alteração pendente)
  const latestNotes = useRef(notes);
  useEffect(() => {
    latestNotes.current = notes;
  }, [notes]);

  useEffect(() => {
    return () => {
      if (sessionId) {
        historyService.updateSessionNotes(sessionId, latestNotes.current);
      }
    };
  }, [sessionId]);

  const handleNotesChange = (text: string) => {
    setNotes(text);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (sessionId) {
        historyService.updateSessionNotes(sessionId, text);
      }
    }, 500);
  };

  const handlePerformAgain = () => {
    if (!sessionId) return;

    const newSessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    
    try {
      db.runSync(
        'INSERT INTO sessions (id, user_id, routine_day_id, start_time, total_volume_kg) VALUES (?, ?, ?, ?, ?)',
        [newSessionId, 'user_1', null, new Date().toISOString(), 0]
      );

      const exercises = historyService.getPerformAgainExercises(sessionId);
      
      const { startFreeWorkout, addExercisesToActive } = useWorkoutStore.getState();
      startFreeWorkout(newSessionId);
      addExercisesToActive(exercises);

      router.replace('/(tabs)/treino');
    } catch (e) {
      console.error('Failed to start perform again', e);
    }
  };

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-forge-bg items-center justify-center">
        <Text className="text-white">Carregando...</Text>
      </SafeAreaView>
    );
  }

  const dateObj = new Date(session.start_time);
  const weekdaysPt = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const monthsPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dateStrPt = `${weekdaysPt[dateObj.getDay()]}, ${dateObj.getDate()} de ${monthsPt[dateObj.getMonth()]}`;

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center py-4 px-5 border-b border-forge-border/30">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <ArrowLeft size={24} color="#A0C4FF" />
        </TouchableOpacity>
        <Text className="text-white text-sm font-bold tracking-widest uppercase">DETALHES DA SESSÃO</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        <Text className="text-white text-4xl font-black mb-6 tracking-tight">{session.name}</Text>

        {/* Date Container */}
        <View className="bg-forge-surface rounded-2xl p-4 flex-row items-center mb-6 border border-forge-border">
          <Clock size={20} color="#9CA3AF" />
          <Text className="text-white text-base font-medium ml-3">{dateStrPt}</Text>
        </View>

        {/* Notes Container */}
        <Text className="text-[#A0C4FF] text-sm font-bold tracking-wide mb-3">Editar nome e data</Text>
        <View className="bg-forge-surface rounded-2xl p-4 mb-6 min-h-[60px] border border-forge-border">
          <View className="flex-row items-start">
            <MessageSquare size={20} color="#9CA3AF" className="mt-0.5" />
            <TextInput
              className="flex-1 ml-3 text-white text-sm"
              placeholder="Toque aqui para adicionar anotações"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={handleNotesChange}
              onFocus={() => setIsEditingNotes(true)}
              onBlur={() => setIsEditingNotes(false)}
              multiline
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row bg-forge-surface rounded-[24px] p-5 mb-8 justify-between border border-forge-border">
          <View className="items-center flex-1 border-r border-forge-border/40">
            <Clock size={24} color="#FCA5A5" className="mb-2" />
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest uppercase mb-1">Duração</Text>
            <Text className="text-white text-xl font-black">{formatDuration(session.duration_seconds)}</Text>
          </View>
          
          <View className="items-center flex-1 border-r border-forge-border/40">
            <List size={24} color="#6EE7B7" className="mb-2" />
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest uppercase mb-1">Séries</Text>
            <Text className="text-white text-xl font-black">{session.total_sets}</Text>
          </View>

          <View className="items-center flex-1">
            <Dumbbell size={24} color="#A0C4FF" className="mb-2" />
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest uppercase mb-1">Volume (KG)</Text>
            <Text className="text-white text-xl font-black">{session.total_volume_kg.toLocaleString('pt-BR')}</Text>
          </View>
        </View>

        {/* Exercise List */}
        {session.exercises && <HistoryExerciseList exercises={session.exercises} />}

        {/* Perform Again Button */}
        <TouchableOpacity 
          className="w-full bg-[#82A8F5] rounded-2xl py-4 items-center justify-center mt-6 mb-12"
          onPress={handlePerformAgain}
        >
          <Text className="text-forge-bg text-base font-black tracking-wide">Realizar novamente</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
