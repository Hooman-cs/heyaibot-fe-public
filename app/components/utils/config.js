
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
 backendApiKey:appId,
  // backendApiKey:'b4a1bf17-4a8b-46ff-b02b-2e8b51cbd8f0',
  // apiBaseUrl: 'https://heyaibot.azurewebsites.net', 
   apiBaseUrl: 'https://backend-chat1.vercel.app', 

  appId: appId, 
  
};

export default config;