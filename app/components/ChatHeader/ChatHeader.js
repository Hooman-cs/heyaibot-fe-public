'use client';
import { useState, useEffect } from 'react';
import styles from './ChatHeader.module.css';

const ChatHeader = ({
  primaryColor    = '#ff6347',
  headerColor,
  connectionStatus = 'connected',
  onClose,
  apiBaseUrl      = '',
  backendApiKey   = '',
  websiteTitle    = 'Support',
  isWebsiteActive = true,
  websiteStatus   = 'active',
  showCloseButton = false
}) => {
  const [status,    setStatus]    = useState({ text: 'Connecting...', color: 'rgba(255,255,255,0.6)' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWebsiteByApiKey = async () => {
      if (!backendApiKey || !apiBaseUrl) {
        setStatus({ text: 'Configuration Error', color: '#ffb3b3' });
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success && data.item) {
          setStatus(
            data.item.status === 'active'
              ? { text: 'Online',  color: '#4ade80' }
              : { text: 'Offline', color: '#fca5a5' }
          );
        } else {
          setStatus({ text: 'Not Found', color: '#fca5a5' });
        }
      } catch {
        setStatus({ text: 'Offline', color: '#fca5a5' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchWebsiteByApiKey();
  }, [apiBaseUrl, backendApiKey]);

  return (
    <div
      className={styles.chatHeader}
      style={{ backgroundColor: headerColor || primaryColor }}
    >
      <div className={styles.headerContent}>
        <div className={styles.headerInfo}>

          {/* Avatar */}
          <div className={styles.avatarContainer}>
            <div className={styles.medicalAvatar}>👨</div>
            <div
              className={styles.statusIndicator}
              style={{
                backgroundColor: status.color,
                // ✅ Glow sirf online pe
               
              }}
              title={status.text}
            />
          </div>

          {/* Title + status */}
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              {isLoading ? 'Loading...' : websiteTitle}
            </h2>
            <div
              className={styles.statusText}
              style={{ color: status.color }}
            >
              {isLoading ? 'Connecting...' : status.text}
            </div>
          </div>
        </div>

        {showCloseButton && (
          <div className={styles.headerActions}>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;