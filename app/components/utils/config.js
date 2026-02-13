
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
 
  backendApiKey: appId,
  apiBaseUrl: 'https://backend-chat1.vercel.app', 

  appId: appId, 
  
};

export default config;