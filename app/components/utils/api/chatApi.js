// utils/api/chatApi.js
import { apiFetcher } from './apiCore';

// Fetch website configuration
export const fetchWebsiteConfig = async (apiBaseUrl, backendApiKey, websiteId) => {
  try {
    const url = `${apiBaseUrl}/api/websites/client-config?apiKey=${encodeURIComponent(backendApiKey)}&websiteId=${websiteId}`;
    const result = await apiFetcher(url, { method: 'GET' });

    if (result.success && result.data && result.data.success && result.data.item) {
      return result.data.item;
    }
    return null;
  } catch (error) {
    console.error('fetchWebsiteConfig error:', error);
    return null;
  }
};

// Fetch welcome messages
export const fetchWelcomeMessages = async (apiBaseUrl, backendApiKey, websiteId) => {
  if (!websiteId || !apiBaseUrl || !backendApiKey) return [];

  try {
    const url = `${apiBaseUrl}/api/websites/chat-config?apiKey=${backendApiKey}&websiteId=${websiteId}`;
    const result = await apiFetcher(url, { method: 'GET' });

    if (result.success && result.data && result.data.success && result.data.item?.systemPrompt) {
      return result.data.item.systemPrompt
        .map(p => p.content)
        .filter(msg => msg && msg.trim());
    }
    return [];
  } catch (error) {
    console.error('fetchWelcomeMessages error:', error);
    return [];
  }
};

// Fetch child prompts
export const fetchChildPrompts = async (apiBaseUrl, backendApiKey, websiteId, promptName) => {
  try {
    const url = `${apiBaseUrl}/api/childprompt/${websiteId}/${encodeURIComponent(promptName)}/filtered`;
    const result = await apiFetcher(url, { 
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${backendApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (result.success && result.data) {
      return result.data;
    }
    return { prompts: [], promptsWithParams: [], summaryList: [] };
  } catch (error) {
    console.error('fetchChildPrompts error:', error);
    return { prompts: [], promptsWithParams: [], summaryList: [] };
  }
};

// Generate AI response
export const generateAIResponse = async (apiBaseUrl, backendApiKey, question) => {
  try {
    const url = `${apiBaseUrl}/api/generate-ai-response`;
    const result = await apiFetcher(url, {
      method: 'POST',
      body: JSON.stringify({
        question: question,
        apiKey: backendApiKey
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (result.success && result.data && result.data.success) {
      return { 
        response: result.data.response || '',
        hasDirectMatch: result.data.hasDirectMatch || false
      };
    } else {
      return { 
        response: result.data?.message || "I'm having trouble processing that. Could you please rephrase your question?"
      };
    }
  } catch (error) {
    console.error('generateAIResponse error:', error);
    const fallbackResponses = [
      "Hmm, I'm having trouble connecting to my knowledge base right now. Could you try again in a moment?",
      "Connection issue detected. Please try your question again, or check back in a few minutes!",
      "Technical hiccup! I couldn't process your request. Please try again or rephrase your question.",
      "Temporary glitch! Let's try that again. Could you rephrase your question?"
    ];
    
    return { 
      response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    };
  }
};