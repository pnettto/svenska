import { html } from '../htm.js';
import { CustomWordModal } from './CustomWordModal.js';
import { EditWordModal } from './EditWordModal.js';
import { WordTableModal } from './WordTableModal.js';
import { PinModal } from './PinModal.js';

export function AppModals({
  customWord,
  editWord,
  wordTable,
  pinAuth,
  handlers
}) {
  return html`
    <${CustomWordModal}
      isOpen=${customWord.modalOpen}
      onClose=${() => customWord.setModalOpen(false)}
      onSubmit=${handlers.handleSubmitCustomWord}
      isTranslating=${customWord.isTranslating}
      onGenerateRandom=${customWord.generateRandomWord}
      isGeneratingRandom=${customWord.isGeneratingRandom}
    />

    <${EditWordModal}
      isOpen=${editWord.modalOpen}
      onClose=${editWord.closeEditModal}
      onSubmit=${handlers.handleSubmitEditWord}
      isUpdating=${editWord.isUpdating}
      word=${editWord.editingWord}
    />

    <${WordTableModal}
      isOpen=${wordTable.isOpen}
      onClose=${wordTable.onClose}
      words=${wordTable.words}
      onSelectWord=${handlers.handleSelectWord}
      onDeleteWord=${handlers.handleDeleteWord}
      onEditWord=${handlers.handleEditWord}
    />

    <${PinModal}
      isOpen=${pinAuth.pinModalOpen}
      onVerify=${pinAuth.verifyPin}
      isVerifying=${pinAuth.isVerifying}
      error=${pinAuth.pinError}
    />
  `;
}
