'use client';
import { useState, useEffect, forwardRef } from 'react';
import styles from './ChatInput.module.css';

const ChatInput = forwardRef(({ 
  inputMessage, 
  setInputMessage, 
  sendMessage, 
  primaryColor = '#4a6baf',
  headerColor = null,          // ✅ from branding API
  disabled = false,
  isFullScreen = false,
  onFocus,
  poweredByText = 'JDPC Global',
  poweredByUrl = 'https://jdpcglobal.com'
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // ✅ Use headerColor if available, fallback to primaryColor
  const activeColor = headerColor || primaryColor;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !disabled && inputMessage.trim()) {
      sendMessage(inputMessage);
    }
  };

  const handleSendClick = () => {
    if (!disabled && inputMessage.trim()) {
      sendMessage(inputMessage);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
    if (ref?.current) ref.current.style.fontSize = '16px';
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (ref?.current) ref.current.style.fontSize = '';
  };

  useEffect(() => {
    if (!disabled && ref?.current) ref.current.focus();
  }, [disabled, ref]);

  return (
    <div className={`${styles.chatInputWrapper} ${isFullScreen ? styles.fullScreen : ''}`}>
      
      <div 
        className={styles.chatInputContainer}
        style={{ 
          '--primary-color': activeColor,              // ✅ use activeColor
          '--primary-color-light': `${activeColor}20`, // ✅ use activeColor
        }}
        data-focused={isFocused}
        data-disabled={disabled}
      >
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            type="text"
            className={styles.chatInput}
            placeholder={disabled ? "Please select an option above..." : "Type your message..."}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={disabled ? "Input disabled - please select an option" : "Type your message"}
            inputMode="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{
              // ✅ input border uses headerColor on focus
              '--input-focus-color': activeColor,
            }}
          />
          {inputMessage && !disabled && (
            <button 
              className={styles.clearButton}
              onClick={() => setInputMessage('')}
              aria-label="Clear message"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18" strokeWidth="2"/>
                <path d="M6 6L18 18" strokeWidth="2"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* ✅ Send button uses headerColor */}
        <button 
          className={styles.chatButton} 
          onClick={handleSendClick}
          aria-label="Send message"
          disabled={disabled || !inputMessage.trim()}
          data-disabled={disabled || !inputMessage.trim()}
          style={{ 
            backgroundColor: !disabled && inputMessage.trim() ? activeColor : '#ccc'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>

      {/* ✅ Powered By — link color uses headerColor */}
      <div className={styles.poweredBy}>
        <span>Powered by</span>
        <a 
          href={poweredByUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.poweredByLink}
          style={{ color: activeColor }}   // ✅ headerColor used here
        >
          {poweredByText}
        </a>
      </div>

    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;