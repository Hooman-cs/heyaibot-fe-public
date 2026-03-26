import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes,
  FaRobot,
  FaQuoteRight,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { MdOutlineSmartToy } from 'react-icons/md';

const Prompts = ({ config, setConfig }) => {
  const [tempPrompt, setTempPrompt] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isHovering, setIsHovering] = useState(null);
  
  const inputRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      // Auto-resize textarea
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [editingIndex]);

  const addPrompt = () => {
    if (tempPrompt.trim()) {
      setConfig(prev => ({
        ...prev,
        systemPrompt: [...(prev.systemPrompt || []), tempPrompt.trim()]
      }));
      setTempPrompt('');
      
      // Add animation feedback
      if (addButtonRef.current) {
        addButtonRef.current.classList.add(styles.buttonPop);
        setTimeout(() => {
          addButtonRef.current.classList.remove(styles.buttonPop);
        }, 300);
      }
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      addPrompt();
    }
  };

  return (
    <div className={styles.promptsWrapper}>
    
      

      <div className={styles.promptsContainer}>
        <div className={styles.twoColumnLayout}>
          
          {/* Column 1: Add System Prompt */}
          <div className={`${styles.column} ${styles.addColumn}`}>
            <div className={styles.columnHeader}>
              <div className={styles.headerWithIcon}>
                <FaPlus className={styles.columnIcon} />
                <h3>Add New Prompt</h3>
              </div>
              <span className={styles.headerBadge}>New</span>
            </div>
            
            <div className={styles.columnContent}>
              <div className={styles.promptInputWrapper}>
                <div className={styles.inputLabel}>
                  <FaRobot className={styles.labelIcon} />
                  <span>System Prompt Description</span>
                </div>
                <textarea
                  value={tempPrompt}
                  onChange={(e) => setTempPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="e.g., You are a helpful assistant that speaks like a pirate..."
                  rows="4"
                  className={`${styles.promptTextarea} ${tempPrompt ? styles.filled : ''}`}
                />
                <div className={styles.inputHint}>
                  <span>{tempPrompt.length} characters</span>
                  <span>Press Ctrl + Enter to add</span>
                </div>
              </div>
            </div>
            
            <div className={styles.columnFooter}>
              <button 
                ref={addButtonRef}
                className={`${styles.addFooterBtn} ${!tempPrompt.trim() ? styles.disabled : ''}`}
                onClick={addPrompt}
                disabled={!tempPrompt.trim()}
              >
                <FaPlus className={styles.btnIcon} />
                <span>Add System Prompt</span>
                <span className={styles.btnHint}>Ctrl+Enter</span>
              </button>
            </div>
          </div>

          {/* Column 2: Added System Prompts */}
          <div className={`${styles.column} ${styles.listColumn}`}>
            <div className={styles.columnHeader}>
              <div className={styles.headerWithIcon}>
                <FaQuoteRight className={styles.columnIcon} />
                <h3>Added Prompts</h3>
              </div>
              <span className={styles.countBadge}>
                {config.systemPrompt?.length || 0}
              </span>
            </div>
            
            <div className={styles.columnContent}>
              <div className={styles.promptsList}>
                {config.systemPrompt && config.systemPrompt.length > 0 ? (
                  config.systemPrompt.map((prompt, index) => (
                    <div 
                      key={index} 
                      className={`${styles.promptCard} ${isHovering === index ? styles.hovered : ''}`}
                      onMouseEnter={() => setIsHovering(index)}
                      onMouseLeave={() => setIsHovering(null)}
                    >
                      {editingIndex === index ? (
                        <div className={styles.editPromptArea}>
                          <div className={styles.editLabel}>Edit Prompt</div>
                          <textarea
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            rows="3"
                            className={styles.editTextarea}
                          />
                          <div className={styles.editActions}>
                            <button 
                              onClick={() => updatePrompt(index)} 
                              className={styles.saveBtn}
                              disabled={!editValue.trim()}
                            >
                              <FaSave className={styles.btnIcon} />
                              Save
                            </button>
                            <button 
                              onClick={cancelEdit} 
                              className={styles.cancelBtn}
                            >
                              <FaUndo className={styles.btnIcon} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.promptContent}>
                            <span className={styles.promptNumber}>#{index + 1}</span>
                            <p className={styles.promptText}>{prompt}</p>
                          </div>
                          <div className={`${styles.promptActions} ${isHovering === index ? styles.visible : ''}`}>
                            <button 
                              onClick={() => startEdit(index, prompt)} 
                              className={`${styles.iconBtn} ${styles.editBtn}`}
                              title="Edit prompt"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              onClick={() => deletePrompt(index)} 
                              className={`${styles.iconBtn} ${styles.deleteBtn}`}
                              title="Delete prompt"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <FaQuoteRight />
                    </div>
                    <h4>No Prompts Added Yet</h4>
                    <p>Add your first system prompt to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompts;