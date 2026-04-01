(function () {
    try {
        var currentScript = document.currentScript;
        var appId = '';
        
        if (currentScript && currentScript.hasAttribute('data-app-id')) {
            appId = currentScript.getAttribute('data-app-id');
        } else {
            var scripts = document.querySelectorAll('script[data-app-id]');
            if (scripts.length > 0) {
                appId = scripts[scripts.length - 1].getAttribute('data-app-id');
            }
        }
        
        var iframe = document.createElement('iframe');
        var baseUrl = 'https://www.heyaibot.com/Chat';
        
        var iframeUrl = new URL(baseUrl);
        if (appId) {
            iframeUrl.searchParams.set('appId', appId);
        }
        
        iframeUrl.searchParams.set('sourceUrl', window.location.href);
        iframeUrl.searchParams.set('sourceDomain', window.location.hostname);
        
        function detectDeviceType() {
            var screenWidth = window.innerWidth;
            var userAgent = navigator.userAgent;
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
            var isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
            var isSmallScreen = screenWidth <= 768;
            
            return {
                isMobile: isMobile,
                isTablet: isTablet,
                screenWidth: screenWidth,
                isSmallScreen: isSmallScreen,
                deviceType: isSmallScreen ? (screenWidth <= 480 ? 'mobile' : 'tablet') : 'desktop'
            };
        }
        
        var deviceInfo = detectDeviceType();
        
        iframeUrl.searchParams.set('deviceType', deviceInfo.deviceType);
        iframeUrl.searchParams.set('screenWidth', deviceInfo.screenWidth.toString());
        iframeUrl.searchParams.set('isSmallScreen', deviceInfo.isSmallScreen.toString());
        
        iframe.src = iframeUrl.toString();
        iframe.id = 'chat-widget-iframe';
        
        var brandingColor = 'tomato';
        var brandingHoverColor = 'tomato';

        if (appId) {
            fetch('https://backend-chat1.vercel.app/api/branding/' + appId, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(function(response) {
                if (!response.ok) return null;
                return response.json();
            })
            .then(function(data) {
                if (data && data.success && data.data && data.data.headerColor) {
                    brandingColor = data.data.headerColor;
                    brandingHoverColor = brandingColor;

                    chatIcon.style.backgroundColor = brandingColor;
                    chatIcon.style.setProperty('--chat-icon-color', brandingColor);
                    chatIcon.style.setProperty('--chat-icon-hover', brandingHoverColor);

                    styleTag.textContent = generateStyles(brandingColor, brandingHoverColor);
                }
            })
            .catch(function(error) {
                console.error('❌ Branding fetch error:', error);
            });
        }

        function updateIframeStyles(device) {
            if (device.isSmallScreen) {
                iframe.style.width = '100vw';
                iframe.style.height = '100dvh';
                iframe.style.position = 'fixed';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.borderRadius = '0';
                iframe.style.boxShadow = 'none';
            } else {
                iframe.style.width = '340px';
                iframe.style.height = '470px';
                iframe.style.position = 'fixed';
                iframe.style.bottom = '90px';
                iframe.style.right = '20px';
                iframe.style.top = 'auto';
                iframe.style.left = 'auto';
                iframe.style.borderRadius = '12px';
                iframe.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }
        }
        
        updateIframeStyles(deviceInfo);
        
        iframe.style.zIndex = '999998';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.transform = deviceInfo.isSmallScreen ? 'translateY(100%)' : 'translateY(20px) scale(0.95)';
        iframe.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        iframe.style.pointerEvents = 'none';
        iframe.style.filter = 'none';
        iframe.style.backdropFilter = 'none';
        iframe.style.webkitBackdropFilter = 'none';
        
        if (appId) {
            iframe.setAttribute('data-app-id', appId);
        }
        
        iframe.setAttribute('data-source-url', window.location.href);
        iframe.setAttribute('data-source-domain', window.location.hostname);
        iframe.setAttribute('data-device-type', deviceInfo.deviceType);
        iframe.setAttribute('data-screen-width', deviceInfo.screenWidth.toString());
        
        var chatIcon = document.createElement('div');
        chatIcon.id = 'chat-widget-icon';
        chatIcon.innerHTML = `
            <svg id="chat-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 1; transform: scale(1) rotate(0deg);">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg id="close-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; opacity: 0; transform: rotate(45deg) scale(0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
        chatIcon.style.position = 'fixed';
        chatIcon.style.bottom = '20px';
        chatIcon.style.right = '20px';
        chatIcon.style.width = '60px';
        chatIcon.style.height = '60px';
        chatIcon.style.backgroundColor = brandingColor;
        chatIcon.style.borderRadius = '50%';
        chatIcon.style.display = 'flex';
        chatIcon.style.alignItems = 'center';
        chatIcon.style.justifyContent = 'center';
        chatIcon.style.cursor = 'pointer';
        chatIcon.style.zIndex = '999999';
        chatIcon.style.border = 'none';
        chatIcon.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        chatIcon.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        chatIcon.style.color = 'white';

        function generateStyles(color, hoverColor) {
            return `
                #chat-widget-icon {
                    --chat-icon-color: ${color};
                    --chat-icon-hover: ${hoverColor};
                }
                #chat-widget-icon:hover {
                    transform: scale(1.1);
                    background-color: ${hoverColor} !important;
                }
                #chat-widget-icon:active {
                    transform: scale(1.05);
                }
                #chat-widget-icon.open #chat-icon-svg {
                    opacity: 0 !important;
                    transform: rotate(-180deg) scale(0.5) !important;
                }
                #chat-widget-icon.open #close-icon-svg {
                    opacity: 1 !important;
                    transform: rotate(0deg) scale(1) !important;
                }
                @keyframes iconBounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                #chat-widget-icon {
                    animation: iconBounce 2s ease-in-out 1s 3;
                }
                #chat-widget-icon.hidden {
                    display: none !important;
                }
                body.iframe-open-mobile {
                    overflow: hidden !important;
                    position: fixed !important;
                    width: 100% !important;
                    height: 100% !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                }
            `;
        }
        
        var styleTag = document.createElement('style');
        styleTag.textContent = generateStyles(brandingColor, brandingHoverColor);
        document.head.appendChild(styleTag);
        
        var isIframeOpen = false;
        var previousIsSmallScreen = deviceInfo.isSmallScreen;
        var isKeyboardOpen = false;
        
        function detectKeyboard() {
            if (!deviceInfo.isSmallScreen) return;
            var originalHeight = window.innerHeight;
            window.addEventListener('resize', function() {
                if (!isIframeOpen) return;
                var currentHeight = window.innerHeight;
                var heightDiff = originalHeight - currentHeight;
                if (heightDiff > 100) {
                    isKeyboardOpen = true;
                    document.body.classList.add('keyboard-open');
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ type: 'keyboardState', isOpen: true, keyboardHeight: heightDiff }, baseUrl);
                    }
                } else if (isKeyboardOpen && heightDiff <= 100) {
                    isKeyboardOpen = false;
                    document.body.classList.remove('keyboard-open');
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ type: 'keyboardState', isOpen: false, keyboardHeight: 0 }, baseUrl);
                    }
                }
                originalHeight = currentHeight;
            });
        }
        
        detectKeyboard();
        
        function preventBodyScroll(prevent) {
            if (deviceInfo.isSmallScreen) {
                if (prevent) {
                    document.body.classList.add('iframe-open-mobile');
                } else {
                    document.body.classList.remove('iframe-open-mobile');
                }
            }
        }
        
        function openIframe() {
            isIframeOpen = true;
            preventBodyScroll(true);
            iframe.style.opacity = '1';
            iframe.style.pointerEvents = 'auto';
            iframe.style.zIndex = '999999';
            if (deviceInfo.isSmallScreen) {
                iframe.style.transform = 'translateY(0)';
                chatIcon.classList.add('hidden');
            } else {
                iframe.style.transform = 'translateY(0) scale(1)';
                chatIcon.classList.add('open');
                chatIcon.style.backgroundColor = brandingHoverColor;
            }
        }
        
        function closeIframe() {
            isIframeOpen = false;
            preventBodyScroll(false);
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.style.zIndex = '999998';
            if (deviceInfo.isSmallScreen) {
                iframe.style.transform = 'translateY(100%)';
                chatIcon.classList.remove('hidden');
            } else {
                iframe.style.transform = 'translateY(20px) scale(0.95)';
                chatIcon.classList.remove('open');
                chatIcon.style.backgroundColor = brandingColor;
            }
            chatIcon.style.animation = '';
            document.body.classList.remove('keyboard-open');
            isKeyboardOpen = false;
        }
        
        function toggleIframe() {
            if (isIframeOpen) {
                closeIframe();
            } else {
                openIframe();
            }
        }
        
        chatIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleIframe();
        });
        
        iframe.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        window.addEventListener('message', function(event) {
            if (event.source === iframe.contentWindow) {
                if (event.data === 'close-chat') { closeIframe(); }
                if (event.data === 'open-chat') { openIframe(); }
                if (event.data.type === 'requestDeviceInfo') {
                    iframe.contentWindow.postMessage({
                        type: 'deviceInfo',
                        isMobile: deviceInfo.isMobile,
                        isTablet: deviceInfo.isTablet,
                        isSmallScreen: deviceInfo.isSmallScreen,
                        screenWidth: deviceInfo.screenWidth,
                        deviceType: deviceInfo.deviceType
                    }, baseUrl);
                }
                if (event.data.type === 'lockScroll') { preventBodyScroll(event.data.lock); }
                if (event.data.type === 'getKeyboardState') {
                    iframe.contentWindow.postMessage({ type: 'keyboardState', isOpen: isKeyboardOpen, keyboardHeight: isKeyboardOpen ? 300 : 0 }, baseUrl);
                }
            }
        });
        
        function handleResize() {
            var newDeviceInfo = detectDeviceType();
            
            var deviceChanged = (
                newDeviceInfo.isSmallScreen !== deviceInfo.isSmallScreen ||
                newDeviceInfo.deviceType !== deviceInfo.deviceType
            );

            // ✅ KEY FIX: deviceInfo update karo but iframe.src mat badlo
            deviceInfo = newDeviceInfo;

            if (deviceChanged) {
                // ✅ Sirf CSS/styles update karo — iframe reload NAHI
                updateIframeStyles(deviceInfo);

                // ✅ Iframe ko postMessage se device info bhejo (reload ke bina)
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'screenResize',
                        isMobile: deviceInfo.isMobile,
                        isTablet: deviceInfo.isTablet,
                        isSmallScreen: deviceInfo.isSmallScreen,
                        screenWidth: deviceInfo.screenWidth,
                        deviceType: deviceInfo.deviceType
                    }, '*');
                }

                // ✅ Open state ke hisaab se position fix karo
                if (isIframeOpen) {
                    if (deviceInfo.isSmallScreen) {
                        iframe.style.opacity = '1';
                        iframe.style.transform = 'translateY(0)';
                        iframe.style.pointerEvents = 'auto';
                        iframe.style.zIndex = '999999';
                        chatIcon.classList.add('hidden');
                        chatIcon.classList.remove('open');
                        preventBodyScroll(true);
                    } else {
                        iframe.style.opacity = '1';
                        iframe.style.transform = 'translateY(0) scale(1)';
                        iframe.style.pointerEvents = 'auto';
                        iframe.style.zIndex = '999999';
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.add('open');
                        chatIcon.style.backgroundColor = brandingHoverColor;
                        preventBodyScroll(false);
                    }
                } else {
                    if (deviceInfo.isSmallScreen) {
                        iframe.style.opacity = '0';
                        iframe.style.transform = 'translateY(100%)';
                        iframe.style.pointerEvents = 'none';
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.remove('open');
                        chatIcon.style.backgroundColor = brandingColor;
                    } else {
                        iframe.style.opacity = '0';
                        iframe.style.transform = 'translateY(20px) scale(0.95)';
                        iframe.style.pointerEvents = 'none';
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.remove('open');
                        chatIcon.style.backgroundColor = brandingColor;
                    }
                    preventBodyScroll(false);
                }
            }
        }
        
        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
        
        document.body.appendChild(iframe);
        document.body.appendChild(chatIcon);
        
        iframe.addEventListener('load', function() {
            if (appId) {
                iframe.contentWindow.postMessage({ type: 'appId', appId: appId }, baseUrl);
                iframe.contentWindow.postMessage({ type: 'pageUrl', url: window.location.href, domain: window.location.hostname, pageTitle: document.title, timestamp: new Date().toISOString() }, baseUrl);
                iframe.contentWindow.postMessage({ type: 'deviceInfo', isMobile: deviceInfo.isMobile, isTablet: deviceInfo.isTablet, isSmallScreen: deviceInfo.isSmallScreen, screenWidth: deviceInfo.screenWidth, deviceType: deviceInfo.deviceType }, baseUrl);
                iframe.contentWindow.postMessage({ type: 'safeArea', top: getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0px', bottom: getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0px', left: getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0px', right: getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0px' }, baseUrl);
            }
        });
        
        window.closeChatWidget = function() { if (isIframeOpen) closeIframe(); };
        window.openChatWidget = function() { if (!isIframeOpen) openIframe(); };
        window.getChatWidgetState = function() {
            return { isOpen: isIframeOpen, appId: appId, currentUrl: window.location.href, currentDomain: window.location.hostname, pageTitle: document.title, fullUrl: window.location.href, installationTime: new Date().toISOString(), deviceInfo: deviceInfo };
        };
        window.toggleChatWidget = toggleIframe;
        
    } catch (error) {
        // Silent error handling
    }
})();