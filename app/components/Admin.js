'use client';
import React, { useState, useEffect } from 'react';
import WebsiteConfig from './authorfromsuperadmin';
import WebsiteList from './SAdmin/index';
import styles from '../../pages/AdminPanel.module.css';
import config from './utils/config';
import { useRouter, useParams } from 'next/navigation';

const API_URL = `${config.apiBaseUrl}/api/websites`;
const CONFIG_API = `${config.apiBaseUrl}/code-config`;

const AdminPanel = () => {
  const router = useRouter();
  const params = useParams();
  
  const urlBackendApiKey = params.backendApiKey;
  const finalBackendApiKey = urlBackendApiKey || config.backendApiKey;

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configError, setConfigError] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('checking');

  const [configData, setConfigData] = useState({
    websiteName: '',
    websiteUrl: '',
    category: [],
    systemPrompt: [],
    customPrompt: [],
    status: 'active',
    roles: [], // Array of role names ONLY (for role field)
    aifuture: [], // Array of {title: roleName, value: [...]}
  });

  const [formData, setFormData] = useState({
    superAdminUrl: '',
    superAdminChatUrl: '',
    integrationCode: ''
  });
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  
  // Temp states for adding items
  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [tempCustomPrompt, setTempCustomPrompt] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');

  // ✅ Fetch Configuration for specific API key
  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      setConfigError('');
      
      if (!finalBackendApiKey) {
       
        setHasExistingConfig(false);
        return;
      }

      const response = await fetch(`${CONFIG_API}/${finalBackendApiKey}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Configuration doesn't exist yet
         
          setHasExistingConfig(false);
          return;
        }
        throw new Error(`Failed to fetch configuration: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setFormData({
          superAdminUrl: result.data.superAdminUrl || '',
          superAdminChatUrl: result.data.superAdminChatUrl || '',
          integrationCode: result.data.integrationCode || ''
        });
        setHasExistingConfig(true);
     
      } else {
        setHasExistingConfig(false);
      
      }
    } catch (err) {
      console.error('Error fetching configuration:', err);
      setConfigError('Failed to load existing configuration');
      setHasExistingConfig(false);
    } finally {
      setConfigLoading(false);
    }
  };

  // ✅ Fetch websites by backendApiKey
  const fetchItems = async () => {
    setLoading(true);
    try {
      if (!finalBackendApiKey) {
        throw new Error('Backend API Key is required');
      }

    
      
      const res = await fetch(`${API_URL}?apiKey=${encodeURIComponent(finalBackendApiKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
     
      
      if (data.success && data.item) {
        const websiteData = data.item;
        
        // Process the data to map fields correctly
        const processedItem = {
          ...websiteData,
          roles: websiteData.role || [], // Map database "role" field to "roles" in state
          aifuture: websiteData.aifuture || []
        };
        
      
        
        if (websiteData.status === 'active') {
          setItems([processedItem]);
          setWebsiteStatus('active');
          setShowForm(false);
        } else {
          setItems([processedItem]);
          setWebsiteStatus('inactive');
          setShowForm(false);
        
        }
      } else if (data.success && !data.item) {
        setItems([]);
        setWebsiteStatus('not_found');
        setShowForm(true);
      
      } else {
        throw new Error(data.error || 'No website data found');
      }
    } catch (err) {
      console.error('❌ Error fetching website:', err);
      setError(err.message || 'Failed to fetch data');
      setItems([]);
      setWebsiteStatus('error');
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Run both API calls when key changes
  useEffect(() => {
    fetchItems();
    fetchConfig();
  }, [finalBackendApiKey]);

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

  // const handleChatRequests = () => {
  //   if (urlBackendApiKey) {
  //     router.push(`/Chatpanel/AdminChatRequests/${encodeURIComponent(urlBackendApiKey)}`);
  //   } else {
  //     router.push(`/Chatpanel/AdminChatRequests/${encodeURIComponent(finalBackendApiKey)}`);
  //   }
  // };

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
      status: configData.status,
      apiKey: finalBackendApiKey,
    };

  

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(finalBackendApiKey && { 'Authorization': `Bearer ${finalBackendApiKey}` })
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

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
        status: item.status || 'active'
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this website?')) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          ...(finalBackendApiKey && { 'Authorization': `Bearer ${finalBackendApiKey}` })
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      await fetchItems();
      setShowForm(true);
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.message || 'Delete error');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(finalBackendApiKey && { 'Authorization': `Bearer ${finalBackendApiKey}` })
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Status update failed');
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );

      setWebsiteStatus(newStatus === 'active' ? 'active' : 'inactive');
    } catch (err) {
      console.error('❌ Status update error:', err);
      setError(err.message || 'Status update error');
      fetchItems();
    }
  };

  // ✅ If website is inactive
  if (!loading && websiteStatus === 'inactive') {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundIcon}>🚫</div>
          <h1>Website Inactive</h1>
          <p className={styles.notFoundMessage}>
            This website is currently inactive and cannot be managed.
          </p>
          <div className={styles.notFoundDetails}>
            <p><strong>API Key:</strong> {finalBackendApiKey ? `***${finalBackendApiKey.slice(-4)}` : 'Not provided'}</p>
            <p><strong>Status:</strong> <span style={{ color: '#ff9800' }}>Inactive</span></p>
          </div>
          <button onClick={fetchItems} className={styles.retryButton}>🔄 Check Status</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>  Admin Dashboard</h1>
        {/* {!loading && items.length > 0 && !showForm && websiteStatus === 'active' && (
          <div className={styles.adminButtons}>
            <button className={styles.adminButton} onClick={handleChatRequests}>Chat Requests</button>
         
          </div>
        )} */}
      </div>

      {/* Config Loading State */}
      {configLoading && (
        <div className={styles.loading}>Loading configuration...</div>
      )}

      {/* Config Error */}
      {configError && (
        <div className={styles.error}>{configError}</div>
      )}

      {/* API Key Info */}
      {finalBackendApiKey && (
        <div className={styles.apiKeyInfo}>
          <span>Using API Key: ***{finalBackendApiKey.slice(-4)}</span>
          {hasExistingConfig && (
            <span className={styles.configStatus}> • Configuration: Active</span>
          )}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading data...
        </div>
      ) : error ? (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
          <button onClick={fetchItems} className={styles.retryButton}>🔄 Retry</button>
        </div>
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
              isEditing={!!editingId}
              hasItems={items.length > 0}
              websiteId={editingId}
              backendApiKey={finalBackendApiKey}
            />
          ) : (
            <WebsiteList
              websites={items}
              onEdit={websiteStatus === 'active' ? handleEdit : undefined}
              onDelete={websiteStatus === 'active' ? handleDelete : undefined}
              onStatusChange={websiteStatus === 'active' ? handleStatusChange : undefined}
              backendApiKey={finalBackendApiKey}
              isWebsiteActive={websiteStatus === 'active'}
              configData={formData}
              hasExistingConfig={hasExistingConfig}
              websiteStatus={websiteStatus}
              configLoading={configLoading}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;