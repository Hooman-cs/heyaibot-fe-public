'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './adminchatwidget.module.css';
import ChatHeader from '../ChatHeader/ChatHeader';
import ChatBody from '../ChatBody/ChatBody';
import ChatInput from '../ChatInput/ChatInput';
import config from '../utils/config';
import { v4 as uuidv4 } from 'uuid';

import { saveConversationToDatabase } from '../utils/api/requestApi';
import { fetchWebsiteConfig, fetchWelcomeMessages, fetchChildPrompts, generateAIResponse } from '../utils/api/chatApi';
import { getDatabaseUrlFromHeaderAPI, checkWebsiteConnection } from '../utils/api/websiteApi';
import { setupParentCommunication, sendCloseMessageToParent } from '../utils/communicationUtils';
import { checkScreenSize, getResponsiveStyles } from '../utils/deviceUtils';
import { transformDataWithParams, createClientSummary, createServerSummary, findSummaryParamKey } from '../utils/transformUtils';
import { validateInput, getFieldType } from '../utils/validationUtils';
import {
  checkUserInterest, checkUserNotInterest, cleanText, makeFriendly,
  generateWelcomeMessage, getSuccessMessage, getCancelMessage,
  getErrorMessage, getPromptIntroMessage, getServiceUnavailableMessage, extractMainTopic
} from '../utils/textUtils';

const Chatwidget = ({
  primaryColor    = '#4a6baf',
  secondaryColor  = 'tomato',
  headerColor,
  poweredByText: poweredByTextProp,
  poweredByUrl:  poweredByUrlProp,
  chatWindowSize  = { width: '340px', height: '470px' },
  backendApiKey,
  apiBaseUrl      = config.apiBaseUrl,
}) => {
  // ── UI State ──────────────────────────────────────────────────────
  const [messages,            setMessages]            = useState([]);
  const [inputMessage,        setInputMessage]        = useState('');
  const [isLoading,           setIsLoading]           = useState(false);
  // ✅ NEW: isTyping — jab tak latest bot message word-by-word chal raha hai
  const [isTyping,            setIsTyping]            = useState(false);
  const [isConfirming,        setIsConfirming]        = useState(false);
  const [messageAnimations,   setMessageAnimations]   = useState({});
  const [isFullScreen,        setIsFullScreen]        = useState(false);
  const [isInitialized,       setIsInitialized]       = useState(false);
  const [autoClickInProgress, setAutoClickInProgress] = useState(false);
  const [deviceInfo,          setDeviceInfo]          = useState({
    isMobile: false, isTablet: false, isSmallScreen: false,
    screenWidth: 1024, deviceType: 'desktop'
  });

  // ── Website / Config State ────────────────────────────────────────
  const [activeConfig,        setActiveConfig]        = useState(null);
  const [websiteTitle,        setWebsiteTitle]        = useState('Support');
  const [connectionStatus,    setConnectionStatus]    = useState('connecting');
  const [isWebsiteActive,     setIsWebsiteActive]     = useState(false);
  const [websiteStatus,       setWebsiteStatus]       = useState('checking');
  const [suggestedPrompts,    setSuggestedPrompts]    = useState([]);
  const [categories,          setCategories]          = useState([]);
  const [systemPrompts,       setSystemPrompts]       = useState([]);
  const [welcomeMessages,     setWelcomeMessages]     = useState([]);
  const [aifuture,            setAifuture]            = useState([]);
  const [aiPersonality,       setAiPersonality]       = useState({
    tone: 'friendly', emojiLevel: 'moderate', detailLevel: 'balanced'
  });
  const [parentWebsiteUrl,    setParentWebsiteUrl]    = useState('');

  // ── Prompt Flow State ─────────────────────────────────────────────
  const [currentPromptFlow,       setCurrentPromptFlow]       = useState(null);
  const [collectedData,           setCollectedData]           = useState({});
  const [transformedDataForAPI,   setTransformedDataForAPI]   = useState({});
  const [currentChildOptions,     setCurrentChildOptions]     = useState([]);
  const [pendingQuestions,        setPendingQuestions]        = useState([]);
  const [selectedPromptName,      setSelectedPromptName]      = useState('');
  const [storedSummaryList,       setStoredSummaryList]       = useState([]);
  const [storedPromptsWithParams, setStoredPromptsWithParams] = useState([]);
  const [storedUrls,              setStoredUrls]              = useState([]);
  const [storedApiKeys,           setStoredApiKeys]           = useState([]);
  const [recentTopics,            setRecentTopics]            = useState([]);
  const [lastAIMessage,           setLastAIMessage]           = useState('');
  const [interestDetectionEnabled] = useState(true);

  // ── Session State ─────────────────────────────────────────────────
  const [sessionId,         setSessionId]         = useState('');
  const [conversationCount, setConversationCount] = useState(0);
  const [lastActivity,      setLastActivity]      = useState(Date.now());
  const [sessionStartTime,  setSessionStartTime]  = useState(Date.now());
  const [isSaving,          setIsSaving]          = useState(false);
  const [hasInitialSave,    setHasInitialSave]    = useState(false);
  const [autoSaveEnabled]                         = useState(true);

  // ── Refs ──────────────────────────────────────────────────────────
  const hasShownWelcome     = useRef(false);
  const welcomeShownRef     = useRef(false);
  const activeConfigRef     = useRef(null);
  const threadResetRef      = useRef(false);
  const lastSavedMessageRef = useRef(null);
  const saveTimeoutRef      = useRef(null);
  const lastMessageCount    = useRef(0);
  // ✅ NEW: pending suggestions — typing complete hone ke baad set hongi
  const pendingSuggestionsRef = useRef([]);

  // ── Branding ──────────────────────────────────────────────────────
  const resolvedHeaderColor   = headerColor        || secondaryColor;
  const resolvedPoweredByText = poweredByTextProp  || 'JDPC Global';
  const resolvedPoweredByUrl  = poweredByUrlProp   || 'https://jdpcglobal.com';

  useEffect(() => { activeConfigRef.current = activeConfig; }, [activeConfig]);

  // ── Screen size & parent communication ───────────────────────────
  const handleScreenSize = () => {
    const info = checkScreenSize();
    setDeviceInfo(info);
    setIsFullScreen(info.isSmallScreen);
    setIsInitialized(true);
  };

  useEffect(() => {
    handleScreenSize();
    window.addEventListener('resize', handleScreenSize);
    return () => window.removeEventListener('resize', handleScreenSize);
  }, []);

  useEffect(() => {
    setupParentCommunication({
      setParentWebsiteUrl, setDeviceInfo, setIsFullScreen,
      setIsInitialized, checkScreenSize: handleScreenSize,
    });
  }, []);

  const responsiveStyles = getResponsiveStyles(isInitialized, isFullScreen, {}, chatWindowSize);

  // ── Session initialization ────────────────────────────────────────
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
      resetPromptState();
    } else if (storedSessionId) {
      setSessionId(storedSessionId);
      setConversationCount(storedCount);
      localStorage.removeItem('force_new_thread');
      threadResetRef.current = false;
    } else {
      const newId = uuidv4();
      localStorage.setItem('chat_session_id', newId);
      setSessionId(newId);
      setSessionStartTime(Date.now());
      localStorage.setItem('conversation_count', '0');
      localStorage.removeItem('force_new_thread');
      localStorage.removeItem('chat_user_messaged');
      setConversationCount(0);
      threadResetRef.current = false;
    }

    const activityHandler = () => setLastActivity(Date.now());
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(e =>
      window.addEventListener(e, activityHandler)
    );
    return () => ['click', 'keypress', 'scroll', 'mousemove'].forEach(e =>
      window.removeEventListener(e, activityHandler)
    );
  }, []);

  // ── Long inactivity → new thread ─────────────────────────────────
  useEffect(() => {
    const LONG_TIME_THRESHOLD = 30 * 60 * 1000;
    const interval = setInterval(() => {
      if ((Date.now() - lastActivity) > LONG_TIME_THRESHOLD) {
        const newCount = conversationCount + 1;
        setConversationCount(newCount);
        localStorage.setItem('conversation_count', newCount.toString());
        localStorage.setItem('force_new_thread', 'true');
        threadResetRef.current = true;
        localStorage.removeItem('chat_user_messaged');
        setSessionStartTime(Date.now());
        setLastActivity(Date.now());
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastActivity, conversationCount]);

  // ── Auto-save ─────────────────────────────────────────────────────
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

  // ── Message tracking — last AI message update ─────────────────────
  useEffect(() => {
    lastMessageCount.current = messages.length;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'support-bot') {
      setLastAIMessage(lastMessage.message);
    }
  }, [messages]);

  // ── Helpers ───────────────────────────────────────────────────────
  const resetPromptState = () => {
    setMessages([]);
    setCurrentPromptFlow(null);
    setCollectedData({});
    setTransformedDataForAPI({});
    setCurrentChildOptions([]);
    setHasInitialSave(false);
    setIsTyping(false);
    pendingSuggestionsRef.current = [];
    lastSavedMessageRef.current   = null;
    hasShownWelcome.current       = false;
    welcomeShownRef.current       = false;
  };

  const addBotMessage = (text, extra = {}) => {
    const msg = {
      id: uuidv4(), sender: 'support-bot', message: text,
      createdAt: new Date().toISOString(), isAdmin: true, ...extra
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const addUserMessage = (text) => {
    const msg = {
      id: uuidv4(), sender: 'user', message: text,
      createdAt: new Date().toISOString(), isAdmin: false
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const showServiceUnavailable = (status) => {
    addBotMessage(getServiceUnavailableMessage(status), { isError: true });
  };

  const shouldForceNewThread = () =>
    localStorage.getItem('force_new_thread') === 'true' || threadResetRef.current;

  // ── Save helpers ──────────────────────────────────────────────────
  const saveSingleMessage = async (role, text) => {
    if (!sessionId || text === 'Saving your request...') return;

    // ✅ Text truncate — DynamoDB size limit fix
    const MAX_LEN  = 800;
    const safeText = text.length > MAX_LEN ? text.substring(0, MAX_LEN) + '...' : text;

    const messageKey = `${role}_${safeText.substring(0, 50)}_${sessionId}`;
    const now        = Date.now();
    const lastKey    = localStorage.getItem(`last_saved_key_${sessionId}`);
    const lastTime   = parseInt(localStorage.getItem(`last_saved_time_${sessionId}`) || '0');
    if (lastKey === messageKey && (now - lastTime) < 3000) return;

    try {
      const endpoint = role === 'user'
        ? `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/user-message`
        : `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/bot-reply`;

      const forceNew = role === 'user' && shouldForceNewThread();

      const response = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          text:           safeText,
          tokens:         Math.ceil(safeText.length / 4),
          forceNewThread: forceNew
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem(`last_saved_key_${sessionId}`, messageKey);
        localStorage.setItem(`last_saved_time_${sessionId}`, now.toString());
        if (role === 'user') localStorage.setItem('chat_user_messaged', 'true');
        if (forceNew && data.data?.isNewThread === true) {
          threadResetRef.current = false;
          localStorage.removeItem('force_new_thread');
        }
      }
      return { success: response.ok, data };
    } catch (err) {
      console.error('Message save error:', err);
      return { success: false };
    }
  };

  const saveCurrentConversation = async () => {
    if (!sessionId || !activeConfig?.id || messages.length === 0 || isSaving) return;
    try {
      setIsSaving(true);
      const lastSaved   = lastSavedMessageRef.current;
      const newMessages = lastSaved
        ? messages.slice(messages.findIndex(m => m.id === lastSaved) + 1)
        : messages;
      if (newMessages.length === 0) return;

      const threads = [];
      let current   = null;
      newMessages.forEach(msg => {
        if (msg.sender === 'user') {
          current = {
            userMessage: { text: msg.message, tokens: Math.ceil(msg.message.length / 4) },
            botReplies:  []
          };
          threads.push(current);
        } else if (msg.sender === 'support-bot' && current && !msg._isTemp) {
          current.botReplies.push({
            text: msg.message, tokens: Math.ceil(msg.message.length / 4)
          });
        }
      });
      if (threads.length === 0) return;

      const result = await saveConversationToDatabase(apiBaseUrl, backendApiKey, {
        sessionId, conversations: threads, forceNewThread: shouldForceNewThread(),
      });

      if (result.success) {
        lastSavedMessageRef.current = messages[messages.length - 1].id;
        if (shouldForceNewThread()) {
          threadResetRef.current = false;
          localStorage.removeItem('force_new_thread');
        }
      }
    } catch (err) {
      console.error('Auto-save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Chat initialization ───────────────────────────────────────────
  const showWelcomeMessage = (backendWelcomeMsgs, websiteData) => {
    if (hasShownWelcome.current || welcomeShownRef.current) return;
    const text = cleanText(generateWelcomeMessage(
      websiteData.websiteName,
      backendWelcomeMsgs,
      websiteData.systemPrompt?.map(p => p.content)
    ));
    addBotMessage(text);
    hasShownWelcome.current = true;
    welcomeShownRef.current = true;
    setTimeout(() => saveSingleMessage('support-bot', text), 500);
  };

  useEffect(() => {
    const initializeChat = async () => {
      const databaseConfig = await getDatabaseUrlFromHeaderAPI(apiBaseUrl, backendApiKey);
      if (!databaseConfig) {
        setWebsiteStatus('not_found'); setIsWebsiteActive(false); setConnectionStatus('offline');
        showServiceUnavailable('not_found');
        hasShownWelcome.current = welcomeShownRef.current = true;
        return;
      }

      const wStatus = databaseConfig.status?.toLowerCase();
      setWebsiteTitle(databaseConfig.websiteName || 'Support');

      if (wStatus !== 'active') {
        setWebsiteStatus('inactive'); setIsWebsiteActive(false); setConnectionStatus('offline');
        showServiceUnavailable('inactive');
        hasShownWelcome.current = welcomeShownRef.current = true;
        return;
      }

      setWebsiteStatus('active'); setIsWebsiteActive(true); setConnectionStatus('online');

      const websiteData = await fetchWebsiteConfig(apiBaseUrl, backendApiKey, databaseConfig.websiteId);
      if (websiteData) {
        setActiveConfig(websiteData);
        setCategories(websiteData.category || []);
        setSystemPrompts(websiteData.systemPrompt || []);
        if (websiteData.aifuture)      setAifuture(websiteData.aifuture);
        if (websiteData.aiPersonality) setAiPersonality(websiteData.aiPersonality);
        if (websiteData.customPrompt?.length > 0) setSuggestedPrompts(websiteData.customPrompt);

        const backendWelcomeMsgs = await fetchWelcomeMessages(apiBaseUrl, backendApiKey, databaseConfig.websiteId);
        setWelcomeMessages(backendWelcomeMsgs);
        showWelcomeMessage(backendWelcomeMsgs, websiteData);
      } else {
        showWelcomeMessage([], databaseConfig);
      }
    };
    initializeChat();
  }, [apiBaseUrl, backendApiKey]);

  // ── Connection polling ────────────────────────────────────────────
  useEffect(() => {
    if (!isWebsiteActive || websiteStatus === 'inactive') return;
    const poll = async () => {
      const result = await checkWebsiteConnection(apiBaseUrl, backendApiKey);
      if (result.success && result.status !== 'active') {
        setIsWebsiteActive(false); setWebsiteStatus('inactive'); setConnectionStatus('offline');
        if (hasShownWelcome.current)
          addBotMessage(getServiceUnavailableMessage('inactive'), { isError: true });
        return;
      }
      setConnectionStatus(result.success ? 'online' : 'offline');
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [apiBaseUrl, isWebsiteActive, backendApiKey, websiteStatus]);

  const handleInactiveInteraction = () => {
    if (websiteStatus === 'inactive')
      addBotMessage(getServiceUnavailableMessage('inactive'), { isError: true });
    return false;
  };

  // ── addBotAndSave — bot message add karo + save karo ─────────────
  const addBotAndSave = async (text, extra = {}) => {
    addBotMessage(text, extra);
    await saveSingleMessage('support-bot', text);
  };

  // ✅ NEW: Typing done callback
  // Jab latest bot message ki typing complete ho:
  // 1. isTyping false karo
  // 2. pending suggestions set karo
  const handleLatestMessageTypingDone = () => {
    setIsTyping(false);
    if (pendingSuggestionsRef.current.length > 0) {
      setSuggestedPrompts(pendingSuggestionsRef.current);
      pendingSuggestionsRef.current = [];
    }
  };

  // ── Prompt flow logic ─────────────────────────────────────────────
  const completePromptFlow = (data) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const transformed = transformDataWithParams(data, storedPromptsWithParams);
    setCollectedData(data);
    setTransformedDataForAPI(transformed);

    const clientSummary = createClientSummary(data);
    addBotAndSave(clientSummary);

    // Summary typing estimate
    const wordCount   = clientSummary.split(/\s+/).length;
    const typingDelay = Math.max(1500, wordCount * 75 + 500);

    setTimeout(async () => {
      const confirmMsg = 'All done! Would you like to confirm this request?';
      await addBotAndSave(confirmMsg);
      setCurrentPromptFlow(null);

      // "All done!" typing estimate, phir Yes/No
      const confirmWordCount = confirmMsg.split(/\s+/).length;
      const confirmDelay     = Math.max(800, confirmWordCount * 75 + 400);
      setTimeout(() => { setIsConfirming(true); }, confirmDelay);
    }, typingDelay);
  };

  const handleConfirmResponse = async (answer) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setIsConfirming(false); setCurrentChildOptions([]);
    addUserMessage(answer);
    await saveSingleMessage('user', answer);

    try {
      if (answer === 'Yes') {
        addBotMessage('Saving your request...', { _isTemp: true });
        const serverSummary   = createServerSummary(collectedData, storedPromptsWithParams);
        const summaryParamKey = findSummaryParamKey(storedSummaryList);

        const formData = new FormData();
        formData.append('websiteId',  activeConfig.websiteId || activeConfig.id);
        formData.append('promptName', selectedPromptName);
        Object.entries(transformedDataForAPI).forEach(([k, v]) => {
          if (v != null) formData.append(k, v);
        });
        if (summaryParamKey) formData.append(summaryParamKey, serverSummary);

        const execResult = await (await fetch(`${apiBaseUrl}/api/execute-urls`, {
          method: 'POST', body: formData
        })).json();

        const saveResult = await (await fetch(`${apiBaseUrl}/api/chat-requests`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${backendApiKey}` },
          body:    JSON.stringify({
            websiteId:      activeConfig?.id,
            collectedData:  transformedDataForAPI,
            backendApiKey,
            urlCallResults: execResult.results?.length > 0 ? execResult.results : undefined
          }),
        })).json();

        if (saveResult.success) {
          setMessages(prev => prev.filter(msg => !msg._isTemp));
          await addBotAndSave(getSuccessMessage());
          // After Yes — show all prompts again
          setTimeout(() => setSuggestedPrompts(suggestedPrompts), 800);
        } else { throw new Error(saveResult.message || 'Failed to save request'); }
      } else {
        await fetch(`${apiBaseUrl}/api/chat-requests`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${backendApiKey}` },
          body:    JSON.stringify({ websiteId: activeConfig?.id, collectedData: transformedDataForAPI }),
        });
        await addBotAndSave(getCancelMessage());
        setTimeout(() => setSuggestedPrompts(suggestedPrompts), 800);
      }
    } catch (error) {
      console.error('handleConfirmResponse error:', error);
      setMessages(prev => prev.filter(msg => !msg._isTemp));
      await addBotAndSave(getErrorMessage(), { isError: true });
    } finally {
      setCollectedData({}); setTransformedDataForAPI({});
      setCurrentPromptFlow(null);
      setStoredUrls([]); setStoredApiKeys([]);
      setStoredPromptsWithParams([]); setStoredSummaryList([]); setRecentTopics([]);
    }
  };

  const handlePromptFlowResponse = (userAnswer) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { currentQuestion } = currentPromptFlow;
    const fieldType = getFieldType(currentQuestion.text);
    if (!validateInput(fieldType, userAnswer)) {
      const errors = {
        email:  'Please enter a valid email address (e.g., name@example.com)',
        phone:  'Please enter a valid 10-digit phone number',
        number: 'Please enter a valid number',
        date:   'Please enter valid dates (e.g., "15-12-2024 to 20-12-2024")',
        url:    'Please enter a valid URL (e.g., http://example.com)',
      };
      addBotAndSave(errors[fieldType] || 'Please provide a valid response', { isError: true });
      return;
    }
    const newData = { ...collectedData, [currentQuestion.text]: userAnswer };
    setCollectedData(newData);
    moveToNextQuestion(newData);
  };

  const buildNextPromptFlow = async (prompts, promptIndex, flowMeta) => {
    const nextPrompt = prompts[promptIndex];
    if (nextPrompt.children?.length === 1) {
      const sc = nextPrompt.children[0];
      setCurrentPromptFlow({
        prompts, promptIndex, questionIndex: 0,
        currentQuestion: sc, waitingForOption: false,
        childOptions: null, ...flowMeta, isSingleChild: true
      });
      await addBotAndSave(makeFriendly(sc.text));
    } else if (nextPrompt.children?.length > 1) {
      setCurrentPromptFlow({
        prompts, promptIndex, questionIndex: 0,
        currentQuestion: nextPrompt, waitingForOption: false,
        childOptions: nextPrompt.children, ...flowMeta, isSingleChild: false
      });
      await addBotAndSave(makeFriendly(nextPrompt.text));
      setTimeout(() => showOptionsAfterQuestion(nextPrompt.children, prompts, promptIndex), 1000);
    } else {
      setCurrentPromptFlow({
        prompts, promptIndex, questionIndex: 0,
        currentQuestion: nextPrompt, waitingForOption: false,
        childOptions: null, ...flowMeta, isSingleChild: false
      });
      await addBotAndSave(makeFriendly(nextPrompt.text));
    }
  };

  const moveToNextQuestion = async (data) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, questionIndex, isSingleChild } = currentPromptFlow;
    const currentPrompt = prompts[promptIndex];
    const flowMeta      = { promptName: currentPromptFlow.promptName };

    if (isSingleChild && questionIndex === 0) {
      const nextIdx = promptIndex + 1;
      if (nextIdx < prompts.length) await buildNextPromptFlow(prompts, nextIdx, flowMeta);
      else completePromptFlow(data);
      return;
    }

    if (currentPrompt.children?.length > 0 && questionIndex === 0) {
      showOptionsAfterQuestion(currentPrompt.children, prompts, promptIndex);
      return;
    }

    const nextQIdx = questionIndex + 1;
    if (nextQIdx < (currentPrompt.children?.length || 0)) {
      const nextQ = currentPrompt.children[nextQIdx];
      setCurrentPromptFlow(prev => ({ ...prev, questionIndex: nextQIdx, currentQuestion: nextQ }));
      await addBotAndSave(makeFriendly(nextQ.text));
    } else {
      const nextIdx = promptIndex + 1;
      if (nextIdx < prompts.length) await buildNextPromptFlow(prompts, nextIdx, flowMeta);
      else completePromptFlow(data);
    }
  };

  const showOptionsAfterQuestion = async (children, prompts, promptIndex) => {
    if (children.length > 1) {
      setCurrentChildOptions(children.map(c => c.text));
      setCurrentPromptFlow(prev => ({
        ...prev, waitingForOption: true, childOptions: children,
        currentQuestion: { text: 'Select Option' }
      }));
    } else if (children.length === 1) {
      const sc = children[0];
      setCurrentPromptFlow(prev => ({
        ...prev, waitingForOption: false, currentQuestion: sc, isSingleChild: true
      }));
      await addBotAndSave(makeFriendly(sc.text));
    }
  };

  const handleOptionSelect = async (optionText) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    const { prompts, promptIndex, childOptions } = currentPromptFlow;
    const selectedOption = childOptions.find(opt => opt.text === optionText);
    if (!selectedOption) {
      await addBotAndSave('Please select a valid option from the available choices.', { isError: true });
      return;
    }
    const newData = { ...collectedData, [prompts[promptIndex].text]: optionText };
    setCollectedData(newData);
    setCurrentChildOptions([]);

    if (!messages[messages.length - 1]?.isOptions) {
      addUserMessage(optionText);
      await saveSingleMessage('user', optionText);
    }

    const flowMeta = { promptName: currentPromptFlow.promptName };
    if (selectedOption.children?.length > 0) {
      if (selectedOption.children.length === 1) {
        const sc = selectedOption.children[0];
        setCurrentPromptFlow(prev => ({
          ...prev, waitingForOption: false, currentQuestion: sc, isSingleChild: true
        }));
        await addBotAndSave(makeFriendly(sc.text));
      } else {
        setTimeout(() => showOptionsAfterQuestion(selectedOption.children, prompts, promptIndex), 500);
      }
    } else {
      const nextIdx = promptIndex + 1;
      if (nextIdx < prompts.length) await buildNextPromptFlow(prompts, nextIdx, flowMeta);
      else completePromptFlow(newData);
    }
  };

  // ── Prompt click ──────────────────────────────────────────────────
  const findMatchingPrompt = (aiResponse) => {
    if (!aiResponse || !suggestedPrompts.length) return null;
    const responseLower = aiResponse.toLowerCase();
    let bestMatch = null, highestScore = 0;
    suggestedPrompts.forEach(prompt => {
      if (!prompt || typeof prompt !== 'string') return;
      let score = 0;
      prompt.toLowerCase().split(/\s+/).forEach(pWord => {
        if (pWord.length > 3) responseLower.split(/\s+/).forEach(rWord => {
          if (rWord.length > 3 && (pWord.includes(rWord) || rWord.includes(pWord))) score += 2;
        });
      });
      if (responseLower.includes(prompt.toLowerCase()) || prompt.toLowerCase().includes(responseLower)) score += 5;
      if (score > highestScore) { highestScore = score; bestMatch = prompt; }
    });
    return highestScore > 3 ? bestMatch : null;
  };

  const handlePromptClick = async (promptName) => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }

    // ✅ Suggestions turant clear karo
    setSuggestedPrompts([]);
    pendingSuggestionsRef.current = [];
    setAutoClickInProgress(false);
    setIsLoading(true);
    setIsTyping(false);

    try {
      const data = await fetchChildPrompts(apiBaseUrl, backendApiKey, activeConfig?.id, promptName);
      setSelectedPromptName(promptName);
      setStoredPromptsWithParams(data.promptsWithParams || []);
      setStoredSummaryList(data.summaryList?.length > 0 ? data.summaryList : []);
      const prompts = data.prompts || (data.items?.length ? data.items.flatMap(i => i.prompts) : []);
      setCollectedData({}); setTransformedDataForAPI({}); setCurrentChildOptions([]);

      addUserMessage(promptName);
      await saveSingleMessage('user', promptName);

      // ✅ 600ms baad intro dikhao
      await new Promise(resolve => setTimeout(resolve, 600));

      setIsLoading(false);
      setIsTyping(true);
      await addBotAndSave(getPromptIntroMessage(promptName));

      // Intro typing estimate
      const introMsg       = getPromptIntroMessage(promptName);
      const introWordCount = introMsg.split(/\s+/).length;
      const introWait      = Math.max(800, introWordCount * 75 + 400);
      await new Promise(resolve => setTimeout(resolve, introWait));
      setIsTyping(false);

      const flowMeta = { promptName };
      if (prompts.length > 0) {
        await buildNextPromptFlow(prompts, 0, flowMeta);
      } else {
        await addBotAndSave(
          `I'd be happy to help you with ${promptName}! Please tell me your requirements and I'll assist you.`
        );
        setCurrentPromptFlow(null);
      }
    } catch (err) {
      console.error('Prompt Click Error:', err);
      addUserMessage(promptName);
      await saveSingleMessage('user', promptName);
      await addBotAndSave(
        `I'd love to help with ${promptName}! Please share what you need, and I'll do my best to assist!`
      );
      setCurrentPromptFlow(null);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setAutoClickInProgress(false);
      setSuggestedPrompts([]);
      pendingSuggestionsRef.current = [];
    }
  };

  const handleNextQuestion = async (userAnswer = '') => {
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    if (pendingQuestions.length > 0) {
      const [next, ...rest] = pendingQuestions;
      setPendingQuestions(rest);
      await addBotAndSave(makeFriendly(next));
    } else if (!isConfirming && messages.length > 0) {
      setTimeout(async () => {
        await addBotAndSave('All done! Would you like to confirm this request?');
        setIsConfirming(true);
      }, 700);
    }
  };

  // ── Main send handler ─────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    // ✅ isTyping ke dauran bhi block karo
    if (!text.trim() || isLoading || isTyping) return;
    if (!isWebsiteActive) { handleInactiveInteraction(); return; }
    setLastActivity(Date.now());

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'user' && lastMessage.message === text &&
        Math.abs(new Date() - new Date(lastMessage.createdAt)) < 3000) return;

    // ✅ Purani suggestions clear karo
    setSuggestedPrompts([]);
    pendingSuggestionsRef.current = [];

    addUserMessage(text);
    setInputMessage('');
    await saveSingleMessage('user', text);

    if (currentPromptFlow?.waitingForOption)         { handleOptionSelect(text);       return; }
    if (currentPromptFlow?.currentQuestion)          { handlePromptFlowResponse(text); return; }
    if (pendingQuestions.length > 0 || isConfirming) { setTimeout(() => handleNextQuestion(text), 800); return; }

    const lastBotMessage = messages.slice().reverse().find(
      m => m.sender === 'support-bot' && m.isAdmin
    );
    const isEmailRequest = lastBotMessage && (
      lastBotMessage.message.includes('email address') ||
      lastBotMessage.message.includes('Please provide your email')
    );

    if (isEmailRequest) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) {
        await addBotAndSave(
          'Please provide a valid email address (e.g., name@example.com)', { isError: true }
        );
        return;
      }
      setIsLoading(true);
      try {
        const allAI  = messages.filter(m => m.sender === 'support-bot' && m.isAdmin);
        const result = await (await fetch(`${apiBaseUrl}/api/chat-requests`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${backendApiKey}` },
          body:    JSON.stringify({
            websiteId:     activeConfig?.id,
            collectedData: {
              email:             text.trim(),
              lastMessage:       allAI[allAI.length - 1]?.message || '',
              secondLastMessage: allAI[allAI.length - 2]?.message || ''
            },
            backendApiKey
          }),
        })).json();
        if (result.success) {
          await addBotAndSave(
            'Thank you! Your email has been saved. Our team will contact you shortly.'
          );
        } else { throw new Error(result.message); }
      } catch {
        await addBotAndSave(
          'Sorry, there was an error saving your email. Please try again.', { isError: true }
        );
      } finally { setIsLoading(false); }
      return;
    }

    if (checkUserNotInterest(text)) {
      setTimeout(async () => {
        await addBotAndSave(
          'No problem! If you have any other questions, feel free to ask. How else can I help you?'
        );
      }, 500);
      return;
    }

    if (checkUserInterest(text) && lastAIMessage && interestDetectionEnabled) {
      const matching = findMatchingPrompt(lastAIMessage);
      if (matching && !autoClickInProgress) {
        setAutoClickInProgress(true);
        await addBotAndSave(`Great! I'll help you with ${matching}. Setting it up for you...`);
        setTimeout(() => handlePromptClick(matching), 1500);
        return;
      }
      if (!matching) {
        const topic    = extractMainTopic(lastAIMessage);
        const emailMsg = topic
          ? `Please provide your email address, we will get you in touch regarding "${topic}"`
          : 'Please provide your email address, we will get you in touch regarding this';
        await addBotAndSave(emailMsg);
        return;
      }
    }

    // ✅ FLOW:
    // 1. isLoading = true  → three dots show
    // 2. Response aaya     → isLoading = false, isTyping = true → word-by-word start
    // 3. Typing done       → isTyping = false, suggestions set
    setIsLoading(true);
    try {
      const { response, suggestions } = await generateAIResponse(apiBaseUrl, backendApiKey, text);
      const cleaned = cleanText(response);

      const lastBot = messages[messages.length - 1];
      if (lastBot?.sender === 'support-bot' && lastBot.message === cleaned) {
        setIsLoading(false);
        return;
      }

      // ✅ Three dots hatao, typing shuru karo
      setIsLoading(false);
      setIsTyping(true);

      // Agar suggestions hain to pending mein rakho
      if (suggestions && suggestions.length > 0 && !currentPromptFlow) {
        pendingSuggestionsRef.current = suggestions;
      } else {
        pendingSuggestionsRef.current = [];
      }

      await addBotAndSave(cleaned);
      // isTyping false aur suggestions set handleLatestMessageTypingDone mein honge

    } catch (err) {
      console.error('AI response error:', err);
      setIsLoading(false);
      setIsTyping(false);
      pendingSuggestionsRef.current = [];
      await addBotAndSave("I'm having trouble right now. Please try again.", { isError: true });
    }
  };

  // ── Close ─────────────────────────────────────────────────────────
  const handleCloseChat = () => {
    if (messages.length > 0 && !isSaving) saveCurrentConversation();
    sendCloseMessageToParent();
    resetPromptState();
    setStoredUrls([]); setStoredApiKeys([]); setStoredPromptsWithParams([]);
    setRecentTopics([]); setAutoClickInProgress(false);
  };

  // ✅ Input disable:
  // - isLoading (three dots, API wait)
  // - isTyping  (word-by-word chal raha hai)
  // - isConfirming (Yes/No buttons)
  // - waitingForOption
  // - website inactive
  // - autoClickInProgress
  const isInputDisabled =
    isLoading ||
    isTyping  ||
    isConfirming ||
    !!currentPromptFlow?.waitingForOption ||
    !isWebsiteActive ||
    autoClickInProgress;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={styles.chatWidgetContainer} style={responsiveStyles.container}>
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
          messages={messages}
          isLoading={isLoading}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          apiBaseUrl={apiBaseUrl}
          backendApiKey={backendApiKey}
          onPromptClick={handlePromptClick}
          onConfirmClick={handleConfirmResponse}
          onOptionSelect={handleOptionSelect}
          showConfirmButtons={isConfirming}
          currentPromptFlow={currentPromptFlow}
          suggestedPrompts={suggestedPrompts}
          currentChildOptions={currentChildOptions}
          isWebsiteActive={isWebsiteActive}
          websiteStatus={websiteStatus}
          messageAnimations={messageAnimations}
          isFullScreen={isFullScreen}
          // ✅ Typing done callback
          onLatestMessageTypingDone={handleLatestMessageTypingDone}
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

        {autoClickInProgress && (
          <div className={styles.autoClickIndicator}>
            <div className={styles.autoClickSpinner} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatwidget;