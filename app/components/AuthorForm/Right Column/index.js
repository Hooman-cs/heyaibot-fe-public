'use client';
import React, { useState } from 'react';
import styles from './PreviewPanel.module.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

const PreviewPanel = ({
  categories = [],
  systemPrompts = [],
  customPrompts = [],
  roles = [],
  roleValues = {},
  removeCategory,
  removeSystemPrompt,
  removeCustomPrompt,
  removeRole,
  removeRoleValue
}) => {
  const [editIndex, setEditIndex] = useState({ type: '', index: null });
  const [editValue, setEditValue] = useState('');

  const rolesWithValues = Object.keys(roleValues).filter(role => 
    roleValues[role] && roleValues[role].length > 0
  );

  const startEdit = (type, index, value) => {
    setEditIndex({ type, index });
    setEditValue(value);
  };

  const saveEdit = () => {
    // Handle edit save
    setEditIndex({ type: '', index: null });
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditIndex({ type: '', index: null });
    setEditValue('');
  };

  return (
    <div className={styles.previewColumn}>
      {/* Basic Info Section */}
      <div className={styles.previewBox}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>Basic Info</h3>
        </div>
      </div>

      {/* Knowledge Base - Categories */}
      <div className={styles.previewBox}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>Knowledge Base</h3>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>Categories</span>
          </div>
          <div className={styles.categoryList}>
            {categories.map((cat, index) => (
              <div key={index} className={styles.categoryItem}>
                <span className={styles.categoryName}>
                  <span className={styles.dot}></span>
                  {cat}
                </span>
                <div className={styles.itemActions}>
                  <button onClick={() => startEdit('category', index, cat)} className={styles.iconButton}>
                    <FaEdit />
                  </button>
                  <button onClick={() => removeCategory(index)} className={styles.iconButton}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className={styles.emptyMessage}>No categories added</p>
            )}
          </div>
        </div>

        {/* Roles */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>Roles</span>
          </div>
          <div className={styles.categoryList}>
            {roles.map((role, index) => (
              <div key={index} className={styles.categoryItem}>
                <span className={styles.categoryName}>
                  <span className={styles.dot} style={{ background: '#8b5cf6' }}></span>
                  {role}
                </span>
                <div className={styles.itemActions}>
                  <button className={styles.iconButton}>
                    <FaEdit />
                  </button>
                  <button onClick={() => removeRole(role)} className={styles.iconButton}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <p className={styles.emptyMessage}>No roles added</p>
            )}
          </div>
        </div>

        {/* Role Values */}
        {rolesWithValues.map((role, roleIndex) => (
          <div key={roleIndex} className={styles.section}>
            <div className={styles.sectionTitle}>
              <span>{role}</span>
            </div>
            <div className={styles.categoryList}>
              {roleValues[role].map((value, valueIndex) => (
                <div key={valueIndex} className={styles.categoryItem}>
                  <span className={styles.categoryName}>
                    <span className={styles.dot} style={{ background: '#f59e0b' }}></span>
                    {value}
                  </span>
                  <div className={styles.itemActions}>
                    <button className={styles.iconButton}>
                      <FaEdit />
                    </button>
                    <button onClick={() => removeRoleValue(role, value)} className={styles.iconButton}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Prompts Section */}
      <div className={styles.previewBox}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>Prompts</h3>
        </div>
        
        {/* System Prompts */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>System Prompts</span>
          </div>
          <div className={styles.promptList}>
            {systemPrompts.map((sp, index) => (
              <div key={index} className={styles.promptItem}>
                <p className={styles.promptText}>{sp}</p>
                <div className={styles.itemActions}>
                  <button className={styles.iconButton}>
                    <FaEdit />
                  </button>
                  <button onClick={() => removeSystemPrompt(index)} className={styles.iconButton}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            {systemPrompts.length === 0 && (
              <p className={styles.emptyMessage}>No system prompts added</p>
            )}
          </div>
        </div>

        {/* Custom Prompts */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span>Custom Prompts</span>
          </div>
          <div className={styles.customPromptList}>
            {customPrompts.map((cp, index) => (
              <div key={index} className={styles.customPromptItem}>
                <span className={styles.promptName}>{cp}</span>
                <div className={styles.itemActions}>
                  <button className={styles.iconButton}>
                    <FaEdit />
                  </button>
                  <button className={styles.addChildButton}>
                    <FaPlus /> Add Child Prompt
                  </button>
                  <button onClick={() => removeCustomPrompt(index)} className={styles.iconButton}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
            {customPrompts.length === 0 && (
              <p className={styles.emptyMessage}>No custom prompts added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;