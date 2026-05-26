import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Delete } from 'lucide-react-native';

interface TimePadModalProps {
  visible: boolean;
  initialSeconds: number;
  onConfirm: (seconds: number) => void;
  onCancel: () => void;
}

export default function TimePadModal({ visible, initialSeconds, onConfirm, onCancel }: TimePadModalProps) {
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
