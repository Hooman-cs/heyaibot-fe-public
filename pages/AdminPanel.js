'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WebsiteConfig from '../app/components/AuthorForm';
import WebsiteList from '../app/components/AuthorList';
import styles from './AdminPanel.module.css';
import config from '../app/components/utils/config';

const API_URL = `${config.apiBaseUrl}/api/websites`;
const MAX_BOT_API_URL = '/api/user/max-bot';
const SESSION_API_URL = '/api/auth/session';

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
  const [isTokenValidated, setIsTokenValidated] = useState(false);
  const [tokenValidationAttempts, setTokenValidationAttempts] = useState(0);

  // Refs to prevent multiple validations
  const validationInProgress = useRef(false);
  const tokenCheckedRef = useRef(false);
  const expiryCheckInterval = useRef(null);
  const apiCallInProgress = useRef(false);
  const websitesFetched = useRef(false);

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

  // ============ SESSION API CALL ============

  const fetchSessionData = useCallback(async () => {
    try {
      const response = await fetch(SESSION_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }, []);

  // ============ MAX BOT API CALL - हर 30 सेकंड में सिर्फ यही call होगी ============

  const fetchMaxBotLimit = useCallback(async () => {
    if (apiCallInProgress.current) return null;

    try {
      apiCallInProgress.current = true;
      
      const response = await fetch(MAX_BOT_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem('adminAuthToken');
          router.push('/login');
          return null;
        }
        return null;
      }

      const data = await response.json();

      // Session data भी ले लो planName के लिए
      const sessionData = await fetchSessionData();
      
      // Session data से planName निकालो
      let planName = 'Free Plan';
      let hasPlan = false;
      
      if (sessionData && sessionData.user) {
        if (sessionData.user.planName) {
          planName = sessionData.user.planName;
          hasPlan = true;
        } else if (sessionData.user.plan) {
          planName = 'Active Plan';
          hasPlan = true;
        }
      }

      // Agar expired हो गया है (maxBot = 0 और expireDate है) तो तुरंत redirect करो
      if (data.maxBot === 0 && data.expireDate) {
        setError(`Your subscription expired on ${new Date(data.expireDate).toLocaleDateString()}`);
        sessionStorage.removeItem('adminAuthToken');
        localStorage.removeItem('adminAuthToken');
        setTimeout(() => {
          router.push('/login?expired=true');
        }, 2000);
        return data;
      }

      // Sirf maxBot update karo
      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          maxBot: data.maxBot || 0,
          plan: hasPlan,
          planName: planName
        };
      });

      return data;

    } catch (error) {
      return null;
    } finally {
      apiCallInProgress.current = false;
    }
  }, [router, fetchSessionData]);

  // ============ TOKEN VALIDATION FUNCTIONS ============

  const validateTokenWithServer = useCallback(async (token) => {
    if (!token) return null;
    
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        cache: 'no-store'
      });

      if (!response.ok) return null;
      const data = await response.json();
      
      if (data.valid && data.payload) {
        return data.payload;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  const extractToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    
    if (token) {
      sessionStorage.setItem('adminAuthToken', token);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return token;
    }
    
    token = sessionStorage.getItem('adminAuthToken');
    if (token) return token;
    
    token = localStorage.getItem('adminAuthToken');
    if (token) {
      sessionStorage.setItem('adminAuthToken', token);
      localStorage.removeItem('adminAuthToken');
      return token;
    }
    
    return null;
  }, []);

  const validateAndSetupToken = useCallback(async () => {
    if (validationInProgress.current) return null;

    try {
      validationInProgress.current = true;
      
      const token = extractToken();
      if (!token) return null;

      const payload = await validateTokenWithServer(token);
      
      if (!payload) {
        sessionStorage.removeItem('adminAuthToken');
        return null;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTime >= payload.exp) {
        sessionStorage.removeItem('adminAuthToken');
        return null;
      }

      const remaining = payload.exp - currentTime;
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const sessionData = await fetchSessionData();
      
      let planName = 'Free Plan';
      let hasPlan = false;
      
      if (sessionData && sessionData.user) {
        if (sessionData.user.planName) {
          planName = sessionData.user.planName;
          hasPlan = true;
        } else if (sessionData.user.plan) {
          planName = 'Active Plan';
          hasPlan = true;
        }
      }

      const userDataObj = {
        userId: payload.userId || payload.sub,
        planId: payload.planId,
        plan: hasPlan,
        planName: planName,
        maxBot: 1,
        token: token,
        iat: payload.iat,
        exp: payload.exp,
        timeRemaining: {
          hours,
          minutes,
          seconds,
          total: remaining
        }
      };

      return userDataObj;

    } catch (error) {
      return null;
    } finally {
      validationInProgress.current = false;
    }
  }, [extractToken, validateTokenWithServer, fetchSessionData]);

  // ============ INITIAL SETUP ============

  useEffect(() => {
    let mounted = true;
    
    async function initializeAuth() {
      if (tokenCheckedRef.current) return;
      tokenCheckedRef.current = true;
      
      try {
        setLoading(true);
        
        const userDataObj = await validateAndSetupToken();
        
        if (!mounted) return;
        
        if (!userDataObj) {
          router.push('/login');
          return;
        }

        setUserData(userDataObj);
        setAuthToken(userDataObj.token);
        setTokenExpiryTime(userDataObj.exp);
        setTimeRemaining(userDataObj.timeRemaining);
        setIsTokenValidated(true);

        // पहली बार max bot API call
        await fetchMaxBotLimit();
        
      } catch (error) {
        if (mounted) router.push('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [router, validateAndSetupToken, fetchMaxBotLimit]);

  // ============ SIRF MAX-BOT API HAR 30 SECOND MEIN CALL HOGA ============

  useEffect(() => {
    if (!authToken || !userData || !isTokenValidated) return;

    // Clear existing interval
    if (expiryCheckInterval.current) {
      clearInterval(expiryCheckInterval.current);
    }

    // Sirf max-bot API har 30 second mein call hogi
    expiryCheckInterval.current = setInterval(() => {
      fetchMaxBotLimit();
    }, 30000);

    return () => {
      if (expiryCheckInterval.current) {
        clearInterval(expiryCheckInterval.current);
      }
    };
  }, [authToken, userData, isTokenValidated, fetchMaxBotLimit]);

  // ============ SESSION EXPIRY TIMER ============

  useEffect(() => {
    if (!userData || !userData.exp) return;

    const timer = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const remaining = userData.exp - currentTime;
      
      if (remaining <= 0) {
        clearInterval(timer);
        sessionStorage.removeItem('adminAuthToken');
        router.push('/login');
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

      if (remaining <= 300 && remaining > 0) {
        setError(`⚠️ Your session will expire in ${minutes} minutes ${seconds} seconds. Please save your work.`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [userData, router]);

  // ============ FETCH WEBSITES - SIRF EK BAAR ============

  const fetchUserItems = useCallback(async () => {
    if (websitesFetched.current || !userData || !authToken || !isTokenValidated) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/user/${userData.userId}/websites`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      const itemsArray = data.items || data.data || [];
      
      const processedItems = itemsArray.map(item => ({
        ...item,
        roles: item.role || item.roles || [],
        aifuture: item.aifuture || []
      }));
      
      setItems(processedItems);
      setShowForm(processedItems.length === 0);
      websitesFetched.current = true;
      
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login');
      } else {
        setError(err.message || 'Failed to fetch data');
      }
    }
  }, [userData, authToken, isTokenValidated, router]);

  // Fetch items when userData is available - sirf ek baar
  useEffect(() => {
    if (userData && authToken && isTokenValidated && !websitesFetched.current) {
      fetchUserItems();
    }
  }, [userData, authToken, isTokenValidated, fetchUserItems]);

  // ============ FORM FUNCTIONS ============

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
    if (!authToken || !userData || !isTokenValidated) {
      router.push('/login');
      return;
    }
    
    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login');
      return;
    }

    if (items.length >= userData.maxBot) {
      setError(`You have reached your limit of ${userData.maxBot} websites. Please upgrade your plan.`);
      return;
    }
    
    resetForm();
    setShowForm(true);
  };

  const handleShowList = () => {
    resetForm();
    setShowForm(false);
  };

  // ============ SUBMIT HANDLER ============

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!authToken || !userData || !isTokenValidated) {
      router.push('/login');
      return;
    }

    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login');
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

    try {
      let url, method;
      
      if (editingId) {
        url = `${API_URL}/user/${userData.userId}/websites/${editingId}`;
        method = 'PUT';
      } else {
        url = API_URL;
        method = 'POST';
      }
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save: ${res.status}`);
      }

      await res.json();
      
      setShowSuccessMessage(editingId ? '✅ Website updated successfully!' : '✅ Website created successfully!');
      
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
      websitesFetched.current = false;
      await fetchUserItems();
      resetForm();
      setShowForm(false);
  
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login');
      } else {
        setError(err.message || 'Error saving data');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============ STATUS CHANGE HANDLER ============

  const handleStatusChange = async (id, newStatus) => {
    if (!authToken || !userData || !isTokenValidated) {
      router.push('/login');
      return;
    }

    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login');
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

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        router.push('/login');
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
      
      setShowSuccessMessage(`✅ Status updated to ${newStatus}`);
      setTimeout(() => setShowSuccessMessage(''), 2000);
      
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login');
      } else {
        setError(err.message || 'Error updating status');
      }
    }
  };

  // ============ EDIT HANDLER ============

  const handleEdit = (id) => {
    if (!authToken || !userData || !isTokenValidated) {
      router.push('/login');
      return;
    }

    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login');
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

  // ============ DELETE HANDLER ============

  const handleDelete = async (id) => {
    if (!authToken || !userData || !isTokenValidated) {
      router.push('/login');
      return;
    }

    if (timeRemaining && timeRemaining.total <= 0) {
      router.push('/login');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/user/${userData.userId}/websites/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }

      setShowSuccessMessage('✅ Website deleted successfully!');
      setTimeout(() => setShowSuccessMessage(''), 2000);
      
      setItems(prevItems => prevItems.filter(item => item.id !== id));
      
      if (items.length <= 1) {
        setShowForm(true);
      }
 
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        router.push('/login');
      } else {
        setError(err.message || 'Delete error');
      }
    }
  };

  // ============ LOGOUT HANDLERS ============

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const performLogout = () => {
    sessionStorage.removeItem('adminAuthToken');
    localStorage.removeItem('adminAuthToken');
    
    setUserData(null);
    setAuthToken(null);
    setItems([]);
    setTimeRemaining(null);
    setIsTokenValidated(false);
    tokenCheckedRef.current = false;
    websitesFetched.current = false;
    
    router.push('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // ============ LOADING STATE ============

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>
            <h3>🔐 Validating secure session...</h3>
            <p>Please wait while we verify your credentials</p>
            {tokenValidationAttempts > 0 && (
              <small>Attempt {tokenValidationAttempts}...</small>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!userData || !isTokenValidated) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <h3>Invalid Session</h3>
          <p>Please login again to access the admin panel.</p>
          <button 
            onClick={() => router.push('/login')}
            className={styles.primaryButton}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ============ MAIN RENDER ============

  return (
    <div className={styles.adminContainer}>
      {/* Session Expiry Timer */}
      {timeRemaining && timeRemaining.total > 0 && (
        <div className={`${styles.sessionTimer} ${timeRemaining.total <= 300 ? styles.warning : ''}`}>
          <span className={styles.timerIcon}>⏰</span>
          <span className={styles.timerText}>
            Session expires in: {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
          </span>
          {timeRemaining.total <= 300 && (
            <button 
              onClick={performLogout}
              className={styles.timerLogoutButton}
            >
              Logout Now
            </button>
          )}
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <p className={styles.modalWarning}>
              Any unsaved changes will be lost.
            </p>
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
          <button 
            className={styles.errorDismiss}
            onClick={() => setError(null)}
          >
            ×
          </button>
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
                    {userData.planName ? `✨ ${userData.planName}` : '🔹 Free Plan'}
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
                  >
                    <span className={styles.usagePercentage}>
                      {Math.round((items.length / userData.maxBot) * 100)}%
                    </span>
                  </div>
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
                  Plan: <strong>{userData.planName || 'Free'}</strong> | 
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