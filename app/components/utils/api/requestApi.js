import { apiFetcher, formDataApiFetcher } from './apiCore';

// Execute URLs
export const executeUrls = async (apiBaseUrl, formData) => {
  try {
    const url    = `${apiBaseUrl}/api/execute-urls`;
    const result = await formDataApiFetcher(url, formData, {
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
      }
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

// Save chat request
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

// Save email request
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

// ─────────────────────────────────────────────────────────────
// ✅ FIXED saveConversationToDatabase
//    - forceNewThread flag ab backend bulk endpoint ko bheja jaata hai
//    - "Saving your request..." temp messages filter hoti hain
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ✅ FIXED saveConversationToDatabase
//    - forceNewThread flag ab sahi tarike se bheja jaata hai
//    - "Saving your request..." temp messages filter hoti hain
// ─────────────────────────────────────────────────────────────
export const saveConversationToDatabase = async (apiBaseUrl, backendApiKey, conversationData) => {
  try {
    if (!conversationData.conversations || conversationData.conversations.length === 0) {
      return { success: true, message: 'No conversations to save' };
    }

    if (!conversationData.sessionId) {
      return { success: false, error: 'sessionId is required' };
    }

    const forceNewThread = conversationData.forceNewThread === true;
    
   

    const formattedData = {
      conversations: conversationData.conversations.map(conv => ({
        userMessage: conv.userMessage ? {
          text: conv.userMessage.text,
          tokens: conv.userMessage.tokens || Math.ceil(conv.userMessage.text.length / 4)
        } : null,
        botReplies: conv.botReplies
          ? conv.botReplies
              .filter(reply => reply.text && reply.text !== 'Saving your request...')
              .map(reply => ({
                text: reply.text,
                tokens: reply.tokens || Math.ceil(reply.text.length / 4)
              }))
          : []
      }))
    };

    // ✅ CRITICAL: forceNewThread ko ALAG se bhejo
    const requestBody = {
      conversations: formattedData.conversations,
      forceNewThread: forceNewThread
    };

  

    const response = await fetch(
      `${apiBaseUrl}/api/session/${backendApiKey}/${conversationData.sessionId}/bulk`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Server error:', data);
      return { success: false, error: data.message || 'Failed to save' };
    }

   
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error saving conversation:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ FIXED saveSingleMessage (utility function)
//    - forceNewThread support added
//    - "Saving your request..." temp messages skip
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// ✅ saveSingleMessage utility function
//    - forceNewThread support added
//    - "Saving your request..." temp messages skip
// ─────────────────────────────────────────────────────────────
export const saveSingleMessage = async (apiBaseUrl, backendApiKey, messageData) => {
  try {
    if (!messageData.sessionId) return { success: false, error: 'sessionId is required' };
    if (!messageData.role)      return { success: false, error: 'role is required' };
    if (!messageData.text)      return { success: false, error: 'text is required' };

    // ✅ Temp messages save nahi hoti
    if (messageData.text === 'Saving your request...') {
      
      return { success: true, skipped: true };
    }

    const endpoint = messageData.role === 'user'
      ? `${apiBaseUrl}/api/session/${backendApiKey}/${messageData.sessionId}/user-message`
      : `${apiBaseUrl}/api/session/${backendApiKey}/${messageData.sessionId}/bot-reply`;

    // ✅ forceNewThread sirf user messages ke liye relevant hai
    const shouldForceNewThread = messageData.role === 'user' ? (messageData.forceNewThread === true) : false;
    
   
    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        text:           messageData.text,
        tokens:         messageData.tokens || Math.ceil(messageData.text.length / 4),
        forceNewThread: shouldForceNewThread
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error saving single message:', data);
      return { success: false, error: data.message || 'Failed to save message' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────
// ✅ FIXED saveBulkMessages
//    - "Saving your request..." temp messages filter hoti hain
// ─────────────────────────────────────────────────────────────
export const saveBulkMessages = async (apiBaseUrl, backendApiKey, sessionId, messages) => {
  try {
    if (!sessionId) return { success: false, error: 'sessionId is required' };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: 'messages array is required' };
    }

    const conversations     = [];
    let   currentConversation = null;

    messages.forEach(msg => {
      if (msg.role === 'user') {
        currentConversation = {
          userMessage: {
            text:   msg.text,
            tokens: msg.tokens || Math.ceil(msg.text.length / 4)
          },
          botReplies: []
        };
        conversations.push(currentConversation);
      } else if (msg.role === 'bot' && currentConversation) {
        // ✅ Temp messages skip
        if (msg.text && msg.text !== 'Saving your request...') {
          currentConversation.botReplies.push({
            text:   msg.text,
            tokens: msg.tokens || Math.ceil(msg.text.length / 4)
          });
        }
      }
    });

    const formattedData = { conversations };

   

    const response = await fetch(
      `${apiBaseUrl}/api/session/${backendApiKey}/${sessionId}/bulk`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formattedData)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error saving bulk messages:', data);
      return { success: false, error: data.message || 'Failed to save bulk messages' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving bulk messages:', error);
    return { success: false, error: error.message };
  }
};