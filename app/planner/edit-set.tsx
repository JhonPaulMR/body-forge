import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Minus, Plus, Delete } from 'lucide-react-native';
import { db } from '@/database/schema';

interface SetConfig {
  warmup: boolean;
  dropSet: boolean;
  dropSetGroupId?: string;
  untilFailure: boolean;
  minReps: number;
  maxReps: number;
  restTime: number;
}

// Time pad component - digits shift left as you type (00h 00m 00s)
function TimePadModal({
  visible,
  initialSeconds,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  initialSeconds: number;
  onConfirm: (seconds: number) => void;
  onCancel: () => void;
}) {
  const [digits, setDigits] = useState('');

  const padded = digits.padStart(6, '0');
  const h = padded.slice(0, 2);
  const m = padded.slice(2, 4);
  const s = padded.slice(4, 6);

  const handlePress = (val: string) => {
    if (digits.length >= 6) return;
    setDigits((prev) => prev + val);
  };

  const handleDouble = () => {
    if (digits.length >= 5) return;
    setDigits((prev) => prev + '00');
  };

  const handleBackspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const hours = parseInt(h);
    const mins = parseInt(m);
    const secs = parseInt(s);
    const totalSeconds = hours * 3600 + mins * 60 + secs;
    onConfirm(totalSeconds);
    setDigits('');
  };

  const handleCancel = () => {
    setDigits('');
    onCancel();
  };

  const numButton = (val: string, onPress: () => void) => (
    <TouchableOpacity
      key={val}
      className="w-[72px] h-[52px] bg-forge-bg rounded-xl justify-center items-center"
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text className="text-white text-xl font-bold">{val}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/70 justify-center items-center">
        <View className="bg-forge-surface rounded-[20px] w-[300px] px-5 pt-5 pb-4">
          <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-4 text-center">SET DURATION</Text>

          {/* Display */}
          <View className="flex-row items-end justify-center mb-5">
            <Text className={`text-[36px] font-black ${digits.length > 4 ? 'text-forge-accent' : 'text-white'}`}>{h}</Text>
            <Text className="text-forge-muted text-2xl font-bold mx-1">:</Text>
            <Text className={`text-[36px] font-black ${digits.length > 2 && digits.length <= 4 ? 'text-forge-accent' : 'text-white'}`}>{m}</Text>
            <Text className="text-forge-muted text-2xl font-bold mx-1">:</Text>
            <Text className={`text-[36px] font-black ${digits.length <= 2 ? 'text-forge-accent' : 'text-white'}`}>{s}</Text>
          </View>

          {/* Labels */}
          <View className="flex-row justify-center mb-5 gap-[60px]">
            <Text className="text-forge-muted text-[9px] font-bold tracking-wider">H</Text>
            <Text className="text-forge-muted text-[9px] font-bold tracking-wider">M</Text>
            <Text className="text-forge-muted text-[9px] font-bold tracking-wider">S</Text>
          </View>

          {/* Number Pad */}
          <View className="gap-2">
            <View className="flex-row justify-between">
              {['1', '2', '3'].map((n) => numButton(n, () => handlePress(n)))}
            </View>
            <View className="flex-row justify-between">
              {['4', '5', '6'].map((n) => numButton(n, () => handlePress(n)))}
            </View>
            <View className="flex-row justify-between">
              {['7', '8', '9'].map((n) => numButton(n, () => handlePress(n)))}
            </View>
            <View className="flex-row justify-between">
              {numButton('00', handleDouble)}
              {numButton('0', () => handlePress('0'))}
              <TouchableOpacity
                className="w-[72px] h-[52px] bg-forge-bg rounded-xl justify-center items-center"
                onPress={handleBackspace}
              >
                <Delete size={20} color="#A0C4FF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row justify-end mt-4 gap-4">
            <TouchableOpacity className="px-5 py-2.5" onPress={handleCancel}>
              <Text className="text-forge-muted text-sm font-bold">CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-5 py-2.5" onPress={handleConfirm}>
              <Text className="text-forge-accent text-sm font-bold">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function EditSetScreen() {
  const router = useRouter();
  const { reId, setIndex, totalSets, configJson } = useLocalSearchParams<{
    reId: string;
    setIndex: string;
    totalSets: string;
    configJson: string;
  }>();

  const setNum = parseInt(setIndex || '0') + 1;
  const setIdx = parseInt(setIndex || '0');

  const parsedConfig: SetConfig = configJson
    ? JSON.parse(decodeURIComponent(configJson))
    : { warmup: false, dropSet: false, untilFailure: false, minReps: 8, maxReps: 12, restTime: 90 };

  const [minReps, setMinReps] = useState(parsedConfig.minReps);
  const [maxReps, setMaxReps] = useState(parsedConfig.maxReps);
  const [warmup, setWarmup] = useState(parsedConfig.warmup);
  const [dropSet, setDropSet] = useState(parsedConfig.dropSet);
  const [untilFailure, setUntilFailure] = useState(parsedConfig.untilFailure);
  const [restSeconds, setRestSecondsState] = useState(parsedConfig.restTime);
  const [showTimePad, setShowTimePad] = useState(false);

  // For manual text input
  const [minRepsText, setMinRepsText] = useState(String(parsedConfig.minReps));
  const [maxRepsText, setMaxRepsText] = useState(String(parsedConfig.maxReps));

  const getCurrentConfig = (): SetConfig => ({
    warmup, dropSet,
    dropSetGroupId: (parsedConfig as any).dropSetGroupId,
    untilFailure, minReps, maxReps, restTime: restSeconds,
  });

  const loadAllConfigs = (): SetConfig[] => {
    try {
      const result = db.getFirstSync<{ set_configs: string | null; target_sets: number; target_reps: string; rest_time_seconds: number }>(
        'SELECT set_configs, target_sets, target_reps, rest_time_seconds FROM routine_exercises WHERE id = ?',
        [reId]
      );
      if (result?.set_configs) return JSON.parse(result.set_configs);
      const reps = (result?.target_reps || '8-12').split('-');
      const configs: SetConfig[] = [];
      for (let i = 0; i < (result?.target_sets || 3); i++) {
        configs.push({
          warmup: false, dropSet: false, untilFailure: false,
          minReps: parseInt(reps[0]) || 8,
          maxReps: parseInt(reps[1] || reps[0]) || 12,
          restTime: result?.rest_time_seconds || 90,
        });
      }
      return configs;
    } catch (e) {
      console.error('Error loading configs:', e);
      return [];
    }
  };

  const saveConfigs = (configs: SetConfig[]) => {
    try {
      db.runSync('UPDATE routine_exercises SET set_configs = ?, target_sets = ? WHERE id = ?',
        [JSON.stringify(configs), configs.length, reId]);
    } catch (e) {
      console.error('Error saving:', e);
    }
  };

  const handleSave = () => {
    const configs = loadAllConfigs();
    const current = getCurrentConfig();

    // Handle dropSet grouping when manually toggling
    if (current.dropSet) {
      // If previous set is dropSet with a groupId, chain with it
      if (setIdx > 0 && configs[setIdx - 1].dropSet && configs[setIdx - 1].dropSetGroupId) {
        current.dropSetGroupId = configs[setIdx - 1].dropSetGroupId;
      } else if (!current.dropSetGroupId) {
        current.dropSetGroupId = 'dsg_' + Date.now();
      }
    } else {
      current.dropSetGroupId = undefined;
    }

    if (setIdx < configs.length) {
      configs[setIdx] = current;
    }
    saveConfigs(configs);
    router.back();
  };

  const handleApplyToAll = () => {
    const configs = loadAllConfigs();
    const current = getCurrentConfig();
    saveConfigs(configs.map(() => ({ ...current })));
    Alert.alert('Aplicado', 'Configuração aplicada a todas as séries.');
    router.back();
  };

  const formatRestDisplay = () => {
    const m = Math.floor(restSeconds / 60);
    const s = restSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleMinRepsInput = (text: string) => {
    setMinRepsText(text);
    const val = parseInt(text);
    if (!isNaN(val) && val >= 1) {
      setMinReps(val);
      if (val > maxReps) { setMaxReps(val); setMaxRepsText(String(val)); }
    }
  };

  const handleMaxRepsInput = (text: string) => {
    setMaxRepsText(text);
    const val = parseInt(text);
    if (!isNaN(val) && val >= 1) {
      setMaxReps(val);
      if (val < minReps) { setMinReps(val); setMinRepsText(String(val)); }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-forge-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-forge-surface justify-center items-center">
          <X size={20} color="#FFF" />
        </TouchableOpacity>
        <Text className="text-white text-sm font-extrabold tracking-wide">EDIT SESSION</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-forge-accent text-sm font-extrabold tracking-tight">SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-[28px] font-black mt-4 mb-8">Set {setNum}</Text>

        {/* Toggles */}
        <View className="bg-forge-surface rounded-2xl overflow-hidden mb-6">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-forge-border">
            <Text className="text-white text-sm font-semibold">Warm up</Text>
            <Switch value={warmup} onValueChange={setWarmup}
              trackColor={{ false: '#3A3D44', true: '#A0C4FF' }} thumbColor="#FFF" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-forge-border">
            <Text className="text-white text-sm font-semibold">Drop set</Text>
            <Switch value={dropSet} onValueChange={setDropSet}
              trackColor={{ false: '#3A3D44', true: '#A0C4FF' }} thumbColor="#FFF" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-white text-sm font-semibold">Until failure</Text>
            <Switch value={untilFailure} onValueChange={setUntilFailure}
              trackColor={{ false: '#3A3D44', true: '#A0C4FF' }} thumbColor="#FFF" />
          </View>
        </View>

        {/* Reps Input */}
        {!untilFailure ? (
          <>
            <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-3">MINIMUM REPS</Text>
            <View className="flex-row items-center justify-between bg-forge-surface rounded-2xl mb-6 overflow-hidden">
              <TouchableOpacity className="px-5 py-4"
                onPress={() => { const v = Math.max(1, minReps - 1); setMinReps(v); setMinRepsText(String(v)); }}>
                <Minus size={20} color="#A0C4FF" />
              </TouchableOpacity>
              <TextInput
                className="text-white text-[32px] font-black text-center w-[80px]"
                value={minRepsText}
                onChangeText={handleMinRepsInput}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
              <TouchableOpacity className="px-5 py-4"
                onPress={() => { const v = minReps + 1; setMinReps(v); setMinRepsText(String(v)); if (v > maxReps) { setMaxReps(v); setMaxRepsText(String(v)); } }}>
                <Plus size={20} color="#A0C4FF" />
              </TouchableOpacity>
            </View>

            <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-3">MAXIMUM REPS</Text>
            <View className="flex-row items-center justify-between bg-forge-surface rounded-2xl mb-6 overflow-hidden">
              <TouchableOpacity className="px-5 py-4"
                onPress={() => { const v = Math.max(minReps, maxReps - 1); setMaxReps(v); setMaxRepsText(String(v)); }}>
                <Minus size={20} color="#A0C4FF" />
              </TouchableOpacity>
              <TextInput
                className="text-white text-[32px] font-black text-center w-[80px]"
                value={maxRepsText}
                onChangeText={handleMaxRepsInput}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
              />
              <TouchableOpacity className="px-5 py-4"
                onPress={() => { const v = maxReps + 1; setMaxReps(v); setMaxRepsText(String(v)); }}>
                <Plus size={20} color="#A0C4FF" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View className="bg-red-500/10 rounded-2xl p-5 mb-6 items-center">
            <Text className="text-red-400 text-sm font-bold">⚡ Até a falha</Text>
            <Text className="text-forge-muted text-[11px] mt-1 text-center">
              Repetições não se aplicam — execute até a falha muscular
            </Text>
          </View>
        )}

        {/* Rest Time — tappable to open pad */}
        <Text className="text-forge-muted text-[10px] font-bold tracking-widest mb-3">REST TIME</Text>
        <TouchableOpacity
          className="flex-row items-center justify-center bg-forge-surface rounded-2xl mb-8 py-4"
          onPress={() => setShowTimePad(true)}
          activeOpacity={0.7}
        >
          <Text className="text-white text-[32px] font-black">{formatRestDisplay()}</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity className="bg-forge-accent rounded-2xl py-4 items-center mb-3" onPress={handleSave}>
          <Text className="text-forge-bg text-sm font-extrabold tracking-wide">SAVE</Text>
        </TouchableOpacity>

        {/* Apply to All */}
        <TouchableOpacity className="border border-forge-border rounded-2xl py-4 items-center mb-6" onPress={handleApplyToAll}>
          <Text className="text-forge-muted text-sm font-extrabold tracking-wide">APPLY TO ALL SETS</Text>
        </TouchableOpacity>

        <View className="h-[40px]" />
      </ScrollView>

      {/* Time Pad Popup */}
      <TimePadModal
        visible={showTimePad}
        initialSeconds={restSeconds}
        onConfirm={(secs) => { setRestSecondsState(secs); setShowTimePad(false); }}
        onCancel={() => setShowTimePad(false)}
      />
    </SafeAreaView>
  );
}
