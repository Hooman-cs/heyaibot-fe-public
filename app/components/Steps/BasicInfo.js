import React, { useState } from 'react';
import styles from './Step.module.css';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const BasicInfo = ({ config, setConfig }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = () => {
    if (editValue.trim()) {
      setConfig({ ...config, [editingField]: editValue.trim() });
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleDelete = (field) => {
    setConfig({ ...config, [field]: '' });
  };

  return (
    <div className={styles.stepContent}>
    

      {/* Website/App Name */}
      <div className={styles.formCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>🌐</span>
          <span className={styles.cardLabel}>Website/App Name</span>
          {config.websiteName && (
            <span className={styles.cardBadge}>Added ✓</span>
          )}
        </div>

        {editingField === 'websiteName' ? (
          <div className={styles.editContainer}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter website name"
              className={styles.editInput}
              autoFocus
            />
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveBtn}>
                <FaCheck /> Save
              </button>
              <button onClick={handleCancel} className={styles.cancelBtn}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayContainer}>
            <span className={styles.displayValue}>
              {config.websiteName || 'Not added yet'}
            </span>
            <div className={styles.itemActions}>
              {!config.websiteName ? (
                <button 
                  onClick={() => handleEdit('websiteName', '')}
                  className={styles.addBtn}
                >
                  + Add
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleEdit('websiteName', config.websiteName)}
                    className={styles.iconBtn}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete('websiteName')}
                    className={styles.iconBtn}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Website URL */}
      <div className={styles.formCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardIcon}>🔗</span>
          <span className={styles.cardLabel}>Website URL</span>
          {config.websiteUrl && (
            <span className={styles.cardBadge}>Added ✓</span>
          )}
        </div>

        {editingField === 'websiteUrl' ? (
          <div className={styles.editContainer}>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="https://example.com"
              className={styles.editInput}
              autoFocus
            />
            <div className={styles.editActions}>
              <button onClick={handleSave} className={styles.saveBtn}>
                <FaCheck /> Save
              </button>
              <button onClick={handleCancel} className={styles.cancelBtn}>
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.displayContainer}>
            <span className={styles.displayValue}>
              {config.websiteUrl || 'Not added yet'}
            </span>
            <div className={styles.itemActions}>
              {!config.websiteUrl ? (
                <button 
                  onClick={() => handleEdit('websiteUrl', '')}
                  className={styles.addBtn}
                >
                  + Add
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleEdit('websiteUrl', config.websiteUrl)}
                    className={styles.iconBtn}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete('websiteUrl')}
                    className={styles.iconBtn}
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

     
     
    </div>
  );
};

export default BasicInfo;