// utils/urlUtils.js
export const normalizeUrl = (url) => {
  if (!url || url.trim() === '') return '';
  
  try {
    let normalized = url.trim();
    normalized = normalized.replace(/^(https?:\/\/)?(www\.)?/, '');
    normalized = normalized.replace(/\/$/, '');
    normalized = normalized.split('?')[0];
    normalized = normalized.split('#')[0];
    normalized = normalized.toLowerCase();
    return normalized;
  } catch (error) {
    return url || '';
  }
};

export const extractDomain = (url) => {
  if (!url) return '';
  
  try {
    const normalized = normalizeUrl(url);
    const domain = normalized.split('/')[0];
    return domain;
  } catch (error) {
    return '';
  }
};

export const checkUrlMatch = (databaseUrl, currentUrl) => {
  if (!databaseUrl || !currentUrl) return false;
  
  const normalizedDatabase = normalizeUrl(databaseUrl);
  const normalizedCurrent = normalizeUrl(currentUrl);
  
  const databaseDomain = extractDomain(databaseUrl);
  const currentDomain = extractDomain(currentUrl);
  
  const directDomainMatch = databaseDomain === currentDomain;
  const fullUrlMatch = normalizedDatabase === normalizedCurrent;
  const substringMatch = normalizedCurrent.includes(normalizedDatabase) || 
                        normalizedDatabase.includes(normalizedCurrent);
  
  return directDomainMatch || substringMatch || fullUrlMatch;
};

export const getParentWebsiteUrl = (parentWebsiteUrl) => {
  if (typeof window !== 'undefined') {
    if (parentWebsiteUrl) return parentWebsiteUrl;
    
    const urlParams = new URLSearchParams(window.location.search);
    const parentUrlParam = urlParams.get('parentUrl') || urlParams.get('siteUrl') || urlParams.get('sourceUrl');
    if (parentUrlParam) {
      return parentUrlParam;
    }
    
    if (document.referrer && document.referrer !== '' && 
        !document.referrer.includes(window.location.hostname)) {
      return document.referrer;
    }
    
    const storedParentUrl = localStorage.getItem('parentWebsiteUrl');
    if (storedParentUrl) {
      return storedParentUrl;
    }
    
    return window.location.href;
  }
  return '';
};

export const getCurrentWebsiteUrl = (parentWebsiteUrl) => {
  if (typeof window !== 'undefined') {
    const parentUrl = getParentWebsiteUrl(parentWebsiteUrl);
    
    if (parentUrl && parentUrl !== window.location.href && 
        !parentUrl.includes(window.location.hostname)) {
      return parentUrl;
    }
    
    return window.location.href;
  }
  return '';
};