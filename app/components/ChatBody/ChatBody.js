'use client';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import styles from './ChatBody.module.css';

// ─── Typewriter hook ────────────────────────────────────────────
const useTypewriter = (text, speed = 18, enabled = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone]               = useState(false);
  const indexRef                          = useRef(0);
  const intervalRef                       = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsDone(true);
      return;
    }
    setDisplayedText('');
    setIsDone(false);
    indexRef.current = 0;

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      setDisplayedText(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(intervalRef.current);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [text, speed, enabled]);

  return { displayedText, isDone };
};

// ─── Single bot message with typewriter ────────────────────────
const BotMessage = ({ message, isLatest, createdAt, onCharTyped }) => {
  const { displayedText, isDone } = useTypewriter(message, 18, isLatest);

  // Notify parent on each new char so it can scroll (if user hasn't scrolled up)
  useEffect(() => {
    if (isLatest && !isDone && onCharTyped) onCharTyped();
  }, [displayedText]);

  return (
    <div className={styles.messageContent}>
      <div className={styles.messageText}>
        {displayedText}
        {!isDone && <span className={styles.typingCursor}>|</span>}
      </div>
      {isDone && (
        <div className={styles.messageTime}>
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

// ─── Main ChatBody ──────────────────────────────────────────────
const ChatBody = forwardRef((props, ref) => {
  const {
    messages,
    isLoading,
    primaryColor,
    secondaryColor,
    apiBaseUrl,
    backendApiKey,
    onPromptClick,
    onConfirmClick,
    onOptionSelect,
    showConfirmButtons,
    currentPromptFlow,
    suggestedPrompts,
    currentChildOptions,
    isWebsiteActive,
    websiteStatus,
    messageAnimations,
    isFullScreen,
    isKeyboardVisible
  } = props;

  const scrollContainerRef = useRef(null);
  const messagesEndRef     = useRef(null);

  // ✅ Track if user has manually scrolled up
  const userScrolledUpRef  = useRef(false);
  const lastScrollTopRef   = useRef(0);

  // ─── Detect manual scroll ──────────────────────────────────────
  // If user scrolls UP → set flag. If they scroll back to bottom → clear flag.
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    if (isAtBottom) {
      userScrolledUpRef.current = false;
    } else if (el.scrollTop < lastScrollTopRef.current) {
      // scrolling upward
      userScrolledUpRef.current = true;
    }
    lastScrollTopRef.current = el.scrollTop;
  }, []);

  // ─── Smart scroll — only if user hasn't scrolled up ───────────
  const scrollToBottom = useCallback(() => {
    if (userScrolledUpRef.current) return;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // Force scroll (new message arrives — always pull to bottom & reset flag)
  const forceScrollToBottom = useCallback(() => {
    userScrolledUpRef.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // Index of last bot message
  const lastBotIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'support-bot') return i;
    }
    return -1;
  })();

  // New message → force scroll to bottom
  useEffect(() => {
    forceScrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (currentChildOptions && currentChildOptions.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [currentChildOptions]);

  useEffect(() => {
    if (showConfirmButtons) setTimeout(() => scrollToBottom(), 100);
  }, [showConfirmButtons]);

  useEffect(() => {
    if (!currentPromptFlow && suggestedPrompts && suggestedPrompts.length > 0 && !isLoading) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [suggestedPrompts, currentPromptFlow, isLoading]);

  useEffect(() => {
    if (isKeyboardVisible) setTimeout(() => forceScrollToBottom(), 300);
  }, [isKeyboardVisible]);

  // Called by BotMessage on each typed character
  const handleCharTyped = useCallback(() => {
    scrollToBottom(); // respects userScrolledUpRef
  }, [scrollToBottom]);

  return (
    <div
      className={styles.chatBody}
      ref={(el) => {
        scrollContainerRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      onScroll={handleScroll}
    >
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`${styles.message} ${
              message.sender === 'user' ? styles.userMessage : styles.botMessage
            }`}
          >
            {message.sender === 'support-bot' ? (
              <BotMessage
                message={message.message}
                isLatest={index === lastBotIndex && !isLoading}
                createdAt={message.createdAt}
                onCharTyped={handleCharTyped}
              />
            ) : (
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{message.message}</div>
                <div className={styles.messageTime}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Three-dot loader */}
        {isLoading && (
          <div className={styles.typingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        {/* Confirm buttons */}
        {showConfirmButtons && (
          <div className={styles.confirmButtons}>
            <button
              className={styles.confirmButton}
              style={{ backgroundColor: primaryColor }}
              onClick={() => onConfirmClick('Yes')}
            >
              Yes
            </button>
            <button
              className={styles.confirmButton}
              style={{ backgroundColor: '#f44336' }}
              onClick={() => onConfirmClick('No')}
            >
              No
            </button>
          </div>
        )}

        {/* Child options */}
        {currentChildOptions && currentChildOptions.length > 0 && (
          <div className={styles.optionsContainer}>
            {currentChildOptions.map((option, index) => (
              <button
                key={index}
                className={styles.optionButton}
                style={{
                  backgroundColor: 'white',
                  color: primaryColor,
                  border: `1px solid ${primaryColor}`
                }}
                onClick={() => onOptionSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Suggested prompts */}
        {!currentPromptFlow && suggestedPrompts && suggestedPrompts.length > 0 && !isLoading && (
          <div className={styles.suggestedPrompts}>
            <div className={styles.promptButtons}>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className={styles.promptButton}
                  style={{
                    backgroundColor: 'white',
                    color: primaryColor,
                    border: `1px solid ${primaryColor}`
                  }}
                  onClick={() => onPromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>
    </div>
  );
});

ChatBody.displayName = 'ChatBody';
export default ChatBody;