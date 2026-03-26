// utils/communicationUtils.js
export const setupParentCommunication = (callbacks) => {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('message', (event) => {
    const allowedOrigins = [
      'https://jdpcglobal.com',
      'https://www.jdpcglobal.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    
    const isAllowedOrigin = allowedOrigins.includes(event.origin) || 
                           event.origin.includes('localhost') ||
                           event.origin.includes('127.0.0.1');
    
    if (!isAllowedOrigin) return;
    
    if (event.data.type === 'parentUrl' || event.data.type === 'pageUrl') {
      callbacks.setParentWebsiteUrl(event.data.url);
      localStorage.setItem('parentWebsiteUrl', event.data.url);
    }
    
    if (event.data.type === 'deviceInfo') {
      callbacks.setDeviceInfo({
        isMobile: event.data.isMobile,
        isTablet: event.data.isTablet,
        isSmallScreen: event.data.isSmallScreen,
        screenWidth: event.data.screenWidth,
        deviceType: event.data.deviceType
      });
      callbacks.setIsFullScreen(event.data.isSmallScreen);
      callbacks.setIsInitialized(true);
    }
    
    if (event.data.type === 'screenResize') {
      callbacks.setDeviceInfo(prev => ({
        ...prev,
        isMobile: event.data.isMobile,
        isTablet: event.data.isTablet,
        screenWidth: event.data.screenWidth,
        isSmallScreen: event.data.isSmallScreen,
        deviceType: event.data.deviceType
      }));
      callbacks.setIsFullScreen(event.data.isSmallScreen);
    }
  });
  
  try {
    window.parent.postMessage(
      { 
        type: 'requestDeviceInfo',
        source: 'chat-widget'
      },
      '*'
    );
  } catch (error) {
    callbacks.checkScreenSize();
  }
};

// Send close message to parent
export const sendCloseMessageToParent = () => {
  if (typeof window !== 'undefined') {
    window.parent.postMessage('close-chat', '*');
  }
};