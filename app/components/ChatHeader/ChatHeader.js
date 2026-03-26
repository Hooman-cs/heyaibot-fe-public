'use client';
import { useState, useEffect } from 'react';
import styles from './ChatHeader.module.css';

const ChatHeader = ({ 

  primaryColor = '#ff6347',
  headerColor, 
  connectionStatus = 'connected', 
  onClose,
  apiBaseUrl = '', 
  backendApiKey = '',
  websiteTitle = 'Support',
  isWebsiteActive = true,
  websiteStatus = 'active',
  showCloseButton = false
}) => {
  const [status, setStatus] = useState({ text: 'Connecting...', color: '#FF9800' });
  const [isLoading, setIsLoading] = useState(true);

  // Log to verify headerColor is received


  useEffect(() => {
    const fetchWebsiteByApiKey = async () => {
      if (!backendApiKey || !apiBaseUrl) {
        setStatus({ text: 'Configuration Error', color: '#F44336' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.item) {
          const websiteData = data.item;
          
          if (websiteData.status === 'active') {
            setStatus({ text: 'Online', color: '#4CAF50' });
          } else {
            setStatus({ text: 'Offline', color: '#F44336' });
          }
        } else {
          setStatus({ text: 'Not Found', color: '#F44336' });
        }
      } catch (error) {
        setStatus({ text: 'Connection Error', color: '#F44336' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebsiteByApiKey();
  }, [apiBaseUrl, backendApiKey]);

  return (
    <div 
      className={styles.chatHeader} 
      style={{ 
        // ✅ Use headerColor from database if available, otherwise fallback to secondaryColor
        backgroundColor: headerColor || primaryColor,
        borderBottom: `1px solid ${primaryColor}20`
      }}
    >
      <div className={styles.headerContent}>
        <div className={styles.headerInfo}>
          <div className={styles.avatarContainer}>
            <div className={styles.medicalAvatar}>👨</div>
            <div 
              className={styles.statusIndicator} 
              style={{ backgroundColor: status.color }}
              title={status.text}
            />
          </div>
          
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              {isLoading ? 'Loading...' : websiteTitle}
            </h2>
            <div className={styles.statusText} style={{ color: status.color }}>
              {status.text}
            </div>
          </div>
        </div>

        {showCloseButton && (
          <div className={styles.headerActions}>
            <button 
              className={styles.closeButton}
              onClick={onClose}
              style={{ 
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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