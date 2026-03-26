// utils/api/websiteApi.js
import { apiFetcher } from './apiCore';

// Get website from header API
export const getDatabaseUrlFromHeaderAPI = async (apiBaseUrl, backendApiKey) => {
  try {
    const url = `${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`;
    const result = await apiFetcher(url, { method: 'GET' });
    
    if (result.success && result.data && result.data.success && result.data.item && result.data.item.websiteUrl) {
      return {
        websiteUrl: result.data.item.websiteUrl,
        websiteName: result.data.item.websiteName || 'Support',
        status: result.data.item.status || 'active',
        websiteId: result.data.item.websiteId || result.data.item.id
      };
    }
    return null;
  } catch (error) {
    console.error('getDatabaseUrlFromHeaderAPI error:', error);
    return null;
  }
};

// Check website connection status
export const checkWebsiteConnection = async (apiBaseUrl, backendApiKey) => {
  try {
    const url = `${apiBaseUrl}/api/websites/header?apiKey=${encodeURIComponent(backendApiKey)}`;
    const result = await apiFetcher(url, { method: 'GET' });
    
    if (result.success && result.data && result.data.success && result.data.item) {
      return {
        success: true,
        status: result.data.item.status?.toLowerCase() || 'inactive',
        websiteUrl: result.data.item.websiteUrl || '',
        websiteName: result.data.item.websiteName || 'Support',
        websiteId: result.data.item.websiteId || result.data.item.id
      };
    }
    return { success: false, status: 'offline' };
  } catch (error) {
    console.error('checkWebsiteConnection error:', error);
    return { success: false, status: 'offline', error: error.message };
  }
};