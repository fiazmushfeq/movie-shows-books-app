let currentType = 'movies';
let mediaData = { movies: [], books: [], shows: [] };

// Form configurations for different media types
const formConfigs = {
    movies: [
        { name: 'title', label: 'Movie Title', type: 'text', required: true },
        { name: 'director', label: 'Director', type: 'text' },
        { name: 'year', label: 'Year', type: 'number', min: 1900, max: 2030 },
        { name: 'genre', label: 'Genre', type: 'text' },
        { name: 'rating', label: 'Rating', type: 'number', min: 1, max: 5 }
    ],
    books: [
        { name: 'title', label: 'Book Title', type: 'text', required: true },
        { name: 'author', label: 'Author', type: 'text', required: true },
        { name: 'year', label: 'Year Published', type: 'number', min: 1000, max: 2030 },
        { name: 'genre', label: 'Genre', type: 'text' },
        { name: 'pages', label: 'Pages', type: 'number', min: 1 },
        { name: 'rating', label: 'Rating', type: 'number', min: 1, max: 5 }
    ],
    shows: [
        { name: 'title', label: 'Show Title', type: 'text', required: true },
        { name: 'seasons', label: 'Seasons Watched', type: 'number', min: 1 },
        { name: 'episodes', label: 'Episodes Watched', type: 'number', min: 1 },
        { name: 'genre', label: 'Genre', type: 'text' },
        { name: 'platform', label: 'Platform', type: 'text', placeholder: 'Netflix, HBO, etc.' },
        { name: 'rating', label: 'Rating', type: 'number', min: 1, max: 5 }
    ]
};

// Initialize the app
async function init() {
    // Load data
    await loadData();
    
    // Set up event listeners
    setupTabs();
    setupForm();
    
    // Render initial view
    renderForm();
    renderList();
    updateStats();
}

// Load data from main process
async function loadData() {
    try {
        mediaData = await window.api.getAllMedia();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Set up tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update current type
            currentType = tab.dataset.type;
            
            // Re-render
            renderForm();
            renderList();
            updateStats();
        });
    });
}

// Set up form submission
function setupForm() {
    const form = document.getElementById('addForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const item = {};
        
        for (let [key, value] of formData.entries()) {
            if (value) {
                item[key] = value;
            }
        }
        
        // Add the item
        const newItem = await window.api.addMediaItem(currentType, item);
        
        if (newItem) {
            mediaData[currentType].push(newItem);
            form.reset();
            renderList();
            updateStats();
        }
    });
}

// Render the form based on current type
function renderForm() {
    const form = document.getElementById('addForm');
    const config = formConfigs[currentType];
    
    let html = '';
    config.forEach(field => {
        html += `
            <div class="input-group">
                <label for="${field.name}">${field.label}</label>
                <input 
                    type="${field.type}" 
                    name="${field.name}" 
                    id="${field.name}"
                    ${field.required ? 'required' : ''}
                    ${field.min !== undefined ? `min="${field.min}"` : ''}
                    ${field.max !== undefined ? `max="${field.max}"` : ''}
                    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
                >
            </div>
        `;
    });
    
    html += '<button type="submit">Add Item</button>';
    form.innerHTML = html;
}

// Render the media list
function renderList() {
    const list = document.getElementById('mediaList');
    const items = mediaData[currentType] || [];
    
    if (items.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3>No ${currentType} added yet</h3>
                <p>Start by adding your first ${currentType.slice(0, -1)} above!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    items.forEach(item => {
        html += createMediaItemHTML(item);
    });
    
    list.innerHTML = html;
    
    // Add delete button listeners
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const success = await window.api.removeMediaItem(currentType, id);
            
            if (success) {
                mediaData[currentType] = mediaData[currentType].filter(item => item.id !== id);
                renderList();
                updateStats();
            }
        });
    });
}

// Create HTML for a single media item
function createMediaItemHTML(item) {
    let details = '';
    
    if (currentType === 'movies') {
        details = `
            ${item.director ? `<div class="media-detail">Director: <span>${item.director}</span></div>` : ''}
            ${item.year ? `<div class="media-detail">Year: <span>${item.year}</span></div>` : ''}
            ${item.genre ? `<div class="media-detail">Genre: <span>${item.genre}</span></div>` : ''}
        `;
    } else if (currentType === 'books') {
        details = `
            ${item.author ? `<div class="media-detail">Author: <span>${item.author}</span></div>` : ''}
            ${item.year ? `<div class="media-detail">Year: <span>${item.year}</span></div>` : ''}
            ${item.pages ? `<div class="media-detail">Pages: <span>${item.pages}</span></div>` : ''}
            ${item.genre ? `<div class="media-detail">Genre: <span>${item.genre}</span></div>` : ''}
        `;
    } else if (currentType === 'shows') {
        details = `
            ${item.seasons ? `<div class="media-detail">Seasons: <span>${item.seasons}</span></div>` : ''}
            ${item.episodes ? `<div class="media-detail">Episodes: <span>${item.episodes}</span></div>` : ''}
            ${item.platform ? `<div class="media-detail">Platform: <span>${item.platform}</span></div>` : ''}
            ${item.genre ? `<div class="media-detail">Genre: <span>${item.genre}</span></div>` : ''}
        `;
    }
    
    const rating = item.rating ? createRatingStars(parseInt(item.rating)) : '';
    
    return `
        <div class="media-item">
            <div class="media-info">
                <div class="media-title">${item.title}</div>
                <div class="media-details">
                    ${details}
                    ${rating ? `<div class="media-detail">Rating: <span class="rating">${rating}</span></div>` : ''}
                </div>
            </div>
            <button class="delete-btn" data-id="${item.id}">Remove</button>
        </div>
    `;
}

// Create star rating display
function createRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star">${i <= rating ? '★' : '☆'}</span>`;
    }
    return stars;
}

// Update statistics
function updateStats() {
    const stats = document.getElementById('stats');
    
    const movieCount = mediaData.movies.length;
    const bookCount = mediaData.books.length;
    const showCount = mediaData.shows.length;
    const totalCount = movieCount + bookCount + showCount;
    
    // Calculate average ratings
    const avgRating = (type) => {
        const items = mediaData[type].filter(item => item.rating);
        if (items.length === 0) return 'N/A';
        const sum = items.reduce((acc, item) => acc + parseInt(item.rating), 0);
        return (sum / items.length).toFixed(1);
    };
    
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalCount}</div>
            <div class="stat-label">Total Items</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${movieCount}</div>
            <div class="stat-label">Movies</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${bookCount}</div>
            <div class="stat-label">Books</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${showCount}</div>
            <div class="stat-label">Shows</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${avgRating(currentType)}</div>
            <div class="stat-label">Avg Rating</div>
        </div>
    `;
}

// Start the app
init();
