/**
 * Extracted Text Editor Component
 * Allows users to preview and edit OCR-extracted text before scanning
 */

import { useState } from 'react';
import styles from './ExtractedTextEditor.module.css';

interface ExtractedTextEditorProps {
  initialText: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ExtractedTextEditor({
  initialText,
  onConfirm,
  onCancel,
  isLoading = false,
}: ExtractedTextEditorProps) {
  const [text, setText] = useState(initialText);

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm(text);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-labelledby="editor-title" aria-modal="true">
      <div className={`${styles.container} glass-surface`}>
        <h2 id="editor-title" className={styles.title}>
          Extracted Text
        </h2>
        
        <p className={styles.description}>
          Review and edit the text extracted from your image before scanning.
        </p>

        <div className={styles.editorWrapper}>
          <label htmlFor="extracted-text" className="sr-only">
            Extracted text content
          </label>
          <textarea
            id="extracted-text"
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            disabled={isLoading}
            aria-describedby="editor-help"
          />
          <p id="editor-help" className={styles.help}>
            Edit the text if needed to improve accuracy
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cancel and go back"
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={!text.trim() || isLoading}
            aria-label="Confirm and scan text"
          >
            {isLoading ? 'Processing...' : 'Scan This Text'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExtractedTextEditor;
