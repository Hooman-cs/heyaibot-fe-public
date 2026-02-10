// utils/config.js

// Get appId from URL parameters
const getAppIdFromURL = () => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('appId') || '';
  }
  return '';
};

const appId = getAppIdFromURL();

const config = {
  aiApiKey: 'AIzaSyBaxe7LSjNARa9F8ydMCSuZl2g7eCWkEHY',
  baseUrl:'https://www.heyaibot.com',
  // backendApiKey: 'e26adef3-ac6d-442e-9801-425f4a86e2a9',
  backendApiKey: appId, // Use appId as backend API key
  apiBaseUrl: 'https://backend-chat1.vercel.app', // Backend URL
  // apiBaseUrl: 'http://localhost:5000', // Backend URL
  appId: appId, // Get appId from URL parameters
  
};

export default config;