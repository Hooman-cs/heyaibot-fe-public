// utils/deviceUtils.js

export const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    const screenWidth   = window.innerWidth;
    const userAgent     = navigator.userAgent;
    const isMobile      = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet      = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
    const isSmallScreen = screenWidth <= 768;

    return {
      isMobile,
      isTablet,
      isSmallScreen,
      screenWidth,
      deviceType: isSmallScreen ? (screenWidth <= 480 ? 'mobile' : 'tablet') : 'desktop',
    };
  }

  return {
    isMobile:     false,
    isTablet:     false,
    isSmallScreen: false,
    screenWidth:  1024,
    deviceType:   'desktop',
  };
};

// ─────────────────────────────────────────────────────────────────
// getResponsiveStyles
//   mode: 'fixed'    → ChatWidget   (floating button widget)
//   mode: 'absolute' → AdminWidget  (embedded, no toggle button)
// ─────────────────────────────────────────────────────────────────
export const getResponsiveStyles = (
  isInitialized,
  isFullScreen,
  widgetPosition = {},   // { bottom, right } — only used in 'fixed' mode
  chatWindowSize = { width: '340px', height: '470px' },
  mode = 'absolute'      // 'fixed' | 'absolute'
) => {
  const positioning = mode === 'fixed'
    ? {
        position: 'fixed',
        bottom:   widgetPosition.bottom || '20px',
        right:    widgetPosition.right  || '20px',
        zIndex:   '999999',
      }
    : {
        position: 'absolute',
        zIndex:   '999999',
      };

  if (!isInitialized) {
    return {
      container: positioning,
      window: {
        width:        chatWindowSize.width,
        height:       chatWindowSize.height,
        borderRadius: '12px',
        boxShadow:    '0 10px 30px rgba(0,0,0,0.15)',
      },
    };
  }

  if (isFullScreen) {
    return {
      container: {
        position:        'absolute',
        top:             '0',
        left:            '0',
        right:           '0',
        bottom:          '0',
        width:           '100vw',
        height:          '100vh',
        zIndex:          '999999',
        backgroundColor: 'white',
      },
      window: {
        width:        '100%',
        height:       '100%',
        borderRadius: '0',
        boxShadow:    'none',
      },
    };
  }

  return {
    container: positioning,
    window: {
      width:        chatWindowSize.width,
      height:       chatWindowSize.height,
      borderRadius: '12px',
      boxShadow:    '0 10px 30px rgba(0,0,0,0.15)',
    },
  };
};