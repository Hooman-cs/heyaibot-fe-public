import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaCodeBranch } from 'react-icons/fa';
import CustomPromptPopup from '../coustomprompt/CustomPromptPopup';

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
    <div className={styles.actions_unique_container}>
      <div className={styles.actions_unique_header}>
        <h3 className={styles.actions_unique_title}>Custom Prompts</h3>
        <span className={styles.actions_unique_count_badge}>
          {config.customPrompt?.length || 0}
        </span>
      </div>
      
      <div className={styles.actions_unique_scroll_list}>
        {config.customPrompt && config.customPrompt.length > 0 ? (
          config.customPrompt.map((prompt, index) => (
            <div key={index} className={styles.actions_unique_prompt_card}>
              {editingIndex === index ? (
                <div className={styles.actions_unique_edit_container}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => updatePrompt(index)}
                    onKeyPress={(e) => e.key === 'Enter' && updatePrompt(index)}
                    className={styles.actions_unique_edit_input}
                    autoFocus
                  />
                  <div className={styles.actions_unique_edit_actions}>
                    <button 
                      onClick={() => updatePrompt(index)} 
                      className={styles.actions_unique_save_btn}
                    >
                      <FaCheck />
                    </button>
                    <button 
                      onClick={cancelEdit} 
                      className={styles.actions_unique_cancel_btn}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={styles.actions_unique_prompt_name}>
                    {prompt}
                  </span>
                  <div className={styles.actions_unique_button_group}>
                    <button 
                      onClick={() => openChildPromptPopup(prompt, index)} 
                      className={styles.actions_unique_child_btn}
                      title="Add Child Prompts"
                    >
                      <FaCodeBranch /> Child
                    </button>
                    <button 
                      onClick={() => startEdit(index, prompt)} 
                      className={styles.actions_unique_icon_btn}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => deletePrompt(index)} 
                      className={styles.actions_unique_icon_btn}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className={styles.actions_unique_empty_state}>
            No custom prompts added
          </div>
        )}
      </div>

      <div className={styles.actions_unique_footer}>
        {!showAddInput ? (
          <button 
            className={styles.actions_unique_add_button}
            onClick={() => setShowAddInput(true)}
          >
            <FaPlus /> Add Custom Prompt
          </button>
        ) : (
          <div className={styles.actions_unique_add_input_container}>
            <input
              ref={inputRef}
              type="text"
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value)}
              placeholder="Enter custom prompt name"
              onKeyPress={(e) => e.key === 'Enter' && addPrompt()}
              className={styles.actions_unique_add_input}
              autoFocus
            />
            <button 
              onClick={addPrompt} 
              className={styles.actions_unique_submit_btn}
              disabled={!tempPrompt.trim()}
            >
              Add
            </button>
            <button 
              onClick={cancelEdit} 
              className={styles.actions_unique_cancel_btn}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

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