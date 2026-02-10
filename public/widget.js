(function () {
    try {
        // Get the current script element (this script)
        var currentScript = document.currentScript;
        var appId = '';
        
        // If we found the current script and it has data-app-id attribute
        if (currentScript && currentScript.hasAttribute('data-app-id')) {
            appId = currentScript.getAttribute('data-app-id');
        } else {
            // Fallback: search for any script with data-app-id
            var scripts = document.querySelectorAll('script[data-app-id]');
            if (scripts.length > 0) {
                appId = scripts[scripts.length - 1].getAttribute('data-app-id');
            }
        }
        
        var iframe = document.createElement('iframe');
        // var baseUrl = 'http://localhost:3000/Chat';
        var baseUrl = 'https://www.heyaibot.com/Chat';
        
        // Build URL with appId parameter if available
        var iframeUrl = new URL(baseUrl);
        if (appId) {
            iframeUrl.searchParams.set('appId', appId);
        }
        
        // Current page URL को भी iframe URL में add करें
        iframeUrl.searchParams.set('sourceUrl', window.location.href);
        iframeUrl.searchParams.set('sourceDomain', window.location.hostname);
        
        // Function to detect device type
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
        
        // Initial device detection
        var deviceInfo = detectDeviceType();
        
        // Send device info to iframe via URL
        iframeUrl.searchParams.set('deviceType', deviceInfo.deviceType);
        iframeUrl.searchParams.set('screenWidth', deviceInfo.screenWidth.toString());
        iframeUrl.searchParams.set('isSmallScreen', deviceInfo.isSmallScreen.toString());
        
        iframe.src = iframeUrl.toString();
        iframe.id = 'chat-widget-iframe';
        
        // Function to update iframe styles based on device
        function updateIframeStyles(device) {
            if (device.isSmallScreen) {
                // Mobile/Tablet: Full screen
                iframe.style.width = '100vw';
                iframe.style.height = '100vh';
                iframe.style.position = 'fixed';
                iframe.style.top = '0';
                iframe.style.left = '0';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.borderRadius = '0';
                iframe.style.boxShadow = 'none';
            } else {
                // Desktop: Floating widget
                iframe.style.width = '340px';
                iframe.style.height = '470px';
                iframe.style.position = 'fixed';
                iframe.style.bottom = '90px';
                iframe.style.right = '20px';
                iframe.style.borderRadius = '12px';
                iframe.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
            }
        }
        
        // Set initial iframe styles
        updateIframeStyles(deviceInfo);
        
        iframe.style.zIndex = '999998';
        iframe.style.border = 'none';
        iframe.style.opacity = '0';
        iframe.style.transform = deviceInfo.isSmallScreen ? 'translateY(100%)' : 'translateY(20px) scale(0.95)';
        iframe.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        iframe.style.pointerEvents = 'none';
        
        // Remove blur effects
        iframe.style.filter = 'none';
        iframe.style.backdropFilter = 'none';
        iframe.style.webkitBackdropFilter = 'none';
        
        // Store appId in iframe data attribute
        if (appId) {
            iframe.setAttribute('data-app-id', appId);
        }
        
        // Store device info in iframe data attributes
        iframe.setAttribute('data-source-url', window.location.href);
        iframe.setAttribute('data-source-domain', window.location.hostname);
        iframe.setAttribute('data-device-type', deviceInfo.deviceType);
        iframe.setAttribute('data-screen-width', deviceInfo.screenWidth.toString());
        
        // Create chat icon button
        var chatIcon = document.createElement('div');
        chatIcon.id = 'chat-widget-icon';
        chatIcon.innerHTML = `
            <!-- Chat icon (message bubble) -->
            <svg id="chat-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 1; transform: scale(1) rotate(0deg);">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            
            <!-- Close icon (hidden by default) -->
            <svg id="close-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; opacity: 0; transform: rotate(45deg) scale(0.5); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
        // Style the chat icon container
        chatIcon.style.position = 'fixed';
        chatIcon.style.bottom = '20px';
        chatIcon.style.right = '20px';
        chatIcon.style.width = '60px';
        chatIcon.style.height = '60px';
        chatIcon.style.backgroundColor = 'tomato';
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
        
        // Add CSS for animations and responsive styles
        var style = document.createElement('style');
        style.textContent = `
            #chat-widget-icon {
                --chat-icon-color: tomato;
                --chat-icon-hover: #ff4500;
            }
            
            #chat-widget-icon:hover {
                transform: scale(1.1);
                background-color: var(--chat-icon-hover);
            }
            
            #chat-widget-icon:active {
                transform: scale(1.05);
            }
            
            /* Chat icon animation when iframe is open */
            #chat-widget-icon.open #chat-icon-svg {
                opacity: 0 !important;
                transform: rotate(-180deg) scale(0.5) !important;
            }
            
            /* Close icon animation when iframe is open */
            #chat-widget-icon.open #close-icon-svg {
                opacity: 1 !important;
                transform: rotate(0deg) scale(1) !important;
            }
            
            /* Icon bounce animation */
            @keyframes iconBounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.15); }
            }
            
            /* Initial animation when widget loads */
            #chat-widget-icon {
                animation: iconBounce 2s ease-in-out 1s 3;
            }
            
            /* Hide chat icon on mobile/tablet when iframe is open */
            #chat-widget-icon.hidden {
                display: none !important;
            }
            
            /* Make iframe always on top when open */
            #chat-widget-iframe[style*="opacity: 1"] {
                z-index: 999999 !important;
            }
            
            /* Responsive iframe styles */
            @media (max-width: 768px) {
                #chat-widget-iframe {
                    width: 100vw !important;
                    height: 100vh !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    border-radius: 0 !important;
                    transform: translateY(100%) !important;
                }
                
                #chat-widget-iframe[style*="opacity: 1"] {
                    transform: translateY(0) !important;
                }
            }
            
            @media (min-width: 769px) {
                #chat-widget-iframe {
                    width: 340px !important;
                    height: 470px !important;
                    bottom: 90px !important;
                    right: 20px !important;
                    left: auto !important;
                    top: auto !important;
                    border-radius: 12px !important;
                    transform: translateY(20px) scale(0.95) !important;
                }
                
                #chat-widget-iframe[style*="opacity: 1"] {
                    transform: translateY(0) scale(1) !important;
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // State variable to track if iframe is open
        var isIframeOpen = false;
        var previousIsSmallScreen = deviceInfo.isSmallScreen;
        
        // Function to open iframe
        function openIframe() {
            isIframeOpen = true;
            
            // Show iframe with animation
            iframe.style.opacity = '1';
            iframe.style.pointerEvents = 'auto';
            
            if (deviceInfo.isSmallScreen) {
                // Mobile/Tablet: Slide up from bottom
                iframe.style.transform = 'translateY(0)';
                // Hide chat icon on mobile/tablet when iframe is open
                chatIcon.classList.add('hidden');
            } else {
                // Desktop: Scale in
                iframe.style.transform = 'translateY(0) scale(1)';
                // Change icon to close
                chatIcon.classList.add('open');
                chatIcon.style.backgroundColor = '#ff4500';
            }
            
            // Add bounce animation to icon
            chatIcon.style.animation = 'iconBounce 0.5s ease';
            
            // Ensure iframe is on top
            iframe.style.zIndex = '999999';
        }
        
        // Function to close iframe
        function closeIframe() {
            isIframeOpen = false;
            
            // Hide iframe with animation
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            
            if (deviceInfo.isSmallScreen) {
                // Mobile/Tablet: Slide down
                iframe.style.transform = 'translateY(100%)';
                // Show chat icon again
                chatIcon.classList.remove('hidden');
            } else {
                // Desktop: Scale out
                iframe.style.transform = 'translateY(20px) scale(0.95)';
                // Change back to chat icon
                chatIcon.classList.remove('open');
                chatIcon.style.backgroundColor = 'tomato';
            }
            
            chatIcon.style.animation = '';
            
            // Reset z-index when closed
            iframe.style.zIndex = '999998';
        }
        
        // Toggle iframe visibility
        function toggleIframe() {
            if (isIframeOpen) {
                closeIframe();
            } else {
                openIframe();
            }
        }
        
        // Add click event to chat icon
        chatIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleIframe();
        });
        
        // Prevent iframe clicks from bubbling (but keep iframe functional)
        iframe.addEventListener('click', function(e) {
            e.stopPropagation();
            // Do NOT close the iframe when clicking inside it
        });
        
        // Listen for messages from iframe to control icon state
        window.addEventListener('message', function(event) {
            // Check if message is from our iframe
            if (event.source === iframe.contentWindow) {
                // Listen for close-chat message (from header cross icon)
                if (event.data === 'close-chat') {
                    closeIframe();
                }
                
                // Listen for open-chat message
                if (event.data === 'open-chat') {
                    openIframe();
                }
                
                // Listen for device info requests
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
            }
        });
        
        // Handle window resize - dynamically update layout
        function handleResize() {
            var newDeviceInfo = detectDeviceType();
            
            // Always update device info on resize
            var deviceChanged = (
                newDeviceInfo.isSmallScreen !== previousIsSmallScreen ||
                newDeviceInfo.screenWidth !== deviceInfo.screenWidth ||
                newDeviceInfo.deviceType !== deviceInfo.deviceType
            );
            
            if (deviceChanged) {
                previousIsSmallScreen = newDeviceInfo.isSmallScreen;
                deviceInfo = newDeviceInfo;
                
                // Update iframe URL params
                var newIframeUrl = new URL(iframe.src);
                newIframeUrl.searchParams.set('screenWidth', deviceInfo.screenWidth.toString());
                newIframeUrl.searchParams.set('isSmallScreen', deviceInfo.isSmallScreen.toString());
                newIframeUrl.searchParams.set('deviceType', deviceInfo.deviceType);
                iframe.src = newIframeUrl.toString();
                
                // Update iframe data attributes
                iframe.setAttribute('data-screen-width', deviceInfo.screenWidth.toString());
                iframe.setAttribute('data-is-small-screen', deviceInfo.isSmallScreen.toString());
                iframe.setAttribute('data-device-type', deviceInfo.deviceType);
                
                // Update iframe styles based on new device info
                updateIframeStyles(deviceInfo);
                
                // Send updated device info to iframe
                if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({
                        type: 'screenResize',
                        isMobile: deviceInfo.isMobile,
                        isTablet: deviceInfo.isTablet,
                        isSmallScreen: deviceInfo.isSmallScreen,
                        screenWidth: deviceInfo.screenWidth,
                        deviceType: deviceInfo.deviceType
                    }, baseUrl);
                }
                
                // Handle iframe open/close state and icon appearance
                if (isIframeOpen) {
                    // Iframe is open, update its position
                    if (deviceInfo.isSmallScreen) {
                        // Switching to mobile/tablet view
                        iframe.style.transform = 'translateY(0)';
                        // Hide chat icon
                        chatIcon.classList.add('hidden');
                        // Remove desktop open class
                        chatIcon.classList.remove('open');
                    } else {
                        // Switching to desktop view
                        iframe.style.transform = 'translateY(0) scale(1)';
                        // Show chat icon as close icon
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.add('open');
                        chatIcon.style.backgroundColor = '#ff4500';
                    }
                } else {
                    // Iframe is closed, update transform based on device
                    if (deviceInfo.isSmallScreen) {
                        iframe.style.transform = 'translateY(100%)';
                        // Show chat icon
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.remove('open');
                        chatIcon.style.backgroundColor = 'tomato';
                    } else {
                        iframe.style.transform = 'translateY(20px) scale(0.95)';
                        // Show chat icon
                        chatIcon.classList.remove('hidden');
                        chatIcon.classList.remove('open');
                        chatIcon.style.backgroundColor = 'tomato';
                    }
                }
            }
        }
        
        // Add resize listener with debouncing
        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 250);
        });
        
        // Append elements to body
        document.body.appendChild(iframe);
        document.body.appendChild(chatIcon);
        
        // Send message to iframe about appId when it loads
        iframe.addEventListener('load', function() {
            if (appId) {
                iframe.contentWindow.postMessage({
                    type: 'appId',
                    appId: appId
                }, baseUrl);
                
                // Send current URL
                iframe.contentWindow.postMessage({
                    type: 'pageUrl',
                    url: window.location.href,
                    domain: window.location.hostname,
                    pageTitle: document.title,
                    timestamp: new Date().toISOString()
                }, baseUrl);
                
                // Send device info
                iframe.contentWindow.postMessage({
                    type: 'deviceInfo',
                    isMobile: deviceInfo.isMobile,
                    isTablet: deviceInfo.isTablet,
                    isSmallScreen: deviceInfo.isSmallScreen,
                    screenWidth: deviceInfo.screenWidth,
                    deviceType: deviceInfo.deviceType
                }, baseUrl);
            }
        });
        
        // Function to close iframe programmatically
        window.closeChatWidget = function() {
            if (isIframeOpen) {
                closeIframe();
            }
        };
        
        // Function to open iframe programmatically
        window.openChatWidget = function() {
            if (!isIframeOpen) {
                openIframe();
            }
        };
        
        // Function to get current iframe state
        window.getChatWidgetState = function() {
            return {
                isOpen: isIframeOpen,
                appId: appId,
                currentUrl: window.location.href,
                currentDomain: window.location.hostname,
                pageTitle: document.title,
                fullUrl: window.location.href,
                installationTime: new Date().toISOString(),
                deviceInfo: deviceInfo
            };
        };
        
        // Make functions available globally
        window.toggleChatWidget = toggleIframe;
        
    } catch (error) {
        // Silent error handling
    }
})();