import { apiFetcher, formDataApiFetcher } from './apiCore';

export const executeUrls = async (apiBaseUrl, formData) => {
  try {
    const url    = `${apiBaseUrl}/api/execute-urls`;
    const result = await formDataApiFetcher(url, formData, {
      headers: {}
    });
    if (result.success) {
      return { success: true, results: result.data?.results || [] };
    }
    return { success: false, results: [] };
  } catch (error) {
    console.error('executeUrls error:', error);
    return { success: false, results: [] };
  }
};

export const saveChatRequest = async (apiBaseUrl, backendApiKey, data) => {
  try {
    const url = `${apiBaseUrl}/api/chat-requests`;
    const cleanData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) cleanData[key] = value;
    });
    const result = await apiFetcher(url, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${backendApiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(cleanData)
    });
    if (result.success && result.data && result.data.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.data?.message || 'Failed to save request' };
  } catch (error) {
    console.error('saveChatRequest error:', error);
    return { success: false, error: error.message };
  }
};

export const saveEmailRequest = async (apiBaseUrl, backendApiKey, data) => {
  try {
    const url = `${apiBaseUrl}/api/chat-requests`;
    const cleanData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) cleanData[key] = value;
    });
    const result = await apiFetcher(url, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${backendApiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(cleanData)
    });
    return {
      success: result.success && result.data?.success === true,
      data:    result.data
    };
  } catch (error) {
    console.error('saveEmailRequest error:', error);
    return { success: false, error: error.message };
  }
};

// ✅ FIXED: "Item size exceeded" — text truncate karo, bulk ko chunks mein bhejo
const MAX_TEXT_LENGTH = 800; // DynamoDB safe limit per message

const truncateText = (text, maxLen = MAX_TEXT_LENGTH) => {
  if (!text || text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
};

export const saveConversationToDatabase = async (apiBaseUrl, backendApiKey, conversationData) => {
  try {
    if (!conversationData.conversations || conversationData.conversations.length === 0) {
      return { success: true, message: 'No conversations to save' };
    }
    if (!conversationData.sessionId) {
      return { success: false, error: 'sessionId is required' };
    }

    const forceNewThread = conversationData.forceNewThread === true;

    // ✅ Text truncate karo aur temp messages filter karo
    const formattedConversations = conversationData.conversations.map(conv => ({
      userMessage: conv.userMessage ? {
        text:   truncateText(conv.userMessage.text),
        tokens: conv.userMessage.tokens || Math.ceil((conv.userMessage.text || '').length / 4)
      } : null,
      botReplies: (conv.botReplies || [])
        .filter(reply => reply.text && reply.text !== 'Saving your request...')
        .map(reply => ({
          text:   truncateText(reply.text),
          tokens: reply.tokens || Math.ceil((reply.text || '').length / 4)
        }))
    })).filter(conv => conv.userMessage !== null);

    if (formattedConversations.length === 0) {
      return { success: true, message: 'No valid conversations to save' };
    }

    // ✅ Chunks mein bhejo — max 3 conversations per request
    const CHUNK_SIZE = 3;
    let lastResult   = null;
    let isFirst      = true;

    for (let i = 0; i < formattedConversations.length; i += CHUNK_SIZE) {
      const chunk = formattedConversations.slice(i, i + CHUNK_SIZE);

      const requestBody = {
        conversations:  chunk,
        forceNewThread: isFirst ? forceNewThread : false
      };

      const response = await fetch(
        `${apiBaseUrl}/api/session/${backendApiKey}/${conversationData.sessionId}/bulk`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(requestBody)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error in bulk save:', data);
        // Chunk fail hua, continue karo baaki ke liye
      } else {
        lastResult = data;
      }

      isFirst = false;

      // Chunks ke beech thoda wait
      if (i + CHUNK_SIZE < formattedConversations.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return { success: true, data: lastResult };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { success: false, error: error.message };
  }
};

export const saveSingleMessage = async (apiBaseUrl, backendApiKey, messageData) => {
  try {
    if (!messageData.sessionId) return { success: false, error: 'sessionId is required' };
    if (!messageData.role)      return { success: false, error: 'role is required' };
    if (!messageData.text)      return { success: false, error: 'text is required' };
    if (messageData.text === 'Saving your request...') {
      return { success: true, skipped: true };
    }

    // ✅ Text truncate karo
    const safeText = truncateText(messageData.text);

    const endpoint = messageData.role === 'user'
      ? `${apiBaseUrl}/api/session/${backendApiKey}/${messageData.sessionId}/user-message`
      : `${apiBaseUrl}/api/session/${backendApiKey}/${messageData.sessionId}/bot-reply`;

    const shouldForceNewThread = messageData.role === 'user'
      ? (messageData.forceNewThread === true)
      : false;

    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text:           safeText,
        tokens:         messageData.tokens || Math.ceil(safeText.length / 4),
        forceNewThread: shouldForceNewThread
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error saving single message:', data);
      return { success: false, error: data.message || 'Failed to save message' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }
};

export const saveBulkMessages = async (apiBaseUrl, backendApiKey, sessionId, messages) => {
  try {
    if (!sessionId)                                  return { success: false, error: 'sessionId is required' };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: 'messages array is required' };
    }

    const conversations     = [];
    let   currentConversation = null;

    messages.forEach(msg => {
      if (msg.role === 'user') {
        currentConversation = {
          userMessage: {
            text:   truncateText(msg.text),
            tokens: msg.tokens || Math.ceil((msg.text || '').length / 4)
          },
          botReplies: []
        };
        conversations.push(currentConversation);
      } else if (msg.role === 'bot' && currentConversation) {
        if (msg.text && msg.text !== 'Saving your request...') {
          currentConversation.botReplies.push({
            text:   truncateText(msg.text),
            tokens: msg.tokens || Math.ceil((msg.text || '').length / 4)
          });
        }
      }
    });

    const response = await fetch(
      `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/bulk`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conversations })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Error saving bulk messages:', data);
      return { success: false, error: data.message || 'Failed to save bulk messages' };
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error saving bulk messages:', error);
    return { success: false, error: error.message };
  }
};