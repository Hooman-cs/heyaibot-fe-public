// utils/deviceUtils.js
export const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    const screenWidth = window.innerWidth;
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
    const isSmallScreen = screenWidth <= 768;
    
    return {
      isMobile: isMobile,
      isTablet: isTablet,
      isSmallScreen: isSmallScreen,
      screenWidth: screenWidth,
      deviceType: isSmallScreen ? (screenWidth <= 480 ? 'mobile' : 'tablet') : 'desktop'
    };
  }
  
  return {
    isMobile: false,
    isTablet: false,
    isSmallScreen: false,
    screenWidth: 1024,
    deviceType: 'desktop'
  };
};

export const getResponsiveStyles = (isInitialized, isFullScreen, widgetPosition, chatWindowSize) => {
  if (!isInitialized) {
    return {
      container: {
        position: 'fixed',
        bottom: widgetPosition.bottom,
        right: widgetPosition.right,
        zIndex: '999999'
      },
      window: {
        width: chatWindowSize.width,
        height: chatWindowSize.height,
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }
    };
  }
  
  if (isFullScreen) {
    return {
      container: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '999999',
        backgroundColor: 'white'
      },
      window: {
        width: '100%',
        height: '100%',
        borderRadius: '0',
        boxShadow: 'none'
      }
    };
  } else {
    return {
      container: {
        position: 'fixed',
        bottom: widgetPosition.bottom,
        right: widgetPosition.right,
        zIndex: '999999'
      },
      window: {
        width: chatWindowSize.width,
        height: chatWindowSize.height,
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }
    };
  }
};