'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './ChatWidget.module.css';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatBody from '../ChatBody/ChatBody';
import ChatInput from '../ChatInput/ChatInput';
import config from '../utils/config';

import { checkScreenSize, getResponsiveStyles } from '../utils/deviceUtils';
import { getCurrentWebsiteUrl, checkUrlMatch } from '../utils/urlUtils';
import { validateInput, getFieldType } from '../utils/validationUtils';
import {
  cleanText, makeFriendly, checkUserInterest, checkUserNotInterest,
  extractMainTopic, getServiceUnavailableMessage, generateWelcomeMessage,
  getSuccessMessage, getCancelMessage, getErrorMessage, getPromptIntroMessage
} from '../utils/textUtils';
import { setupParentCommunication, sendCloseMessageToParent } from '../utils/communicationUtils';
import { getDatabaseUrlFromHeaderAPI, checkWebsiteConnection } from '../utils/api/websiteApi';
import { fetchWebsiteConfig, fetchWelcomeMessages, fetchChildPrompts, generateAIResponse } from '../utils/api/chatApi';
import { executeUrls, saveChatRequest, saveEmailRequest, saveConversationToDatabase } from '../utils/api/requestApi';
import { transformDataWithParams, createClientSummary, createServerSummary, findSummaryParamKey } from '../utils/transformUtils';
import { v4 as uuidv4 } from 'uuid';

const TOKEN_LIMIT_MESSAGE = 'Token limit reached. Please upgrade your token plan.';

const ChatWidget = ({
  primaryColor   = '#4a6baf',
  secondaryColor = 'tomato',
  widgetPosition = { right: '0px', bottom: '0px' },
  chatWindowSize = { width: '340px', height: '470px' },
  backendApiKey  = config.backendApiKey,
  apiBaseUrl     = config.apiBaseUrl,
}) => {
  const [isChatOpen, setIsChatOpen]                           = useState(true);
  const [messages, setMessages]                               = useState([]);
  const [inputMessage, setInputMessage]                       = useState('');
  const [isLoading, setIsLoading]                             = useState(false);
  // isTyping — jab tak latest bot message word-by-word chal raha hai
  const [isTyping, setIsTyping]                               = useState(false);
  const [storedSummaryList, setStoredSummaryList]             = useState([]);
  const [systemPrompts, setSystemPrompts]                     = useState([]);
  const [welcomeMessages, setWelcomeMessages]                 = useState([]);
  const [websiteTitle, setWebsiteTitle]                       = useState('Support');
  const [pendingQuestions, setPendingQuestions]               = useState([]);
  const [isConfirming, setIsConfirming]                       = useState(false);
  const [connectionStatus, setConnectionStatus]               = useState('connecting');
  const [activeConfig, setActiveConfig]                       = useState(null);
  const [categories, setCategories]                           = useState([]);
  const [currentPromptFlow, setCurrentPromptFlow]             = useState(null);
  const [collectedData, setCollectedData]                     = useState({});
  const [transformedDataForAPI, setTransformedDataForAPI]     = useState({});
  const [allCustomPrompts, setAllCustomPrompts]               = useState([]);
  const [suggestedPrompts, setSuggestedPrompts]               = useState([]);
  const [currentChildOptions, setCurrentChildOptions]         = useState([]);
  const [isWebsiteActive, setIsWebsiteActive]                 = useState(false);
  const [websiteStatus, setWebsiteStatus]                     = useState('checking');
  const [storedUrls, setStoredUrls]                           = useState([]);
  const [storedApiKeys, setStoredApiKeys]                     = useState([]);
  const [storedPromptsWithParams, setStoredPromptsWithParams] = useState([]);
  const [messageAnimations, setMessageAnimations]             = useState({});
  const [selectedPromptName, setSelectedPromptName]           = useState('');
  const [parentWebsiteUrl, setParentWebsiteUrl]               = useState('');
  const [interestDetectionEnabled]                            = useState(true);
  const [recentTopics, setRecentTopics]                       = useState([]);
  const [autoClickInProgress, setAutoClickInProgress]         = useState(false);
  const [lastAIMessage, setLastAIMessage]                     = useState('');
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false, isTablet: false, isSmallScreen: false,
    screenWidth: 1024, deviceType: 'desktop'
  });
  const [isFullScreen, setIsFullScreen]                       = useState(false);
  const [isInitialized, setIsInitialized]                     = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible]             = useState(false);
  const [keyboardHeight, setKeyboardHeight]                   = useState(0);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: '0px', bottom: '0px', left: '0px', right: '0px'
  });
  const [sessionId, setSessionId]                 = useState('');
  const [autoSaveEnabled]                         = useState(true);
  const [lastActivity, setLastActivity]           = useState(Date.now());
  const [sessionStartTime, setSessionStartTime]   = useState(Date.now());
  const [conversationCount, setConversationCount] = useState(0);
  const [responsiveStyles, setResponsiveStyles]   = useState({
    container: {},
    window: {
      width: chatWindowSize.width, height: chatWindowSize.height,
      position: 'fixed', right: widgetPosition.right, bottom: widgetPosition.bottom
    }
  });
  const [isSaving, setIsSaving]                   = useState(false);
  const [chatEnabled, setChatEnabled]             = useState(true);
  const [tokenLimitReached, setTokenLimitReached] = useState(false);
  const [hasInitialSave, setHasInitialSave]       = useState(false);
  const [isMounted, setIsMounted]                 = useState(false);
  const [headerColor, setHeaderColor]             = useState(null);
  const [poweredByText, setPoweredByText]         = useState('JDPC Global');
  const [poweredByUrl, setPoweredByUrl]           = useState('https://jdpcglobal.com');
  const [tokenDetails, setTokenDetails]           = useState(null);
  const [tokenUserId, setTokenUserId]             = useState(null);

  const userHasMessagedRef  = useRef(false);
  const TOKENDETAILS_API_URL = '/api/user/token-details';
  const chatBodyRef          = useRef(null);
  const chatInputRef         = useRef(null);
  const messagesEndRef       = useRef(null);
  const headerRef            = useRef(null);
  const inputWrapperRef      = useRef(null);
  const lastMessageCount     = useRef(0);
  const saveTimeoutRef       = useRef(null);
  const lastSavedMessageRef  = useRef(null);
  const hasShownWelcome      = useRef(false);
  const welcomeShownRef      = useRef(false);
  const activeConfigRef      = useRef(null);
  const threadResetRef       = useRef(false);
  const tokenLimitShownRef   = useRef(false);
  // pending suggestions — typing complete hone ke baad set hongi
  const pendingSuggestionsRef = useRef([]);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { activeConfigRef.current = activeConfig; }, [activeConfig]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      const s = getResponsiveStyles(
        isInitialized, isFullScreen, widgetPosition, chatWindowSize,
        isKeyboardVisible, keyboardHeight, safeAreaInsets
      );
      setResponsiveStyles(s);
    }
  }, [isInitialized, isFullScreen, widgetPosition, chatWindowSize,
      isKeyboardVisible, keyboardHeight, safeAreaInsets, isMounted]);

  useEffect(() => {
    const fetchBrandingData = async () => {
      if (!backendApiKey || !apiBaseUrl) return;
      try {
        const response = await fetch(`${apiBaseUrl}/api/branding/${backendApiKey}`, {
          method: 'GET', headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.data) {
          if (data.data.headerColor)   setHeaderColor(data.data.headerColor);
          if (data.data.poweredByText) setPoweredByText(data.data.poweredByText);
          if (data.data.poweredByUrl)  setPoweredByUrl(data.data.poweredByUrl);
        }
      } catch (err) { console.error('Branding error:', err); }
    };
    fetchBrandingData();
  }, [apiBaseUrl, backendApiKey]);

  const applyTokenLimit = () => {
    setIsLoading(false);
    setIsTyping(false);
    setAutoClickInProgress(false);
    setCurrentPromptFlow(null);
    setIsConfirming(false);
    setCurrentChildOptions([]);
    setChatEnabled(false);
    setTokenLimitReached(true);
    setSuggestedPrompts([]);
    if (!tokenLimitShownRef.current) {
      tokenLimitShownRef.current = true;
      setMessages([{
        id: uuidv4(), sender: 'support-bot',
        message: TOKEN_LIMIT_MESSAGE,
        createdAt: new Date().toISOString(),
        isAdmin: true, isError: true, _isTokenError: true,
      }]);
    }
  };

  const fetchAndSetTokenDetails = async (userId) => {
    if (!userId) return;
    try {
      const r1 = await fetch(`${TOKENDETAILS_API_URL}?userId=${userId}`);
      const d1 = await r1.json();
      if (!d1.success) return;
      const r2 = await fetch(`${apiBaseUrl}/api/get-token-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d1.data),
      });
      const d2 = await r2.json();
      if (d2.message === 'All token use' || d2.usertotalTokenPercentage === '100.0%') {
        applyTokenLimit(); return;
      }
      if (tokenLimitReached) {
        setChatEnabled(true);
        setTokenLimitReached(false);
        tokenLimitShownRef.current = false;
      }
    } catch (err) { console.error('Token check error:', err); }
  };

  useEffect(() => {
    if (!tokenUserId) return;
    fetchAndSetTokenDetails(tokenUserId);
    const interval = setInterval(() => fetchAndSetTokenDetails(tokenUserId), 8000);
    return () => clearInterval(interval);
  }, [tokenUserId, apiBaseUrl]);

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
      threadResetRef.current     = true;
      tokenLimitShownRef.current = false;
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
      userHasMessagedRef.current  = false;
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

    const act = () => setLastActivity(Date.now());
    window.addEventListener('click', act);
    window.addEventListener('keypress', act);
    window.addEventListener('scroll', act);
    window.addEventListener('mousemove', act);
    return () => {
      window.removeEventListener('click', act);
      window.removeEventListener('keypress', act);
      window.removeEventListener('scroll', act);
      window.removeEventListener('mousemove', act);
    };
  }, []);

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
        userHasMessagedRef.current = false;
      }
    };
    const interval = setInterval(checkLongTimePassed, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [lastActivity, conversationCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setupParentCommunication({
      setParentWebsiteUrl, setDeviceInfo, setIsFullScreen,
      setIsInitialized, setSafeAreaInsets, setKeyboardHeight, setIsKeyboardVisible,
      checkScreenSize: () => {
        const info = checkScreenSize();
        setDeviceInfo(info);
        setIsFullScreen(info.isSmallScreen);
        setIsInitialized(true);
      }
    });
    const handleMessage = (event) => {
      if (event.data?.type === 'keyboardState') {
        setIsKeyboardVisible(event.data.isOpen);
        setKeyboardHeight(event.data.keyboardHeight);
        if (event.data.isOpen) setTimeout(() => forceScrollToBottom(), 100);
      }
      if (event.data?.type === 'safeArea') {
        setSafeAreaInsets({
          top: event.data.top, bottom: event.data.bottom,
          left: event.data.left, right: event.data.right
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const info = checkScreenSize();
      setDeviceInfo(info);
      setIsFullScreen(info.isSmallScreen);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const forceScrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > lastMessageCount.current) setTimeout(() => forceScrollToBottom(), 100);
    lastMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isKeyboardVisible) setTimeout(() => forceScrollToBottom(), 300);
  }, [isKeyboardVisible]);

  /* ── Auto-save ─────────────────────────────────────────── */
  useEffect(() => {
    if (!autoSaveEnabled || messages.length === 0 || !sessionId || !activeConfig?.id || isSaving) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const lastMsg = messages[messages.length - 1];
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
          currentThread = {
            userMessage: { text: msg.message, tokens: Math.ceil(msg.message.length / 4) },
            botReplies: []
          };
          threads.push(currentThread);
        } else if (msg.sender === 'support-bot' && currentThread && !msg._isTemp) {
          currentThread.botReplies.push({
            text: msg.message, tokens: Math.ceil(msg.message.length / 4)
          });
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
    } catch (err) { console.error('Auto-save error:', err); }
    finally { setIsSaving(false); }
  };

  const saveSingleMessage = async (role, text, tokens = 0) => {
    if (!sessionId) return;
    if (text === 'Saving your request...') return;

    const MAX_LEN  = 800;
    const safeText = text.length > MAX_LEN ? text.substring(0, MAX_LEN) + '...' : text;

    const messageKey    = `${role}_${safeText.substring(0, 50)}_${sessionId}`;
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
          text:           safeText,
          tokens:         tokens || Math.ceil(safeText.length / 4),
          forceNewThread: shouldForceNewThread
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem(`last_saved_key_${sessionId}`, messageKey);
        localStorage.setItem(`last_saved_time_${sessionId}`, now.toString());
        if (role === 'user') localStorage.setItem('chat_user_messaged', 'true');
        if (shouldForceNewThread && data.data?.isNewThread === true) {
          threadResetRef.current = false;
          localStorage.removeItem('force_new_thread');
        }
      }
      return { success: response.ok, data };
    } catch (err) {
      console.error('Message save error:', err);
      return { success: false, error: err.message };
    }
  };

  /* ── Chat init ─────────────────────────────────────────── */
  const showServiceUnavailableMessage = (status) => {
    const message = getServiceUnavailableMessage(status);
    setMessages([{
      id: uuidv4(), sender: 'support-bot', message,
      createdAt: new Date().toISOString(), isAdmin: true, isError: true
    }]);
  };

  const showWelcomeMessage = (backendWelcomeMessages, websiteData, customPromptsArr) => {
    if (tokenLimitShownRef.current) return;
    if (hasShownWelcome.current || welcomeShownRef.current) return;

    const welcomeMessage = generateWelcomeMessage(
      websiteData.websiteName || websiteTitle,
      backendWelcomeMessages,
      websiteData.systemPrompt || systemPrompts
    );
    const cleanedMessage = cleanText(welcomeMessage);
    setMessages([{
      id: uuidv4(), sender: 'support-bot', message: cleanedMessage,
      createdAt: new Date().toISOString(), isAdmin: true
    }]);
    hasShownWelcome.current = true;
    welcomeShownRef.current = true;

    if (customPromptsArr && customPromptsArr.length > 0) {
      setSuggestedPrompts(customPromptsArr);
    }
    setTimeout(() => saveSingleMessage('support-bot', cleanedMessage), 500);
  };

  useEffect(() => {
    const initializeChat = async () => {
      const currentUrl     = getCurrentWebsiteUrl(parentWebsiteUrl);
      const databaseConfig = await getDatabaseUrlFromHeaderAPI(apiBaseUrl, backendApiKey);

      if (databaseConfig) {
        const wStatus = databaseConfig.status?.toLowerCase();
        if (wStatus !== 'active') {
          setWebsiteStatus('inactive'); setIsWebsiteActive(false); setConnectionStatus('offline');
          setWebsiteTitle(databaseConfig.websiteName || 'Support');
          showServiceUnavailableMessage('inactive');
          hasShownWelcome.current = true; welcomeShownRef.current = true;
          return;
        }

        const isUrlMatch = checkUrlMatch(databaseConfig.websiteUrl, currentUrl);
        if (isUrlMatch) {
          setWebsiteStatus('active'); setIsWebsiteActive(true); setConnectionStatus('online');
          setWebsiteTitle(databaseConfig.websiteName || 'Support');

          const websiteData = await fetchWebsiteConfig(apiBaseUrl, backendApiKey, databaseConfig.websiteId);
          if (websiteData) {
            setActiveConfig(websiteData);
            setCategories(websiteData.category || []);
            setSystemPrompts(websiteData.systemPrompt || []);

            const userId = websiteData.userId || websiteData.user_id || null;
            if (userId) {
              setTokenUserId(userId);
              try {
                const r1 = await fetch(`/api/user/token-details?userId=${userId}`);
                const d1 = await r1.json();
                if (d1.success) {
                  const r2 = await fetch(`${apiBaseUrl}/api/get-token-details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(d1.data),
                  });
                  const d2 = await r2.json();
                  if (d2.message === 'All token use' || d2.usertotalTokenPercentage === '100.0%') {
                    applyTokenLimit();
                    hasShownWelcome.current = true;
                    welcomeShownRef.current = true;
                    return;
                  }
                }
              } catch (e) { console.error('Initial token check error:', e); }
            }

            const customPromptsArr = (websiteData.customPrompt || []).filter(p => typeof p === 'string');
            setAllCustomPrompts(customPromptsArr);

            const backendWelcomeMessages = await fetchWelcomeMessages(
              apiBaseUrl, backendApiKey, databaseConfig.websiteId
            );
            setWelcomeMessages(backendWelcomeMessages);
            showWelcomeMessage(backendWelcomeMessages, websiteData, customPromptsArr);
          } else {
            showWelcomeMessage([], databaseConfig, []);
          }
        } else {
          setWebsiteStatus('url_mismatch'); setIsWebsiteActive(false); setConnectionStatus('offline');
          setWebsiteTitle(databaseConfig.websiteName || 'Support');
          showServiceUnavailableMessage('url_mismatch');
          hasShownWelcome.current = true; welcomeShownRef.current = true;
        }
      } else {
        setWebsiteStatus('not_found'); setIsWebsiteActive(false); setConnectionStatus('offline');
        showServiceUnavailableMessage('not_found');
        hasShownWelcome.current = true; welcomeShownRef.current = true;
      }
    };
    initializeChat();
  }, [apiBaseUrl, backendApiKey, parentWebsiteUrl]);

  /* ── Connection polling ─────────────────────────────────── */
  useEffect(() => {
    if (!isWebsiteActive || websiteStatus === 'inactive') return;
    const checkConnection = async () => {
      try {
        const currentUrl = getCurrentWebsiteUrl(parentWebsiteUrl);
        const result     = await checkWebsiteConnection(apiBaseUrl, backendApiKey);
        if (result.success) {
          if (result.status !== 'active') {
            setIsWebsiteActive(false); setWebsiteStatus('inactive'); setConnectionStatus('offline');
            if (hasShownWelcome.current) {
              setMessages(prev => [...prev, {
                id: uuidv4(), sender: 'support-bot',
                message: getServiceUnavailableMessage('inactive'),
                createdAt: new Date().toISOString(), isAdmin: true, isError: true
              }]);
            }
            return;
          }
          const databaseUrl = result.websiteUrl || '';
          if (databaseUrl && !checkUrlMatch(databaseUrl, currentUrl)) {
            setIsWebsiteActive(false); setWebsiteStatus('url_mismatch'); setConnectionStatus('offline');
            if (hasShownWelcome.current) {
              setMessages(prev => [...prev, {
                id: uuidv4(), sender: 'support-bot',
                message: getServiceUnavailableMessage('url_mismatch'),
                createdAt: new Date().toISOString(), isAdmin: true, isError: true
              }]);
            }
            return;
          }
          setConnectionStatus('online');
        } else { setConnectionStatus('offline'); }
      } catch { setConnectionStatus('offline'); }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 8000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, isWebsiteActive, backendApiKey, websiteStatus, parentWebsiteUrl]);

  const handleInactiveInteraction = () => {
    if (websiteStatus === 'inactive') {
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot',
        message: getServiceUnavailableMessage('inactive'),
        createdAt: new Date().toISOString(), isAdmin: true, isError: true
      }]);
    }
    return false;
  };

  /* ── Typing done callback ──────────────────────────────── */
  // Jab latest bot message ki typing complete ho:
  // 1. isTyping false karo (input enable ho jayega)
  // 2. pending suggestions set karo
  const handleLatestMessageTypingDone = () => {
    setIsTyping(false);
    if (pendingSuggestionsRef.current.length > 0) {
      setSuggestedPrompts(pendingSuggestionsRef.current);
      pendingSuggestionsRef.current = [];
    }
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  /* ── Prompt flow ───────────────────────────────────────── */
  const completePromptFlow = (data) => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    const transformedData = storedPromptsWithParams?.length > 0
      ? transformDataWithParams(data, storedPromptsWithParams)
      : { ...data };
    setCollectedData(data);
    setTransformedDataForAPI(transformedData);
    const clientSummary = createClientSummary(data);

    setMessages(prev => [...prev, {
      id: uuidv4(), sender: 'support-bot', message: clientSummary,
      createdAt: new Date().toISOString(), isAdmin: true,
    }]);
    saveSingleMessage('support-bot', clientSummary);

    const wordCount   = clientSummary.split(/\s+/).length;
    const typingDelay = Math.max(1500, wordCount * 75 + 500);

    setTimeout(() => {
      const confirmMsg = 'All done! Would you like to confirm this request?';
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: confirmMsg,
        createdAt: new Date().toISOString(), isAdmin: true,
      }]);
      saveSingleMessage('support-bot', confirmMsg);
      setCurrentPromptFlow(null);

      const confirmWordCount = confirmMsg.split(/\s+/).length;
      const confirmDelay     = Math.max(800, confirmWordCount * 75 + 400);
      setTimeout(() => { setIsConfirming(true); }, confirmDelay);
    }, typingDelay);
  };

  const handleConfirmResponse = async (answer) => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    setIsConfirming(false);
    setCurrentChildOptions([]);
    setMessages(prev => [...prev, {
      id: uuidv4(), sender: 'user', message: answer,
      createdAt: new Date().toISOString(), isAdmin: false
    }]);
    await saveSingleMessage('user', answer);

    try {
      if (answer === 'Yes') {
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: 'Saving your request...',
          createdAt: new Date().toISOString(), isAdmin: true, _isTemp: true
        }]);
        const serverSummary = createServerSummary(collectedData, storedPromptsWithParams);
        const formData      = new FormData();
        if (activeConfig?.id)   formData.append('websiteId',  activeConfig.id);
        if (selectedPromptName) formData.append('promptName', selectedPromptName);
        if (transformedDataForAPI && Object.keys(transformedDataForAPI).length > 0) {
          Object.entries(transformedDataForAPI).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              formData.append(key, String(value));
            }
          });
        }
        const summaryParamKey = findSummaryParamKey(storedSummaryList);
        if (summaryParamKey && serverSummary) formData.append(summaryParamKey, serverSummary);

        let urlCallResults = [];
        if (activeConfig?.id && selectedPromptName) {
          const execResult = await executeUrls(apiBaseUrl, formData);
          urlCallResults   = execResult.results || [];
        }
        const chatRequestData = {
          websiteId: activeConfig?.id, collectedData: transformedDataForAPI || {}, backendApiKey
        };
        if (urlCallResults.length > 0) chatRequestData.urlCallResults = urlCallResults;

        const saveResult = await saveChatRequest(apiBaseUrl, backendApiKey, chatRequestData);
        if (saveResult.success) {
          setMessages(prev => prev.filter(msg => msg._isTemp !== true));
          const successMessage = getSuccessMessage();
          setMessages(prev => [...prev, {
            id: uuidv4(), sender: 'support-bot', message: successMessage,
            createdAt: new Date().toISOString(), isAdmin: true
          }]);
          await saveSingleMessage('support-bot', successMessage);
          setTimeout(() => setSuggestedPrompts(allCustomPrompts), 800);
        } else { throw new Error(saveResult.error || 'Failed to save request'); }
      } else {
        await saveChatRequest(apiBaseUrl, backendApiKey, {
          websiteId: activeConfig?.id, collectedData: transformedDataForAPI || {}, backendApiKey
        });
        const cancelMessage = getCancelMessage();
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: cancelMessage,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', cancelMessage);
        setTimeout(() => setSuggestedPrompts(allCustomPrompts), 800);
      }
    } catch (error) {
      console.error('Error in handleConfirmResponse:', error);
      setMessages(prev => prev.filter(msg => msg._isTemp !== true));
      const errorMessage = getErrorMessage();
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: errorMessage,
        createdAt: new Date().toISOString(), isAdmin: true, isError: true
      }]);
      await saveSingleMessage('support-bot', errorMessage);
    } finally {
      setCollectedData({}); setTransformedDataForAPI({}); setCurrentPromptFlow(null);
      setStoredUrls([]); setStoredApiKeys([]); setStoredPromptsWithParams([]);
      setStoredSummaryList([]); setRecentTopics([]);
    }
  };

  const moveToNextQuestion = async (data) => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, questionIndex } = currentPromptFlow;
    const currentPrompt = prompts[promptIndex];

    if (currentPromptFlow.isSingleChild && questionIndex === 0) {
      const nextPromptIndex = promptIndex + 1;
      if (nextPromptIndex < prompts.length) {
        const nextPrompt = prompts[nextPromptIndex];
        if (nextPrompt.children?.length > 0) {
          if (nextPrompt.children.length === 1) {
            const singleChild = nextPrompt.children[0];
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: singleChild, waitingForOption: false, childOptions: null, isSingleChild: true });
            const botMessage = makeFriendly(singleChild.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
          }
        } else {
          setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(data); }
      return;
    }

    if (currentPrompt.children?.length > 0 && questionIndex === 0) {
      showOptionsAfterQuestion(currentPrompt.children, prompts, promptIndex);
      return;
    }

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
            const singleChild = nextPrompt.children[0];
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: singleChild, waitingForOption: false, childOptions: null, isSingleChild: true });
            const botMessage = makeFriendly(singleChild.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            if (nextPrompt.children?.length > 0) {
              setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
            }
          }
        } else {
          setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(data); }
    }
  };

  const showOptionsAfterQuestion = async (children, prompts, promptIndex) => {
    if (children.length > 1) {
      setCurrentChildOptions(children.map(child => child.text));
      setCurrentPromptFlow(prev => ({
        ...prev, waitingForOption: true, childOptions: children,
        currentQuestion: { text: 'Select Option' }
      }));
    } else if (children.length === 1) {
      const singleChild = children[0];
      setCurrentPromptFlow(prev => ({
        ...prev, waitingForOption: false, currentQuestion: singleChild, isSingleChild: true
      }));
      const botMessage = makeFriendly(singleChild.text);
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: botMessage,
        createdAt: new Date().toISOString(), isAdmin: true
      }]);
      await saveSingleMessage('support-bot', botMessage);
    }
  };

  const handleOptionSelect = async (optionText) => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, childOptions } = currentPromptFlow;
    const selectedOption = childOptions.find(opt => opt.text === optionText);
    if (!selectedOption) {
      const errorMsg = 'Please select a valid option from the available choices.';
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: errorMsg,
        createdAt: new Date().toISOString(), isAdmin: true, isError: true
      }]);
      await saveSingleMessage('support-bot', errorMsg);
      return;
    }
    const newCollectedData = { ...collectedData, [prompts[promptIndex].text]: optionText };
    setCollectedData(newCollectedData);
    setCurrentChildOptions([]);
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.isOptions) {
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'user', message: optionText,
        createdAt: new Date().toISOString(), isAdmin: false
      }]);
      await saveSingleMessage('user', optionText);
    }
    if (selectedOption.children?.length > 0) {
      if (selectedOption.children.length === 1) {
        const singleChild = selectedOption.children[0];
        setCurrentPromptFlow(prev => ({
          ...prev, waitingForOption: false, currentQuestion: singleChild, isSingleChild: true
        }));
        const botMessage = makeFriendly(singleChild.text);
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: botMessage,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', botMessage);
      } else {
        setTimeout(() => showOptionsAfterQuestion(selectedOption.children, prompts, promptIndex), 500);
      }
    } else {
      const nextPromptIndex = promptIndex + 1;
      if (nextPromptIndex < prompts.length) {
        const nextPrompt = prompts[nextPromptIndex];
        if (nextPrompt.children?.length > 0) {
          if (nextPrompt.children.length === 1) {
            const singleChild = nextPrompt.children[0];
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: singleChild, waitingForOption: false, childOptions: null, isSingleChild: true });
            const botMessage = makeFriendly(singleChild.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
          } else {
            setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: nextPrompt.children, isSingleChild: false });
            const botMessage = makeFriendly(nextPrompt.text);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
            await saveSingleMessage('support-bot', botMessage);
            if (nextPrompt.children?.length > 0) {
              setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, nextPromptIndex), 1000);
            }
          }
        } else {
          setCurrentPromptFlow({ ...currentPromptFlow, promptIndex: nextPromptIndex, questionIndex: 0, currentQuestion: nextPrompt, waitingForOption: false, childOptions: null, isSingleChild: false });
          const botMessage = makeFriendly(nextPrompt.text);
          setMessages(prev => [...prev, { id: uuidv4(), sender: 'support-bot', message: botMessage, createdAt: new Date().toISOString(), isAdmin: true }]);
          await saveSingleMessage('support-bot', botMessage);
        }
      } else { completePromptFlow(newCollectedData); }
    }
  };

  const handlePromptFlowResponse = (userAnswer) => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    const { currentQuestion } = currentPromptFlow;
    const fieldType           = getFieldType(currentQuestion.text);
    if (!validateInput(fieldType, userAnswer)) {
      let errorMessage = '';
      switch (fieldType) {
        case 'email':  errorMessage = 'Please enter a valid email address (e.g., name@example.com)'; break;
        case 'phone':  errorMessage = 'Please enter a valid 10-digit phone number'; break;
        case 'number': errorMessage = 'Please enter a valid number'; break;
        case 'date':   errorMessage = 'Please enter valid dates (e.g., "15-12-2024 to 20-12-2024")'; break;
        case 'url':    errorMessage = 'Please enter a valid URL (e.g., http://example.com)'; break;
        default:       errorMessage = 'Please provide a valid response';
      }
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: errorMessage,
        createdAt: new Date().toISOString(), isAdmin: true, isError: true
      }]);
      saveSingleMessage('support-bot', errorMessage);
      return;
    }
    const newCollectedData = { ...collectedData, [currentQuestion.text]: userAnswer };
    setCollectedData(newCollectedData);
    moveToNextQuestion(newCollectedData);
  };

  const findMatchingPrompt = (aiResponse) => {
    if (!aiResponse || !allCustomPrompts.length) return null;
    const aiResponseLower = aiResponse.toLowerCase();
    let bestMatch = null, highestScore = 0;
    allCustomPrompts.forEach(prompt => {
      if (!prompt || typeof prompt !== 'string') return;
      const promptLower   = prompt.toLowerCase();
      let score           = 0;
      const promptWords   = promptLower.split(/\s+/);
      const responseWords = aiResponseLower.split(/\s+/);
      promptWords.forEach(pWord => {
        if (pWord.length > 3) responseWords.forEach(rWord => {
          if (rWord.length > 3 && (pWord.includes(rWord) || rWord.includes(pWord))) score += 2;
        });
      });
      if (aiResponseLower.includes(promptLower) || promptLower.includes(aiResponseLower)) score += 5;
      if (score > highestScore) { highestScore = score; bestMatch = prompt; }
    });
    return highestScore > 3 ? bestMatch : null;
  };

  const handlePromptClick = async (promptName) => {
    if (!chatEnabled) return;
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }

    setSuggestedPrompts([]);
    pendingSuggestionsRef.current = [];
    setAutoClickInProgress(false);
    userHasMessagedRef.current = true;

    setIsLoading(true);
    setIsTyping(false);

    try {
      const data              = await fetchChildPrompts(apiBaseUrl, backendApiKey, activeConfig?.id, promptName);
      const promptsWithParams = data.promptsWithParams || [];
      setSelectedPromptName(promptName);
      setStoredPromptsWithParams(promptsWithParams);
      setStoredSummaryList(data.summaryList?.length > 0 ? data.summaryList : []);
      const prompts = data.prompts || (data.items?.length ? data.items.flatMap(item => item.prompts) : []);
      setCollectedData({}); setTransformedDataForAPI({}); setCurrentChildOptions([]);

      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'user', message: promptName,
        createdAt: new Date().toISOString(), isAdmin: false,
      }]);
      await saveSingleMessage('user', promptName);

      await new Promise(resolve => setTimeout(resolve, 600));

      const introMessage = getPromptIntroMessage(promptName);
      setIsLoading(false);
      setIsTyping(true);
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: introMessage,
        createdAt: new Date().toISOString(), isAdmin: true,
      }]);
      await saveSingleMessage('support-bot', introMessage);

      const introWordCount  = introMessage.split(/\s+/).length;
      const introTypingWait = Math.max(800, introWordCount * 75 + 400);
      await new Promise(resolve => setTimeout(resolve, introTypingWait));
      setIsTyping(false);

      if (prompts.length > 0) {
        const firstPrompt = prompts[0];
        if (firstPrompt.children?.length > 0) {
          if (firstPrompt.children.length === 1) {
            const singleChild = firstPrompt.children[0];
            setCurrentPromptFlow({ prompts, promptIndex: 0, questionIndex: 0, currentQuestion: singleChild, waitingForOption: false, childOptions: null, promptName, isSingleChild: true });
            const botMessage = makeFriendly(singleChild.text);
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
      console.error('Prompt Click Error:', err);
      const botMsg = `I'd love to help with ${promptName}! Please share what you need!`;
      setMessages(prev => [...prev,
        { id: uuidv4(), sender: 'user',        message: promptName, createdAt: new Date().toISOString(), isAdmin: false },
        { id: uuidv4(), sender: 'support-bot', message: botMsg,     createdAt: new Date().toISOString(), isAdmin: true  }
      ]);
      await saveSingleMessage('user', promptName);
      await saveSingleMessage('support-bot', botMsg);
      setCurrentPromptFlow(null);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setAutoClickInProgress(false);
      setSuggestedPrompts([]);
    }
  };

  const handleNextQuestion = (userAnswer = '') => {
    if (!chatEnabled || !isWebsiteActive) { handleInactiveInteraction(); return; }
    if (pendingQuestions.length > 0) {
      const [next, ...rest] = pendingQuestions;
      setPendingQuestions(rest);
      const botMsg = makeFriendly(next);
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: botMsg,
        createdAt: new Date().toISOString(), isAdmin: true
      }]);
      saveSingleMessage('support-bot', botMsg);
    } else if (!isConfirming && messages.length > 0) {
      setTimeout(async () => {
        const confirmMsg = 'All done! Would you like to confirm this request?';
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: confirmMsg,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', confirmMsg);
        setIsConfirming(true);
      }, 700);
    }
  };

  const handleInputFocus = () => {
    if (isFullScreen && chatInputRef.current) setTimeout(() => forceScrollToBottom(), 300);
  };

  /* ── Main send message ─────────────────────────────────── */
  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading || isTyping) return;
    if (!chatEnabled) return;
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setLastActivity(Date.now());

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'user' && lastMessage.message === text) {
      const timeDiff = Math.abs(new Date() - new Date(lastMessage.createdAt));
      if (timeDiff < 3000) return;
    }

    // Purani suggestions turant clear karo
    setSuggestedPrompts([]);
    pendingSuggestionsRef.current = [];

    if (!userHasMessagedRef.current) {
      userHasMessagedRef.current = true;
    }

    setMessages(prev => [...prev, {
      id: uuidv4(), sender: 'user', message: text,
      createdAt: new Date().toISOString(), isAdmin: false
    }]);
    setInputMessage('');
    await saveSingleMessage('user', text);

    if (currentPromptFlow?.waitingForOption)         { handleOptionSelect(text);       return; }
    if (currentPromptFlow?.currentQuestion)          { handlePromptFlowResponse(text); return; }
    if (pendingQuestions.length > 0 || isConfirming) { setTimeout(() => handleNextQuestion(text), 800); return; }

    const lastBotMessage = messages.slice().reverse().find(
      msg => msg.sender === 'support-bot' && msg.isAdmin
    );
    const isEmailRequest = lastBotMessage && (
      lastBotMessage.message.includes('email address') ||
      lastBotMessage.message.includes('Please provide your email')
    );

    if (isEmailRequest) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text.trim())) {
        const errorMsg = 'Please provide a valid email address (e.g., name@example.com)';
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: errorMsg,
          createdAt: new Date().toISOString(), isAdmin: true, isError: true
        }]);
        await saveSingleMessage('support-bot', errorMsg);
        return;
      }
      setIsLoading(true);
      try {
        const allAIMessages = messages.filter(msg => msg.sender === 'support-bot' && msg.isAdmin);
        const emailData     = {
          email:             text.trim(),
          lastMessage:       allAIMessages[allAIMessages.length - 1]?.message || '',
          secondLastMessage: allAIMessages[allAIMessages.length - 2]?.message || ''
        };
        const saveResult = await saveEmailRequest(apiBaseUrl, backendApiKey, {
          websiteId: activeConfig?.id, collectedData: emailData, backendApiKey
        });
        if (saveResult.success) {
          const successMsg = 'Thank you! Your email has been saved. Our team will contact you shortly regarding this.';
          setMessages(prev => [...prev, {
            id: uuidv4(), sender: 'support-bot', message: successMsg,
            createdAt: new Date().toISOString(), isAdmin: true
          }]);
          await saveSingleMessage('support-bot', successMsg);
        } else { throw new Error(saveResult.error || 'Failed to save request'); }
      } catch {
        const errorMsg = 'Sorry, there was an error saving your email. Please try again.';
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: errorMsg,
          createdAt: new Date().toISOString(), isAdmin: true, isError: true
        }]);
        await saveSingleMessage('support-bot', errorMsg);
      } finally { setIsLoading(false); }
      return;
    }

    const userShowsInterest    = checkUserInterest(text);
    const userShowsNotInterest = checkUserNotInterest(text);

    if (userShowsNotInterest) {
      setTimeout(async () => {
        const notInterestMsg = 'No problem! If you have any other questions, feel free to ask. How else can I help you?';
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: notInterestMsg,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', notInterestMsg);
      }, 500);
      return;
    }

    if (userShowsInterest && lastAIMessage && interestDetectionEnabled) {
      const matchingPrompt = findMatchingPrompt(lastAIMessage);
      if (matchingPrompt && !autoClickInProgress) {
        setAutoClickInProgress(true);
        const processingMsg = `Great! I'll help you with ${matchingPrompt}. Setting it up for you...`;
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: processingMsg,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', processingMsg);
        setTimeout(() => handlePromptClick(matchingPrompt), 1500);
        return;
      }
      if (!matchingPrompt) {
        const aiTopic  = extractMainTopic(lastAIMessage);
        const emailMsg = aiTopic
          ? `Please provide your email address, we will get you in touch regarding "${aiTopic}"`
          : `Please provide your email address, we will get you in touch regarding this`;
        setMessages(prev => [...prev, {
          id: uuidv4(), sender: 'support-bot', message: emailMsg,
          createdAt: new Date().toISOString(), isAdmin: true
        }]);
        await saveSingleMessage('support-bot', emailMsg);
        return;
      }
    }

    // ── AI response fetch ──
    // Three dots show karo (isLoading = true)
    setIsLoading(true);
    try {
      const { response, suggestions } = await generateAIResponse(apiBaseUrl, backendApiKey, text);
      const cleanedResponse = cleanText(response);

      const lastBotMsg = messages[messages.length - 1];
      if (lastBotMsg && lastBotMsg.sender === 'support-bot' && lastBotMsg.message === cleanedResponse) {
        setIsLoading(false);
        return;
      }

      // Three dots hatao, typing shuru karo
      setIsLoading(false);
      setIsTyping(true);

      // Agar suggestions hain to pending mein rakho — typing done pe set honge
      if (suggestions && suggestions.length > 0 && !currentPromptFlow) {
        pendingSuggestionsRef.current = suggestions;
      } else {
        pendingSuggestionsRef.current = [];
      }

      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: cleanedResponse,
        createdAt: new Date().toISOString(), isAdmin: true
      }]);
      await saveSingleMessage('support-bot', cleanedResponse);
      setLastAIMessage(cleanedResponse);
      // isTyping false aur suggestions set handleLatestMessageTypingDone mein honge

    } catch (err) {
      console.error('AI response error:', err);
      const errMsg = "I'm having trouble right now. Please try again.";
      setIsLoading(false);
      setIsTyping(false);
      pendingSuggestionsRef.current = [];
      setMessages(prev => [...prev, {
        id: uuidv4(), sender: 'support-bot', message: errMsg,
        createdAt: new Date().toISOString(), isAdmin: true, isError: true
      }]);
      await saveSingleMessage('support-bot', errMsg);
    }
  };

  const handleCloseChat = () => {
    if (messages.length > 0 && !isSaving) saveCurrentConversation();
    sendCloseMessageToParent();
    setCurrentPromptFlow(null); setCollectedData({}); setTransformedDataForAPI({});
    setCurrentChildOptions([]); setStoredUrls([]); setStoredApiKeys([]);
    setStoredPromptsWithParams([]); setRecentTopics([]); setAutoClickInProgress(false);
    setIsTyping(false);
    pendingSuggestionsRef.current = [];
  };

  // ✅ Input disable sirf in cases mein:
  // - token limit reach
  // - AI response ka wait (isLoading)
  // - Bot message type ho raha hai (isTyping)  
  // - Confirm buttons dikh rahe hain
  // - Options select karne hain
  // - Website inactive
  // - Auto click progress
  const isInputDisabled =
    !chatEnabled ||
    isLoading ||
    isTyping ||
    isConfirming ||
    (currentPromptFlow && currentPromptFlow.waitingForOption) ||
    !isWebsiteActive ||
    autoClickInProgress;

  const visibleSuggestedPrompts = chatEnabled ? suggestedPrompts : [];

  if (!isMounted || typeof window === 'undefined') {
    return (
      <div className={styles.chatWidgetContainer} style={responsiveStyles.container}>
        {isChatOpen && (
          <div className={styles.chatWidgetWindow} style={responsiveStyles.window}>
            <div className={styles.loading}>Loading chat...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.chatWidgetContainer} style={responsiveStyles.container}>
      {isChatOpen && (
        <div
          className={`${styles.chatWidgetWindow} ${isKeyboardVisible ? styles.keyboardVisible : ''}`}
          style={responsiveStyles.window}
        >
          <div className={styles.headerWrapper} ref={headerRef}>
            {isFullScreen && <div className={styles.safeAreaTop} style={{ height: safeAreaInsets.top }} />}
            <ChatHeader
              secondaryColor={secondaryColor} connectionStatus={connectionStatus}
              onClose={handleCloseChat} websiteTitle={websiteTitle}
              apiBaseUrl={apiBaseUrl} backendApiKey={backendApiKey}
              isWebsiteActive={isWebsiteActive} websiteStatus={websiteStatus}
              showCloseButton={isFullScreen} headerColor={headerColor}
              tokenDetails={tokenDetails}
            />
          </div>
          <div className={styles.chatBodyWrapper} ref={chatBodyRef}>
            <ChatBody
              messages={messages}
              isLoading={isLoading}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              apiBaseUrl={apiBaseUrl}
              backendApiKey={backendApiKey}
              onPromptClick={chatEnabled ? handlePromptClick : () => {}}
              onConfirmClick={chatEnabled ? handleConfirmResponse : () => {}}
              onOptionSelect={chatEnabled ? handleOptionSelect : () => {}}
              showConfirmButtons={chatEnabled ? isConfirming : false}
              currentPromptFlow={chatEnabled ? currentPromptFlow : null}
              suggestedPrompts={visibleSuggestedPrompts}
              currentChildOptions={chatEnabled ? currentChildOptions : []}
              isWebsiteActive={isWebsiteActive}
              websiteStatus={websiteStatus}
              messageAnimations={messageAnimations}
              isFullScreen={isFullScreen}
              isKeyboardVisible={isKeyboardVisible}
              tokenDetails={tokenDetails}
              onLatestMessageTypingDone={handleLatestMessageTypingDone}
            />
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputWrapper} ref={inputWrapperRef}>
            <ChatInput
              ref={chatInputRef}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              sendMessage={handleSendMessage}
              disabled={isInputDisabled}
              primaryColor={primaryColor}
              isWebsiteActive={isWebsiteActive}
              websiteStatus={websiteStatus}
              isFullScreen={isFullScreen}
              onFocus={handleInputFocus}
              headerColor={headerColor}
              poweredByText={poweredByText}
              poweredByUrl={poweredByUrl}
            />
            {isFullScreen && (
              <div className={styles.safeAreaBottom} style={{ height: safeAreaInsets.bottom }} />
            )}
          </div>
          {autoClickInProgress && (
            <div className={styles.autoClickIndicator}>
              <div className={styles.autoClickSpinner} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;