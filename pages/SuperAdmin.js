'use client';
import React, { useState, useEffect } from 'react';
import WebsiteConfig from '../app/components/superadminauthorform/index';
import WebsiteList from '../app/components/superadminauthorlist/index';
import styles from './AdminPanel.module.css';
import config from '../app/components/utils/config';

const API_URL = `${config.apiBaseUrl}/api/websites`;

const AdminPanel = ({
  backendApiKey = config.backendApiKey
}) => {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [configData, setConfigData] = useState({
    websiteName: '',
    websiteUrl: '',
    category: [],
    systemPrompt: [],
    customPrompt: [],
    roles: [], // Array of role names ONLY (for role field)
    aifuture: [], // Array of {title: roleName, value: [...]}
    status: 'active'
  });

  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [tempCustomPrompt, setTempCustomPrompt] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');

  // Fetch all websites
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      
      
      
      const processedItems = (data.items || []).map(item => {
       
        
        return {
          ...item,
          roles: item.role || [], // Map database "role" field to "roles" in state
          aifuture: item.aifuture || []
        };
      });
      
     
      setItems(processedItems);
      setShowForm(processedItems.length === 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setConfigData({
      websiteName: '',
      websiteUrl: '',
      category: [],
      systemPrompt: [],
      customPrompt: [],
      roles: [],
      aifuture: [],
      status: 'active'
    });
    setTempSystemPrompt('');
    setTempCustomPrompt('');
    setTempCategory('');
    setTempRole('');
    setTempRoleValue('');
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleShowList = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

 

    // Prepare payload - roles should be separate array
    const payload = {
      websiteName: configData.websiteName,
      websiteUrl: configData.websiteUrl,
      category: configData.category,
      systemPrompt: configData.systemPrompt,
      customPrompt: configData.customPrompt,
      role: configData.roles, // Send as "role" field for database
      aifuture: configData.aifuture, // Send aifuture array
      status: configData.status
    };



    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendApiKey}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.error || 'Failed to save');
      }

      const responseData = await res.json();
     

      await fetchItems();
      resetForm();
      setShowForm(items.length === 0);
  
    } catch (err) {
      console.error('❌ Save error:', err);
      setError(err.message || 'Error saving data');
     
    } finally {
      setLoading(false);
    }
  };
const handleStatusChange = async (id, newStatus) => {
    console.log('Changing status for ID:', id, 'to:', newStatus);
    
    try {
      // Find the item
      const item = items.find((i) => i.id === id);
      if (!item) {
        console.error('Item not found with ID:', id);
        return;
      }

      // Prepare payload with all existing data + new status
      const payload = {
      
        status: newStatus,
        apiKey: item.apiKey
      };

   

      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendApiKey}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Backend error response:', errorData);
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Update local state immediately for better UX
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      
      console.log('Status updated successfully');
      
    } catch (err) {
      console.error('❌ Status update error:', err);
      setError(err.message || 'Error updating status');
    }
  };

  const handleEdit = (id) => {
    const item = items.find((i) => i.id === id);
    if (item) {
    
      
      setConfigData({
        websiteName: item.websiteName,
        websiteUrl: item.websiteUrl,
        category: item.category || [],
        systemPrompt: item.systemPrompt || [],
        customPrompt: item.customPrompt || [],
        roles: item.roles || [], // Use the mapped roles
        aifuture: item.aifuture || [],
        status: item.status || 'active',
        apiKey: item.apiKey
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
   
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${backendApiKey}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');

      await fetchItems();
      setShowForm(items.length === 1);
 
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.message || 'Delete error');
    
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>Super Admin Dashboard</h1>
        {!loading && items.length > 0 && !showForm && (
          <div className={styles.adminButtons}>
            <button className={styles.adminButton} onClick={handleAddNew}>
              Add New Website
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>Error: {error}</div>
      ) : (
        <div className={styles.adminContent}>
          {showForm ? (
            <WebsiteConfig
              config={configData}
              setConfig={setConfigData}
              tempSystemPrompt={tempSystemPrompt}
              setTempSystemPrompt={setTempSystemPrompt}
              tempCustomPrompt={tempCustomPrompt}
              setTempCustomPrompt={setTempCustomPrompt}
              tempCategory={tempCategory}
              setTempCategory={setTempCategory}
              tempRole={tempRole}
              setTempRole={setTempRole}
              tempRoleValue={tempRoleValue}
              setTempRoleValue={setTempRoleValue}
              onSubmit={handleSubmit}
              onCancel={handleShowList}
              hasItems={items.length > 0}
              websiteId={editingId}
              apiKey={configData.apiKey}
              backendApiKey={backendApiKey}
            />
          ) : (
            <WebsiteList
              websites={items}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddNew={handleAddNew}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;