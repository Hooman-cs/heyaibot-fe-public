// utils/api/apiCore.js

// Base API fetcher with error handling
export const apiFetcher = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      console.error(`API Error ${response.status}:`, await response.text().catch(() => 'No response body'));
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API Fetcher Error:', error);
    return { success: false, error: error.message };
  }
};

// Form data API fetcher
export const formDataApiFetcher = async (url, formData, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      ...options,
      headers: {
        // Don't set Content-Type for FormData
        ...options.headers
      }
    });

    if (!response.ok) {
      console.error(`FormData API Error ${response.status}:`, await response.text().catch(() => 'No response body'));
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Form Data API Error:', error);
    return { success: false, error: error.message };
  }
};