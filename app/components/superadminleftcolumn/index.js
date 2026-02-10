import React, { useState, useEffect, useRef } from 'react';
import styles from './ConfigForm.module.css';
import { FaPlus, FaChevronDown, FaEdit, FaTrash } from 'react-icons/fa';

const ConfigForm = ({
  config,
  setConfig,
  tempSystemPrompt,
  setTempSystemPrompt,
  tempCustomPrompt,
  setTempCustomPrompt,
  tempCategory,
  setTempCategory,
  // New role and value props
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
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Get values for selected role
  const selectedRoleValues = selectedRole ? getRoleValues?.(selectedRole) || [] : [];

  return (
    <div className={styles.formColumn}>
      {/* Website Name */}
      <div className={styles.formGroup}>
        <label htmlFor="websiteName">Website Name/App Name</label>
        <input
          type="text"
          id="websiteName"
          value={config.websiteName}
          onChange={(e) => {
            setConfig({ ...config, websiteName: e.target.value });
          }}
          placeholder="Enter website name"
          className={errors.websiteName ? styles.errorInput : ''}
        />
        {errors.websiteName && <p className={styles.errorText}>{errors.websiteName}</p>}
      </div>

      {/* Website URL / App Name */}
      <div className={styles.formGroup}>
        <label htmlFor="websiteUrl">Website URL</label>
        <input
          type="text"
          id="websiteUrl"
          value={config.websiteUrl}
          onChange={(e) => {
            setConfig({ ...config, websiteUrl: e.target.value });
          }}
          placeholder="https://example.com"
          className={errors.websiteUrl ? styles.errorInput : ''}
        />
        {errors.websiteUrl && <p className={styles.errorText}>{errors.websiteUrl}</p>}
      </div>

      {/* Category */}
      <div className={styles.formGroup}>
        <label htmlFor="category">Category</label>
        <div className={styles.keywordInput}>
          <input
            type="text"
            id="category"
            value={tempCategory}
            onChange={(e) => {
              setTempCategory(e.target.value);
            }}
            onKeyPress={(e) => handleKeyPress(e, 'category')}
            placeholder="Enter category"
            className={errors.category ? styles.errorInput : ''}
          />
          <button
            type="button"
            className={styles.addButton1}
            onClick={() => {
              addCategory();
            }}
          >
            <FaPlus style={{ marginRight: '6px' }} /> Add
          </button>
        </div>
        {errors.category && <p className={styles.errorText}>{errors.category}</p>}
      </div>

      {/* Role Management Section */}
      <div className={styles.formGroup}>
        <label className={styles.roleManagementLabel}>Role Management</label>
        
        {/* Add New Role */}
        <div className={styles.keywordInput}>
          <input
            type="text"
            value={tempRole}
            onChange={(e) => setTempRole(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'role')}
            placeholder="Enter new role"
          />
          <button
            type="button"
            className={styles.addButton1}
            onClick={addRole}
            disabled={!tempRole.trim()}
          >
            <FaPlus style={{ marginRight: '6px' }} /> Add 
          </button>
        </div>

        {/* Role Selection Dropdown - ALWAYS SHOW */}
        <div className={styles.formGroup}>
          <div className={styles.roleHeader}>
            <label className={styles.roleLabel}>Select Role</label>
            <div className={styles.dropdownContainer} ref={dropdownRef}>
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => {
                  // Only open dropdown if there are roles
                  if (config.roles && config.roles.length > 0) {
                    setShowDropdown(!showDropdown);
                  }
                }}
                aria-expanded={showDropdown}
                aria-haspopup="listbox"
                disabled={!config.roles || config.roles.length === 0}
              >
                <span className={styles.selectedText}>
                  {selectedRole || 
                   (config.roles && config.roles.length > 0 ? '--Select a Role--' : '--No Roles--')}
                </span>
                <FaChevronDown 
                  className={`${styles.dropdownIcon} ${showDropdown ? styles.rotated : ''} ${
                    (!config.roles || config.roles.length === 0) ? styles.disabledIcon : ''
                  }`} 
                  aria-hidden="true"
                />
              </button>
              
              {showDropdown && config.roles && config.roles.length > 0 && (
                <div 
                  className={styles.dropdownMenu}
                  role="listbox"
                  aria-label="Select a role"
                >
                  {config.roles.map((role, index) => (
                    <div
                      key={index}
                      className={`${styles.dropdownItem} ${
                        selectedRole === role ? styles.selected : ''
                      }`}
                      onClick={() => handleSelectRole(role)}
                      role="option"
                      aria-selected={selectedRole === role}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelectRole(role);
                        }
                      }}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Values for Selected Role - Only show when a role is selected */}
        {selectedRole ? (
          <div className={styles.formGroup}>
            <div className={styles.selectedRoleHeader}>
              <label className={styles.roleManagementLabel}>
                {selectedRole}
              </label>
              <div className={styles.keywordInput}>
                <input
                  type="text"
                  value={tempRoleValue}
                  onChange={(e) => setTempRoleValue(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'roleValue')}
                  placeholder={`Enter value for ${selectedRole}`}
                />
                <button
                  type="button"
                  className={styles.addButton1}
                  onClick={addRoleValue}
                  disabled={!tempRoleValue.trim()}
                >
                  <FaPlus style={{ marginRight: '6px' }} /> Add 
                </button>
              </div>
            </div>

            
           
          </div>
        ) : (
          // Show disabled input when no role is selected
          <div className={styles.formGroup}>
            <div className={styles.selectedRoleHeader}>
              <label className={styles.roleManagementLabel}>
                No Role Selected
              </label>
              <div className={styles.keywordInput}>
                <input
                  type="text"
                  value=""
                  placeholder="Select a role first"
                  disabled={true}
                  className={styles.disabledInput}
                />
                <button
                  type="button"
                  className={`${styles.addButton1} ${styles.disabledButton}`}
                  disabled={true}
                >
                  <FaPlus style={{ marginRight: '6px' }} /> Add 
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div className={styles.formGroup}>
        <label htmlFor="systemPrompt">System Prompt</label>
        <textarea
          id="systemPrompt"
          value={tempSystemPrompt}
          onChange={(e) => {
            setTempSystemPrompt(e.target.value);
          }}
          placeholder="Enter system prompt"
          rows="3"
          className={errors.systemPrompt ? styles.errorInput : ''}
        />
        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            addSystemPrompt();
          }}
        >
          <FaPlus style={{ marginRight: '6px' }} /> Add
        </button>
        {errors.systemPrompt && <p className={styles.errorText}>{errors.systemPrompt}</p>}
      </div>

      {/* Custom Prompt */}
      <div className={styles.formGroup}>
        <label htmlFor="customPrompt">Custom Prompt</label>
        <div className={styles.keywordInput}>
          <input
            type="text"
            id="customPrompt"
            value={tempCustomPrompt}
            onChange={(e) => {
              setTempCustomPrompt(e.target.value);
            }}
            onKeyPress={(e) => handleKeyPress(e, 'customPrompt')}
            placeholder="Enter custom prompt"
            className={errors.customPrompt ? styles.errorInput : ''}
          />
          <button
            type="button"
            className={styles.addButton1}
            onClick={() => {
              addCustomPrompt();
            }}
          >
            <FaPlus style={{ marginRight: '6px' }} /> Add
          </button>
        </div>
        {errors.customPrompt && <p className={styles.errorText}>{errors.customPrompt}</p>}
      </div>
    </div>
  );
};

export default ConfigForm;