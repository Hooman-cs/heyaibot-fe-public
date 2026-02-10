'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './ChatBody.module.css';
import { Check, CheckCheck } from 'lucide-react';

const ChatBody = ({
  messages,
  isLoading,
  primaryColor = '#4a6baf',
  secondaryColor = 'tomato',
  apiBaseUrl,
  backendApiKey = '',
  onPromptClick,
  onConfirmClick,
  onOptionSelect,
  showConfirmButtons,
  currentPromptFlow,
  suggestedPrompts = [],
  currentChildOptions = [],
  isWebsiteActive = true,
  websiteStatus = 'active',
  messageAnimations = {}
}) => {
  const messagesEndRef = useRef(null);
  const [websiteId, setWebsiteId] = useState('');
  const [lastClickedKeyword, setLastClickedKeyword] = useState(null);
  const [showMainPrompts, setShowMainPrompts] = useState(true);
  const [isAutoClickInProgress, setIsAutoClickInProgress] = useState(false);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
useEffect(() => {
  if (currentChildOptions.length > 0 && 
      !showConfirmButtons &&
      currentPromptFlow &&
      currentPromptFlow.waitingForOption) {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}, [currentChildOptions, showConfirmButtons, currentPromptFlow]);
  // Listen for auto-click events from ChatWidget
  useEffect(() => {
    const handleAutoClickEvent = (event) => {
      if (event.detail && event.detail.type === 'userInterested' && event.detail.isAutoClick) {
        // Auto-click detected, hide prompts immediately
        setShowMainPrompts(false);
        setIsAutoClickInProgress(true);
        
        // Reset after auto-click completes
        setTimeout(() => {
          setIsAutoClickInProgress(false);
        }, 1500);
      }
    };
    
    // Listen for custom events from ChatWidget
    window.addEventListener('userInterestDetected', handleAutoClickEvent);
    
    return () => {
      window.removeEventListener('userInterestDetected', handleAutoClickEvent);
    };
  }, []);

  // Reset prompts when flow is complete or when suggestedPrompts change
  useEffect(() => {
    // If there's a current flow, hide main prompts
    if (currentPromptFlow) {
      setShowMainPrompts(false);
    } else if (showConfirmButtons) {
      // Hide prompts when confirming
      setShowMainPrompts(false);
    } else if (suggestedPrompts.length === 0) {
      // Hide if no suggested prompts
      setShowMainPrompts(false);
    } else if (!isAutoClickInProgress) {
      // Show prompts when no flow, no confirmation, and not auto-clicking
      setShowMainPrompts(true);
    }
  }, [currentPromptFlow, showConfirmButtons, suggestedPrompts, isAutoClickInProgress]);

  // Listen for message animations
  useEffect(() => {
    // Check if last message is from bot and has animation
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.isAdmin && messageAnimations[lastMessage.id]) {
        // Bot is typing/showing message, keep prompts hidden
        setShowMainPrompts(false);
      }
    }
  }, [messages, messageAnimations]);

  // Fetch website ID
  useEffect(() => {
    const fetchWebsiteData = async () => {
      if (!backendApiKey || !apiBaseUrl) {
        console.warn('❌ Missing API configuration');
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/websites/chat-config?apiKey=${encodeURIComponent(backendApiKey)}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.item) {
          const websiteData = data.item;
          
          if (websiteData.status === 'active') {
            setWebsiteId(websiteData.id || '');
          } else {
            setWebsiteId('');
          }
        } else {
          setWebsiteId('');
          console.warn('❌ No website found with this API key:', data.error);
        }
      } catch (error) {
        console.error('💥 Error checking website status:', error);
        setWebsiteId('');
      }
    };
    
    fetchWebsiteData();
  }, [apiBaseUrl, backendApiKey]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  const renderTicks = (status) => {
    if (status === 'single')
      return <Check size={14} color="#999" className={styles.tickIcon} />;
    if (status === 'double')
      return <CheckCheck size={14} color="#999" className={styles.tickIcon} />;
    if (status === 'green')
      return <CheckCheck size={14} color="#4caf50" className={styles.tickIcon} />;
    return null;
  };

  const handleKeywordClick = (prompt) => {
    setLastClickedKeyword(prompt);
    setShowMainPrompts(false); // Hide immediately on click
    onPromptClick(prompt);
  };

  const handleOptionSelect = (option) => {
    onOptionSelect(option);
    setShowMainPrompts(false);
  };

  const handleConfirmClick = (response) => {
    onConfirmClick(response);
    
    if (response === 'No') {
      // If user cancels, show main prompts again after delay
      setTimeout(() => {
        setShowMainPrompts(true);
        setLastClickedKeyword(null);
      }, 1000);
    } else {
      // If user confirms, keep prompts hidden
      setShowMainPrompts(false);
    }
  };

  // Determine when to show main prompts
  const shouldShowMainPrompts = 
    showMainPrompts && 
    suggestedPrompts.length > 0 && 
    !showConfirmButtons && 
    currentChildOptions.length === 0 && 
    !isLoading &&
    !isAutoClickInProgress &&
    (!currentPromptFlow || (!currentPromptFlow.waitingForOption && !currentPromptFlow.isSingleChild));

  // Determine when to show child options
  const shouldShowChildOptions = 
    currentChildOptions.length > 1 && 
    !showConfirmButtons &&
    currentPromptFlow &&
    currentPromptFlow.waitingForOption;

  // Show loading indicator for auto-click
  if (isAutoClickInProgress) {
    return (
      <div className={styles.chatBox}>
        <div className={styles.messagesContainer}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.chatMessage} ${msg.isAdmin ? styles.admin : styles.user}`}
              style={{
                backgroundColor: msg.isAdmin ? '#fff' : `${primaryColor}15`,
                border: msg.isAdmin ? 'none' : `1px solid ${primaryColor}`,
              }}
            >
              <div className={styles.messageRow}>
                <div
                  className={styles.messageText}
                  dangerouslySetInnerHTML={{
                    __html: msg.message.replace(/\n/g, '<br>'),
                  }}
                  style={{ 
                    color: msg.isAdmin ? '#333' : primaryColor,
                    whiteSpace: 'pre-line'
                  }}
                />
              </div>

              {msg.isError && (
                <div 
                  className={styles.errorMessage}
                  style={{ 
                    color: secondaryColor,
                    border: `1px solid ${secondaryColor}20`,
                    backgroundColor: `${secondaryColor}10`
                  }}
                >
                  ⚠️ {msg.message}
                </div>
              )}

              <div className={styles.messageFooter}>
                <span className={styles.messageTimestamp}>
                  {formatTime(msg.createdAt)}
                </span>
                {!msg.isAdmin && renderTicks(msg.status)}
              </div>
            </div>
          ))}

          {/* Auto-click loading indicator */}
          <div className={styles.autoClickIndicator}>
            <div className={styles.autoClickSpinner} style={{ borderColor: primaryColor }} />
            <span style={{ color: primaryColor }}>Auto-selecting relevant option...</span>
          </div>

          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatBox}>
      <div className={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`${styles.chatMessage} ${msg.isAdmin ? styles.admin : styles.user}`}
            style={{
              backgroundColor: msg.isAdmin ? '#fff' : `${primaryColor}15`,
              border: msg.isAdmin ? 'none' : `1px solid ${primaryColor}`,
            }}
          >
            <div className={styles.messageRow}>
              <div
                className={styles.messageText}
                dangerouslySetInnerHTML={{
                  __html: msg.message.replace(/\n/g, '<br>'),
                }}
                style={{ 
                  color: msg.isAdmin ? '#333' : primaryColor,
                  whiteSpace: 'pre-line'
                }}
              />
            </div>

            {msg.isError && (
              <div 
                className={styles.errorMessage}
                style={{ 
                  color: secondaryColor,
                  border: `1px solid ${secondaryColor}20`,
                  backgroundColor: `${secondaryColor}10`
                }}
              >
                ⚠️ {msg.message}
              </div>
            )}

            <div className={styles.messageFooter}>
              <span className={styles.messageTimestamp}>
                {formatTime(msg.createdAt)}
              </span>
              {!msg.isAdmin && renderTicks(msg.status)}
            </div>
          </div>
        ))}

        {isLoading && !isAutoClickInProgress && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDot} style={{ backgroundColor: secondaryColor }} />
            <div className={styles.typingDot} style={{ backgroundColor: secondaryColor }} />
            <div className={styles.typingDot} style={{ backgroundColor: secondaryColor }} />
          </div>
        )}

        {/* Confirmation Buttons */}
        {showConfirmButtons && (
          <div className={styles.confirmContainer}>
            <button
              style={{ 
                backgroundColor: primaryColor, 
                color: 'white',
                border: `1px solid ${primaryColor}`
              }}
              className={styles.confirmButton}
              onClick={() => handleConfirmClick('Yes')}
            >
              ✅ Yes, Confirm
            </button>
            <button
              style={{ 
                backgroundColor: 'transparent', 
                color: secondaryColor,
                border: `1px solid ${secondaryColor}`
              }}
              className={styles.confirmButton}
              onClick={() => handleConfirmClick('No')}
            >
              ❌ No, Cancel
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Child options suggestions */}
      {shouldShowChildOptions && (
        <div className={styles.childOptionsContainer}>
          <div className={styles.childOptionsHeader}>
            <span style={{ color: primaryColor }}>📋 Available Options:</span>
          </div>
          <div className={styles.childOptionsList}>
            {currentChildOptions.map((option, i) => (
              <button
                key={i}
                className={styles.childOptionButton}
                style={{ 
                  backgroundColor: primaryColor, 
                  color: 'white',
                  border: `1px solid ${primaryColor}`
                }}
                onClick={() => handleOptionSelect(option)}
                disabled={isLoading || isAutoClickInProgress}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main suggested prompts */}
      {shouldShowMainPrompts && (
        <div className={styles.keywordSuggestionsContainer}>
          <div className={styles.keywordHeader}>
            {/* Optional header text */}
          </div>
          <div className={styles.keywordList}>
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                className={styles.keywordPill}
                style={{ 
                  backgroundColor: primaryColor, 
                  color: 'white',
                  border: `1px solid ${primaryColor}`
                }}
                onClick={() => handleKeywordClick(prompt)}
                disabled={isLoading || isAutoClickInProgress}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBody;