'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PreviewPanel.module.css';
import CustomPromptPopup from '../../coustomprompt/CustomPromptPopup';
import config from '../../utils/config';

// Framer Motion Variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const PreviewPanel = ({
  websiteId,
  categories = [],
  systemPrompts = [],
  customPrompts = [],
  roles = [],
  roleValues = {},
  removeCategory,
  removeSystemPrompt,
  removeCustomPrompt,
  // Role management props
  removeRole,
  updateRoleName,
  updateRoleValue,
  removeRoleValue,
  setConfig,
  apiKey,
  backendApiKey,
  // Editing states
  editingRole = { name: '', newName: '' },
  setEditingRole,
  handleSaveEditRole,
  editingRoleValue = { role: '', index: null, value: '' },
  setEditingRoleValue,
  handleSaveEditRoleValue,
  // Selected role for dropdown sync
  selectedRole,
  setSelectedRole
}) => {
  const [currentPromptName, setCurrentPromptName] = useState('');
  const [editIndex, setEditIndex] = useState({ type: '', index: null });
  const [editValue, setEditValue] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const API_BASE = `${config.apiBaseUrl}/api/childprompt`;

  // Get roles that have values (for displaying separate sections)
  const rolesWithValues = Object.keys(roleValues).filter(role => 
    roleValues[role] && roleValues[role].length > 0
  );

  // Debug: Monitor incoming props


  // Start editing category, system prompt, or custom prompt
  const startEdit = (type, index, value) => {
    setEditIndex({ type, index });
    setEditValue(value);
  };

  // Start editing role name
  const startEditRole = (role) => {
    if (setEditingRole) {
      setEditingRole({ name: role, newName: role });
    } else {
      console.warn('setEditingRole function not provided');
    }
  };

  // Start editing role value
  const startEditRoleValue = (role, index, value) => {
    if (setEditingRoleValue) {
      setEditingRoleValue({ role, index, value });
    } else {
      console.warn('setEditingRoleValue function not provided');
    }
  };

  // Save edit for category, system prompt, or custom prompt
  const saveEdit = async () => {
    if (!editValue.trim()) return;

    const oldValue = 
      editIndex.type === 'customPrompt'
        ? customPrompts[editIndex.index]
        : editIndex.type === 'systemPrompt'
        ? systemPrompts[editIndex.index]
        : categories[editIndex.index];

    if (editValue.trim() === oldValue) {
      setEditIndex({ type: '', index: null });
      setEditValue('');
      return;
    }

    setIsSaving(true);

    try {
      if (editIndex.type === 'customPrompt') {
        const res = await fetch(
          `${API_BASE}/${websiteId}/updatename/${encodeURIComponent(oldValue)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${backendApiKey}`
            },
            body: JSON.stringify({ newPromptName: editValue.trim() })
          }
        );

        const data = await res.json();

        if (!res.ok) {
          console.warn("API failed, but frontend will still update:", data);
        }
      }

      setConfig((prev) => {
        const updated = { ...prev };

        if (editIndex.type === 'category')
          updated.category[editIndex.index] = editValue.trim();
        if (editIndex.type === 'systemPrompt')
          updated.systemPrompt[editIndex.index] = editValue.trim();
        if (editIndex.type === 'customPrompt')
          updated.customPrompt[editIndex.index] = editValue.trim();

        return updated;
      });

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSaving(false);
      setEditIndex({ type: '', index: null });
      setEditValue('');
    }
  };

  // Save role edit
  const saveRoleEdit = () => {
    if (handleSaveEditRole) {
      handleSaveEditRole();
    } else {
      console.warn('handleSaveEditRole function not provided');
    }
  };

  // Save role value edit
  const saveRoleValueEdit = () => {
    if (handleSaveEditRoleValue) {
      handleSaveEditRoleValue();
    } else {
      console.warn('handleSaveEditRoleValue function not provided');
    }
  };

  // Delete role
  const handleDeleteRole = (role) => {
    if (removeRole) {
     
        removeRole(role);
        
        // Clear selected role if it's the deleted one
        if (selectedRole === role && setSelectedRole) {
          setSelectedRole('');
        }
      
    } else {
      console.warn('removeRole function not provided');
    }
  };

  // Delete role value
  const handleDeleteRoleValue = (role, value) => {
    if (removeRoleValue) {
      
        removeRoleValue(role, value);
      
    } else {
      console.warn('removeRoleValue function not provided');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditIndex({ type: '', index: null });
    setEditValue('');
  };

  // Cancel role editing
  const cancelRoleEdit = () => {
    if (setEditingRole) {
      setEditingRole({ name: '', newName: '' });
    }
  };

  // Cancel role value editing
  const cancelRoleValueEdit = () => {
    if (setEditingRoleValue) {
      setEditingRoleValue({ role: '', index: null, value: '' });
    }
  };

  // Open custom prompt popup
  const openPopup = (promptName) => {
    setCurrentPromptName(promptName);
    setShowPopup(true);
  };

  const closePopup = () => setShowPopup(false);

  return (
    <div className={styles.previewColumn}>
      {/* Categories Section */}
      <motion.div 
        className={styles.previewBox} 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        key={`categories-${categories.length}`}
      >
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>
            <span className={styles.titleIcon}>📂</span>Categories
          </h3>
          <span className={styles.countBadge}>{categories.length}</span>
        </div>

        <AnimatePresence>
          {categories.length > 0 ? (
            <motion.div className={styles.categoryGrid}>
              {categories.map((cat, index) => (
                <motion.div 
                  key={`cat-${index}-${cat}`} 
                  variants={itemVariants} 
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.03 }} 
                  className={styles.categoryChip}
                >
                  {editIndex.type === 'category' && editIndex.index === index ? (
                    <div className={styles.editBox}>
                      <input 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        className={styles.editInput} 
                        placeholder="Enter category name..."
                        autoFocus
                      />
                      <div className={styles.editBox1}>
                        <button 
                          onClick={saveEdit} 
                          className={styles.saveBtn}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className={styles.cancelBtn}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={styles.dot}></span>
                      <span>{cat}</span>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => startEdit('category', index, cat)} 
                          className={styles.editButton}
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => removeCategory(index)} 
                          className={styles.removeButton}
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p 
              key="empty-categories" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={styles.emptyMessage}
            >
              ✨ No categories added yet
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Roles Section - Show all roles from database */}
      <motion.div 
        className={styles.previewBox} 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        key={`roles-${roles.length}-${JSON.stringify(roles)}`}
      >
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>
            <span className={styles.titleIcon}>👥</span>Roles 
          </h3>
          <span className={styles.countBadge}>{roles.length}</span>
        </div>

        <AnimatePresence>
          {roles.length > 0 ? (
            <div className={styles.categoryGrid}>
              {roles.map((role, index) => (
                <motion.div 
                  key={`role-${index}-${role}`} 
                  variants={itemVariants} 
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.03 }} 
                  className={styles.categoryChip}
                >
                  {editingRole.name === role ? (
                    <div className={styles.editBox}>
                      <input 
                        value={editingRole.newName} 
                        onChange={(e) => setEditingRole({ ...editingRole, newName: e.target.value })} 
                        className={styles.editInput} 
                        placeholder="Enter role name..."
                        autoFocus
                      />
                      <div className={styles.editBox1}>
                        <button 
                          onClick={saveRoleEdit} 
                          className={styles.saveBtn}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                          onClick={cancelRoleEdit} 
                          className={styles.cancelBtn}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={styles.dot} style={{ backgroundColor: '#8b5cf6' }}></span>
                      <span>{role}</span>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => startEditRole(role)} 
                          className={styles.editButton}
                          title="Edit Role"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => handleDeleteRole(role)} 
                          className={styles.removeButton}
                          title="Delete Role"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.p 
              key="empty-roles" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={styles.emptyMessage}
            >
              ✨ No roles added yet. Add roles using the input box on the left.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Role Values Sections - Separate section for each role with values */}
      {rolesWithValues.map((role, roleIndex) => (
        <motion.div 
          key={`role-values-${roleIndex}-${role}`}
          className={styles.previewBox} 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants}
        >
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              <span className={styles.titleIcon}>🎯</span>{role} Values
            </h3>
            <span className={styles.countBadge}>{roleValues[role]?.length || 0}</span>
          </div>

          <div className={styles.roleValuesSection}>
            <div className={styles.categoryGrid}>
              {roleValues[role] && roleValues[role].length > 0 ? (
                roleValues[role].map((value, valueIndex) => (
                  <motion.div 
                    key={`value-${roleIndex}-${valueIndex}-${value}`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.03 }} 
                    className={styles.categoryChip}
                  >
                    {editingRoleValue.role === role && editingRoleValue.index === valueIndex ? (
                      <div className={styles.editBox}>
                        <input 
                          value={editingRoleValue.value} 
                          onChange={(e) => setEditingRoleValue({ ...editingRoleValue, value: e.target.value })} 
                          className={styles.editInput} 
                          placeholder="Enter value..."
                          autoFocus
                        />
                        <div className={styles.editBox1}>
                          <button 
                            onClick={saveRoleValueEdit} 
                            className={styles.saveBtn}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Updating...' : 'Update'}
                          </button>
                          <button 
                            onClick={cancelRoleValueEdit} 
                            className={styles.cancelBtn}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={styles.dot} style={{ backgroundColor: '#f59e0b' }}></span>
                        <span className={styles.roleValueText}>{value}</span>
                        <div className={styles.actionButtons}>
                          <button 
                            onClick={() => updateRoleValue && updateRoleValue(role, valueIndex, value)} 
                            className={styles.editButton}
                            title="Edit Value"
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => handleDeleteRoleValue(role, value)} 
                            className={styles.removeButton}
                            title="Delete Value"
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              ) : (
                <motion.p 
                  key={`empty-${role}`} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className={styles.emptyMessage}
                >
                  ✨ No values added for {role}
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {/* System Prompts Section */}
      <motion.div 
        className={styles.previewBox} 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        key={`system-prompts-${systemPrompts.length}`}
      >
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>📝 System Prompts</h3>
          <span className={styles.countBadge}>{systemPrompts.length}</span>
        </div>

        <AnimatePresence>
          {systemPrompts.length > 0 ? (
            <motion.ul className={styles.list}>
              {systemPrompts.map((sp, index) => (
                <motion.li 
                  key={`sys-${index}-${sp.substring(0, 20)}`} 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {editIndex.type === 'systemPrompt' && editIndex.index === index ? (
                    <div className={styles.editBox}>
                      <textarea 
                        rows={2} 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        className={styles.editInput} 
                        placeholder="Enter system prompt..."
                        autoFocus
                      />
                      <div className={styles.editBox1}>
                        <button 
                          onClick={saveEdit} 
                          className={styles.saveBtn}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className={styles.cancelBtn}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={styles.promptText}>{sp}</span>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => startEdit('systemPrompt', index, sp)} 
                          className={styles.editButton}
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => removeSystemPrompt(index)} 
                          className={styles.removeButton}
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p 
              key="empty-system-prompts" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={styles.emptyMessage}
            >
              ✨ No system prompts added yet
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Custom Prompts Section */}
      <motion.div 
        className={styles.previewBox} 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        key={`custom-prompts-${customPrompts.length}`}
      >
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>⚙️ Custom Prompts</h3>
          <span className={styles.countBadge}>{customPrompts.length}</span>
        </div>

        <AnimatePresence>
          {customPrompts.length > 0 ? (
            <motion.ul className={styles.list}>
              {customPrompts.map((cp, index) => (
                <motion.li 
                  key={`custom-${index}-${cp}`} 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {editIndex.type === 'customPrompt' && editIndex.index === index ? (
                    <div className={styles.editBox}>
                      <input 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        className={styles.editInput} 
                        placeholder="Enter custom prompt name..."
                        autoFocus
                      />
                      <div className={styles.editBox1}>
                        <button 
                          onClick={saveEdit} 
                          className={styles.saveBtn}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Updating...' : 'Update'}
                        </button>
                        <button 
                          onClick={cancelEdit} 
                          className={styles.cancelBtn}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={styles.promptText}>{cp}</span>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => startEdit('customPrompt', index, cp)} 
                          className={styles.editButton}
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => openPopup(cp)} 
                          className={styles.plushButton}
                        >
                          + Add Child Prompt
                        </button>
                        <button 
                          onClick={() => removeCustomPrompt(index)} 
                          className={styles.removeButton}
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </motion.li>
              ))}
            </motion.ul>
          ) : (
            <motion.p 
              key="empty-custom-prompts" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className={styles.emptyMessage}
            >
              ✨ No custom prompts added yet
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CustomPromptPopup */}
      <AnimatePresence>
        {showPopup && (
          <CustomPromptPopup
            onClose={closePopup}
            promptName={currentPromptName}
            websiteId={websiteId}
            apiKey={apiKey}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreviewPanel;