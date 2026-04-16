import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, ChevronRight, Dumbbell, Zap } from 'lucide-react-native';

const featuredPlan = {
  title: 'Hipertrofia Elite',
  duration: '12 Semanas',
  frequency: '5 Dias/Semana',
  image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000',
};

const basePlans = [
  {
    id: 'plan_ppl',
    name: 'PPL (Push/Pull/Legs)',
    focus: 'VOLUME MODERADO',
    duration: '8 Semanas',
    frequency: '6 Dias/Semana',
    muscles: [
      { name: 'PEITO/OMBRO', pct: 40, color: '#A0C4FF' },
      { name: 'COSTAS', pct: 35, color: '#4ADE80' },
      { name: 'PERNAS', pct: 25, color: '#FFA07A' },
    ],
  },
  {
    id: 'plan_sl',
    name: 'Stronglifts 5×5',
    focus: 'FOCO EM FORÇA',
    duration: 'Contínuo',
    frequency: '3 Dias/Semana',
    muscles: [
      { name: 'INFERIOR', pct: 60, color: '#A0C4FF' },
      { name: 'EMPURRAR', pct: 25, color: '#4ADE80' },
      { name: 'PUXAR', pct: 15, color: '#FFA07A' },
    ],
  },
];

const userPlans = [
  { id: 'uplan_1', name: 'Cutting Verão 2024', sub: 'Criado há 2 semanas • 4 treinos ativos', freq: '5x' },
  { id: 'uplan_2', name: 'Manutenção Off-Season', sub: 'Arquivado em Jan/2024', freq: '4x' },
];

export default function PlanosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BODY FORGE</Text>
          <View style={styles.avatarPlaceholder}>
            <View style={{ width: 32, height: 32, backgroundColor: '#333', borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: '#FAD6B1', marginTop: 8, marginHorizontal: 6, borderTopLeftRadius: 10, borderTopRightRadius: 10 }} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>EXPLORAR PROGRAMAS</Text>
        <Text style={styles.pageTitle}>Planos</Text>

        <Text style={styles.sectionTitle}>EM DESTAQUE</Text>
        <View style={styles.featuredCard}>
          <Image
            source={{ uri: featuredPlan.image }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredOverlay}>
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle}>{featuredPlan.title}</Text>
              <Text style={styles.featuredSub}>
                {featuredPlan.duration} • {featuredPlan.frequency}
              </Text>
            </View>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>COMEÇAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PROGRAMAS BASE</Text>
        {basePlans.map((plan) => (
          <TouchableOpacity key={plan.id} style={styles.basePlanCard} activeOpacity={0.7}>
            <View style={styles.basePlanHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.basePlanName}>{plan.name}</Text>
                <Text style={styles.basePlanFocus}>{plan.focus}</Text>
              </View>
              <Zap size={20} color="#A0C4FF" />
            </View>

            <View style={styles.muscleBarRow}>
              {plan.muscles.map((m, i) => (
                <View key={i} style={styles.muscleTag}>
                  <View style={[styles.muscleDot, { backgroundColor: m.color }]} />
                  <Text style={styles.muscleTagText}>{m.name}</Text>
                  <Text style={styles.muscleTagPct}>{m.pct}%</Text>
                </View>
              ))}
            </View>
            <View style={styles.muscleBarContainer}>
              {plan.muscles.map((m, i) => (
                <View
                  key={i}
                  style={[
                    styles.muscleBarSegment,
                    { flex: m.pct, backgroundColor: m.color },
                    i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                    i === plan.muscles.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
                  ]}
                />
              ))}
            </View>

            <View style={styles.basePlanFooter}>
              <Text style={styles.basePlanMeta}>{plan.duration}</Text>
              <Text style={styles.basePlanMeta}>📅 {plan.frequency}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>MEUS PLANOS</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {userPlans.map((plan) => (
          <TouchableOpacity key={plan.id} style={styles.userPlanCard} activeOpacity={0.7}>
            <View style={styles.userPlanDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.userPlanName}>{plan.name}</Text>
              <Text style={styles.userPlanSub}>{plan.sub}</Text>
            </View>
            <View style={styles.userPlanFreq}>
              <Text style={styles.freqLabel}>FREQ</Text>
              <Text style={styles.freqValue}>{plan.freq}</Text>
            </View>
            <ChevronRight size={18} color="#5F6368" />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>EXERCÍCIOS</Text>
        <TouchableOpacity
          style={styles.exercisesButton}
          activeOpacity={0.7}
          onPress={() => router.push('/exercises' as any)}
        >
          <Dumbbell size={20} color="#A0C4FF" />
          <Text style={styles.exercisesButtonText}>VER TODOS OS EXERCÍCIOS</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181C',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2C35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#A0C4FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  pageTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  seeAllText: {
    color: '#A0C4FF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },

  featuredCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#22242A',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.35,
  },
  featuredOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  featuredSub: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#A0C4FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#16181C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  basePlanCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  basePlanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  basePlanName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  basePlanFocus: {
    color: '#888',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  muscleBarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  muscleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  muscleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  muscleTagText: {
    color: '#CCC',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  muscleTagPct: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
  },
  muscleBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    gap: 2,
  },
  muscleBarSegment: {
    height: 6,
  },
  basePlanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  basePlanMeta: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },

  userPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  userPlanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A0C4FF',
  },
  userPlanName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  userPlanSub: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
  },
  userPlanFreq: {
    alignItems: 'center',
    marginRight: 4,
  },
  freqLabel: {
    color: '#5F6368',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  freqValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },

  exercisesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A2D35',
  },
  exercisesButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
