import { useState } from '../hooks.js';
import { updateWord } from '../api/wordApi.js';

/**
 * Manages word editing
 */
export function useEditWord() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingWord, setEditingWord] = useState(null);

  const openEditModal = (word) => {
    setEditingWord(word);
    setModalOpen(true);
  };

  const closeEditModal = () => {
    setModalOpen(false);
    setEditingWord(null);
  };

  const updateWord = async (swedish, english, onSuccess) => {
    if (!editingWord) return;

    setIsUpdating(true);

    try {
      const updatedWord = await updateWord(
        editingWord._id,
        swedish,
        english,
        editingWord.examples || []
      );
      
      if (!updatedWord) {
        throw new Error('Failed to update word');
      }

      closeEditModal();
      
      if (onSuccess) {
        onSuccess(updatedWord);
      }

    } catch (error) {
      if (error?.authError) {
        // Re-throw auth errors so they can be handled at app level
        throw error;
      }
      alert('Kunde inte uppdatera ord / Failed to update word');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    modalOpen,
    isUpdating,
    editingWord,
    openEditModal,
    closeEditModal,
    updateWord
  };
}
