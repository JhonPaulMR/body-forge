import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Play, Plus, Droplet, Utensils } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Menu size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BODY FORGE</Text>
          <View style={styles.avatarPlaceholder}>
             {/* Simulando o mini avatar do protótipo */}
             <View style={{width: 32, height: 32, backgroundColor: '#333', borderRadius: 16, overflow: 'hidden'}}>
               <View style={{flex: 1, backgroundColor: '#FAD6B1', marginTop: 8, marginHorizontal: 6, borderTopLeftRadius: 10, borderTopRightRadius: 10}} />
             </View>
          </View>
        </View>

        {/* CALENDAR SECTION */}
        <View style={styles.calendarSection}>
          <Text style={styles.monthText}>JUNHO 2024</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>2/5 DIAS CONCLUÍDOS</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
          </View>

          <View style={styles.daysRow}>
            {['SEG\n17', 'TER\n18', 'QUA\n19', 'QUI\n20', 'SEX\n21', 'SÁB\n22', 'DOM\n23'].map((day, i) => {
              const acts = day.split('\n');
              const isToday = acts[1] === '19';
              return (
                <View key={i} style={[styles.dayCard, isToday && styles.dayCardActive]}>
                  <Text style={[styles.dayName, isToday && styles.dayTextActive]}>{acts[0]}</Text>
                  <Text style={[styles.dayNumber, isToday && styles.dayTextActive]}>{acts[1]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* SESSÕES DE HOJE */}
        <Text style={styles.sectionTitle}>SESSÕES DE HOJE</Text>
        
        {/* SESSION 1 */}
        <View style={styles.sessionCard}>
           <Image
             source={{ uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000' }}
             style={styles.sessionImage}
           />
           <View style={styles.sessionOverlay}>
             <View>
               <Text style={styles.sessionCategory}>HIPERTROFIA</Text>
               <Text style={styles.sessionTitle}>TREINO ABC</Text>
               <Text style={styles.sessionSub}>⏱ 45 min   🔥 320 kcal</Text>
             </View>
             <TouchableOpacity style={styles.playButton}>
               <Play size={20} color="#1A1C23" fill="#1A1C23" />
             </TouchableOpacity>
           </View>
        </View>

        {/* SESSION 2 */}
        <View style={styles.sessionCard}>
           <Image
             source={{ uri: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000' }}
             style={styles.sessionImage}
           />
           <View style={[styles.sessionOverlay, {backgroundColor: 'rgba(26,28,35,0.7)'}]}>
             <View>
               <Text style={[styles.sessionCategory, {color: '#FFA07A'}]}>CARDIO INTENSITY</Text>
               <Text style={styles.sessionTitle}>TREINO ABC 2</Text>
               <Text style={styles.sessionSub}>⏱ 60 min   🔥 510 kcal</Text>
             </View>
             <TouchableOpacity style={styles.plusButton}>
               <Plus size={20} color="#FFF" />
             </TouchableOpacity>
           </View>
        </View>

        {/* REGISTRO DE ATIVIDADE */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>REGISTRO DE ATIVIDADE</Text>
            <Text style={styles.activityDots}>...</Text>
          </View>
          
          {/* Chart Mockup */}
          <View style={styles.chartContainer}>
             <View style={[styles.bar, {height: 60, backgroundColor: '#A0C4FF'}]} />
             <View style={[styles.bar, {height: 35, backgroundColor: '#4ADE80'}]} />
             <View style={[styles.bar, {height: 70, backgroundColor: '#FFA07A'}]} />
          </View>
        </View>

        {/* PESO E IMC */}
        <View style={styles.statsRow}>
           <View style={styles.statCard}>
             <Text style={styles.statTitle}>PESO</Text>
             <View style={{flexDirection: 'row', alignItems: 'baseline', marginTop: 12}}>
               <Text style={styles.statValue}>84.2</Text>
               <Text style={styles.statUnit}> KG</Text>
             </View>
             <Text style={styles.statDesc}>📉 -0.5kg esta semana</Text>
           </View>

           <View style={styles.statCard}>
             <Text style={styles.statTitle}>IMC</Text>
             <Text style={[styles.statValue, {marginTop: 12}]}>23.8</Text>
             <View style={styles.imcBarWrap}>
                <View style={styles.imcBarFill} />
             </View>
             <Text style={styles.imcDesc}>Faixa Saudável</Text>
           </View>
        </View>

        {/* LEMBRETES */}
        <Text style={styles.sectionTitle}>LEMBRETES</Text>
        <View style={styles.remindersCard}>
           <View style={styles.reminderItem}>
             <Droplet size={18} color="#A0C4FF" />
             <View style={styles.reminderContent}>
                <Text style={styles.reminderName}>Meta de Água</Text>
                <Text style={styles.reminderTime}>Próximo: 15:30</Text>
             </View>
             <Text style={styles.reminderValue}>2.1 / 3.0L</Text>
           </View>
           <View style={styles.reminderItem}>
             <Utensils size={18} color="#FFA07A" />
             <View style={styles.reminderContent}>
                <Text style={styles.reminderName}>Suplementação</Text>
                <Text style={styles.reminderTime}>Pós-treino</Text>
             </View>
             <View style={styles.checkCircle}>
               <Text style={{color: '#1A1C23', fontSize: 10, fontWeight: 'bold'}}>✓</Text>
             </View>
           </View>
        </View>
        <View style={{height: 100}} />
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
    marginBottom: 30,
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
  calendarSection: {
    marginBottom: 24,
  },
  monthText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },
  progressText: {
    color: '#FFA07A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    backgroundColor: '#2A2C35',
    borderRadius: 2,
  },
  progressBarFill: {
    width: 24,
    height: 4,
    backgroundColor: '#4ADE80',
    borderRadius: 2,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1A1C23',
    alignItems: 'center',
  },
  dayCardActive: {
    backgroundColor: '#A0C4FF',
  },
  dayName: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  dayNumber: {
    color: '#CCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayTextActive: {
    color: '#16181C',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sessionCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#22242A',
  },
  sessionImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.4,
  },
  sessionOverlay: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(26,28,35,0.4)',
  },
  sessionCategory: {
    color: '#A0C4FF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sessionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  sessionSub: {
    color: '#CCC',
    fontSize: 11,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#A0C4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#353945',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activityDots: {
    color: '#888',
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 90,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  bar: {
    width: 32,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
  },
  statTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  statUnit: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statDesc: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 12,
  },
  imcBarWrap: {
    width: '100%',
    height: 4,
    backgroundColor: '#353945',
    borderRadius: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  imcBarFill: {
    width: '40%',
    height: 4,
    backgroundColor: '#A0C4FF',
    borderRadius: 2,
  },
  imcDesc: {
    color: '#CCC',
    fontSize: 10,
  },
  remindersCard: {
    backgroundColor: '#1C1E26',
    borderRadius: 16,
    padding: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  reminderContent: {
    flex: 1,
    marginLeft: 16,
  },
  reminderName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderTime: {
    color: '#888',
    fontSize: 11,
  },
  reminderValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
