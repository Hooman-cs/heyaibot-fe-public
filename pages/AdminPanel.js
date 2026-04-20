'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WebsiteConfig  from '../app/components/AuthorForm';
import WebsiteList    from '../app/components/AuthorList';
import styles         from './AdminPanel.module.css';
import config         from '../app/components/utils/config';
import { signOut }    from 'next-auth/react';
import PlanLimitModal from '../app/components/PlanLimitModal';

const API_URL         = `${config.apiBaseUrl}/api/websites`;
const MAX_BOT_API_URL = '/api/user/max-bot';
const SESSION_API_URL = '/api/auth/session';
const POLL_INTERVAL   = 3000; // Reduced to 3 seconds for faster updates

const AdminPanel = () => {
  const router = useRouter();

  const [items, setItems]                         = useState([]);
  const [editingId, setEditingId]                 = useState(null);
  const [showForm, setShowForm]                   = useState(false);
  const [loading, setLoading]                     = useState(true);
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState(null);
  const [userData, setUserData]                   = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [authToken, setAuthToken]                 = useState(null);
  const [tokenExpiryTime, setTokenExpiryTime]     = useState(null);
  const [timeRemaining, setTimeRemaining]         = useState(null);
  const [isTokenValidated, setIsTokenValidated]   = useState(false);

  // Plan-limit modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planModalBots, setPlanModalBots] = useState([]);

  const validationInProgress = useRef(false);
  const tokenCheckedRef      = useRef(false);
  const expiryCheckInterval  = useRef(null);
  const apiCallInProgress    = useRef(false);
  const websitesFetched      = useRef(false);
  const pollRef              = useRef(null);
  const userDataRef          = useRef(null);
  const authTokenRef         = useRef(null);
  const modalOpenRef         = useRef(false);
  const pollStarted          = useRef(false);
  const isMounted            = useRef(true);

  userDataRef.current  = userData;
  authTokenRef.current = authToken;

  // Sync modalOpenRef with showPlanModal state
  useEffect(() => {
    modalOpenRef.current = showPlanModal;

    if (showPlanModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showPlanModal]);

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

  // ── SESSION ──
  const fetchSessionData = useCallback(async () => {
    try {
      const res = await fetch(SESSION_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }, []);

  // ── MAX BOT ──
  const fetchMaxBotLimit = useCallback(async () => {
    if (apiCallInProgress.current) return null;
    try {
      apiCallInProgress.current = true;
      const res = await fetch(MAX_BOT_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('adminAuthToken');
          window.location.replace('/login');
          return null;
        }
        return null;
      }

      const data        = await res.json();
      const sessionData = await fetchSessionData();
      let planName = 'Free Plan', hasPlan = false;

      if (sessionData?.user) {
        if (sessionData.user.planName) { planName = sessionData.user.planName; hasPlan = true; }
        else if (sessionData.user.plan) { planName = 'Active Plan'; hasPlan = true; }
      }

      if (data.maxBot === 0 && data.expireDate) {
        setError(`Your subscription expired on ${new Date(data.expireDate).toLocaleDateString()}`);
        sessionStorage.removeItem('adminAuthToken');
        setTimeout(() => window.location.replace('/login?expired=true'), 2000);
        return data;
      }

      setUserData(prev =>
        prev ? { ...prev, maxBot: data.maxBot || 0, plan: hasPlan, planName } : prev
      );
      return data;
    } catch { return null; }
    finally { apiCallInProgress.current = false; }
  }, [fetchSessionData]);

  // ── TOKEN ──
  const validateTokenWithServer = useCallback(async (token) => {
    if (!token) return null;
    try {
      const res = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.valid && data.payload) ? data.payload : null;
    } catch { return null; }
  }, []);

  const extractToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');
    if (token) {
      sessionStorage.setItem('adminAuthToken', token);
      window.history.replaceState({}, document.title, window.location.pathname);
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
      if (!payload) { sessionStorage.removeItem('adminAuthToken'); return null; }

      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && currentTime >= payload.exp) {
        sessionStorage.removeItem('adminAuthToken');
        return null;
      }

      const remaining = payload.exp - currentTime;
      const sessionData = await fetchSessionData();
      let planName = 'Free Plan', hasPlan = false;
      if (sessionData?.user) {
        if (sessionData.user.planName) { planName = sessionData.user.planName; hasPlan = true; }
        else if (sessionData.user.plan) { planName = 'Active Plan'; hasPlan = true; }
      }

      return {
        userId: payload.userId || payload.sub,
        planId: payload.planId,
        plan: hasPlan, planName,
        maxBot: 1,
        token,
        iat: payload.iat,
        exp: payload.exp,
        timeRemaining: {
          hours:   Math.floor(remaining / 3600),
          minutes: Math.floor((remaining % 3600) / 60),
          seconds: remaining % 60,
          total:   remaining
        }
      };
    } catch { return null; }
    finally { validationInProgress.current = false; }
  }, [extractToken, validateTokenWithServer, fetchSessionData]);

  // ── INITIAL AUTH ──
  useEffect(() => {
    let mounted = true;
    const blockBack = () => {
      const token = sessionStorage.getItem('adminAuthToken');
      if (!token) window.location.replace('/login');
      else window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);

    async function initializeAuth() {
      if (tokenCheckedRef.current) return;
      tokenCheckedRef.current = true;
      try {
        setLoading(true);
        const userDataObj = await validateAndSetupToken();
        if (!mounted) return;
        if (!userDataObj) { window.location.replace('/login'); return; }
        setUserData(userDataObj);
        setAuthToken(userDataObj.token);
        setTokenExpiryTime(userDataObj.exp);
        setTimeRemaining(userDataObj.timeRemaining);
        setIsTokenValidated(true);
        await fetchMaxBotLimit();
      } catch {
        if (mounted) window.location.replace('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initializeAuth();
    return () => {
      mounted = false;
      window.removeEventListener('popstate', blockBack);
    };
  }, [validateAndSetupToken, fetchMaxBotLimit]);

  // ── SESSION TIMER ──
  useEffect(() => {
    if (!userData?.exp) return;
    const timer = setInterval(() => {
      const remaining = userData.exp - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        clearInterval(timer);
        sessionStorage.removeItem('adminAuthToken');
        window.location.replace('/login');
        return;
      }
      setTimeRemaining({
        hours:   Math.floor(remaining / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
        total:   remaining
      });
      if (remaining <= 300)
        setError(`⚠️ Session expires in ${Math.floor(remaining / 60)}m ${remaining % 60}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [userData]);

  // ─────────────────────────────────────────────────────────────
  // PLAN ENFORCEMENT
  // ─────────────────────────────────────────────────────────────
  const checkAndEnforcePlanLimit = useCallback((fetchedItems, maxBot) => {
    if (!maxBot || maxBot <= 0) return;

    const activeCount = fetchedItems.filter(b => b.status === 'active').length;

    if (activeCount > maxBot) {
      if (!modalOpenRef.current) {
        setPlanModalBots(fetchedItems);
        setShowPlanModal(true);
      }
    } else {
      if (modalOpenRef.current) {
        setShowPlanModal(false);
      }
    }
  }, []);

  // ── IMMEDIATE UPDATE FUNCTION ──
  const updateItemInList = useCallback((updatedItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    ));
  }, []);

  const removeItemFromList = useCallback((itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const addItemToList = useCallback((newItem) => {
    setItems(prev => [newItem, ...prev]);
  }, []);

  // ── FORCE REFRESH FUNCTION ──
  const forceRefreshData = useCallback(async () => {
    const ud = userDataRef.current;
    const token = authTokenRef.current;
    if (!ud || !token || !isTokenValidated) return;

    try {
      const res = await fetch(`${API_URL}/user/${ud.userId}/websites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        window.location.replace('/login');
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'API error');

      const processed = (data.items || data.data || []).map(item => ({
        ...item,
        roles: item.role || item.roles || [],
        aifuture: item.aifuture || [],
        planDisabled: item.planDisabled || false,
        description: item.description || '',
        tags: item.tags || []
      }));

      if (isMounted.current) {
        setItems(processed);
        websitesFetched.current = true;
        checkAndEnforcePlanLimit(processed, ud.maxBot);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [isTokenValidated, checkAndEnforcePlanLimit]);

  // ── FETCH WEBSITES ──
  const fetchUserItems = useCallback(async (silent = false) => {
    const ud    = userDataRef.current;
    const token = authTokenRef.current;
    if (!ud || !token || !isTokenValidated) return;

    if (silent && modalOpenRef.current) return;

    try {
      const res = await fetch(`${API_URL}/user/${ud.userId}/websites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken');
        window.location.replace('/login');
        return;
      }
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'API error');

      const processed = (data.items || data.data || []).map(item => ({
        ...item,
        roles: item.role || item.roles || [],
        aifuture: item.aifuture || [],
        planDisabled: item.planDisabled || false,
        description: item.description || '',
        tags: item.tags || []
      }));

      if (isMounted.current) {
        setItems(processed);
      }

      if (!silent) {
        setShowForm(processed.length === 0);
        websitesFetched.current = true;
      }

      checkAndEnforcePlanLimit(processed, ud.maxBot);

    } catch (err) {
      if (!silent) setError(err.message || 'Failed to fetch data');
    }
  }, [isTokenValidated, checkAndEnforcePlanLimit]);

  // ── FIRST FETCH ──
  useEffect(() => {
    if (userData && authToken && isTokenValidated && !websitesFetched.current) {
      fetchUserItems(false);
    }
  }, [userData, authToken, isTokenValidated, fetchUserItems]);

  // ── COMBINED POLLING ──
  useEffect(() => {
    if (!userData || !authToken || !isTokenValidated) return;
    if (pollStarted.current) return;
    pollStarted.current = true;

    pollRef.current = setInterval(() => {
      if (!modalOpenRef.current) {
        fetchUserItems(true);
      }
      fetchMaxBotLimit();
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      pollStarted.current = false;
    };
  }, [isTokenValidated, fetchUserItems, fetchMaxBotLimit]);

  // ─────────────────────────────────────────────────────────────
  // MODAL CONFIRM
  // ─────────────────────────────────────────────────────────────
  const handlePlanModalConfirm = useCallback(async (selectedIds) => {
    const token = authTokenRef.current;
    const ud    = userDataRef.current;
    if (!token || !ud) return;

    const toDisable = planModalBots.filter(
      b => b.status === 'active' && !selectedIds.includes(b.id)
    );

    setShowPlanModal(false);

    // Immediate UI update
    setItems(prev => prev.map(item =>
      toDisable.some(d => d.id === item.id)
        ? { ...item, status: 'inactive', planDisabled: true }
        : item
    ));

    if (toDisable.length === 0) {
      setShowSuccessMessage('✅ Plan limit is now within range.');
      setTimeout(() => setShowSuccessMessage(''), 2000);
      return;
    }

    try {
      await Promise.all(
        toDisable.map(bot =>
          fetch(`${API_URL}/${bot.id}/status/role-aware`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              status: 'inactive',
              changedBy: 'admin',
              planDisabled: true,
            }),
          }).catch(() => null)
        )
      );

      setShowSuccessMessage(
        `✅ ${toDisable.length} bot${toDisable.length > 1 ? 's' : ''} disabled to match your plan limit.`
      );
      setTimeout(() => setShowSuccessMessage(''), 3000);

      // Silent refresh to sync with backend
      setTimeout(() => fetchUserItems(true), 500);
    } catch {
      setError('Some bots could not be disabled. Please refresh.');
    }
  }, [planModalBots, fetchUserItems]);

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

  const handleAddNew = () => {
    if (!authToken || !userData || !isTokenValidated) { window.location.replace('/login'); return; }
    if (items.length >= userData.maxBot) {
      setError(`You've reached your limit of ${userData.maxBot} websites.`);
      return;
    }
    resetForm();
    setShowForm(true);
  };

  const handleShowList = () => { resetForm(); setShowForm(false); };

  // ── SUBMIT WITH IMMEDIATE UPDATE ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authToken || !userData || !isTokenValidated) { 
      window.location.replace('/login'); 
      return; 
    }
    setSaving(true); 
    setError(null);

    if (!editingId && items.length >= userData.maxBot) {
      setError(`You've reached your limit of ${userData.maxBot} websites.`);
      setSaving(false); 
      return;
    }

    const payload = {
      websiteName: configData.websiteName, 
      websiteUrl: configData.websiteUrl,
      description: configData.description || '',
      tags: configData.tags || [],
      category: configData.category, 
      systemPrompt: configData.systemPrompt,
      customPrompt: configData.customPrompt, 
      role: configData.roles,
      aifuture: configData.aifuture, 
      status: configData.status, 
      userId: userData.userId
    };

    try {
      const url = editingId 
        ? `${API_URL}/user/${userData.userId}/websites/${editingId}` 
        : API_URL;
      const method = editingId ? 'PUT' : 'POST';
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
        window.location.replace('/login'); 
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed: ${res.status}`);
      }

      const responseData = await res.json();
      const savedItem = responseData.item || responseData;

      // Immediate UI update
      if (editingId) {
        updateItemInList(savedItem);
      } else {
        addItemToList(savedItem);
      }

      setShowSuccessMessage(editingId ? '✅ Website updated!' : '✅ Website created!');
      setTimeout(() => setShowSuccessMessage(''), 3000);
      
      resetForm(); 
      setShowForm(false);
      
      // Silent background refresh to ensure sync
      setTimeout(() => fetchUserItems(true), 500);
    } catch (err) {
      setError(err.message || 'Error saving data');
    } finally { 
      setSaving(false); 
    }
  };

  // ── STATUS CHANGE WITH IMMEDIATE UPDATE ──
  const handleStatusChange = async (id, newStatus) => {
    if (!authToken || !userData || !isTokenValidated) { 
      window.location.replace('/login'); 
      return; 
    }

    if (newStatus === 'active') {
      const currentActive = items.filter(b => b.status === 'active' && b.id !== id).length;
      if (currentActive >= userData.maxBot) {
        setError(
          `⚠️ Plan limit reached (${userData.maxBot} active bot${userData.maxBot > 1 ? 's' : ''}). ` +
          `Deactivate another bot first.`
        );
        return;
      }
    }

    // Immediate UI update
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, status: newStatus }
        : item
    ));

    try {
      const res = await fetch(`${API_URL}/${id}/status/role-aware`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify({ status: newStatus, changedBy: 'admin' }),
      });

      const data = await res.json();

      if (res.status === 403 && data.locked) {
        setError('🔒 Locked by SuperAdmin. Only SuperAdmin can reactivate this website.');
        // Revert on error
        setItems(prev => prev.map(item =>
          item.id === id
            ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
            : item
        ));
        return;
      }
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken'); 
        window.location.replace('/login'); 
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      // Update with server response
      setItems(prev => prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              superAdminLocked: data.item?.superAdminLocked || false,
              planDisabled: newStatus === 'active' ? false : item.planDisabled,
            }
          : item
      ));
      
      setShowSuccessMessage(`✅ Status updated to ${newStatus}`);
      setTimeout(() => setShowSuccessMessage(''), 2000);
    } catch (err) { 
      setError(err.message || 'Error updating status');
      // Revert on error
      setItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
          : item
      ));
    }
  };

  // ── EDIT ──
  const handleEdit = (id) => {
    if (!authToken || !userData || !isTokenValidated) { 
      window.location.replace('/login'); 
      return; 
    }
    const item = items.find(i => i.id === id);
    if (item) {
      setConfigData({
        websiteName: item.websiteName, 
        websiteUrl: item.websiteUrl,
        description: item.description || '',
        tags: item.tags || [],
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

  // ── DELETE WITH IMMEDIATE UPDATE ──
  const handleDelete = async (id) => {
    if (!authToken || !userData || !isTokenValidated) { 
      window.location.replace('/login'); 
      return; 
    }
    
    // Immediate UI update
    removeItemFromList(id);
    
    try {
      const res = await fetch(`${API_URL}/user/${userData.userId}/websites/${id}/soft`, {
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('adminAuthToken'); 
        window.location.replace('/login'); 
        return;
      }
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      
      setShowSuccessMessage('✅ Website removed!');
      setTimeout(() => setShowSuccessMessage(''), 2000);
      
      if (items.length <= 1) setShowForm(true);
    } catch (err) { 
      setError(err.message || 'Delete error');
      // Revert on error - refetch data
      fetchUserItems(false);
    }
  };

  // ── LOGOUT ──
  const confirmLogout = () => setShowLogoutConfirm(true);
  const cancelLogout  = () => setShowLogoutConfirm(false);
  const performLogout = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (expiryCheckInterval.current) clearInterval(expiryCheckInterval.current);
    sessionStorage.removeItem('adminAuthToken'); 
    sessionStorage.clear();
    localStorage.removeItem('adminAuthToken');
    setUserData(null); 
    setAuthToken(null); 
    setItems([]); 
    setIsTokenValidated(false);
    tokenCheckedRef.current = false; 
    websitesFetched.current = false; 
    pollStarted.current = false;
    await signOut({ callbackUrl: '/login', redirect: true });
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>
            <h3>🔐 Validating secure session...</h3>
            <p>Please wait while we verify your credentials</p>
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
          <p>Please login again.</p>
          <button onClick={() => window.location.replace('/login')} className={styles.primaryButton}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const activeCount = items.filter(i => i.status === 'active').length;

  return (
    <div className={styles.adminContainer}>

      {showPlanModal && (
        <PlanLimitModal
          bots={planModalBots}
          maxBot={userData.maxBot}
          onConfirm={handlePlanModalConfirm}
        />
      )}

      {timeRemaining && timeRemaining.total > 0 && (
        <div className={`${styles.sessionTimer} ${timeRemaining.total <= 300 ? styles.warning : ''}`}>
          <span className={styles.timerIcon}>⏰</span>
          <span className={styles.timerText}>
            Session expires in: {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
          </span>
          {timeRemaining.total <= 300 && (
            <button onClick={performLogout} className={styles.timerLogoutButton}>Logout Now</button>
          )}
        </div>
      )}

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
              <span className={styles.titleIcon}>🚀</span>
              Chat-Bot Studio
            </h1>
            <p className={styles.headerSubtitle}>Manage your AI-powered websites</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userProfile}>
              <div className={styles.profileIcon}><span className={styles.icon}>👤</span></div>
              <div className={styles.profileInfo}>
                <div className={styles.userStatus}>
                  <span className={`${styles.statusBadge} ${userData.plan ? styles.active : styles.inactive}`}>
                    {userData.planName ? `✨ ${userData.planName}` : '🔹 Free Plan'}
                  </span>
                  <span className={`${styles.websiteCount} ${activeCount > userData.maxBot ? styles.warning : ''}`}>
                    {activeCount}/{userData.maxBot}
                  </span>
                </div>
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageFill}
                    style={{ width: `${Math.min((activeCount / userData.maxBot) * 100, 100)}%` }}
                  >
                    <span className={styles.usagePercentage}>
                      {Math.round(Math.min((activeCount / userData.maxBot) * 100, 100))}%
                    </span>
                  </div>
                  <span className={styles.usageText}>
                    {activeCount} of {userData.maxBot} websites active
                  </span>
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
      className={`${styles.primaryButton} ${
        !showForm && items.length >= userData.maxBot ? styles.disabled : ''
      }`}
      onClick={showForm ? handleShowList : handleAddNew}
      disabled={!showForm && items.length >= userData.maxBot}
    >
      <span className={styles.buttonIcon}>
        {showForm ? '←' : '+'}
      </span>
      {showForm ? 'Back to List' : 'Add New Website'}
    </button>

    {!showForm && items.length >= userData.maxBot && !editingId && (
      <div className={styles.upgradePrompt}>
        <span className={styles.upgradeIcon}>✨</span>
        <span className={styles.upgradeText}>
          Max limit reached.{' '}
          <button onClick={() => router.push('/pricing')} className={styles.upgradeLink}>
            Upgrade plan
          </button>
        </span>
      </div>
    )}
  </div>

  {items.length > 0 && (
    <div className={styles.statsBox}>
      <div className={styles.statItem}>
        <span className={`${styles.statNumber} ${activeCount > userData.maxBot ? styles.warningText : ''}`}>
          {activeCount}
        </span>
        <span className={styles.statLabel}>Active</span>
      </div>
      <div className={styles.statDivider}>|</div>
      <div className={styles.statItem}>
        <span className={styles.statNumber}>
          {items.filter(i => i.status === 'inactive').length}
        </span>
        <span className={styles.statLabel}>Inactive</span>
      </div>
      <div className={styles.statDivider}>|</div>
      <div className={styles.statItem}>
        <span className={styles.statNumber}>{items.length}</span>
        <span className={styles.statLabel}>Total</span>
      </div>
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
            userData={userData} 
            saving={saving}
            onRefresh={forceRefreshData}
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
            <p className={styles.emptyStateText}>Create your first website to get started!</p>
            <div className={styles.planReminder}>
              <span className={styles.planReminderIcon}>💡</span>
              <span className={styles.planReminderText}>
                Plan: <strong>{userData.planName || 'Free'}</strong> |
                Limit: <strong>{userData.maxBot}</strong> |
                Active: <strong>{activeCount}/{userData.maxBot}</strong>
              </span>
            </div>
            <button className={styles.emptyStateButton} onClick={handleAddNew}>
              Create Your First Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;