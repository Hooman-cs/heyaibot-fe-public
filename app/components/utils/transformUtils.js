// utils/transformUtils.js
// Transform data with parameter mapping
export const transformDataWithParams = (originalData, promptsWithParams) => {
  if (!promptsWithParams || promptsWithParams.length === 0) {
    return originalData;
  }

  const transformedData = {};
  const textToParamMap = {};
  
  // Map text to parameter keys
  promptsWithParams.forEach(item => {
    if (item.text && item.parameter && item.parameter.key) {
      textToParamMap[item.text] = item.parameter.key;
    }
  });
  
  // Transform the data
  Object.entries(originalData).forEach(([textKey, value]) => {
    const paramKey = textToParamMap[textKey] || textKey;
    transformedData[paramKey] = value;
  });
  
  return transformedData;
};

// Create client summary from collected data
export const createClientSummary = (data) => {
  let clientSummary = "Summary of Your Details\n\n";
  let count = 1;

  Object.entries(data).forEach(([key, value]) => {
    clientSummary += `${count}) ${key} : ${value}\n`;
    count++;
  });
  
  clientSummary += "\nPlease confirm if all details are correct!";
  
  return clientSummary;
};

// Create server summary (only unmapped data)
export const createServerSummary = (collectedData, storedPromptsWithParams) => {
  let serverSummary = "";
  let count = 1;

  // Check which keys were NOT mapped in promptsWithParams
  Object.entries(collectedData).forEach(([key, value]) => {
    // Check if this key has a mapping in storedPromptsWithParams
    const hasMapping = storedPromptsWithParams && 
                      storedPromptsWithParams.some(item => 
                        item.text === key && 
                        item.parameter && 
                        item.parameter.key
                      );
    
    // If no mapping, add to server summary
    if (!hasMapping) {
      serverSummary += `${count}) ${key} : ${value}\n`;
      count++;
    }
  });
  
  return count === 1 ? "" : serverSummary;
};

// Find summary parameter key from summary list
export const findSummaryParamKey = (storedSummaryList) => {
  if (storedSummaryList && storedSummaryList.length > 0) {
    const summaryItem = storedSummaryList.find(item => item.text === "Summary");
    if (summaryItem && summaryItem.parameter && summaryItem.parameter.key) {
      return summaryItem.parameter.key;
    }
  }
  return null;
};