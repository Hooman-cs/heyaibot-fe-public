import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const Prompts = ({ config, setConfig }) => {
  const [tempPrompt, setTempPrompt] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);

  const addPrompt = () => {
    if (tempPrompt.trim()) {
      setConfig(prev => ({
        ...prev,
        systemPrompt: [...(prev.systemPrompt || []), tempPrompt.trim()]
      }));
      setTempPrompt('');
    }
  };

  const updatePrompt = (index) => {
    if (editValue.trim()) {
      const updated = [...config.systemPrompt];
      updated[index] = editValue.trim();
      setConfig(prev => ({ ...prev, systemPrompt: updated }));
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const deletePrompt = (index) => {
    const updated = config.systemPrompt.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, systemPrompt: updated }));
  };

  const startEdit = (index, value) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
    setTempPrompt('');
  };

  return (
    <div className={styles.promptsContainer}>
      <div className={styles.twoColumnLayout}>
        
        {/* Column 1: Add System Prompt */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>Add System Prompt</h3>
          </div>
          
          <div className={styles.columnContent}>
            <div className={styles.promptInputArea}>
              <textarea
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                placeholder="Enter system prompt description..."
                rows="6"
                className={styles.promptTextarea}
              />
            </div>
          </div>
          
          <div className={styles.columnFooter}>
            <button 
              className={styles.addFooterBtn}
              onClick={addPrompt}
              disabled={!tempPrompt.trim()}
            >
              <FaPlus /> Add System Prompt
            </button>
          </div>
        </div>

        {/* Column 2: Added System Prompts */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>Added System Prompts</h3>
            <span className={styles.count}>{config.systemPrompt?.length || 0}</span>
          </div>
          
          <div className={styles.columnContent}>
            <div className={styles.promptsList}>
              {config.systemPrompt && config.systemPrompt.length > 0 ? (
                config.systemPrompt.map((prompt, index) => (
                  <div key={index} className={styles.promptCard}>
                    {editingIndex === index ? (
                      <div className={styles.editPromptArea}>
                        <textarea
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          rows="3"
                          className={styles.editTextarea}
                        />
                        <div className={styles.editActions}>
                          <button onClick={() => updatePrompt(index)} className={styles.saveBtn}>
                            <FaCheck /> Save
                          </button>
                          <button onClick={cancelEdit} className={styles.cancelBtn}>
                            <FaTimes /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={styles.promptText}>{prompt}</p>
                        <div className={styles.promptActions}>
                          <button onClick={() => startEdit(index, prompt)} className={styles.iconBtn}>
                            <FaEdit />
                          </button>
                          <button onClick={() => deletePrompt(index)} className={styles.iconBtn}>
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No system prompts added</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompts;