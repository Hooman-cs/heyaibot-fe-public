'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WebsiteConfig from '../app/components/AuthorForm';
import WebsiteList from '../app/components/AuthorList';
import styles from './AdminPanel.module.css';
import config from '../app/components/utils/config';

const API_URL = `${config.apiBaseUrl}/api/websites`;

const AdminPanel = () => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [authToken, setAuthToken] = useState(null);
  const [tokenExpiryTime, setTokenExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const [configData, setConfigData] = useState({
    websiteName: '',
    websiteUrl: '',
    category: [],
    systemPrompt: [],
    customPrompt: [],
    roles: [],
    aifuture: [],
    status: 'active'
  });

  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [tempCustomPrompt, setTempCustomPrompt] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempRoleValue, setTempRoleValue] = useState('');

  // Function to validate JWT token
  const validateJWTToken = (token) => {
    try {
      // Split JWT token into parts
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }

      const [headerBase64, payloadBase64, signatureBase64] = parts;

      // Decode payload
      let payload;
      try {
        const decodedPayload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        payload = decodedPayload;
      } catch (e) {
        console.error('Payload decode error:', e);
        return null;
      }

      // Verify signature (optional but recommended)
      if (process.env.NEXT_PUBLIC_VERIFY_TOKEN === 'true') {
        const secret = process.env.NEXTAUTH_SECRET;
        if (secret) {
          const signatureInput = `${headerBase64}.${payloadBase64}`;
          const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(signatureInput)
            .digest('hex');
          
          if (signatureBase64 !== expectedSignature) {
            console.error('Invalid signature');
            return null;
          }
        }
      }

      return payload;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  // Function to check token expiration
  const isTokenExpired = (payload) => {
    if (!payload || !payload.exp) {
      console.error('No expiration in token');
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = currentTime >= payload.exp;
    
    if (isExpired) {
      console.log(`Token expired at: ${new Date(payload.exp * 1000).toLocaleString()}`);
      console.log(`Current time: ${new Date().toLocaleString()}`);
    }
    
    return isExpired;
  };

  // Function to parse and validate token from URL
  const parseAndValidateToken = () => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      console.error('No token found in URL');
      return null;
    }

    try {
      // Validate JWT token
      const payload = validateJWTToken(token);
      
      if (!payload) {
        console.error('Invalid token payload');
        return null;
      }

      // Check expiration
      if (isTokenExpired(payload)) {
        console.error('Token expired');
        return null;
      }

      // Calculate time remaining
      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = payload.exp - currentTime;
      
      // Format remaining time
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      
      return {
        userId: payload.userId,
        planId: payload.planId,
        plan: payload.plan,
        maxBot: payload.maxBot,
        token: token,
        iat: payload.iat,
        exp: payload.exp,
        timeRemaining: {
          hours,
          minutes,
          seconds: remaining % 60,
          total: remaining
        }
      };
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  };

  // Update time remaining every second
  useEffect(() => {
    if (!userData || !userData.exp) return;

    const timer = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = userData.exp - currentTime;
      
      if (remaining <= 0) {
        // Token expired, redirect to login
        clearInterval(timer);
        router.push('/login?error=SessionExpired');
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining({
        hours,
        minutes,
        seconds,
        total: remaining
      });

      // Show warning when 5 minutes remaining
      if (remaining <= 300 && remaining > 0) {
        setError(`⚠️ Your session will expire in ${minutes} minutes ${seconds} seconds. Please save your work.`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [userData, router]);

  // Clean URL by removing token parameters
  const cleanUrl = () => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.toString());
  };

  // Check token and get user data
  useEffect(() => {
    const tokenData = parseAndValidateToken();
    
    if (!tokenData) {
      router.push('/login?error=SessionExpired');
      return;
    }

    console.log('User Token Data:', tokenData);
    console.log('Token expires:', new Date(tokenData.exp * 1000).toLocaleString());
    console.log('Time remaining:', tokenData.timeRemaining);
    
    setUserData(tokenData);
    setAuthToken(tokenData.token);
    setTokenExpiryTime(tokenData.exp);
    setTimeRemaining(tokenData.timeRemaining);
    
    // Clean URL after extracting token
    cleanUrl();

    // Set a timer to check token expiration periodically
    const expirationCheck = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime >= tokenData.exp) {
        console.log('Token expired during session');
        clearInterval(expirationCheck);
        router.push('/login?error=SessionExpired');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(expirationCheck);
  }, [router]);

  // Fetch all websites for this user
  const fetchUserItems = async () => {
    if (!userData || !authToken) {
      console.log('No user data or token, skipping fetch');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log('Fetching items for user:', userData.userId);
    
    try {
      const res = await fetch(`${API_URL}/user/${userData.userId}/websites`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      console.log('API Response Status:', res.status);
      
      if (res.status === 401) {
        console.log('Unauthorized - redirecting to login');
        router.push('/login?error=SessionExpired');
        return;
      }

      if (res.status === 403) {
        console.log('Forbidden - invalid token');
        router.push('/login?error=InvalidToken');
        return;
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('API Error Response:', errorText);
        throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('API Success Data:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      const itemsArray = data.items || data.data || [];
      console.log('Processed Items Array:', itemsArray);
      
      const processedItems = itemsArray.map(item => {
        return {
          ...item,
          roles: item.role || [],
          aifuture: item.aifuture || []
        };
      });
      
      console.log('Final Processed Items:', processedItems);
      setItems(processedItems);
      
      setShowForm(processedItems.length === 0);
      
    } catch (err) {
      console.log('Fetch Error:', err);
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login?error=SessionExpired');
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch items when userData changes
  useEffect(() => {
    if (userData && authToken) {
      console.log('User data and token available, fetching items');
      fetchUserItems();
    } else {
      console.log('No user data or token yet');
    }
  }, [userData, authToken]);

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
    // Check if token is still valid
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login?error=SessionExpired');
      return;
    }
    
    resetForm();
    setShowForm(true);
  };

  const handleShowList = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if token is still valid
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login?error=SessionExpired');
      return;
    }

    if (!userData || !authToken) {
      router.push('/login?error=SessionExpired');
      return;
    }

    setSaving(true);
    setError(null);

    if (!editingId && items.length >= userData.maxBot) {
      setError(`You have reached your limit of ${userData.maxBot} websites. Please upgrade your plan.`);
      setSaving(false);
      return;
    }

    const payload = {
      websiteName: configData.websiteName,
      websiteUrl: configData.websiteUrl,
      category: configData.category,
      systemPrompt: configData.systemPrompt,
      customPrompt: configData.customPrompt,
      role: configData.roles,
      aifuture: configData.aifuture,
      status: configData.status,
      userId: userData.userId
    };

    console.log('Submit Payload:', payload);

    try {
      let url, method;
      
      if (editingId) {
        url = `${API_URL}/user/${userData.userId}/websites/${editingId}`;
        method = 'PUT';
      } else {
        url = API_URL;
        method = 'POST';
      }
      
      console.log('API URL:', url);
      console.log('API Method:', method);
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload),
      });

      console.log('Save Response Status:', res.status);
      
      if (res.status === 401) {
        console.log('Unauthorized - redirecting to login');
        router.push('/login?error=SessionExpired');
        return;
      }

      if (res.status === 403) {
        console.log('Forbidden - invalid token');
        router.push('/login?error=InvalidToken');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log('Save Error Data:', errorData);
        throw new Error(errorData.error || `Failed to save: ${res.status} ${res.statusText}`);
      }

      const responseData = await res.json();
      console.log('Save Success Data:', responseData);
      
      setShowSuccessMessage(editingId ? 'Website updated successfully!' : 'Website created successfully!');
      
      setTimeout(() => {
        setShowSuccessMessage('');
      }, 3000);
      
      await fetchUserItems();
      
      resetForm();
      setShowForm(false);
  
    } catch (err) {
      console.log('Submit Error:', err);
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login?error=SessionExpired');
      } else {
        setError(err.message || 'Error saving data');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    // Check if token is still valid
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login?error=SessionExpired');
      return;
    }

    if (!userData || !authToken) {
      router.push('/login?error=SessionExpired');
      return;
    }
    
    try {
      const payload = { status: newStatus };

      const res = await fetch(`${API_URL}/user/${userData.userId}/websites/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push('/login?error=SessionExpired');
        return;
      }

      if (res.status === 403) {
        router.push('/login?error=InvalidToken');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, status: newStatus } : item
        )
      );
      
      setShowSuccessMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setShowSuccessMessage(''), 2000);
      
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login?error=SessionExpired');
      } else {
        console.error('Status update error:', err);
        setError(err.message || 'Error updating status');
      }
    }
  };

  const handleEdit = (id) => {
    // Check if token is still valid
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login?error=SessionExpired');
      return;
    }

    const item = items.find((i) => i.id === id);
    if (item) {
      setConfigData({
        websiteName: item.websiteName,
        websiteUrl: item.websiteUrl,
        category: item.category || [],
        systemPrompt: item.systemPrompt || [],
        customPrompt: item.customPrompt || [],
        roles: item.roles || [],
        aifuture: item.aifuture || [],
        status: item.status || 'active',
        apiKey: item.apiKey
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = async (id) => {
    // Check if token is still valid
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login?error=SessionExpired');
      return;
    }

    if (!userData || !authToken) {
      router.push('/login?error=SessionExpired');
      return;
    }
    
   
    
    try {
      const res = await fetch(`${API_URL}/user/${userData.userId}/websites/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.status === 401) {
        router.push('/login?error=SessionExpired');
        return;
      }

      if (res.status === 403) {
        router.push('/login?error=InvalidToken');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Delete failed: ${errorText}`);
      }

      setShowSuccessMessage('Website deleted successfully!');
      setTimeout(() => setShowSuccessMessage(''), 2000);
      
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      if (items.length <= 1) {
        setShowForm(true);
      }
 
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login?error=SessionExpired');
      } else {
        console.error('Delete error:', err);
        setError(err.message || 'Delete error');
      }
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = () => {
    setUserData(null);
    setAuthToken(null);
    setItems([]);
    setTimeRemaining(null);
    
    window.history.replaceState({}, document.title, window.location.pathname);
    router.push('/login?message=LoggedOut');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Show loading if no user data
  if (!userData) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          Validating session...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Session Expiry Timer */}
      {timeRemaining && timeRemaining.total > 0 && (
        <div className={`${styles.sessionTimer} ${timeRemaining.total <= 300 ? styles.warning : ''}`}>
          <span className={styles.timerIcon}>⏰</span>
          <span className={styles.timerText}>
            Session expires in: {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
          </span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className={styles.modalButtons}>
              <button 
                onClick={cancelLogout} 
                className={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={performLogout} 
                className={styles.modalConfirmButton}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✓</span>
          {showSuccessMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      <div className={styles.adminHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1 className={styles.adminTitle}>
              <span className={styles.titleIcon}>🚀</span>
              Website Dashboard
            </h1>
            <p className={styles.headerSubtitle}>
              Manage your AI-powered websites
            </p>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.userProfile}>
              <div className={styles.profileIcon}>
                <span className={styles.icon}>👤</span>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.userStatus}>
                  <span className={`${styles.statusBadge} ${userData.plan ? styles.active : styles.inactive}`}>
                    {userData.plan ? 'Active Plan' : 'Free Plan'}
                  </span>
                  <span className={styles.websiteCount}>
                    {items.length}/{userData.maxBot}
                  </span>
                </div>
                <div className={styles.usageBar}>
                  <div 
                    className={styles.usageFill}
                    style={{ 
                      width: `${Math.min((items.length / userData.maxBot) * 100, 100)}%` 
                    }}
                  ></div>
                  <span className={styles.usageText}>
                    {items.length} of {userData.maxBot} websites used
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={confirmLogout} 
              className={styles.logoutButton}
              title="Logout"
            >
              <span className={styles.logoutIcon}>↪</span>
              <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        </div>
        
        <div className={styles.headerBottom}>
          <div className={styles.actionButtons}>
            <div className={styles.buttonWithUpgrade}>
              <button 
                className={`${styles.primaryButton} ${items.length >= userData.maxBot ? styles.disabled : ''}`}
                onClick={handleAddNew}
                disabled={items.length >= userData.maxBot}
                title={items.length >= userData.maxBot ? 'Max limit reached. Upgrade plan to add more.' : 'Add new website'}
              >
                <span className={styles.buttonIcon}>+</span>
                Add New Website
              </button>
              
              {items.length >= userData.maxBot && !editingId && (
                <div className={styles.upgradePrompt}>
                  <span className={styles.upgradeIcon}>✨</span>
                  <span className={styles.upgradeText}>
                    Max limit reached. <button className={styles.upgradeLink}>Upgrade plan</button>
                  </span>
                </div>
              )}
            </div>
            
            <div className={styles.headerActions}>
              {items.length > 0 && (
                <div className={styles.statsBox}>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {items.filter(item => item.status === 'active').length}
                    </span>
                    <span className={styles.statLabel}>Active</span>
                  </div>
                  <div className={styles.statDivider}>|</div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {items.filter(item => item.status === 'inactive').length}
                    </span>
                    <span className={styles.statLabel}>Inactive</span>
                  </div>
                  <div className={styles.statDivider}>|</div>
                  <div className={styles.statItem}>
                    <span className={styles.statNumber}>
                      {userData.maxBot - items.length}
                    </span>
                    <span className={styles.statLabel}>Remaining</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          Loading websites...
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
              hasItems={items.length > 0}
              websiteId={editingId}
              apiKey={configData.apiKey}
              userData={userData}
              saving={saving}
            />
          ) : items.length > 0 ? (
            <WebsiteList
              websites={items}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddNew={handleAddNew}
              onStatusChange={handleStatusChange}
              userData={userData}
            />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>📝</div>
              <h3 className={styles.emptyStateTitle}>No Websites Yet</h3>
              <p className={styles.emptyStateText}>
                You haven't created any websites yet. Create your first website to get started!
              </p>
              <div className={styles.planReminder}>
                <span className={styles.planReminderIcon}>💡</span>
                <span className={styles.planReminderText}>
                  Plan: <strong>{userData.plan ? 'Active' : 'Free'}</strong> | 
                  Limit: <strong>{userData.maxBot} websites</strong> | 
                  Used: <strong>{items.length}/{userData.maxBot}</strong>
                </span>
              </div>
              <button 
                className={styles.emptyStateButton}
                onClick={handleAddNew}
              >
                Create Your First Website
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;