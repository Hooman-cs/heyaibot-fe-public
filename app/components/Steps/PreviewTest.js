// PreviewTest.jsx
import React, { useState, useEffect } from 'react';
import styles from './Step.module.css';
import Chatwidget from './chatwidget';
import config  from '../utils/config';

const API_URL = config.apiBaseUrl;

const PreviewTest = ({ 
  config, 
  backendApiKey
}) => {
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showWidget, setShowWidget] = useState(true);

  // ✅ Branding states
  const [headerColor, setHeaderColor] = useState(null);
  const [poweredByText, setPoweredByText] = useState('JDPC Global');
  const [poweredByUrl, setPoweredByUrl] = useState('https://jdpcglobal.com');

  // ✅ Fetch branding from API
  useEffect(() => {
    const fetchBranding = async () => {
      if (!backendApiKey) return;
      try {
        const response = await fetch(`${API_URL}/api/branding/${backendApiKey}`);
        const data = await response.json();
        if (data.success && data.data) {
          if (data.data.headerColor) setHeaderColor(data.data.headerColor);
          if (data.data.poweredByText) setPoweredByText(data.data.poweredByText);
          if (data.data.poweredByUrl) setPoweredByUrl(data.data.poweredByUrl);
        }
      } catch (error) {
        console.error('❌ Branding fetch error (PreviewTest):', error);
      }
    };
    fetchBranding();
  }, [backendApiKey]);

  const defaultConfig = {
    primaryColor: '#4a6baf',
    secondaryColor: '#ff6347',
    widgetPosition: { right: '0px', bottom: '0px', left: '0px', top: '0px' },
    chatWindowSize: { width: '340px', height: '470px' },
    websiteName: 'Support12'
  };

  const widgetConfig = {
    ...defaultConfig,
    ...config,
    widgetPosition: {
      ...defaultConfig.widgetPosition,
      ...(config?.widgetPosition || {})
    },
    chatWindowSize: {
      ...defaultConfig.chatWindowSize,
      ...(config?.chatWindowSize || {})
    }
  };

  useEffect(() => {
    setPreviewKey(Date.now());
    setShowWidget(true);
  }, [config]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === 'requestDeviceInfo') {
        const deviceInfo = {
          type: 'deviceInfo',
          isMobile: previewMode === 'mobile',
          isTablet: previewMode === 'tablet',
          isSmallScreen: previewMode !== 'desktop',
          screenWidth: previewMode === 'mobile' ? 375 : previewMode === 'tablet' ? 768 : 1024,
          deviceType: previewMode
        };
        setTimeout(() => {
          window.dispatchEvent(new MessageEvent('message', {
            data: deviceInfo,
            origin: window.location.origin
          }));
        }, 100);
      }
      if (event.data === 'close-chat') {
        setShowWidget(false);
        setTimeout(() => setShowWidget(true), 2000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewMode]);

  useEffect(() => {
    setTimeout(() => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'parentUrl', url: window.location.href },
        origin: window.location.origin
      }));
    }, 200);
  }, []);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewBackground}>
        {showWidget && (
          <Chatwidget
            key={previewKey}
            primaryColor={widgetConfig.primaryColor}
            secondaryColor={widgetConfig.secondaryColor}
            widgetPosition={widgetConfig.widgetPosition}
            chatWindowSize={widgetConfig.chatWindowSize}
            backendApiKey={backendApiKey}
            apiBaseUrl={widgetConfig.apiBaseUrl}
            // ✅ Pass branding props
            headerColor={headerColor || widgetConfig.secondaryColor}
            poweredByText={poweredByText}
            poweredByUrl={poweredByUrl}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewTest;