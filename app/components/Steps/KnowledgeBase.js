import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

const KnowledgeBase = ({ config, setConfig }) => {
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [showRoleInput, setShowRoleInput] = useState(false);
  const [showValueInput, setShowValueInput] = useState(false);

  const roleInputRef = useRef(null);
  const valueInputRef = useRef(null);

  // Focus inputs
  useEffect(() => {
    if (showRoleInput && roleInputRef.current) {
      roleInputRef.current.focus();
    }
  }, [showRoleInput]);

  useEffect(() => {
    if (showValueInput && valueInputRef.current) {
      valueInputRef.current.focus();
    }
  }, [showValueInput]);

  // Initialize aifuture array if it doesn't exist
  useEffect(() => {
    if (!config.aifuture) {
      setConfig(prev => ({
        ...prev,
        aifuture: []
      }));
    }
  }, [config.aifuture, setConfig]);

  // Roles Management
  const addRole = () => {
    if (tempRole.trim() && !(config.roles || []).includes(tempRole.trim())) {
      setConfig(prev => ({
        ...prev,
        roles: [...(prev.roles || []), tempRole.trim()],
        aifuture: [...(prev.aifuture || []), { title: tempRole.trim(), value: [] }]
      }));
      setTempRole('');
      setShowRoleInput(false);
      setSelectedRole(tempRole.trim()); // Auto-select the new role
    }
  };

  const updateRole = (oldRole, newRole) => {
    if (newRole.trim() && newRole !== oldRole) {
      setConfig(prev => ({
        ...prev,
        roles: (prev.roles || []).map(r => r === oldRole ? newRole.trim() : r),
        aifuture: (prev.aifuture || []).map(item => 
          item.title === oldRole ? { ...item, title: newRole.trim() } : item
        )
      }));
      if (selectedRole === oldRole) {
        setSelectedRole(newRole.trim());
      }
    }
    setEditingRole(null);
    setTempRole('');
  };

  const deleteRole = (role) => {
    setConfig(prev => ({
      ...prev,
      roles: (prev.roles || []).filter(r => r !== role),
      aifuture: (prev.aifuture || []).filter(item => item.title !== role)
    }));
    if (selectedRole === role) {
      setSelectedRole('');
    }
  };

  const startEditRole = (role) => {
    setEditingRole(role);
    setTempRole(role);
  };

  const cancelEditRole = () => {
    setEditingRole(null);
    setTempRole('');
    setShowRoleInput(false);
  };

  // Role Values Management - FIXED VERSION
  const addRoleValue = () => {
    if (selectedRole && tempRoleValue.trim()) {
      setConfig(prev => {
        // Ensure aifuture exists
        const currentAifuture = prev.aifuture || [];
        const aifuture = [...currentAifuture];
        
        // Find the role index
        let roleIndex = aifuture.findIndex(item => item.title === selectedRole);
        
        // If role doesn't exist in aifuture, create it
        if (roleIndex === -1) {
          aifuture.push({ title: selectedRole, value: [] });
          roleIndex = aifuture.length - 1;
        }
        
        // Get current values (ensure it's an array)
        const currentValues = aifuture[roleIndex].value || [];
        
        // Add new value if it doesn't already exist
        if (!currentValues.includes(tempRoleValue.trim())) {
          aifuture[roleIndex] = {
            ...aifuture[roleIndex],
            value: [...currentValues, tempRoleValue.trim()]
          };
        }
        
        return { ...prev, aifuture };
      });
      setTempRoleValue('');
      setShowValueInput(false);
    }
  };

  const updateRoleValue = (role, oldValue, newValue) => {
    if (newValue.trim() && newValue !== oldValue) {
      setConfig(prev => {
        const aifuture = [...(prev.aifuture || [])];
        const roleIndex = aifuture.findIndex(item => item.title === role);
        
        if (roleIndex !== -1) {
          const values = aifuture[roleIndex].value || [];
          const valueIndex = values.findIndex(v => v === oldValue);
          if (valueIndex !== -1) {
            values[valueIndex] = newValue.trim();
            aifuture[roleIndex] = { ...aifuture[roleIndex], value: values };
          }
        }
        return { ...prev, aifuture };
      });
    }
    setEditingValue(null);
    setTempRoleValue('');
  };

  const deleteRoleValue = (role, value) => {
    setConfig(prev => {
      const aifuture = [...(prev.aifuture || [])];
      const roleIndex = aifuture.findIndex(item => item.title === role);
      
      if (roleIndex !== -1) {
        aifuture[roleIndex] = {
          ...aifuture[roleIndex],
          value: (aifuture[roleIndex].value || []).filter(v => v !== value)
        };
      }
      return { ...prev, aifuture };
    });
  };

  const startEditValue = (role, value) => {
    setEditingValue({ role, value });
    setTempRoleValue(value);
  };

  const cancelEditValue = () => {
    setEditingValue(null);
    setTempRoleValue('');
    setShowValueInput(false);
  };

  const getRoleValues = (role) => {
    if (!role) return [];
    const roleItem = (config.aifuture || []).find(item => item.title === role);
    // Ensure we always return an array, even if value is undefined/null
    return roleItem ? (roleItem.value || []) : [];
  };

  return (
    <div className={styles.knowledgeBase}>
      <div className={styles.twoColumnLayout}>
        
        {/* Column 1: Roles */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>Roles</h3>
            <span className={styles.count}>{config.roles?.length || 0}</span>
          </div>
          
          {/* Scrollable Roles List */}
          <div className={styles.columnContent}>
            <div className={styles.itemsList}>
              {config.roles && config.roles.length > 0 ? (
                config.roles.map((role, index) => (
                  <div 
                    key={index} 
                    className={`${styles.itemRow} ${selectedRole === role ? styles.selectedRow : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    {editingRole === role ? (
                      <div className={styles.editRow}>
                        <input
                          ref={roleInputRef}
                          type="text"
                          value={tempRole}
                          onChange={(e) => setTempRole(e.target.value)}
                          onBlur={() => updateRole(role, tempRole)}
                          onKeyPress={(e) => e.key === 'Enter' && updateRole(role, tempRole)}
                          className={styles.editInput}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => updateRole(role, tempRole)} className={styles.saveBtn}>
                            <FaCheck />
                          </button>
                          <button onClick={cancelEditRole} className={styles.cancelBtn}>
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={styles.itemText}>
                          {role} {selectedRole === role && <span className={styles.selectedIndicator}>✓</span>}
                        </span>
                        <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => startEditRole(role)} className={styles.iconBtn}>
                            <FaEdit />
                          </button>
                          <button onClick={() => deleteRole(role)} className={styles.iconBtn}>
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No roles added</div>
              )}
            </div>
          </div>
          
          {/* Fixed Add Button at Bottom */}
          <div className={styles.columnFooter}>
            {!showRoleInput ? (
              <button 
                className={styles.addFooterBtn}
                onClick={() => setShowRoleInput(true)}
              >
                <FaPlus /> Add Role
              </button>
            ) : (
              <div className={styles.addInputFooter}>
                <input
                  ref={roleInputRef}
                  type="text"
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  placeholder="Enter role name"
                  onKeyPress={(e) => e.key === 'Enter' && addRole()}
                />
                <button onClick={addRole} className={styles.addBtn} disabled={!tempRole.trim()}>
                  Add
                </button>
                <button onClick={cancelEditRole} className={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Role Values */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>
              Role Values
              {selectedRole && <span className={styles.selectedRoleName}> - {selectedRole}</span>}
            </h3>
            {selectedRole && (
              <span className={styles.count}>
                {getRoleValues(selectedRole).length}
              </span>
            )}
          </div>
          
          {/* Values List */}
          <div className={styles.columnContent}>
            {selectedRole ? (
              <div className={styles.itemsList}>
                {getRoleValues(selectedRole).length > 0 ? (
                  getRoleValues(selectedRole).map((value, index) => (
                    <div key={index} className={styles.itemRow}>
                      {editingValue?.role === selectedRole && editingValue?.value === value ? (
                        <div className={styles.editRow}>
                          <input
                            ref={valueInputRef}
                            type="text"
                            value={tempRoleValue}
                            onChange={(e) => setTempRoleValue(e.target.value)}
                            onBlur={() => updateRoleValue(selectedRole, value, tempRoleValue)}
                            onKeyPress={(e) => e.key === 'Enter' && updateRoleValue(selectedRole, value, tempRoleValue)}
                            className={styles.editInput}
                          />
                          <div className={styles.rowActions}>
                            <button onClick={() => updateRoleValue(selectedRole, value, tempRoleValue)} className={styles.saveBtn}>
                              <FaCheck />
                            </button>
                            <button onClick={cancelEditValue} className={styles.cancelBtn}>
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className={styles.itemText}>{value}</span>
                          <div className={styles.rowActions}>
                            <button onClick={() => startEditValue(selectedRole, value)} className={styles.iconBtn}>
                              <FaEdit />
                            </button>
                            <button onClick={() => deleteRoleValue(selectedRole, value)} className={styles.iconBtn}>
                              <FaTrash />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No values added for {selectedRole}</div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>Select a role to add values</div>
            )}
          </div>
          
          {/* Fixed Add Button at Bottom - Always show when role selected */}
          {selectedRole && (
            <div className={styles.columnFooter}>
              {!showValueInput ? (
                <button 
                  className={styles.addFooterBtn}
                  onClick={() => setShowValueInput(true)}
                >
                  <FaPlus /> Add Value
                </button>
              ) : (
                <div className={styles.addInputFooter}>
                  <input
                    ref={valueInputRef}
                    type="text"
                    value={tempRoleValue}
                    onChange={(e) => setTempRoleValue(e.target.value)}
                    placeholder={`Enter value for ${selectedRole}`}
                    onKeyPress={(e) => e.key === 'Enter' && addRoleValue()}
                  />
                  <button onClick={addRoleValue} className={styles.addBtn} disabled={!tempRoleValue.trim()}>
                    Add
                  </button>
                  <button onClick={cancelEditValue} className={styles.cancelBtn}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;