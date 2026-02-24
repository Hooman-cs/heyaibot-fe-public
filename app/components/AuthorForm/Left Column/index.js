import React, { useState } from 'react';
import styles from './ConfigForm.module.css';
import { FaPlus, FaChevronDown } from 'react-icons/fa';

const ConfigForm = ({
  config,
  setConfig,
  tempSystemPrompt,
  setTempSystemPrompt,
  tempCustomPrompt,
  setTempCustomPrompt,
  tempCategory,
  setTempCategory,
  tempRole,
  setTempRole,
  tempRoleValue,
  setTempRoleValue,
  selectedRole,
  setSelectedRole,
  addCategory,
  addSystemPrompt,
  addCustomPrompt,
  addRole,
  addRoleValue,
  getRoleValues,
  errors
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch(type) {
        case 'category':
          addCategory();
          break;
        case 'customPrompt':
          addCustomPrompt();
          break;
        case 'role':
          addRole();
          break;
        case 'roleValue':
          addRoleValue();
          break;
        default:
          break;
      }
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setShowDropdown(false);
  };

  return (
    <div className={styles.formColumn}>
      {/* Website Name */}
      <div className={styles.formGroup}>
        <label>Website/App Name</label>
        <input
          type="text"
          value={config.websiteName}
          onChange={(e) => setConfig({ ...config, websiteName: e.target.value })}
          placeholder="Tech Support"
          className={errors.websiteName ? styles.errorInput : ''}
        />
        {errors.websiteName && <p className={styles.errorText}>{errors.websiteName}</p>}
      </div>

      {/* Website URL */}
      <div className={styles.formGroup}>
        <label>Website URL</label>
        <input
          type="text"
          value={config.websiteUrl}
          onChange={(e) => setConfig({ ...config, websiteUrl: e.target.value })}
          placeholder="https://itglobal.com"
          className={errors.websiteUrl ? styles.errorInput : ''}
        />
        {errors.websiteUrl && <p className={styles.errorText}>{errors.websiteUrl}</p>}
      </div>

      {/* Category */}
      <div className={styles.formGroup}>
        <label>Categories</label>
        <div className={styles.inputWithButton}>
          <input
            type="text"
            value={tempCategory}
            onChange={(e) => setTempCategory(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'category')}
            placeholder="Add Category"
            className={errors.category ? styles.errorInput : ''}
          />
          <button onClick={addCategory} className={styles.addButton}>
            + Add Category
          </button>
        </div>
        {errors.category && <p className={styles.errorText}>{errors.category}</p>}
      </div>

      {/* Roles */}
      <div className={styles.formGroup}>
        <label>Roles</label>
        <div className={styles.inputWithButton}>
          <input
            type="text"
            value={tempRole}
            onChange={(e) => setTempRole(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'role')}
            placeholder="Add Role"
          />
          <button onClick={addRole} className={styles.addButton} disabled={!tempRole.trim()}>
            + Add Role
          </button>
        </div>
      </div>

      {/* Role Dropdown */}
      {config.roles && config.roles.length > 0 && (
        <div className={styles.formGroup}>
          <label>Select Role</label>
          <div className={styles.dropdown}>
            <button
              className={styles.dropdownButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{selectedRole || '--Select a Role--'}</span>
              <FaChevronDown className={`${styles.dropdownIcon} ${showDropdown ? styles.rotated : ''}`} />
            </button>
            
            {showDropdown && (
              <div className={styles.dropdownMenu}>
                {config.roles.map((role, index) => (
                  <div
                    key={index}
                    className={`${styles.dropdownItem} ${selectedRole === role ? styles.selected : ''}`}
                    onClick={() => handleSelectRole(role)}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Values */}
      {selectedRole && (
        <div className={styles.formGroup}>
          <label>Values for {selectedRole}</label>
          <div className={styles.inputWithButton}>
            <input
              type="text"
              value={tempRoleValue}
              onChange={(e) => setTempRoleValue(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'roleValue')}
              placeholder="Add value"
            />
            <button onClick={addRoleValue} className={styles.addButton} disabled={!tempRoleValue.trim()}>
              + Add Value
            </button>
          </div>
        </div>
      )}

      {/* System Prompt */}
      <div className={styles.formGroup}>
        <label>System Prompt</label>
        <textarea
          value={tempSystemPrompt}
          onChange={(e) => setTempSystemPrompt(e.target.value)}
          placeholder="Hello! Need help with software development or tech solutions? I'm here to assist! Please type your query or select from below:"
          rows="4"
          className={errors.systemPrompt ? styles.errorInput : ''}
        />
        <button onClick={addSystemPrompt} className={styles.addButton2}>
          <FaPlus /> Add
        </button>
        {errors.systemPrompt && <p className={styles.errorText}>{errors.systemPrompt}</p>}
      </div>

      {/* Custom Prompt */}
      <div className={styles.formGroup}>
        <label>Custom Prompt</label>
        <div className={styles.inputWithButton}>
          <input
            type="text"
            value={tempCustomPrompt}
            onChange={(e) => setTempCustomPrompt(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'customPrompt')}
            placeholder="IT Consulting"
            className={errors.customPrompt ? styles.errorInput : ''}
          />
          <button onClick={addCustomPrompt} className={styles.addButton}>
            + Add
          </button>
        </div>
        {errors.customPrompt && <p className={styles.errorText}>{errors.customPrompt}</p>}
      </div>
    </div>
  );
};

export default ConfigForm;