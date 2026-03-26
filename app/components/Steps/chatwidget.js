'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './adminchatwidget.module.css';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatBody from '../ChatBody/ChatBody';
import ChatInput from '../ChatInput/ChatInput';
import config from '../utils/config';
import { v4 as uuidv4 } from 'uuid';
import { saveConversationToDatabase } from '../utils/api/requestApi';

const Chatwidget = ({
  primaryColor    = '#4a6baf',
  secondaryColor  = 'tomato',
  headerColor,
  poweredByText: poweredByTextProp,
  poweredByUrl: poweredByUrlProp,
  chatWindowSize  = { width: '340px', height: '470px' },
  backendApiKey,
  apiBaseUrl      = config.apiBaseUrl,
}) => {
  const [isChatOpen, setIsChatOpen]                       = useState(true);
  const [messages, setMessages]                           = useState([]);
  const [inputMessage, setInputMessage]                   = useState('');
  const [isLoading, setIsLoading]                         = useState(false);
  const [storedSummaryList, setStoredSummaryList]         = useState([]);
  const [systemPrompts, setSystemPrompts]                 = useState([]);
  const [welcomeMessages, setWelcomeMessages]             = useState([]);
  const [websiteTitle, setWebsiteTitle]                   = useState('Support');
  const [pendingQuestions, setPendingQuestions]           = useState([]);
  const [isConfirming, setIsConfirming]                   = useState(false);
  const [connectionStatus, setConnectionStatus]           = useState('connecting');
  const [activeConfig, setActiveConfig]                   = useState(null);
  const [categories, setCategories]                       = useState([]);
  const [aifuture, setAifuture]                           = useState([]);
  const [currentPromptFlow, setCurrentPromptFlow]         = useState(null);
  const [collectedData, setCollectedData]                 = useState({});
  const [transformedDataForAPI, setTransformedDataForAPI] = useState({});
  const [suggestedPrompts, setSuggestedPrompts]           = useState([]);
  const [currentChildOptions, setCurrentChildOptions]     = useState([]);
  const [isWebsiteActive, setIsWebsiteActive]             = useState(false);
  const [websiteStatus, setWebsiteStatus]                 = useState('checking');
  const [storedUrls, setStoredUrls]                       = useState([]);
  const [storedApiKeys, setStoredApiKeys]                 = useState([]);
  const [storedPromptsWithParams, setStoredPromptsWithParams] = useState([]);
  const [messageAnimations, setMessageAnimations]         = useState({});
  const [selectedPromptName, setSelectedPromptName]       = useState('');
  const [parentWebsiteUrl, setParentWebsiteUrl]           = useState('');
  const [aiPersonality, setAiPersonality]                 = useState({ tone: 'friendly', emojiLevel: 'moderate', detailLevel: 'balanced' });
  const [interestDetectionEnabled, setInterestDetectionEnabled] = useState(true);
  const [recentTopics, setRecentTopics]                   = useState([]);
  const [autoClickInProgress, setAutoClickInProgress]     = useState(false);
  const [lastAIMessage, setLastAIMessage]                 = useState('');
  const [deviceInfo, setDeviceInfo]                       = useState({ isMobile: false, isTablet: false, isSmallScreen: false, screenWidth: 1024, deviceType: 'desktop' });
  const [isFullScreen, setIsFullScreen]                   = useState(false);
  const [isInitialized, setIsInitialized]                 = useState(false);

  // ✅ Session / conversation state (from ChatWidget.js)
  const [sessionId, setSessionId]               = useState('');
  const [conversationCount, setConversationCount] = useState(0);
  const [lastActivity, setLastActivity]         = useState(Date.now());
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [isSaving, setIsSaving]                 = useState(false);
  const [hasInitialSave, setHasInitialSave]     = useState(false);
  const [autoSaveEnabled]                       = useState(true);

  // ─── Refs ──────────────────────────────────────────────────────
  const hasShownWelcome     = useRef(false);
  const welcomeShownRef     = useRef(false);
  const activeConfigRef     = useRef(null);
  const threadResetRef      = useRef(false);
  const lastSavedMessageRef = useRef(null);
  const saveTimeoutRef      = useRef(null);
  const lastMessageCount    = useRef(0);

  // ✅ Branding — directly from props, no API fetch needed
  const resolvedHeaderColor   = headerColor || secondaryColor;
  const resolvedPoweredByText = poweredByTextProp || 'JDPC Global';
  const resolvedPoweredByUrl  = poweredByUrlProp  || 'https://jdpcglobal.com';

  useEffect(() => { activeConfigRef.current = activeConfig; }, [activeConfig]);

  // ─── Screen size ───────────────────────────────────────────────
  const checkScreenSize = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const userAgent   = navigator.userAgent;
      const isMobile    = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet    = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
      const isSmallScreen = screenWidth <= 768;
      setDeviceInfo({ isMobile, isTablet, isSmallScreen, screenWidth, deviceType: isSmallScreen ? (screenWidth <= 480 ? 'mobile' : 'tablet') : 'desktop' });
      setIsFullScreen(isSmallScreen);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    const handleResize = () => checkScreenSize();
    checkScreenSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setupParentCommunication = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener('message', (event) => {
      const isAllowedOrigin = ['https://jdpcglobal.com', 'https://www.jdpcglobal.com', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'].includes(event.origin) || event.origin.includes('localhost') || event.origin.includes('127.0.0.1');
      if (!isAllowedOrigin) return;
      if (event.data.type === 'parentUrl') { setParentWebsiteUrl(event.data.url); localStorage.setItem('parentWebsiteUrl', event.data.url); }
      if (event.data.type === 'pageUrl')   { setParentWebsiteUrl(event.data.url); localStorage.setItem('parentWebsiteUrl', event.data.url); }
      if (event.data.type === 'deviceInfo') {
        setDeviceInfo({ isMobile: event.data.isMobile, isTablet: event.data.isTablet, isSmallScreen: event.data.isSmallScreen, screenWidth: event.data.screenWidth, deviceType: event.data.deviceType });
        setIsFullScreen(event.data.isSmallScreen);
        setIsInitialized(true);
      }
      if (event.data.type === 'screenResize') {
        setDeviceInfo(prev => ({ ...prev, isMobile: event.data.isMobile, isTablet: event.data.isTablet, screenWidth: event.data.screenWidth, isSmallScreen: event.data.isSmallScreen, deviceType: event.data.deviceType }));
        setIsFullScreen(event.data.isSmallScreen);
      }
    });
    try { window.parent.postMessage({ type: 'requestDeviceInfo', source: 'chat-widget' }, '*'); }
    catch { checkScreenSize(); }
  };

  const getResponsiveStyles = () => {
    if (!isInitialized) return { container: { position: 'absolute', zIndex: '999999' }, window: { width: chatWindowSize.width, height: chatWindowSize.height, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } };
    if (isFullScreen)   return { container: { position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', width: '100vw', height: '100vh', zIndex: '999999', backgroundColor: 'white' }, window: { width: '100%', height: '100%', borderRadius: '0', boxShadow: 'none' } };
    return { container: { position: 'absolute', zIndex: '999999' }, window: { width: chatWindowSize.width, height: chatWindowSize.height, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } };
  };

  const responsiveStyles = getResponsiveStyles();

  // ─────────────────────────────────────────────────────────────────
  // ✅ RELOAD DETECTION (from ChatWidget.js)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSessionId = localStorage.getItem('chat_session_id');
    const userHadMessaged = localStorage.getItem('chat_user_messaged') === 'true';
    const storedCount     = parseInt(localStorage.getItem('conversation_count') || '0');
    const isReload        = !!(storedSessionId && userHadMessaged);

    if (isReload) {
      setSessionId(storedSessionId);
      const newCount = storedCount + 1;
      setConversationCount(newCount);
      localStorage.setItem('conversation_count', newCount.toString());
      localStorage.setItem('force_new_thread', 'true');
      threadResetRef.current = true;
      localStorage.removeItem('chat_user_messaged');

      setMessages([]);
      setCurrentPromptFlow(null);
      setCollectedData({});
      setTransformedDataForAPI({});
      setCurrentChildOptions([]);
      setHasInitialSave(false);
      lastSavedMessageRef.current = null;
      hasShownWelcome.current     = false;
      welcomeShownRef.current     = false;

    } else if (storedSessionId) {
      setSessionId(storedSessionId);
      setConversationCount(storedCount);
      localStorage.removeItem('force_new_thread');
      threadResetRef.current = false;

    } else {
      const newSessionId = uuidv4();
      localStorage.setItem('chat_session_id', newSessionId);
      setSessionId(newSessionId);
      setSessionStartTime(Date.now());
      localStorage.setItem('conversation_count', '0');
      localStorage.removeItem('force_new_thread');
      localStorage.removeItem('chat_user_messaged');
      setConversationCount(0);
      threadResetRef.current = false;
    }

    const activityHandler = () => setLastActivity(Date.now());
    window.addEventListener('click',     activityHandler);
    window.addEventListener('keypress',  activityHandler);
    window.addEventListener('scroll',    activityHandler);
    window.addEventListener('mousemove', activityHandler);
    return () => {
      window.removeEventListener('click',     activityHandler);
      window.removeEventListener('keypress',  activityHandler);
      window.removeEventListener('scroll',    activityHandler);
      window.removeEventListener('mousemove', activityHandler);
    };
  }, []);

  // ─── Long inactivity → new thread ─────────────────────────────
  useEffect(() => {
    const LONG_TIME_THRESHOLD = 30 * 60 * 1000;
    const CHECK_INTERVAL      = 60000;
    const checkLongTimePassed = () => {
      const now = Date.now();
      if ((now - lastActivity) > LONG_TIME_THRESHOLD) {
        const newCount = conversationCount + 1;
        setConversationCount(newCount);
        localStorage.setItem('conversation_count', newCount.toString());
        localStorage.setItem('force_new_thread', 'true');
        threadResetRef.current = true;
        localStorage.removeItem('chat_user_messaged');
        setSessionStartTime(now);
        setLastActivity(now);
      }
    };
    const interval = setInterval(checkLongTimePassed, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [lastActivity, conversationCount]);

  // ─── Auto-save ─────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSaveEnabled || messages.length === 0 || !sessionId || !activeConfig?.id || isSaving) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const lastMsg        = messages[messages.length - 1];
      const isNaturalPause = lastMsg && (
        lastMsg.message.includes('confirm') || lastMsg.message.includes('done') ||
        lastMsg.message.includes('thank you') || lastMsg.sender === 'user'
      );
      if (isNaturalPause || !hasInitialSave) {
        await saveCurrentConversation();
        setHasInitialSave(true);
      }
    }, 10000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [messages, sessionId, activeConfig, autoSaveEnabled, isSaving, hasInitialSave]);

  // ─── saveCurrentConversation ────────────────────────────────────
  const saveCurrentConversation = async () => {
    if (!sessionId || !activeConfig?.id || messages.length === 0 || isSaving) return;
    try {
      setIsSaving(true);
      const lastSaved   = lastSavedMessageRef.current;
      const newMessages = lastSaved
        ? messages.slice(messages.findIndex(m => m.id === lastSaved) + 1)
        : messages;
      if (newMessages.length === 0) { setIsSaving(false); return; }

      const threads       = [];
      let   currentThread = null;
      newMessages.forEach((msg) => {
        if (msg.sender === 'user') {
          currentThread = { userMessage: { text: msg.message, tokens: Math.ceil(msg.message.length / 4) }, botReplies: [] };
          threads.push(currentThread);
        } else if (msg.sender === 'support-bot' && currentThread && !msg._isTemp) {
          currentThread.botReplies.push({ text: msg.message, tokens: Math.ceil(msg.message.length / 4) });
        }
      });
      if (threads.length === 0) { setIsSaving(false); return; }

      const forceFromStorage     = localStorage.getItem('force_new_thread') === 'true';
      const shouldForceNewThread = forceFromStorage || threadResetRef.current;

      const result = await saveConversationToDatabase(apiBaseUrl, backendApiKey, {
        sessionId, conversations: threads, forceNewThread: shouldForceNewThread
      });

      if (result.success) {
        lastSavedMessageRef.current = messages[messages.length - 1].id;
        if (shouldForceNewThread) {
          threadResetRef.current = false;
          localStorage.removeItem('force_new_thread');
        }
      }
    } catch (err) { console.error('❌ Auto-save error:', err); }
    finally { setIsSaving(false); }
  };

  // ─────────────────────────────────────────────────────────────────
  // ✅ saveSingleMessage (from ChatWidget.js)
  // ─────────────────────────────────────────────────────────────────
  const saveSingleMessage = async (role, text, tokens = 0) => {
    if (!sessionId) return;
    if (text === 'Saving your request...') return;

    const messageKey    = `${role}_${text}_${sessionId}`;
    const now           = Date.now();
    const lastSavedKey  = localStorage.getItem(`last_saved_key_${sessionId}`);
    const lastSavedTime = parseInt(localStorage.getItem(`last_saved_time_${sessionId}`) || '0');
    if (lastSavedKey === messageKey && (now - lastSavedTime) < 3000) return;

    try {
      const endpoint = role === 'user'
        ? `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/user-message`
        : `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/bot-reply`;

      const forceFromStorage     = localStorage.getItem('force_new_thread') === 'true';
      const shouldForceNewThread = role === 'user' && (threadResetRef.current || forceFromStorage);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tokens: tokens || Math.ceil(text.length / 4),
          forceNewThread: shouldForceNewThread
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(`last_saved_key_${sessionId}`, messageKey);
        localStorage.setItem(`last_saved_time_${sessionId}`, now.toString());

        const lastMsg = messages[messages.length - 1];
        if (lastMsg) lastSavedMessageRef.current = lastMsg.id;

        // ✅ Mark that user has messaged — enables reload detection next time
        if (role === 'user') {
          localStorage.setItem('chat_user_messaged', 'true');
        }

        // ✅ Reset force flags after new thread confirmed
        if (shouldForceNewThread && data.data?.isNewThread === true) {
          threadResetRef.current = false;
          localStorage.removeItem('force_new_thread');
        }
      } else {
        console.error('❌ Save failed:', data);
      }

      return { success: response.ok, data };
    } catch (err) {
      console.error('❌ Message save error:', err);
      return { success: false, error: err.message };
    }
  };

  // ─── Scroll to bottom on new messages ─────────────────────────
  const forceScrollToBottom = () => {
    // Admin widget has no separate chatBodyRef, ChatBody handles its own scroll
  };

  useEffect(() => {
    if (messages.length > lastMessageCount.current) setTimeout(() => forceScrollToBottom(), 100);
    lastMessageCount.current = messages.length;
  }, [messages]);

  // ─── Message animation tracking ────────────────────────────────
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'support-bot') {
      const messageId = Date.now();
      setMessageAnimations(prev => ({ ...prev, [messageId]: 'typing' }));
      setTimeout(() => setMessageAnimations(prev => ({ ...prev, [messageId]: 'visible' })), Math.min(lastMessage.message.length * 30, 1500));
      setLastAIMessage(lastMessage.message);
    }
  }, [messages]);

  // ─── API helpers ───────────────────────────────────────────────
  const getDatabaseUrlFromHeaderAPI = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.success && data.item) return { websiteUrl: data.item.websiteUrl, websiteName: data.item.websiteName || 'Support', status: data.item.status || 'active', websiteId: data.item.websiteId || data.item.id };
      return null;
    } catch { return null; }
  };

  const fetchWelcomeMessages = async (websiteId) => {
    if (!websiteId || !apiBaseUrl || !backendApiKey) return [];
    try {
      const response = await fetch(`${apiBaseUrl}/api/websites/chat-config?apiKey=${backendApiKey}&websiteId=${websiteId}`);
      const data = await response.json();
      if (data.success && data.item?.systemPrompt) return data.item.systemPrompt.map(p => p.content).filter(msg => msg && msg.trim());
      return [];
    } catch { return []; }
  };

  const fetchWebsiteConfig = async (websiteId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/websites/client-config?apiKey=${encodeURIComponent(backendApiKey)}&websiteId=${websiteId}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.success && data.item) {
        if (data.item.aifuture)    setAifuture(data.item.aifuture);
        if (data.item.aiPersonality) setAiPersonality(data.item.aiPersonality);
        if (data.item.systemPrompt?.length > 0) setSuggestedPrompts(data.item.systemPrompt.map(p => p.content).filter(p => p?.trim().length > 0));
        if (data.item.customPrompt?.length > 0) setSuggestedPrompts(prev => [...prev, ...data.item.customPrompt]);
        return data.item;
      }
      return null;
    } catch { return null; }
  };

  const showServiceUnavailableMessage = (status) => {
    const msgs = { inactive: 'Chat service is temporarily disabled for this website. Please contact the website administrator for assistance.', error: 'Service is currently unavailable. Please try again later.' };
    setMessages([{ id: uuidv4(), sender: 'support-bot', message: msgs[status] || msgs.error, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/[^\w\s.,!?\-]/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  };

  const showWelcomeMessage = (backendWelcomeMessages, websiteData) => {
    if (hasShownWelcome.current || welcomeShownRef.current) return;
    let welcomeMessage = '';
    if (backendWelcomeMessages?.length > 0) {
      welcomeMessage = backendWelcomeMessages[Math.floor(Math.random() * backendWelcomeMessages.length)];
    } else if (websiteData.systemPrompt?.length > 0) {
      welcomeMessage = websiteData.systemPrompt[Math.floor(Math.random() * websiteData.systemPrompt.length)];
    } else {
      const greetings = [
        `Hello there! I'm your ${websiteData.websiteName || 'AI'} assistant. How can I help you today?`,
        `Hey! Welcome! I'm here to help you with anything about ${websiteData.websiteName || 'our services'}. What's on your mind?`
      ];
      welcomeMessage = greetings[Math.floor(Math.random() * greetings.length)];
    }
    welcomeMessage = cleanText(welcomeMessage);
    setMessages([{ id: uuidv4(), sender: 'support-bot', message: welcomeMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
    hasShownWelcome.current = true;
    welcomeShownRef.current = true;
    setTimeout(() => saveSingleMessage('support-bot', welcomeMessage), 500);
  };

  // ─── Chat initialization ───────────────────────────────────────
  useEffect(() => {
    const initializeChat = async () => {
      setupParentCommunication();
      const databaseConfig = await getDatabaseUrlFromHeaderAPI();
      if (databaseConfig) {
        const wStatus = databaseConfig.status?.toLowerCase();
        if (wStatus !== 'active') {
          setWebsiteStatus('inactive'); setIsWebsiteActive(false); setConnectionStatus('offline');
          setWebsiteTitle(databaseConfig.websiteName || 'Support');
          showServiceUnavailableMessage('inactive');
          hasShownWelcome.current = true; welcomeShownRef.current = true;
          return;
        }
        setWebsiteStatus('active'); setIsWebsiteActive(true); setConnectionStatus('online');
        setWebsiteTitle(databaseConfig.websiteName || 'Support');
        const websiteData = await fetchWebsiteConfig(databaseConfig.websiteId);
        if (websiteData) {
          setActiveConfig(websiteData); setCategories(websiteData.category || []); setSystemPrompts(websiteData.systemPrompt || []);
          if (websiteData.customPrompt?.length > 0) setSuggestedPrompts(websiteData.customPrompt);
          const backendWelcomeMessages = await fetchWelcomeMessages(databaseConfig.websiteId);
          setWelcomeMessages(backendWelcomeMessages);
          showWelcomeMessage(backendWelcomeMessages, websiteData);
        } else { showWelcomeMessage([], databaseConfig); }
      } else {
        setWebsiteStatus('not_found'); setIsWebsiteActive(false); setConnectionStatus('offline');
        showServiceUnavailableMessage('not_found');
        hasShownWelcome.current = true; welcomeShownRef.current = true;
      }
    };
    initializeChat();
  }, [apiBaseUrl, backendApiKey]);

  // ─── Connection polling ────────────────────────────────────────
  useEffect(() => {
    if (!isWebsiteActive || websiteStatus === 'inactive') return;
    const checkConnection = async () => {
      try {
        const res  = await fetch(`${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.item) {
            if (data.item.status?.toLowerCase() !== 'active') {
              setIsWebsiteActive(false); setWebsiteStatus('inactive'); setConnectionStatus('offline');
              if (hasShownWelcome.current) setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: 'Chat service is temporarily disabled for this website. Please contact the website administrator for assistance.', createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
              return;
            }
            setConnectionStatus('online');
          } else { setConnectionStatus('offline'); }
        } else { setConnectionStatus('offline'); }
      } catch { setConnectionStatus('offline'); }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, isWebsiteActive, backendApiKey, websiteStatus]);

  const handleInactiveInteraction = () => {
    if (websiteStatus === 'inactive') setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: 'Chat service is temporarily disabled for this website. Please contact the website administrator for assistance.', createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
    return false;
  };

  // ─── Data helpers ──────────────────────────────────────────────
  const transformDataWithParams = (originalData, promptsWithParams) => {
    if (!promptsWithParams?.length) return originalData;
    const textToParamMap = {};
    promptsWithParams.forEach(item => { if (item.text && item.parameter?.key) textToParamMap[item.text] = item.parameter.key; });
    const transformedData = {};
    Object.entries(originalData).forEach(([textKey, value]) => { transformedData[textToParamMap[textKey] || textKey] = value; });
    return transformedData;
  };

  // ─── Prompt flow ───────────────────────────────────────────────
  const completePromptFlow = (data) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const transformedData = storedPromptsWithParams?.length > 0 ? transformDataWithParams(data, storedPromptsWithParams) : { ...data };
    setCollectedData(data);
    setTransformedDataForAPI(transformedData);
    let clientSummary = "Summary of Your Details\n\n";
    Object.entries(data).forEach(([key, value], i) => { clientSummary += `${i + 1}) ${key} : ${value}\n`; });
    clientSummary += "\nPlease confirm if all details are correct!";
    setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: clientSummary, createdAt: new Date().toISOString(), isAdmin: true }]);
    saveSingleMessage('support-bot', clientSummary);
    setTimeout(async () => {
      const confirmMsg = 'All done! Would you like to confirm this request?';
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: confirmMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
      await saveSingleMessage('support-bot', confirmMsg);
      setIsConfirming(true);
      setCurrentPromptFlow(null);
    }, 1000);
  };

  const handleConfirmResponse = async (answer) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setIsConfirming(false); setCurrentChildOptions([]);
    setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', message: answer, createdAt: new Date().toISOString(), isAdmin: false }]);
    await saveSingleMessage('user', answer);
    try {
      if (answer === 'Yes') {
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: 'Saving your request...', createdAt: new Date().toISOString(), isAdmin: true, _isTemp: true }]);
        let serverSummary = "", count = 1;
        Object.entries(collectedData).forEach(([key, value]) => {
          const hasMapping = storedPromptsWithParams?.some(item => item.text === key && item.parameter?.key);
          if (!hasMapping) { serverSummary += `${count}) ${key} : ${value}\n`; count++; }
        });
        if (count === 1) serverSummary = "";
        const formData = new FormData();
        formData.append("websiteId",   activeConfig.websiteId || activeConfig.id);
        formData.append("promptName",  selectedPromptName);
        Object.entries(transformedDataForAPI).forEach(([key, value]) => { if (value != null) formData.append(key, value); });
        if (storedSummaryList?.length > 0) {
          const summaryItem = storedSummaryList.find(item => item.text === "Summary");
          if (summaryItem?.parameter?.key) formData.append(summaryItem.parameter.key, serverSummary);
        }
        const execResult    = await (await fetch(`${apiBaseUrl}/api/execute-urls`, { method: "POST", body: formData })).json();
        const urlCallResults = execResult.results || [];
        const saveResult    = await (await fetch(`${apiBaseUrl}/api/chat-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${backendApiKey}` }, body: JSON.stringify({ websiteId: activeConfig?.id, collectedData: transformedDataForAPI, backendApiKey, urlCallResults: urlCallResults.length > 0 ? urlCallResults : undefined }) })).json();
        if (saveResult.success) {
          setMessages(prev => prev.filter(msg => msg._isTemp !== true));
          const successMessages = ["Excellent! Your request has been confirmed successfully! We'll contact you shortly.", "Perfect! Your request is saved and we'll get back to you soon! Thank you!"];
          const successMessage  = successMessages[Math.floor(Math.random() * successMessages.length)];
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: successMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', successMessage);
        } else { throw new Error(saveResult.message || 'Failed to save request'); }
      } else {
        await fetch(`${apiBaseUrl}/api/chat-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${backendApiKey}` }, body: JSON.stringify({ websiteId: activeConfig?.id, collectedData: transformedDataForAPI }) });
        const cancelMessages = ['No worries! Your request has been cancelled. Feel free to update and try again later!', "Cancelled! You can update your request anytime or try again later. We're here to help!"];
        const cancelMessage  = cancelMessages[Math.floor(Math.random() * cancelMessages.length)];
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: cancelMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', cancelMessage);
      }
    } catch (error) {
      console.error("Error in handleConfirmResponse:", error);
      setMessages(prev => prev.filter(msg => msg._isTemp !== true));
      const errorMessages = ['Oops! There was a small hiccup processing your request. Please try again in a moment!', 'Technical Glitch: We encountered an issue. Please try again or contact support if it persists.'];
      const errorMessage  = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: errorMessage, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
      await saveSingleMessage('support-bot', errorMessage);
    } finally {
      setCollectedData({}); setTransformedDataForAPI({}); setCurrentPromptFlow(null);
      setStoredUrls([]); setStoredApiKeys([]); setStoredPromptsWithParams([]); setStoredSummaryList([]); setRecentTopics([]);
    }
  };

  const makeFriendly = (text) => {
    if (typeof text !== "string" || !text.trim()) return "Could you please provide some information?";
    const friendlyPrompts = [`Could you please share ${text}?`, `May I know ${text}?`, `Please tell me ${text}`, `I'd love to know ${text}!`];
    return friendlyPrompts[Math.floor(Math.random() * friendlyPrompts.length)];
  };

  const validateEmail       = (email)  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhoneNumber = (phone)  => { const c = phone.replace(/\D/g, ''); return c.length === 10 && /^\d+$/.test(c); };
  const validateNumber      = (number) => !isNaN(number) && number.trim() !== '';
  const validateSingleDate  = (dateStr) => { const formats = [/^\d{1,2}-\d{1,2}-\d{4}$/, /^\d{1,2}\/\d{1,2}\/\d{4}$/, /^\d{4}-\d{1,2}-\d{1,2}$/]; return formats.some(f => f.test(dateStr)) && !isNaN(new Date(dateStr).getTime()); };
  const validateDate        = (date)   => { const d = date.trim(); if (d.includes(' to ')) { const [s, e] = d.split(' to ').map(x => x.trim()); return validateSingleDate(s) && validateSingleDate(e); } return validateSingleDate(d); };
  const validateURL         = (url)    => { const patterns = [/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+(:\d{1,5})?(\/[a-zA-Z0-9-._~:?#@!$&'()*+,;=]*)?$/, /^(https?:\/\/)?localhost(:\d{1,5})?(\/.*)?$/]; return patterns.some(p => p.test(url.trim())); };
  const validateInput       = (fieldType, value) => { switch (fieldType) { case 'email': return validateEmail(value); case 'number': return validateNumber(value); case 'phone': return validatePhoneNumber(value); case 'date': return validateDate(value); case 'url': return validateURL(value); default: return value.trim() !== ''; } };
  const getFieldType        = (text)   => { const t = text.toLowerCase(); if (t.includes('email') || t.includes('e-mail') || t.includes('gmail')) return 'email'; if (t.includes('phone') || t.includes('mobile')) return 'phone'; if (t.includes('number') || t.includes('guest')) return 'number'; if (t.includes('url') || t.includes('website') || t.includes('link')) return 'url'; if (t.includes('date') || t.includes('stay') || t.includes('check-in')) return 'date'; return 'text'; };

  const handlePromptFlowResponse = (userAnswer) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { currentQuestion } = currentPromptFlow;
    const fieldType           = getFieldType(currentQuestion.text);
    if (!validateInput(fieldType, userAnswer)) {
      const errors = { email: 'Please enter a valid email address (e.g., name@example.com)', phone: 'Please enter a valid 10-digit phone number', number: 'Please enter a valid number', date: 'Please enter valid dates (e.g., "15-12-2024 to 20-12-2024" or "15/12/2024")', url: 'Please enter a valid URL (e.g., http://example.com)' };
      const errorMsg = errors[fieldType] || 'Please provide a valid response';
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: errorMsg, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
      saveSingleMessage('support-bot', errorMsg);
      return;
    }
    const newCollectedData = { ...collectedData, [currentQuestion.text]: userAnswer };
    setCollectedData(newCollectedData);
    moveToNextQuestion(newCollectedData);
  };

  const moveToNextQuestion = async (data) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, questionIndex } = currentPromptFlow;
    const currentPrompt = prompts[promptIndex];

    if (currentPromptFlow.isSingleChild && questionIndex === 0) {
      const nextPromptIndex = promptIndex + 1;
      if (nextPromptIndex < prompts.length) {
        const nextPrompt = prompts[nextPromptIndex];
        if (nextPrompt.children?.length > 0) {
          if (nextPrompt.children.length === 1) {
            const sc = nextPrompt.children[0];
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: sc, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: true });
            const botMessage = makeFriendly(sc.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, promptName: currentPromptFlow.promptName, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
          }
        } else {
          setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(data); }
      return;
    }

    if (currentPrompt.children?.length > 0 && questionIndex === 0) { showOptionsAfterQuestion(currentPrompt.children, prompts, promptIndex); return; }

    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex < (currentPrompt.children?.length || 0)) {
      const nextQuestion = currentPrompt.children[nextQuestionIndex];
      setCurrentPromptFlow(prev => ({ ...prev, questionIndex: nextQuestionIndex, currentQuestion: nextQuestion }));
      const botMessage = makeFriendly(nextQuestion.text);
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
      await saveSingleMessage('support-bot', botMessage);
    } else {
      const nextPromptIndex = promptIndex + 1;
      if (nextPromptIndex < prompts.length) {
        const nextPrompt = prompts[nextPromptIndex];
        if (nextPrompt.children?.length > 0) {
          if (nextPrompt.children.length === 1) {
            const sc = nextPrompt.children[0];
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: sc, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: true });
            const botMessage = makeFriendly(sc.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, promptName: currentPromptFlow.promptName, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            if (nextPrompt.children?.length > 0) setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
          }
        } else {
          setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(data); }
    }
  };

  const showOptionsAfterQuestion = async (children, prompts, promptIndex) => {
    if (children.length > 1) {
      setCurrentChildOptions(children.map(c => c.text));
      setCurrentPromptFlow(prev => ({ ...prev, waitingForOption: true, childOptions: children, currentQuestion: { text: 'Select Option' } }));
    } else if (children.length === 1) {
      const sc         = children[0];
      const botMessage = makeFriendly(sc.text);
      setCurrentPromptFlow(prev => ({ ...prev, waitingForOption: false, currentQuestion: sc, isSingleChild: true }));
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
      await saveSingleMessage('support-bot', botMessage);
    }
  };

  const handleOptionSelect = async (optionText) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, childOptions } = currentPromptFlow;
    const selectedOption = childOptions.find(opt => opt.text === optionText);
    if (!selectedOption) {
      const errorMsg = 'Please select a valid option from the available choices.';
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: errorMsg, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
      await saveSingleMessage('support-bot', errorMsg);
      return;
    }
    const newCollectedData = { ...collectedData, [prompts[promptIndex].text]: optionText };
    setCollectedData(newCollectedData); setCurrentChildOptions([]);
    if (!messages[messages.length - 1].isOptions) {
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', message: optionText, createdAt: new Date().toISOString(), isAdmin: false }]);
      await saveSingleMessage('user', optionText);
    }
    if (selectedOption.children?.length > 0) {
      if (selectedOption.children.length === 1) {
        const sc         = selectedOption.children[0];
        const botMessage = makeFriendly(sc.text);
        setCurrentPromptFlow(prev => ({ ...prev, waitingForOption: false, currentQuestion: sc, isSingleChild: true }));
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', botMessage);
      } else { setTimeout(() => showOptionsAfterQuestion(selectedOption.children, prompts, promptIndex), 500); }
    } else {
      const nextPromptIndex = promptIndex + 1;
      if (nextPromptIndex < prompts.length) {
        const nextPrompt = prompts[nextPromptIndex];
        if (nextPrompt.children?.length > 0) {
          if (nextPrompt.children.length === 1) {
            const sc         = nextPrompt.children[0];
            const botMessage = makeFriendly(sc.text);
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: sc, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: true });
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, promptName: currentPromptFlow.promptName, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            if (nextPrompt.children?.length > 0) setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
          }
        } else {
          setCurrentPromptFlow({ prompts, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, promptName: currentPromptFlow.promptName, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(newCollectedData); }
    }
  };

  const checkUserInterest = (userMessage) => {
    if (!userMessage || typeof userMessage !== 'string') return false;
    const messageLower   = userMessage.toLowerCase().trim();
    const interestPatterns = ['yes', 'yes.', 'yes!', 'yes?', 'okay', 'okay.', 'okay!', 'ok', 'ok.', 'ok!', 'sure', 'sure.', 'sure!', 'absolutely', 'yeah', 'yeah.', 'yeah!', 'yep', 'yep.', 'why not', 'yes please', 'yes, please', 'sure, please', 'yes go ahead', 'start now', "let's start", 'lets start', 'start please', 'continue please', 'show me', 'yes i want that', 'yes i want it', 'i want that', 'i want it', 'i want this'];
    if (interestPatterns.some(p => messageLower === p.toLowerCase())) return true;
    if (messageLower.startsWith('i want') && messageLower.split(' ').length <= 3) return true;
    if (['start', 'continue', 'begin'].includes(messageLower)) return true;
    return false;
  };

  const checkUserNotInterest = (userMessage) => {
    if (!userMessage || typeof userMessage !== 'string') return false;
    const messageLower    = userMessage.toLowerCase().trim();
    const negativePatterns = ['no', 'no.', 'no!', 'no?', 'nope', 'nope.', 'nah', 'nah.', 'never', 'no thanks', 'no thank you', 'not interested', 'not now', 'not today', 'maybe later', 'later', 'some other time', "don't want", 'dont want', 'do not want', "don't think so", 'not right now', "i'm busy", 'im busy', "we're busy"];
    return negativePatterns.some(p => messageLower === p.toLowerCase());
  };

  const findMatchingPrompt = (aiResponse) => {
    if (!aiResponse || !suggestedPrompts.length) return null;
    const aiResponseLower = aiResponse.toLowerCase();
    let bestMatch = null, highestScore = 0;
    suggestedPrompts.forEach(prompt => {
      if (!prompt || typeof prompt !== 'string') return;
      const promptLower = prompt.toLowerCase();
      let score = 0;
      promptLower.split(/\s+/).forEach(pWord => { if (pWord.length > 3) aiResponseLower.split(/\s+/).forEach(rWord => { if (rWord.length > 3 && (pWord.includes(rWord) || rWord.includes(pWord))) score += 2; }); });
      if (aiResponseLower.includes(promptLower) || promptLower.includes(aiResponseLower)) score += 5;
      if (score > highestScore) { highestScore = score; bestMatch = prompt; }
    });
    return highestScore > 3 ? bestMatch : null;
  };

  const handlePromptClick = async (promptName) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setAutoClickInProgress(false); setIsLoading(true);
    try {
      const childRes = await fetch(`${apiBaseUrl}/api/childprompt/${activeConfig?.id}/${encodeURIComponent(promptName)}/filtered`, { headers: { Authorization: `Bearer ${backendApiKey}` } });
      const data     = await childRes.json();
      setSelectedPromptName(promptName);
      setStoredPromptsWithParams(data.promptsWithParams || []);
      setStoredSummaryList(data.summaryList?.length > 0 ? data.summaryList : []);
      const prompts = data.prompts || (data.items?.length ? data.items.flatMap(i => i.prompts) : []);
      setCollectedData({}); setTransformedDataForAPI({}); setCurrentChildOptions([]);

      setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', message: promptName, createdAt: new Date().toISOString(), isAdmin: false }]);
      await saveSingleMessage('user', promptName);

      const introMessages  = [`Awesome choice! Let's work on ${promptName} together!`, `Great! Let's get started with ${promptName}. I'll guide you step by step!`];
      const introMessage   = introMessages[Math.floor(Math.random() * introMessages.length)];
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: introMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
      await saveSingleMessage('support-bot', introMessage);

      if (prompts.length > 0) {
        const firstPrompt = prompts[0];
        if (firstPrompt.children?.length > 0) {
          if (firstPrompt.children.length === 1) {
            const sc         = firstPrompt.children[0];
            const botMessage = makeFriendly(sc.text);
            setCurrentPromptFlow({ prompts, promptIndex: 0, questionIndex: 0, currentQuestion: sc, waitingForOption: false, childOptions: null, promptName, isSingleChild: true });
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ prompts, promptIndex: 0, questionIndex: 0, currentQuestion: firstPrompt, waitingForOption: false, childOptions: firstPrompt.children, promptName, isSingleChild: false });
            const botMessage = makeFriendly(firstPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            setTimeout(() => showOptionsAfterQuestion(firstPrompt.children, prompts, 0), 1000);
          }
        } else {
          setCurrentPromptFlow({ prompts, promptIndex: 0, questionIndex: 0, currentQuestion: firstPrompt, waitingForOption: false, childOptions: null, promptName, isSingleChild: false });
          const botMessage = makeFriendly(firstPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else {
        const fallbackMsg = `I'd be happy to help you with ${promptName}! Please tell me your requirements and I'll assist you.`;
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: fallbackMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', fallbackMsg);
        setCurrentPromptFlow(null);
      }
    } catch (err) {
      console.error("Prompt Click Error:", err);
      const botMsg = `I'd love to help with ${promptName}! Please share what you need, and I'll do my best to assist!`;
      setMessages(prev => [...prev,
        { id: uuidv4(), sender: 'user',        message: promptName, createdAt: new Date().toISOString(), isAdmin: false },
        { id: uuidv4(), sender: 'support-bot', message: botMsg,     createdAt: new Date().toISOString(), isAdmin: true  }
      ]);
      await saveSingleMessage('user',        promptName);
      await saveSingleMessage('support-bot', botMsg);
      setCurrentPromptFlow(null);
    } finally { setTimeout(() => { setAutoClickInProgress(false); setIsLoading(false); }, 2000); }
  };

  const handleNextQuestion = async (userAnswer = '') => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    if (pendingQuestions.length > 0) {
      const [next, ...rest] = pendingQuestions;
      setPendingQuestions(rest);
      const botMsg = makeFriendly(next);
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
      await saveSingleMessage('support-bot', botMsg);
    } else if (!isConfirming && messages.length > 0) {
      setTimeout(async () => {
        const confirmMsg = 'All done! Would you like to confirm this request?';
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: confirmMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', confirmMsg);
        setIsConfirming(true);
      }, 700);
    }
  };

  const generateAIResponse = async (question) => {
    if (!isWebsiteActive) return { response: websiteStatus === 'inactive' ? 'Chat service is temporarily disabled.' : 'Service is currently unavailable.' };
    try {
      setIsLoading(true);
      const res  = await fetch(`${apiBaseUrl}/api/generate-ai-response`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, apiKey: backendApiKey }) });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      return { response: cleanText(data.success ? data.response : data.message) || "I'm having trouble processing that. Could you please rephrase your question?", hasDirectMatch: data.hasDirectMatch || false };
    } catch {
      const fallbacks = ["Hmm, I'm having trouble connecting to my knowledge base right now. Could you try again in a moment?", "Technical hiccup! I couldn't process your request. Please try again or rephrase your question."];
      return { response: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
    } finally { setIsLoading(false); }
  };

  const extractMainTopic = (aiResponse) => {
    if (!aiResponse) return null;
    const firstSentence = aiResponse.split(/[.!?]/)[0]?.trim();
    if (!firstSentence) return null;
    const cleaned = firstSentence.replace(/^(I can help you with|We offer|We provide|Our services include|You can get|Get|Available)\s+/i, '').replace(/^(There is|There are)\s+/i, '').trim();
    const word = (cleaned !== firstSentence ? cleaned : firstSentence).trim().split(/\s+/)[0];
    return word?.length > 50 ? word.substring(0, 50) + '...' : word;
  };

  // ─── Main message handler ──────────────────────────────────────
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setLastActivity(Date.now());

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'user' && lastMessage.message === text) {
      const timeDiff = Math.abs(new Date() - new Date(lastMessage.createdAt));
      if (timeDiff < 3000) return;
    }

    setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', message: text, createdAt: new Date().toISOString(), isAdmin: false }]);
    setInputMessage('');
    await saveSingleMessage('user', text);

    if (currentPromptFlow?.waitingForOption)         { handleOptionSelect(text);       return; }
    if (currentPromptFlow?.currentQuestion)          { handlePromptFlowResponse(text); return; }
    if (pendingQuestions.length > 0 || isConfirming) { setTimeout(() => handleNextQuestion(text), 800); return; }

    const lastBotMessage = messages.slice().reverse().find(msg => msg.sender === 'support-bot' && msg.isAdmin);
    const isEmailRequest = lastBotMessage && (
      lastBotMessage.message.includes('email address') ||
      lastBotMessage.message.includes('Please provide your email')
    );

    if (isEmailRequest) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) {
        const errorMsg = 'Please provide a valid email address (e.g., name@example.com)';
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: errorMsg, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
        await saveSingleMessage('support-bot', errorMsg);
        return;
      }
      setIsLoading(true);
      try {
        const allAIMessages = messages.filter(msg => msg.sender === 'support-bot' && msg.isAdmin);
        const payload       = { websiteId: activeConfig?.id, collectedData: { email: text.trim(), lastMessage: allAIMessages[allAIMessages.length - 1]?.message || '', secondLastMessage: allAIMessages[allAIMessages.length - 2]?.message || '' }, backendApiKey };
        const saveResult    = await (await fetch(`${apiBaseUrl}/api/chat-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${backendApiKey}` }, body: JSON.stringify(payload) })).json();
        if (saveResult.success) {
          const successMsg = 'Thank you! Your email has been saved. Our team will contact you shortly regarding this.';
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: successMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', successMsg);
        } else { throw new Error(saveResult.message || 'Failed to save request'); }
      } catch {
        const errorMsg = 'Sorry, there was an error saving your email. Please try again.';
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: errorMsg, createdAt: new Date().toISOString(), isAdmin: true, isError: true }]);
        await saveSingleMessage('support-bot', errorMsg);
      } finally { setIsLoading(false); }
      return;
    }

    if (checkUserNotInterest(text)) {
      setTimeout(async () => {
        const notInterestMsg = 'No problem! If you have any other questions, feel free to ask. How else can I help you?';
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: notInterestMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', notInterestMsg);
      }, 500);
      return;
    }

    if (checkUserInterest(text) && lastAIMessage && interestDetectionEnabled) {
      const matchingPrompt = findMatchingPrompt(lastAIMessage);
      if (matchingPrompt && !autoClickInProgress) {
        setAutoClickInProgress(true);
        const processingMsg = `Great! I'll help you with ${matchingPrompt}. Setting it up for you...`;
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: processingMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', processingMsg);
        setTimeout(() => handlePromptClick(matchingPrompt), 1500);
        return;
      }
      if (!matchingPrompt) {
        setIsLoading(true);
        const aiTopic  = extractMainTopic(lastAIMessage);
        const emailMsg = aiTopic
          ? `Please provide your email address, we will get you in touch regarding "${aiTopic}"`
          : `Please provide your email address, we will get you in touch regarding this`;
        setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: emailMsg, createdAt: new Date().toISOString(), isAdmin: true }]);
        await saveSingleMessage('support-bot', emailMsg);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    const { response }    = await generateAIResponse(text);
    const cleanedResponse = cleanText(response);

    const lastBotMsg = messages[messages.length - 1];
    if (lastBotMsg && lastBotMsg.sender === 'support-bot' && lastBotMsg.message === cleanedResponse) {
      setIsLoading(false);
      return;
    }

    setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: cleanedResponse, createdAt: new Date().toISOString(), isAdmin: true }]);
    await saveSingleMessage('support-bot', cleanedResponse);
    setLastAIMessage(cleanedResponse);
    setIsLoading(false);
  };

  const handleCloseChat = () => {
    if (messages.length > 0 && !isSaving) saveCurrentConversation();
    if (typeof window !== 'undefined') window.parent.postMessage('close-chat', '*');
    setCurrentPromptFlow(null); setCollectedData({}); setTransformedDataForAPI({});
    setCurrentChildOptions([]); setStoredUrls([]); setStoredApiKeys([]);
    setStoredPromptsWithParams([]); setRecentTopics([]); setAutoClickInProgress(false);
  };

  const isInputDisabled = isLoading || isConfirming || (currentPromptFlow?.waitingForOption) || !isWebsiteActive || autoClickInProgress || isSaving;

  return (
    <div className={styles.chatWidgetContainer} style={responsiveStyles.container}>
      {isChatOpen && (
        <div className={styles.chatWidgetWindow} style={responsiveStyles.window}>
          {isFullScreen && <div className={styles.safeAreaTop} />}

          <ChatHeader
            secondaryColor={secondaryColor}
            connectionStatus={connectionStatus}
            onClose={handleCloseChat}
            websiteTitle={websiteTitle}
            apiBaseUrl={apiBaseUrl}
            backendApiKey={backendApiKey}
            isWebsiteActive={isWebsiteActive}
            websiteStatus={websiteStatus}
            showCloseButton={isFullScreen}
            headerColor={resolvedHeaderColor}
          />

          <ChatBody
            messages={messages} isLoading={isLoading}
            primaryColor={primaryColor} secondaryColor={secondaryColor}
            apiBaseUrl={apiBaseUrl} backendApiKey={backendApiKey}
            onPromptClick={handlePromptClick} onConfirmClick={handleConfirmResponse}
            onOptionSelect={handleOptionSelect} showConfirmButtons={isConfirming}
            currentPromptFlow={currentPromptFlow} suggestedPrompts={suggestedPrompts}
            currentChildOptions={currentChildOptions} isWebsiteActive={isWebsiteActive}
            websiteStatus={websiteStatus} messageAnimations={messageAnimations}
            isFullScreen={isFullScreen}
          />

          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            sendMessage={handleSendMessage}
            disabled={isInputDisabled}
            primaryColor={primaryColor}
            isWebsiteActive={isWebsiteActive}
            websiteStatus={websiteStatus}
            isFullScreen={isFullScreen}
            headerColor={resolvedHeaderColor}
            poweredByText={resolvedPoweredByText}
            poweredByUrl={resolvedPoweredByUrl}
          />

          {isFullScreen && <div className={styles.safeAreaBottom} />}
          {autoClickInProgress && <div className={styles.autoClickIndicator}><div className={styles.autoClickSpinner} /></div>}
        </div>
      )}
    </div>
  );
};

export default Chatwidget;