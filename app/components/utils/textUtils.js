// utils/textUtils.js
export const cleanText = (text) => {
  if (!text) return '';
  
  // Remove emojis and special characters
  let cleaned = text.replace(/[^\w\s.,!?\-]/g, '');
  
  // Remove markdown bold formatting
  cleaned = cleaned.replace(/\*\*/g, '');
  
  // Remove extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

export const makeFriendly = (text) => {
  if (typeof text !== "string" || !text.trim()) {
    return "Could you please provide some information?";
  }
  
  const friendlyPrompts = [
    // `Could you please share ${text}?`,
    // `May I know ${text}?`,
    `Please tell me ${text}`,
    `I'd love to know ${text}!`,
    `Let me know ${text}`,
    `Could you provide ${text}?`
  ];
  return friendlyPrompts[Math.floor(Math.random() * friendlyPrompts.length)];
};

export const checkUserInterest = (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') return false;
  
  const messageLower = userMessage.toLowerCase().trim();
  
  const interestPatterns = [
    'yes', 'yes.', 'yes!', 'yes?',
    'okay', 'okay.', 'okay!',
    'ok', 'ok.', 'ok!',
    'sure', 'sure.', 'sure!',
    'absolutely', 'absolutely.', 'absolutely!',
    'yeah', 'yeah.', 'yeah!',
    'yep', 'yep.', 'yep!',
    'why not', 'why not.', 'why not!',
    'yes please',
    'yes, please',
    'sure, please',
    'okay, please',
    'yes go ahead',
    'yes, go ahead',
    'start now',
    'let\'s start',
    'lets start',
    'start please',
    'continue please',
    'show me',
    'show me please',
    'yes i want that',
    'yes i want it',
    'yes i want this',
    'yes i\'m interested',
    'yes im interested',
    'i want that',
    'i want it',
    'i want this',
  ];
  
  const exactMatch = interestPatterns.some(pattern => 
    messageLower === pattern.toLowerCase()
  );
  
  if (exactMatch) return true;
  
  if (messageLower.startsWith('i want')) {
    const words = messageLower.split(' ');
    if (words.length <= 3) return true;
  }
  
  if (messageLower === 'start' || messageLower === 'continue' || messageLower === 'begin') {
    return true;
  }
  
  return false;
};

export const checkUserNotInterest = (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') return false;
  
  const messageLower = userMessage.toLowerCase().trim();
  
  const negativePatterns = [
    'no', 'no.', 'no!', 'no?',
    'nope', 'nope.', 'nope!',
    'nah', 'nah.', 'nah!',
    'never', 'never.', 'never!',
    'no thanks',
    'no thank you',
    'no, thanks',
    'no, thank you',
    'not interested',
    'not interested.',
    'not now',
    'not now.',
    'not today',
    'not today.',
    'maybe later',
    'maybe later.',
    'later',
    'later.',
    'some other time',
    'some other time.',
    'another time',
    'another time.',
    'don\'t want',
    'dont want',
    'do not want',
    'don\'t think so',
    'dont think so',
    'do not think so',
    'i\'ll think about it',
    'i will think about it',
    'i\'ll consider it',
    'i will consider it',
    'maybe some other time',
    'not right now',
    'not at the moment',
    'i\'m busy',
    'im busy',
    'i am busy',
    'we are busy',
    'we\'re busy',
  ];
  
  return negativePatterns.some(pattern => 
    messageLower === pattern.toLowerCase()
  );
};

export const extractMainTopic = (aiResponse) => {
  if (!aiResponse) return null;
  
  const sentences = aiResponse.split(/[.!?]/);
  if (sentences.length === 0) return null;
  
  const firstSentence = sentences[0].trim();
  
  const cleaned = firstSentence
    .replace(/^(I can help you with|We offer|We provide|Our services include|You can get|Get|Available)\s+/i, '')
    .replace(/^(There is|There are)\s+/i, '')
    .trim();
  
  if (cleaned === firstSentence) {
    const otherPatterns = [
      /^(Let me|I will|We can|You can)\s+(help you with|assist you with|setup|create|build|develop)\s+/i,
      /^(Would you like me to|Can I|Should I)\s+(help you with|assist with|setup|create)\s+/i,
      /^(I'm here to|We're here to)\s+(help with|assist with|provide)\s+/i,
      /^(Please let me|Kindly allow me to)\s+/i
    ];
    
    let tempCleaned = firstSentence;
    for (const pattern of otherPatterns) {
      tempCleaned = tempCleaned.replace(pattern, '');
    }
    
    if (tempCleaned !== firstSentence) {
      const firstWord = tempCleaned.trim().split(/\s+/)[0];
      return firstWord.trim();
    }
  }
  
  if (cleaned && cleaned !== firstSentence) {
    const firstWord = cleaned.trim().split(/\s+/)[0];
    return firstWord.trim();
  }
  
  const firstWord = firstSentence.trim().split(/\s+/)[0];
  
  if (firstWord.length > 50) {
    return firstWord.substring(0, 50) + '...';
  }
  
  return firstWord;
};

export const getServiceUnavailableMessage = (status) => {
  switch (status) {
    case 'inactive':
      return 'Chat service is temporarily disabled for this website. Please contact the website administrator for assistance.';
    case 'url_mismatch':
      return 'This chat widget is not authorized for this website URL. Please contact the website administrator.';
    case 'not_found':
      return 'Website configuration not found. Please check if the website is properly configured.';
    case 'error':
      return 'Service is currently unavailable. Please try again later.';
    default:
      return 'Service is currently unavailable. Please try again later.';
  }
};

export const generateWelcomeMessage = (websiteName, backendWelcomeMessages, systemPrompt) => {
  if (backendWelcomeMessages && backendWelcomeMessages.length > 0) {
    const randomIndex = Math.floor(Math.random() * backendWelcomeMessages.length);
    return backendWelcomeMessages[randomIndex];
  } else if (systemPrompt && systemPrompt.length > 0) {
    const randomIndex = Math.floor(Math.random() * systemPrompt.length);
    return systemPrompt[randomIndex];
  } else {
    const welcomeGreetings = [
      `Hello there! I'm your ${websiteName || 'AI'} assistant. How can I help you today?`,
      `Hey! Welcome! I'm here to help you with anything about ${websiteName || 'our services'}. What's on your mind?`,
      `Greetings! I'm your friendly ${websiteName || 'Support'} bot, ready to assist you! How may I help?`,
      `Hi there! Welcome to ${websiteName || 'our chat'}. I'm here to help you today! What can I do for you?`,
      `Hello! I'm your dedicated assistant for ${websiteName || 'this website'}. Let me know how I can assist you!`
    ];
    return welcomeGreetings[Math.floor(Math.random() * welcomeGreetings.length)];
  }
};

export const getSuccessMessage = () => {
  const successMessages = [
    'Excellent! Your request has been confirmed successfully! We\'ll contact you shortly.',
    'Perfect! Your request is saved and we\'ll get back to you soon! Thank you!',
    'Awesome! All done! Your request is confirmed and our team will reach out to you.',
    'Request Confirmed! We\'ve saved all your details and will contact you shortly. Thank you!'
  ];
  return successMessages[Math.floor(Math.random() * successMessages.length)];
};

export const getCancelMessage = () => {
  const cancelMessages = [
    'No worries! Your request has been cancelled. Feel free to update and try again later!',
    'Cancelled! You can update your request anytime or try again later. We\'re here to help!',
    'Request cancelled. No problem at all! Come back whenever you\'re ready.',
    'Cancellation complete. Feel free to restart the process whenever you\'re ready!'
  ];
  return cancelMessages[Math.floor(Math.random() * cancelMessages.length)];
};

export const getErrorMessage = () => {
  const errorMessages = [
    'Oops! There was a small hiccup processing your request. Please try again in a moment!',
    'Temporary Issue: There was an error processing your request. Could you please try again?',
    'Technical Glitch: We encountered an issue. Please try again or contact support if it persists.',
    'Something went wrong. Please try again or refresh the page and start over.'
  ];
  return errorMessages[Math.floor(Math.random() * errorMessages.length)];
};

export const getPromptIntroMessage = (promptName) => {
  const introMessages = [
    `Awesome choice! Let's work on ${promptName} together!`,
    `Great! Let's get started with ${promptName}. I'll guide you step by step!`,
    `Perfect! I'll help you with ${promptName}. Let's begin this journey!`,
    `Excellent! Let's tackle ${promptName} together. I'm here to help!`
  ];
  return introMessages[Math.floor(Math.random() * introMessages.length)];
};