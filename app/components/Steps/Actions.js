import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaCodeBranch } from 'react-icons/fa';
import CustomPromptPopup from '../coustomprompt/CustomPromptPopup'; // Adjust path as needed

const Actions = ({ config, setConfig, websiteId, apiKey }) => {
  const [tempPrompt, setTempPrompt] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);

  const addPrompt = () => {
    if (tempPrompt.trim()) {
      setConfig(prev => ({
        ...prev,
        customPrompt: [...(prev.customPrompt || []), tempPrompt.trim()]
      }));
      setTempPrompt('');
      setShowAddInput(false);
    }
  };

  const updatePrompt = (index) => {
    if (editValue.trim()) {
      const updated = [...config.customPrompt];
      updated[index] = editValue.trim();
      setConfig(prev => ({ ...prev, customPrompt: updated }));
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const deletePrompt = (index) => {
    const updated = config.customPrompt.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, customPrompt: updated }));
  };

  const startEdit = (index, value) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
    setShowAddInput(false);
    setTempPrompt('');
  };

  const openChildPromptPopup = (prompt, index) => {
    setSelectedPrompt({ name: prompt, index });
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedPrompt(null);
  };

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.columnHeader}>
        <h3>Custom Prompts</h3>
        <span className={styles.count}>{config.customPrompt?.length || 0}</span>
      </div>
      
      {/* Scrollable List of Added Prompts */}
      <div className={styles.actionsList}>
        {config.customPrompt && config.customPrompt.length > 0 ? (
          config.customPrompt.map((prompt, index) => (
            <div key={index} className={styles.customPromptCard}>
              {editingIndex === index ? (
                <div className={styles.editPrompt}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => updatePrompt(index)}
                    onKeyPress={(e) => e.key === 'Enter' && updatePrompt(index)}
                    className={styles.editInput}
                    autoFocus
                  />
                  <div className={styles.editActions}>
                    <button onClick={() => updatePrompt(index)} className={styles.saveBtn}>
                      <FaCheck />
                    </button>
                    <button onClick={cancelEdit} className={styles.cancelBtn}>
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={styles.customPromptName}>{prompt}</span>
                  <div className={styles.promptActions}>
                    <button 
                      onClick={() => openChildPromptPopup(prompt, index)} 
                      className={styles.childBtn}
                      title="Add Child Prompts"
                    >
                      <FaCodeBranch /> Child
                    </button>
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
          <div className={styles.emptyState}>No custom prompts added</div>
        )}
      </div>

      {/* Fixed Bottom Add Button */}
      <div className={styles.actionsFooter}>
        {!showAddInput ? (
          <button 
            className={styles.addFooterBtn}
            onClick={() => setShowAddInput(true)}
          >
            <FaPlus /> Add Custom Prompt
          </button>
        ) : (
          <div className={styles.addInputFooter}>
            <input
              ref={inputRef}
              type="text"
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="Enter custom prompt name"
              onKeyPress={(e) => e.key === 'Enter' && addPrompt()}
              autoFocus
            />
            <button onClick={addPrompt} className={styles.addBtn} disabled={!tempPrompt.trim()}>
              Add
            </button>
            <button onClick={cancelEdit} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* CustomPromptPopup Modal */}
      {showPopup && selectedPrompt && (
        <CustomPromptPopup
          onClose={closePopup}
          websiteId={websiteId}
          promptName={selectedPrompt.name}
          apiKey={apiKey}
        />
      )}
    </div>
  );
};

export default Actions;