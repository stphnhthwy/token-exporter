let currentCollection = 'all';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize by requesting JSON data
    parent.postMessage({ 
        pluginMessage: { 
            type: 'export' 
        }
    }, '*');
});

document.getElementById('export-button').addEventListener('click', function() {
    // Trigger download of current collection
    const jsonContent = document.getElementById('json-preview').textContent;
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentCollection}-tokens.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
});

function createCollectionTabs(collections) {
    const tabsContainer = document.getElementById('tabs');
    collections.forEach(collection => {
        console.log('Creating tab for collection:', collection); // Debug log
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.setAttribute('data-collection', collection);
        button.textContent = collection;
        button.addEventListener('click', selectTab);
        tabsContainer.appendChild(button);
    });
}

function selectTab(event) {
    // Update active state
    document.querySelectorAll('.tab-button').forEach(btn => 
        btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update current collection
    currentCollection = event.target.getAttribute('data-collection');

    // Request JSON for selected collection
    parent.postMessage({ 
        pluginMessage: { 
            type: 'loadJson', 
            collection: currentCollection 
        } 
    }, '*');
}

// Handle messages from the plugin code
window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    console.log('Received message:', msg); // Debug log
    
    if (msg.type === 'jsonData') {
        // Update JSON preview
        document.getElementById('json-preview').textContent = 
            JSON.stringify(msg.json, null, 2);
        
        // If this is the initial load, create collection tabs
        if (!document.querySelector('.tab-button:not([data-collection="all"])')) {
            console.log('Creating tabs for collections:', Object.keys(msg.json)); // Debug log
            const collections = Object.keys(msg.json);
            createCollectionTabs(collections);
        }
    }
};

// Add click handler to the "All Collections" tab
document.querySelector('[data-collection="all"]')
    .addEventListener('click', selectTab);