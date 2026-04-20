'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WebsiteConfig from '../app/components/superadminauthorform/index';
import WebsiteList   from '../app/components/superadminauthorlist/index';
import styles        from './AdminPanel.module.css';
import config        from '../app/components/utils/config';
import { signOut }   from 'next-auth/react';

const API_URL = `${config.apiBaseUrl}/api/websites`;
const POLL_INTERVAL = 3000;

const SuperAdminPanel = () => {
  const router = useRouter();

  const [verified, setVerified]               = useState(false);
  const [checking, setChecking]               = useState(true);
  const [items, setItems]                     = useState([]);
  const [editingId, setEditingId]             = useState(null);
  const [showForm, setShowForm]               = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [error, setError]                     = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm]   = useState(false);

  const pollRef    = useRef(null);
  const itemsRef   = useRef(items);
  const isMounted  = useRef(true);
  itemsRef.current = items;

  const userData = { planName: 'Super Admin', plan: true, maxBot: Infinity };

  const [configData, setConfigData] = useState({
    websiteName: '', websiteUrl: '', category: [],
    systemPrompt: [], customPrompt: [], roles: [],
    aifuture: [], status: 'active', description: '', tags: []
  });
  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [tempCustomPrompt, setTempCustomPrompt] = useState('');
  const [tempCategory, setTempCategory]         = useState('');
  const [tempRole, setTempRole]                 = useState('');
  const [tempRoleValue, setTempRoleValue]       = useState('');

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // ── AUTH GUARD ──
  useEffect(() => {
    async function verifyAccess() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken  = urlParams.get('token');
      if (urlToken) {
        sessionStorage.setItem('superAdminToken', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = sessionStorage.getItem('superAdminToken');
      if (!token) { window.location.replace('/login'); return; }

      try {
        const res  = await fetch('/api/verify-superadmin-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();

        if (!res.ok || !data.valid || !data.isSuperAdmin) {
          sessionStorage.removeItem('superAdminToken');
          window.location.replace('/login?error=Unauthorized');
          return;
        }
        setVerified(true);
        window.history.pushState(null, '', window.location.pathname);
      } catch {
        sessionStorage.removeItem('superAdminToken');
        window.location.replace('/login');
      } finally {
        setChecking(false);
      }
    }

    const blockBack = () => {
      const token = sessionStorage.getItem('superAdminToken');
      if (!token) window.location.replace('/login');
      else window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);
    verifyAccess();
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  // ── IMMEDIATE UPDATE FUNCTIONS ──
  const updateItemInList = useCallback((updatedItem) => {
    setItems(prev => {
      const newItems = prev.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      );
      return newItems;
    });
  }, []);

  const removeItemFromList = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const addItemToList = useCallback((newItem) => {
    setItems(prev => [newItem, ...prev]);
  }, []);

  // ── FETCH ITEMS ──
  const fetchItems = useCallback(async (silent = false) => {
    if (!isMounted.current) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}?superadmin=true`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const processed = (data.items || []).map(item => ({
        ...item,
        roles:        item.role    || item.roles    || [],
        aifuture:     item.aifuture || [],
        description:  item.description || '',
        tags:         item.tags || []
      }));

      if (isMounted.current) {
        setItems(processed);
      }

      if (!silent && isMounted.current) {
        setShowForm(processed.length === 0);
      }
    } catch (err) {
      if (!silent && isMounted.current) setError(err.message || 'Failed to fetch data');
    } finally {
      if (!silent && isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (verified) fetchItems(false);
  }, [verified, fetchItems]);

  useEffect(() => {
    if (!verified) return;
    pollRef.current = setInterval(() => {
      if (isMounted.current) {
        fetchItems(true);
      }
    }, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [verified, fetchItems]);

  // ── FORM ──
  const resetForm = () => {
    setConfigData({
      websiteName: '', websiteUrl: '', category: [],
      systemPrompt: [], customPrompt: [], roles: [],
      aifuture: [], status: 'active', description: '', tags: []
    });
    setTempSystemPrompt(''); setTempCustomPrompt('');
    setTempCategory(''); setTempRole(''); setTempRoleValue('');
    setEditingId(null);
  };

  const handleAddNew    = () => { resetForm(); setShowForm(true); };
  const handleShowList  = () => { resetForm(); setShowForm(false); };

  // ── SUBMIT WITH IMMEDIATE UPDATE ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      websiteName:  configData.websiteName,
      websiteUrl:   configData.websiteUrl,
      description:  configData.description || '',
      tags:         configData.tags || [],
      category:     configData.category,
      systemPrompt: configData.systemPrompt,
      customPrompt: configData.customPrompt,
      role:         configData.roles,
      aifuture:     configData.aifuture,
      status:       configData.status
    };

    try {
      const url    = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed: ${res.status}`);
      }

      const responseData = await res.json();
      const savedItem = responseData.item || responseData;

      // Prepare the item with proper structure
      const processedItem = {
        ...savedItem,
        roles: savedItem.role || savedItem.roles || [],
        aifuture: savedItem.aifuture || [],
        description: savedItem.description || '',
        tags: savedItem.tags || []
      };

      // Immediate UI update
      if (editingId) {
        updateItemInList(processedItem);
        setShowSuccessMessage('✅ Website updated successfully!');
      } else {
        addItemToList(processedItem);
        setShowSuccessMessage('✅ Website created successfully!');
      }
      
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
      // Reset form and show list
      resetForm();
      setShowForm(false);
      setEditingId(null);
      
      // Force a background refresh to ensure consistency
      setTimeout(() => fetchItems(true), 100);
      
    } catch (err) {
      setError(err.message || 'Error saving data');
    } finally {
      setSaving(false);
    }
  };

  // ── STATUS CHANGE WITH IMMEDIATE UPDATE ──
  const handleStatusChange = async (id, newStatus) => {
    // Store original status for rollback
    const originalItem = items.find(i => i.id === id);
    const originalStatus = originalItem?.status;
    
    // Immediate optimistic UI update
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, status: newStatus } : i
    ));

    try {
      const res = await fetch(`${API_URL}/${id}/status/role-aware`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, changedBy: 'superadmin' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      // Update with server response to ensure correct state
      setItems(prev => prev.map(i =>
        i.id === id
          ? { ...i, status: newStatus, superAdminLocked: data.superAdminLocked || false }
          : i
      ));

      const lockMsg = data.superAdminLocked ? ' 🔒 Admin cannot reactivate' : '';
      setShowSuccessMessage(`✅ Status updated to ${newStatus}${lockMsg}`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Error updating status');
      // Rollback on error
      setItems(prev => prev.map(i =>
        i.id === id ? { ...i, status: originalStatus } : i
      ));
    }
  };

  // ── EDIT ──
  const handleEdit = (id) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setConfigData({
        websiteName:  item.websiteName,
        websiteUrl:   item.websiteUrl,
        description:  item.description || '',
        tags:         item.tags || [],
        category:     item.category     || [],
        systemPrompt: item.systemPrompt || [],
        customPrompt: item.customPrompt || [],
        roles:        item.roles        || [],
        aifuture:     item.aifuture     || [],
        status:       item.status       || 'active',
        apiKey:       item.apiKey
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  // ── PERMANENT DELETE WITH IMMEDIATE UPDATE ──
  const handleDelete = async (id) => {
    // Store the item for potential rollback
    const deletedItem = items.find(i => i.id === id);
    
    // Immediate UI update - remove from list
    removeItemFromList(id);
    setShowSuccessMessage('✅ Website deleted successfully!');
    setTimeout(() => setShowSuccessMessage(''), 2000);
    
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }
      
      // If list becomes empty, show form
      if (items.length <= 1) {
        setShowForm(true);
      }
      
      // Background refresh
      setTimeout(() => fetchItems(true), 100);
      
    } catch (err) {
      setError(err.message || 'Delete error');
      // Rollback - add the item back
      if (deletedItem) {
        addItemToList(deletedItem);
      }
    }
  };

  // ── RESTORE WITH IMMEDIATE UPDATE ──
  const handleRestore = async (id) => {
    // Immediate optimistic UI update
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, adminDeleted: false, adminDeletedAt: null }
        : item
    ));

    try {
      const res = await fetch(`${API_URL}/${id}/restore`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      setShowSuccessMessage('✅ Website restored! Admin can see it again.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
      // Background refresh
      setTimeout(() => fetchItems(true), 100);
      
    } catch (err) {
      setError(err.message || 'Restore error');
      // Rollback
      setItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, adminDeleted: true }
          : item
      ));
    }
  };

  // ── LOGOUT ──
  const confirmLogout  = () => setShowLogoutConfirm(true);
  const cancelLogout   = () => setShowLogoutConfirm(false);
  const performLogout  = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    sessionStorage.removeItem('superAdminToken');
    sessionStorage.clear();
    localStorage.removeItem('superAdminKey');
    try { await signOut({ redirect: false }); } catch {}
    window.location.replace('/login');
  };

  // ── SCREENS ──
  if (checking) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
        <div style={{ width:'48px', height:'48px', border:'4px solid #e2e8f0', borderTop:'4px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#64748b', fontWeight:600 }}>🔐 Verifying super admin access...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!verified) return null;

  if (loading && items.length === 0) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>
            <h3>🔐 Loading Super Admin Panel...</h3>
            <p>Fetching all websites</p>
          </div>
        </div>
      </div>
    );
  }

  // Stats
  const adminDeletedCount = items.filter(i => i.adminDeleted === true).length;
  const activeCount = items.filter(i => i.status === 'active' && !i.adminDeleted).length;
  const inactiveCount = items.filter(i => i.status === 'inactive' && !i.adminDeleted).length;

  // ── MAIN RENDER ──
  return (
    <div className={styles.adminContainer}>

      {showLogoutConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <p className={styles.modalWarning}>Any unsaved changes will be lost.</p>
            <div className={styles.modalButtons}>
              <button onClick={cancelLogout}  className={styles.modalCancelButton}>Cancel</button>
              <button onClick={performLogout} className={styles.modalConfirmButton}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          {showSuccessMessage}
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
          <button className={styles.errorDismiss} onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className={styles.adminHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1 className={styles.adminTitle}>
              <span className={styles.titleIcon}>🛡️</span>
              Super Admin Studio
            </h1>
            <p className={styles.headerSubtitle}>Manage all AI-powered websites</p>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userProfile}>
              <div className={styles.profileIcon}>
                <span className={styles.icon}>👑</span>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.userStatus}>
                  <span className={`${styles.statusBadge} ${styles.active}`}>✨ Super Admin</span>
                  <span className={styles.websiteCount}>{items.length} total</span>
                </div>
                <div className={styles.usageBar}>
                  <div className={styles.usageFill} style={{ width: '100%' }}>
                    <span className={styles.usagePercentage}>∞</span>
                  </div>
                  <span className={styles.usageText}>{items.length} websites — unlimited access</span>
                </div>
              </div>
            </div>

            <button onClick={() => router.push('/dashboard')} className={styles.dashboardButton}>
              <span className={styles.dashboardIcon}>📊</span>
              <span className={styles.dashboardText}>Dashboard</span>
            </button>

            <button onClick={confirmLogout} className={styles.logoutButton}>
              <span className={styles.logoutIcon}>↪</span>
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.adminContent}>
        <div className={styles.headerBottom}>
          <div className={styles.actionButtons}>
          <div className={styles.buttonWithUpgrade}>
    <button
      className={styles.primaryButton}
      onClick={showForm ? handleShowList : handleAddNew}
    >
      <span className={styles.buttonIcon}>
        {showForm ? '←' : '+'}
      </span>
      {showForm ? 'Back to List' : 'Add New Website'}
    </button>
  </div>

            {items.length > 0 && (
              <div className={styles.statsBox}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{activeCount}</span>
                  <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statDivider}>|</div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{inactiveCount}</span>
                  <span className={styles.statLabel}>Inactive</span>
                </div>
                <div className={styles.statDivider}>|</div>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{items.length}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                {adminDeletedCount > 0 && (
                  <>
                    <div className={styles.statDivider}>|</div>
                    <div className={styles.statItem}>
                      <span className={styles.statNumber} style={{ color: '#f59e0b' }}>{adminDeletedCount}</span>
                      <span className={styles.statLabel}>Admin Deleted</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

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
            backendApiKey={configData.apiKey}
            saving={saving}
          />
        ) : items.length > 0 ? (
          <WebsiteList
            websites={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            onStatusChange={handleStatusChange}
            onRestore={handleRestore}
          />
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📝</div>
            <h3 className={styles.emptyStateTitle}>No Websites Yet</h3>
            <p className={styles.emptyStateText}>No websites created yet. Add the first one!</p>
            <div className={styles.planReminder}>
              <span className={styles.planReminderIcon}>💡</span>
              <span className={styles.planReminderText}>
                Plan: <strong>Super Admin</strong> | Access: <strong>Unlimited</strong>
              </span>
            </div>
            <button className={styles.emptyStateButton} onClick={handleAddNew}>
              Create First Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;