import React, { useState, useRef, useEffect } from 'react';
import styles from './Step.module.css';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaTag, FaInfoCircle } from 'react-icons/fa';
// import { FaDollarSign } from 'react-icons/fa'; // Uncomment when price field is needed

const KnowledgeBase = ({ config, setConfig }) => {
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');
  // const [tempValuePrice, setTempValuePrice] = useState(''); // Uncomment when price field is needed
  const [tempValueDescription, setTempValueDescription] = useState('');
  const [tempValueTags, setTempValueTags] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [showRoleInput, setShowRoleInput] = useState(false);
  const [showValueInput, setShowValueInput] = useState(false);
  const [expandedValue, setExpandedValue] = useState(null);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    description: false
    // price: false // Uncomment when price field is needed
  });

  const roleInputRef = useRef(null);
  const valueInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  // const priceInputRef = useRef(null); // Uncomment when price field is needed

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

  // Helper to ensure value has proper structure
  const ensureValueStructure = (value) => {
    if (typeof value === 'object' && value !== null) {
      return {
        name: value.name || '',
        price: value.price || '', // Keep as is for existing data
        description: value.description || '',
        tags: Array.isArray(value.tags) ? value.tags : (value.tags ? [value.tags] : [])
      };
    }
    if (typeof value === 'string') {
      const match = value.match(/^(.*?)\s*-\s*(.*)$/);
      if (match) {
        return {
          name: match[1].trim(),
          price: match[2].trim(),
          description: '',
          tags: []
        };
      }
      return {
        name: value,
        price: '',
        description: '',
        tags: []
      };
    }
    return {
      name: String(value),
      price: '',
      description: '',
      tags: []
    };
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {
      name: !tempRoleValue.trim(),
      description: !tempValueDescription.trim()
      // price: !tempValuePrice.trim() // Uncomment when price field is needed
    };
    setValidationErrors(errors);
    return !errors.name && !errors.description; // && !errors.price; // Update when price field is needed
  };

  // Clear validation errors
  const clearValidationErrors = () => {
    setValidationErrors({
      name: false,
      description: false
      // price: false // Uncomment when price field is needed
    });
  };

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
      setSelectedRole(tempRole.trim());
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

  // Role Values Management with Description and Tags (Price commented)
  const addRoleValue = () => {
    if (selectedRole && validateForm()) {
      setConfig(prev => {
        const currentAifuture = prev.aifuture || [];
        const aifuture = [...currentAifuture];
        
        let roleIndex = aifuture.findIndex(item => item.title === selectedRole);
        
        if (roleIndex === -1) {
          aifuture.push({ title: selectedRole, value: [] });
          roleIndex = aifuture.length - 1;
        }
        
        const currentValues = aifuture[roleIndex].value || [];
        
        // Check if value with same name already exists
        const valueExists = currentValues.some(v => {
          const existing = ensureValueStructure(v);
          return existing.name === tempRoleValue.trim();
        });
        
        if (!valueExists) {
          const newValue = {
            name: tempRoleValue.trim(),
            price: '', // Price is optional/empty for now
            description: tempValueDescription.trim(),
            tags: tempValueTags.split(',').map(t => t.trim()).filter(t => t)
          };
          
          aifuture[roleIndex] = {
            ...aifuture[roleIndex],
            value: [...currentValues, newValue]
          };
        }
        
        return { ...prev, aifuture };
      });
      
      // Reset form
      setTempRoleValue('');
      // setTempValuePrice(''); // Uncomment when price field is needed
      setTempValueDescription('');
      setTempValueTags('');
      setShowValueInput(false);
      clearValidationErrors();
    }
  };

  const updateRoleValue = (role, oldValue, newValueData) => {
    setConfig(prev => {
      const aifuture = [...(prev.aifuture || [])];
      const roleIndex = aifuture.findIndex(item => item.title === role);
      
      if (roleIndex !== -1) {
        const values = [...(aifuture[roleIndex].value || [])];
        const oldValueObj = ensureValueStructure(oldValue);
        const valueIndex = values.findIndex(v => {
          const existing = ensureValueStructure(v);
          return existing.name === oldValueObj.name;
        });
        
        if (valueIndex !== -1) {
          const currentValue = ensureValueStructure(values[valueIndex]);
          values[valueIndex] = {
            name: newValueData.name !== undefined ? newValueData.name : currentValue.name,
            price: newValueData.price !== undefined ? newValueData.price : currentValue.price,
            description: newValueData.description !== undefined ? newValueData.description : currentValue.description,
            tags: newValueData.tags !== undefined 
              ? (Array.isArray(newValueData.tags) ? newValueData.tags : newValueData.tags.split(',').map(t => t.trim()).filter(t => t))
              : currentValue.tags
          };
          aifuture[roleIndex] = { ...aifuture[roleIndex], value: values };
        }
      }
      return { ...prev, aifuture };
    });
    setEditingValue(null);
    setTempRoleValue('');
    // setTempValuePrice(''); // Uncomment when price field is needed
    setTempValueDescription('');
    setTempValueTags('');
    clearValidationErrors();
  };

  const deleteRoleValue = (role, valueToDelete) => {
    setConfig(prev => {
      const aifuture = [...(prev.aifuture || [])];
      const roleIndex = aifuture.findIndex(item => item.title === role);
      
      if (roleIndex !== -1) {
        const valueObj = ensureValueStructure(valueToDelete);
        aifuture[roleIndex] = {
          ...aifuture[roleIndex],
          value: (aifuture[roleIndex].value || []).filter(v => {
            const existing = ensureValueStructure(v);
            return existing.name !== valueObj.name;
          })
        };
      }
      return { ...prev, aifuture };
    });
  };

  const startEditValue = (role, value) => {
    const valueObj = ensureValueStructure(value);
    setEditingValue({ role, value: valueObj });
    setTempRoleValue(valueObj.name);
    // setTempValuePrice(valueObj.price || ''); // Uncomment when price field is needed
    setTempValueDescription(valueObj.description || '');
    setTempValueTags((valueObj.tags || []).join(', '));
  };

  const saveEditValue = () => {
    if (editingValue) {
      updateRoleValue(editingValue.role, editingValue.value, {
        name: tempRoleValue,
        price: '', // Price is optional
        description: tempValueDescription,
        tags: tempValueTags
      });
    }
  };

  const cancelEditValue = () => {
    setEditingValue(null);
    setTempRoleValue('');
    // setTempValuePrice(''); // Uncomment when price field is needed
    setTempValueDescription('');
    setTempValueTags('');
    setShowValueInput(false);
    clearValidationErrors();
  };

  const toggleExpandValue = (valueName) => {
    setExpandedValue(expandedValue === valueName ? null : valueName);
  };

  const getRoleValues = (role) => {
    if (!role) return [];
    const roleItem = (config.aifuture || []).find(item => item.title === role);
    return roleItem ? (roleItem.value || []).map(v => ensureValueStructure(v)) : [];
  };

  // const updateValuePrice = (role, valueName, price) => { // Uncomment when price field is needed
  //   setConfig(prev => {
  //     const aifuture = [...(prev.aifuture || [])];
  //     const roleIndex = aifuture.findIndex(item => item.title === role);
  //     
  //     if (roleIndex !== -1) {
  //       const values = [...(aifuture[roleIndex].value || [])];
  //       const valueIndex = values.findIndex(v => {
  //         const existing = ensureValueStructure(v);
  //         return existing.name === valueName;
  //       });
  //       
  //       if (valueIndex !== -1) {
  //         const currentValue = ensureValueStructure(values[valueIndex]);
  //         values[valueIndex] = {
  //           ...currentValue,
  //           price: price
  //         };
  //         aifuture[roleIndex] = { ...aifuture[roleIndex], value: values };
  //       }
  //     }
  //     return { ...prev, aifuture };
  //   });
  // };

  return (
    <div className={styles.knowledgeBase}>
      <div className={styles.twoColumnLayout}>
        
        {/* Column 1: Roles */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>Roles</h3>
            <span className={styles.count}>{config.roles?.length || 0}</span>
          </div>
          
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

        {/* Column 2: Role Values with Description and Tags */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>
              Services
              {selectedRole && <span className={styles.selectedRoleName}> - {selectedRole}</span>}
            </h3>
            {selectedRole && (
              <span className={styles.count}>
                {getRoleValues(selectedRole).length}
              </span>
            )}
          </div>
          
          <div className={styles.columnContent}>
            {selectedRole ? (
              <div className={styles.itemsList}>
                {getRoleValues(selectedRole).length > 0 ? (
                  getRoleValues(selectedRole).map((value, index) => (
                    <div key={index} className={styles.valueCard}>
                      <div className={styles.valueHeader}>
                        <div className={styles.valueInfo}>
                          <span className={styles.valueName}>{value.name}</span>
                          {/* Price display - Commented out */}
                          {/* {value.price && (
                            <span className={styles.valuePrice}>{value.price}</span>
                          )} */}
                        </div>
                        <div className={styles.rowActions}>
                          <button 
                            onClick={() => toggleExpandValue(value.name)} 
                            className={styles.iconBtn}
                            title="View Details"
                          >
                            <FaInfoCircle />
                          </button>
                          <button 
                            onClick={() => startEditValue(selectedRole, value)} 
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => deleteRoleValue(selectedRole, value)} 
                            className={styles.iconBtn}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      {expandedValue === value.name && (
                        <div className={styles.valueDetails}>
                          {value.description && (
                            <div className={styles.descriptionSection}>
                              <strong>Description:</strong>
                              <p>{value.description}</p>
                            </div>
                          )}
                          {value.tags && value.tags.length > 0 && (
                            <div className={styles.tagsSection}>
                              <strong>Tags:</strong>
                              <div className={styles.tagsList}>
                                {value.tags.map((tag, idx) => (
                                  <span key={idx} className={styles.tag}>
                                    <FaTag /> {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {!value.description && (!value.tags || value.tags.length === 0) && (
                            <div className={styles.noDetails}>No additional details</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No services added for {selectedRole}</div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>Select a role to add services</div>
            )}
          </div>
          
          {/* Add Service Form with Description and Tags (Price commented) */}
          {selectedRole && (
            <div className={styles.columnFooter}>
              {!showValueInput ? (
                <button 
                  className={styles.addFooterBtn}
                  onClick={() => setShowValueInput(true)}
                >
                  <FaPlus /> Add Service
                </button>
              ) : (
                <div className={styles.addServiceForm}>
                  <input
                    ref={valueInputRef}
                    type="text"
                    value={tempRoleValue}
                    onChange={(e) => setTempRoleValue(e.target.value)}
                    placeholder="Service name *"
                    className={`${styles.serviceInput} ${validationErrors.name ? styles.errorInput : ''}`}
                  />
                  
                  {/* Price Field - Commented out */}
                  {/* <input
                    ref={priceInputRef}
                    type="text"
                    value={tempValuePrice}
                    onChange={(e) => setTempValuePrice(e.target.value)}
                    placeholder="Price * (e.g., $499, ₹999, Contact for pricing)"
                    className={`${styles.priceInput} ${validationErrors.price ? styles.errorInput : ''}`}
                  /> */}
                  
                  <textarea
                    ref={descriptionInputRef}
                    value={tempValueDescription}
                    onChange={(e) => setTempValueDescription(e.target.value)}
                    placeholder="Description * (Detailed description of the service)"
                    className={`${styles.descriptionInput} ${validationErrors.description ? styles.errorInput : ''}`}
                    rows="3"
                  />
                  
                  <input
                    type="text"
                    value={tempValueTags}
                    onChange={(e) => setTempValueTags(e.target.value)}
                    placeholder="Tags (comma separated, e.g., ecommerce, website, seo)"
                    className={styles.tagsInput}
                  />
                  
                  <div className={styles.formActions}>
                    <button onClick={addRoleValue} className={styles.addBtn}>
                      Add Service
                    </button>
                    <button onClick={cancelEditValue} className={styles.cancelBtn}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal for Service - Stays on top, only Cancel button closes */}
      {editingValue && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Edit Service</h3>
            <div className={styles.modalForm}>
              <label>Service Name *</label>
              <input
                type="text"
                value={tempRoleValue}
                onChange={(e) => setTempRoleValue(e.target.value)}
                placeholder="Service name"
                className={validationErrors.name ? styles.errorInput : ''}
              />
              
              {/* Price Field - Commented out */}
              {/* <label>Price *</label>
              <input
                type="text"
                value={tempValuePrice}
                onChange={(e) => setTempValuePrice(e.target.value)}
                placeholder="e.g., $499, ₹999, Contact for pricing"
                className={validationErrors.price ? styles.errorInput : ''}
              /> */}
              
              <label>Description *</label>
              <textarea
                value={tempValueDescription}
                onChange={(e) => setTempValueDescription(e.target.value)}
                placeholder="Detailed description of the service"
                rows="3"
                className={validationErrors.description ? styles.errorInput : ''}
              />
              
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={tempValueTags}
                onChange={(e) => setTempValueTags(e.target.value)}
                placeholder="e.g., ecommerce, web-development, seo"
              />
              
              <div className={styles.modalActions}>
                <button onClick={saveEditValue} className={styles.saveBtn}>
                  Save Changes
                </button>
                <button onClick={cancelEditValue} className={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;