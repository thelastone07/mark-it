document.addEventListener('DOMContentLoaded', async () => {
  const currentUrlEl = document.getElementById('currentUrl');
  const currentStatusEl = document.getElementById('currentStatus');
  const buttons = document.querySelectorAll('.status-btn');
  
  let currentUrl = '';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab.url;
    currentUrlEl.textContent = currentUrl;
  } catch (error) {
    console.error('Error getting current tab:', error);
    currentUrlEl.textContent = 'Error loading URL';
    return;
  }

  try {
    const result = await chrome.storage.local.get([currentUrl]);
    const status = result[currentUrl] || 'not-visited';
    updateStatusDisplay(status);
    updateActiveButton(status);
  } catch (error) {
    console.error('Error loading status:', error);
    updateStatusDisplay('not-visited');
    updateActiveButton('not-visited');
  }
  
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const newStatus = button.dataset.status;
      
      try {
        await chrome.storage.local.set({
          [currentUrl]: newStatus
        });
        
        updateStatusDisplay(newStatus);
        updateActiveButton(newStatus);
        
        
      } catch (error) {
        console.error('Error saving status:', error);
      }
    });
  });
  
  function updateStatusDisplay(status) {
    const statusMap = {
      'not-visited': { text: '⚪ Not Visited', className: 'status-not-visited' },
      'ongoing': { text: '🟡 Ongoing', className: 'status-ongoing' },
      'completed': { text: '🟢 Completed', className: 'status-completed' }
    };
    
    const statusInfo = statusMap[status] || statusMap['not-visited'];
    currentStatusEl.textContent = statusInfo.text;
    currentStatusEl.className = `status-value ${statusInfo.className}`;
  }
  
  function updateActiveButton(status) {
    buttons.forEach(button => {
      button.classList.toggle('active', button.dataset.status === status);
    });
  }
});