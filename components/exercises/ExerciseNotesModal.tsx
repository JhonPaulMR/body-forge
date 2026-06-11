import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { X, Plus, Trash2, Pencil } from 'lucide-react-native';
import { ExerciseNotesRepository, ExerciseNote } from '@/database/repositories/ExerciseNotesRepository';

interface ExerciseNotesModalProps {
  exerciseId: string;
  exerciseName: string;
  visible: boolean;
  onClose: () => void;
}

export function ExerciseNotesModal({ exerciseId, exerciseName, visible, onClose }: ExerciseNotesModalProps) {
  const [notes, setNotes] = useState<ExerciseNote[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadNotes = () => {
    if (exerciseId) {
      setNotes(ExerciseNotesRepository.getNotesForExercise(exerciseId));
    }
  };

  useEffect(() => {
    if (visible) {
      loadNotes();
      setIsEditing(false);
      setNoteText('');
    }
  }, [visible, exerciseId]);

  const handleSave = () => {
    if (!noteText.trim()) {
      setIsEditing(false);
      return;
    }

    if (currentNoteId) {
      ExerciseNotesRepository.updateNote(currentNoteId, noteText);
    } else {
      ExerciseNotesRepository.addNote(exerciseId, noteText);
    }
    
    setNoteText('');
    setCurrentNoteId(null);
    setIsEditing(false);
    loadNotes();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir', 'Tem certeza que deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => {
        ExerciseNotesRepository.deleteNote(id);
        loadNotes();
      }}
    ]);
  };

  const handleEdit = (note: ExerciseNote) => {
    setNoteText(note.note_text);
    setCurrentNoteId(note.id);
    setIsEditing(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-forge-bg rounded-t-3xl h-[80%] p-6">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-white text-xl font-bold">Anotações</Text>
              <Text className="text-forge-muted text-sm">{exerciseName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 bg-forge-surface rounded-full">
              <X size={20} color="#8A8F98" />
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <View className="flex-1">
              <TextInput
                className="flex-1 bg-forge-surface border border-forge-border rounded-xl p-4 text-white text-base"
                multiline
                placeholder="Adicione suas anotações aqui..."
                placeholderTextColor="#8A8F98"
                value={noteText}
                onChangeText={setNoteText}
                textAlignVertical="top"
                autoFocus
              />
              <View className="flex-row gap-4 mt-4">
                <TouchableOpacity 
                  onPress={() => { setIsEditing(false); setNoteText(''); setCurrentNoteId(null); }} 
                  className="flex-1 bg-forge-surface py-4 rounded-xl items-center border border-forge-border"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-widest">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} className="flex-1 bg-[#A0C4FF] py-4 rounded-xl items-center">
                  <Text className="text-forge-bg font-black text-sm uppercase tracking-widest">Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {notes.length === 0 ? (
                  <Text className="text-forge-muted text-center mt-10">Você não tem anotações para este exercício.</Text>
                ) : (
                  notes.map((n) => (
                    <View key={n.id} className="bg-forge-surface p-4 rounded-2xl mb-4 border border-forge-border">
                      <Text className="text-forge-muted text-[10px] uppercase font-bold tracking-widest mb-2">
                        {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Text className="text-white text-sm mb-4 leading-relaxed">{n.note_text}</Text>
                      <View className="flex-row justify-end gap-4">
                        <TouchableOpacity onPress={() => handleEdit(n)}>
                          <Pencil size={16} color="#A0C4FF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(n.id)}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              
              <TouchableOpacity 
                onPress={() => setIsEditing(true)} 
                className="bg-forge-surface border border-forge-border border-dashed mt-4 py-4 rounded-xl items-center flex-row justify-center gap-2"
              >
                <Plus size={20} color="#A0C4FF" />
                <Text className="text-[#A0C4FF] font-black text-sm uppercase tracking-widest">Nova Anotação</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
