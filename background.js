chrome.runtime.onInstalled.addListener(() => {
  console.log('Page Status Tracker extension installed');
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateBadge(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId);
  }
});

async function updateBadge(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return;
    }
    
    const result = await chrome.storage.local.get([tab.url]);
    const status = result[tab.url] || 'not-visited';
    
    const badgeInfo = {
      'not-visited': { text: '', color: '#6c757d' },
      'ongoing': { text: '●', color: '#ffc107' },
      'completed': { text: '✓', color: '#17a2b8' }
    };
    
    const info = badgeInfo[status];
    
    chrome.action.setBadgeText({ 
      text: info.text, 
      tabId: tabId 
    });
    
    if (info.text) {
      chrome.action.setBadgeBackgroundColor({ 
        color: info.color, 
        tabId: tabId 
      });
    }
    
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      updateBadge(tabs[0].id);
    }
  }
});