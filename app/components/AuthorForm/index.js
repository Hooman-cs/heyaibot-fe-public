import React, { useState, useEffect } from 'react';
import styles from './AuthorForm.module.css';
import ConfigForm from './Left Column';
import PreviewPanel from './Right Column';

const WebsiteConfig = ({
  config,
  setConfig,
  tempSystemPrompt,
  setTempSystemPrompt,
  tempCustomPrompt,
  setTempCustomPrompt,
  tempCategory,
  setTempCategory,
  onSubmit,
  onCancel,
  hasItems,
  websiteId,
  apiKey,
  backendApiKey
}) => {
  const [errors, setErrors] = useState({
    websiteName: '',
    websiteUrl: '',
    category: '',
    systemPrompt: '',
    customPrompt: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [editingRole, setEditingRole] = useState({ name: '', newName: '' });
  const [editingRoleValue, setEditingRoleValue] = useState({ role: '', index: null, value: '' });

  // Debug: Monitor config changes

 
  const validateForm = () => {
    const newErrors = {
      websiteName: !config.websiteName.trim() ? 'Website Name is required' : '',
      websiteUrl: !config.websiteUrl.trim() ? 'Website URL / App Name is required' : '',
      category: config.category.length === 0 ? 'At least one Category is required' : '',
      systemPrompt: config.systemPrompt.length === 0 ? 'At least one System Prompt is required' : '',
      customPrompt: config.customPrompt.length === 0 ? 'At least one Custom Prompt is required' : ''
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await onSubmit(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    setConfig({
      websiteName: '',
      websiteUrl: '',
      category: [],
      systemPrompt: [],
      customPrompt: [],
      roles: [],
      aifuture: []
    });
    setTempSystemPrompt('');
    setTempCustomPrompt('');
    setTempCategory('');
    setTempRole('');
    setTempRoleValue('');
    setSelectedRole('');
    setErrors({
      websiteName: '',
      websiteUrl: '',
      category: '',
      systemPrompt: '',
      customPrompt: ''
    });
    onCancel();
  };

  // Category Management
  const handleAddCategory = () => {
    if (tempCategory.trim()) {
      const newCategory = tempCategory.trim();
      
      setConfig(prev => ({
        ...prev,
        category: [...prev.category, newCategory]
      }));
      
      setTempCategory('');
      setErrors(prev => ({...prev, category: ''}));
    }
  };

  const handleRemoveCategory = (index) => {
    const newList = [...config.category];
    newList.splice(index, 1);
    setConfig({ ...config, category: newList });
    setErrors(prev => ({
      ...prev, 
      category: newList.length === 0 ? 'At least one Category is required' : ''
    }));
  };

  // System Prompt Management
  const handleAddSystemPrompt = () => {
    if (tempSystemPrompt.trim()) {
      const newPrompt = tempSystemPrompt.trim();
      
      setConfig(prev => ({
        ...prev,
        systemPrompt: [...prev.systemPrompt, newPrompt]
      }));
      
      setTempSystemPrompt('');
      setErrors(prev => ({...prev, systemPrompt: ''}));
    }
  };

  const handleRemoveSystemPrompt = (index) => {
    const newList = [...config.systemPrompt];
    newList.splice(index, 1);
    setConfig({ ...config, systemPrompt: newList });
    setErrors(prev => ({
      ...prev, 
      systemPrompt: newList.length === 0 ? 'At least one System Prompt is required' : ''
    }));
  };

  // Custom Prompt Management
  const handleAddCustomPrompt = () => {
    if (tempCustomPrompt.trim()) {
      const newPrompt = tempCustomPrompt.trim();
      
      setConfig(prev => ({
        ...prev,
        customPrompt: [...prev.customPrompt, newPrompt]
      }));
      
      setTempCustomPrompt('');
      setErrors(prev => ({...prev, customPrompt: ''}));
    }
  };

  const handleRemoveCustomPrompt = (index) => {
    const newList = [...config.customPrompt];
    newList.splice(index, 1);
    setConfig({ ...config, customPrompt: newList });
    setErrors(prev => ({
      ...prev, 
      customPrompt: newList.length === 0 ? 'At least one Custom Prompt is required' : ''
    }));
  };

  // ROLE MANAGEMENT - FIXED: Add to both roles array and aifuture
  const handleAddRole = () => {
    if (tempRole.trim()) {
      const newRole = tempRole.trim();
     
      
      setConfig(prev => {
        const currentRoles = prev.roles || [];
        const currentAifuture = prev.aifuture || [];
        
        // Check if role already exists
        if (!currentRoles.includes(newRole)) {
          // Add to roles array
          const updatedRoles = [...currentRoles, newRole];
          
          // Add to aifuture array if not already exists
          let updatedAifuture = [...currentAifuture];
          const existingInAifuture = currentAifuture.find(item => item.title === newRole);
          
          if (!existingInAifuture) {
            updatedAifuture.push({
              title: newRole,
              value: []
            });
          }
          
       
          
          return {
            ...prev,
            roles: updatedRoles,
            aifuture: updatedAifuture
          };
        }
        return prev;
      });
      
      setTempRole('');
      setSelectedRole(newRole); // Auto-select the newly added role
    }
  };

  const handleRemoveRole = (roleName) => {
   
     
      
      setConfig(prev => {
        // Remove role from roles array
        const currentRoles = prev.roles || [];
        const updatedRoles = currentRoles.filter(r => r !== roleName);
        
        // Remove role from aifuture (role values)
        const currentAifuture = prev.aifuture || [];
        const updatedAifuture = currentAifuture.filter(item => item.title !== roleName);
        
       
        
        return {
          ...prev,
          roles: updatedRoles,
          aifuture: updatedAifuture
        };
      });
      
      if (selectedRole === roleName) {
        setSelectedRole('');
      }
    
  };

  const handleStartEditRole = (roleName) => {
    setEditingRole({ name: roleName, newName: roleName });
  };

  const handleSaveEditRole = () => {
    if (editingRole.newName.trim() && editingRole.newName !== editingRole.name) {
      const newRoleName = editingRole.newName.trim();
      
      
      setConfig(prev => {
        const currentRoles = prev.roles || [];
        const currentAifuture = prev.aifuture || [];
        
        // Update role in roles array
        const updatedRoles = currentRoles.map(r => 
          r === editingRole.name ? newRoleName : r
        );
        
        // Update role title in aifuture
        const updatedAifuture = currentAifuture.map(item => 
          item.title === editingRole.name 
            ? { ...item, title: newRoleName }
            : item
        );
        
      
        
        return {
          ...prev,
          roles: updatedRoles,
          aifuture: updatedAifuture
        };
      });
      
      if (selectedRole === editingRole.name) {
        setSelectedRole(newRoleName);
      }
      
      setEditingRole({ name: '', newName: '' });
    }
  };

  // ROLE VALUE MANAGEMENT
  const handleAddRoleValue = () => {
    if (selectedRole && tempRoleValue.trim()) {
      const newValue = tempRoleValue.trim();
     
      
      setConfig(prev => {
        const currentAifuture = prev.aifuture || [];
        let updatedAifuture = [...currentAifuture];
        
        const roleIndex = updatedAifuture.findIndex(item => item.title === selectedRole);
        
        if (roleIndex !== -1) {
          // Update existing role values
          const existingValues = updatedAifuture[roleIndex].value || [];
          
          // Avoid duplicate values
          if (!existingValues.includes(newValue)) {
            updatedAifuture[roleIndex] = {
              ...updatedAifuture[roleIndex],
              value: [...existingValues, newValue]
            };
          }
        } else {
          // Create new role entry in aifuture
          updatedAifuture.push({
            title: selectedRole,
            value: [newValue]
          });
        }
        
      
        
        return {
          ...prev,
          aifuture: updatedAifuture
        };
      });
      
      setTempRoleValue('');
    }
  };

  const handleStartEditRoleValue = (roleName, index, value) => {
    setEditingRoleValue({ role: roleName, index, value });
  };

  const handleSaveEditRoleValue = () => {
    if (editingRoleValue.value.trim() && editingRoleValue.role) {
    
      
      setConfig(prev => {
        const currentAifuture = prev.aifuture || [];
        const roleIndex = currentAifuture.findIndex(item => item.title === editingRoleValue.role);
        
        if (roleIndex !== -1) {
          const updatedAifuture = [...currentAifuture];
          const values = updatedAifuture[roleIndex].value || [];
          
          if (editingRoleValue.index !== null && values[editingRoleValue.index]) {
            values[editingRoleValue.index] = editingRoleValue.value.trim();
            updatedAifuture[roleIndex] = {
              ...updatedAifuture[roleIndex],
              value: values
            };
            
            return {
              ...prev,
              aifuture: updatedAifuture
            };
          }
        }
        
        return prev;
      });
      
      setEditingRoleValue({ role: '', index: null, value: '' });
    }
  };

  const handleRemoveRoleValue = (roleName, value) => {
 
     
      
      setConfig(prev => {
        const currentAifuture = prev.aifuture || [];
        const roleIndex = currentAifuture.findIndex(item => item.title === roleName);
        
        if (roleIndex !== -1) {
          const updatedAifuture = [...currentAifuture];
          const values = updatedAifuture[roleIndex].value || [];
          const filteredValues = values.filter(val => val !== value);
          
          updatedAifuture[roleIndex] = {
            ...updatedAifuture[roleIndex],
            value: filteredValues
          };
          
          return {
            ...prev,
            aifuture: updatedAifuture
          };
        }
        
        return prev;
      });
    
  };

  // Get role values for a specific role
  const getRoleValues = (roleName) => {
    if (!config.aifuture || !Array.isArray(config.aifuture)) return [];
    const roleItem = config.aifuture.find(item => item.title === roleName);
    return roleItem ? roleItem.value : [];
  };

  // Convert aifuture array to roleValues object for PreviewPanel
  const roleValues = {};
  if (config.aifuture && Array.isArray(config.aifuture)) {
    config.aifuture.forEach(item => {
      if (item.title && item.value) {
        roleValues[item.title] = item.value;
      }
    });
  }

  return (
    <div className={styles.configContainer}>
      <div className={styles.configHeader}>
        <h1 className={styles.configTitle}>
          {websiteId ? 'Edit Website' : 'Add Website'}
        </h1>
        <div className={styles.headerButtons}>
          <button 
            className={styles.cancelButton} 
            onClick={handleCancelClick}
            disabled={isLoading}
          >
            {hasItems ? 'Back to List' : 'Cancel'}
          </button>
          <button 
            className={styles.submitButton} 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className={styles.column}>
        <ConfigForm
          config={config}
          setConfig={setConfig}
          tempSystemPrompt={tempSystemPrompt}
          setTempSystemPrompt={setTempSystemPrompt}
          tempCustomPrompt={tempCustomPrompt}
          setTempCustomPrompt={setTempCustomPrompt}
          tempCategory={tempCategory}
          setTempCategory={setTempCategory}
          // Role management props
          tempRole={tempRole}
          setTempRole={setTempRole}
          tempRoleValue={tempRoleValue}
          setTempRoleValue={setTempRoleValue}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          // Add functions
          addCategory={handleAddCategory}
          addSystemPrompt={handleAddSystemPrompt}
          addCustomPrompt={handleAddCustomPrompt}
          addRole={handleAddRole}
          addRoleValue={handleAddRoleValue}
          getRoleValues={getRoleValues}
          errors={errors}
        />

        <PreviewPanel
          key={`preview-${JSON.stringify(config.roles)}-${JSON.stringify(config.aifuture)}`}
          websiteId={websiteId}
          categories={config.category || []}
          systemPrompts={config.systemPrompt || []}
          customPrompts={config.customPrompt || []}
          roles={config.roles || []} // Pass roles array directly
          roleValues={roleValues}
          setConfig={setConfig}
          apiKey={apiKey}
          backendApiKey={backendApiKey}
          // Remove functions
          removeCategory={handleRemoveCategory}
          removeSystemPrompt={handleRemoveSystemPrompt}
          removeCustomPrompt={handleRemoveCustomPrompt}
          // Role management functions
          removeRole={handleRemoveRole}
          updateRoleName={handleStartEditRole}
          updateRoleValue={handleStartEditRoleValue}
          removeRoleValue={handleRemoveRoleValue}
          // Editing states
          editingRole={editingRole}
          setEditingRole={setEditingRole}
          handleSaveEditRole={handleSaveEditRole}
          editingRoleValue={editingRoleValue}
          setEditingRoleValue={setEditingRoleValue}
          handleSaveEditRoleValue={handleSaveEditRoleValue}
          // Selected role for dropdown sync
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />
      </div>
    </div>
  );
};

export default WebsiteConfig;