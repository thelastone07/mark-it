document.addEventListener('DOMContentLoaded', async () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const completedList = document.getElementById('completed-list');
  const ongoingList = document.getElementById('ongoing-list');
  const completedCount = document.getElementById('completed-count');
  const ongoingCount = document.getElementById('ongoing-count');
  const deleteAllCompletedBtn = document.getElementById('deleteAllCompleted');
  const deleteAllOngoingBtn = document.getElementById('deleteAllOngoing');
  
  let allData = {};
  let completedItems = [];
  let ongoingItems = [];
  
  await loadData();
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      tabPanels.forEach(panel => panel.classList.remove('active'));
      document.getElementById(`${targetTab}-panel`).classList.add('active');
    });
  });
  
  deleteAllCompletedBtn.addEventListener('click', () => deleteAllItems('completed'));
  deleteAllOngoingBtn.addEventListener('click', () => deleteAllItems('ongoing'));
  
  async function loadData() {
    try {
      const result = await chrome.storage.local.get(null);
      allData = result;
      
      completedItems = [];
      ongoingItems = [];
      
      for (const [url, status] of Object.entries(allData)) {
        const item = { url, status };
        
        if (status === 'completed') {
          completedItems.push(item);
        } else if (status === 'ongoing') {
          ongoingItems.push(item);
        }
      }
      
      completedItems.sort((a, b) => b.url.localeCompare(a.url));
      ongoingItems.sort((a, b) => b.url.localeCompare(a.url));
      
      completedCount.textContent = `${completedItems.length} completed item${completedItems.length !== 1 ? 's' : ''}`;
      ongoingCount.textContent = `${ongoingItems.length} ongoing item${ongoingItems.length !== 1 ? 's' : ''}`;
      
      deleteAllCompletedBtn.disabled = completedItems.length === 0;
      deleteAllOngoingBtn.disabled = ongoingItems.length === 0;
      
      renderList(completedList, completedItems, 'completed');
      renderList(ongoingList, ongoingItems, 'ongoing');
      
    } catch (error) {
      console.error('Error loading data:', error);
      completedCount.textContent = 'Error loading data';
      ongoingCount.textContent = 'Error loading data';
    }
  }
  
  function renderList(container, items, status) {
    container.innerHTML = '';
    
    if (items.length === 0) {
      const emptyState = createEmptyState(status);
      container.appendChild(emptyState);
      return;
    }
    
    items.forEach(item => {
      const listItem = createListItem(item, status);
      container.appendChild(listItem);
    });
  }
  
  function createListItem(item, status) {
    const li = document.createElement('li');
    li.className = `url-item ${status}-item`;
    
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.className = 'url-link';
    
    const title = document.createElement('div');
    title.className = 'url-title';
    title.textContent = getUrlTitle(item.url);
    
    const address = document.createElement('div');
    address.className = 'url-address';
    address.textContent = item.url;
    
    const footer = document.createElement('div');
    footer.className = 'item-footer';
    
    const badge = document.createElement('span');
    badge.className = `status-badge ${status}-badge`;
    badge.textContent = status;
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    
    moveBtn.className = 'action-btn move-btn';
    moveBtn.title = status === 'completed' ? 'Move to Ongoing' : 'Move to Completed';
    moveBtn.textContent = status === 'completed' ? '⏪' : '✅';
    moveBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      moveItem(item.url, status);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Remove';
    deleteBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeItem(item.url);
    };
    
    actions.appendChild(moveBtn);
    actions.appendChild(deleteBtn);
    
    footer.appendChild(badge);
    footer.appendChild(actions);
    
    link.appendChild(title);
    link.appendChild(address);
    link.appendChild(footer);
    
    li.appendChild(link);
    
    return li;
  }
  
  function createEmptyState(status) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = status === 'completed' ? '✅' : '📖';
    
    const text = document.createElement('div');
    text.className = 'empty-state-text';
    text.textContent = status === 'completed' ? 'No completed items yet' : 'No ongoing items yet';
    
    const subtext = document.createElement('div');
    subtext.className = 'empty-state-subtext';
    subtext.textContent = `Start marking pages as ${status} to see them here`;
    
    emptyDiv.appendChild(icon);
    emptyDiv.appendChild(text);
    emptyDiv.appendChild(subtext);
    
    return emptyDiv;
  }
  
  function getUrlTitle(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '');
      const path = urlObj.pathname;
      
      if (path === '/' || path === '') {
        return hostname;
      }
      
      const pathParts = path.split('/').filter(part => part);
      const lastPart = pathParts[pathParts.length - 1];
      
      if (lastPart) {
        let title = decodeURIComponent(lastPart);
        title = title.replace(/\.[^/.]+$/, ''); // Remove file extension
        title = title.replace(/[-_]/g, ' '); // Replace hyphens and underscores with spaces
        title = title.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letters
        
        return `${title} - ${hostname}`;
      }
      
      return hostname;
    } catch (error) {
      return url;
    }
  }
  
  async function removeItem(url) {
    try {
      await chrome.storage.local.remove([url]);
      await loadData(); 
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Error removing item. Please try again.');
    }
  }
  
  async function moveItem(url, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'ongoing' : 'completed';
    
    try {
      await chrome.storage.local.set({
        [url]: newStatus
      });
      await loadData(); 
    } catch (error) {
      console.error('Error moving item:', error);
      alert('Error moving item. Please try again.');
    }
  }
  
  async function deleteAllItems(status) {
    const itemsToDelete = status === 'completed' ? completedItems : ongoingItems;
    
    if (itemsToDelete.length === 0) return;
    
    try {
      const urlsToRemove = itemsToDelete.map(item => item.url);
      await chrome.storage.local.remove(urlsToRemove);
      await loadData(); 
    } catch (error) {
      console.error('Error deleting all items:', error);
      alert('Error deleting items. Please try again.');
    }
  }
  
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      loadData();
    }
  });
});