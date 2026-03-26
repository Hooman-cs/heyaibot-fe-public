// utils/validationUtils.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const cleanedPhone = phone.replace(/\D/g, '');
  const isValidLength = cleanedPhone.length === 10;
  const isValidFormat = /^\d+$/.test(cleanedPhone);
  return isValidLength && isValidFormat;
};

export const validateNumber = (number) => {
  return !isNaN(number) && number.trim() !== '';
};

export const validateSingleDate = (dateStr) => {
  const dateFormats = [
    /^\d{1,2}-\d{1,2}-\d{4}$/,
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    /^\d{4}-\d{1,2}-\d{1,2}$/
  ];
  const isValidFormat = dateFormats.some(format => format.test(dateStr));
  if (!isValidFormat) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.trim() !== '';
};

export const validateDate = (date) => {
  const dateStr = date.trim();
  if (dateStr.includes(' to ')) {
    const [startDate, endDate] = dateStr.split(' to ').map(d => d.trim());
    return validateSingleDate(startDate) && validateSingleDate(endDate);
  }
  return validateSingleDate(dateStr);
};

export const validateURL = (url) => {
  const urlStr = url.trim();
  if (urlStr === '') return false;
  
  const urlPatterns = [
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+(:\d{1,5})?(\/[a-zA-Z0-9-._~:?#@!$&'()*+,;=]*)?$/,
    /^(https?:\/\/)?localhost(:\d{1,5})?(\/[a-zA-Z0-9-._~:?#@!$&'()*+,;=]*)?$/,
    /^(https?:\/\/)?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\/[a-zA-Z0-9-._~:?#@!$&'()*+,;=]*)?$/,
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  ];
  
  return urlPatterns.some(pattern => pattern.test(urlStr));
};

export const validateInput = (fieldType, value) => {
  switch (fieldType) {
    case 'email':
      return validateEmail(value);
    case 'number':
      return validateNumber(value);
    case 'phone':
      return validatePhoneNumber(value);
    case 'date':
      return validateDate(value);
    case 'url':
      return validateURL(value);
    default:
      return value.trim() !== '';
  }
};

export const getFieldType = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('email') || lowerText.includes('e-mail') || lowerText.includes('gmail') || lowerText.includes('Email')) return 'email';
  if (lowerText.includes('phone') || lowerText.includes('mobile')) return 'phone';
  if (lowerText.includes('number') || lowerText.includes('guest')) return 'number';
  if (lowerText.includes('url') || lowerText.includes('website') || lowerText.includes('link') || lowerText.includes('web')) return 'url';
  if (lowerText.includes('date') || lowerText.includes('stay') || lowerText.includes('check-in') || lowerText.includes('check-out')) return 'date';
  return 'text';
};