const API_KEY = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88'; 
const API_BASE_URL = 'https://kinopoiskapiunofficial.tech/api';

let currentPage = 1;
let totalPages = 0;
let currentFilters = {};
let excludeTags = [];

document.addEventListener('DOMContentLoaded', () => {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showNotification('⚠️ Внимание! Необходимо получить API ключ на kinopoiskapiunofficial.tech и вставить его в код (строка 2 в script.js)', 'warning');
    }
    
    loadExcludeTags();
    
    setupEventListeners();
});
function setupEventListeners() {
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.onclick = () => searchMovies();
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.onclick = () => resetFilters();
    }
    
    const addExcludeBtn = document.getElementById('addExcludeBtn');
    if (addExcludeBtn) {
        addExcludeBtn.onclick = () => addExcludeTag();
    }
    
    document.querySelectorAll('.exclude-tag').forEach(btn => {
        btn.onclick = () => {
            const tag = btn.getAttribute('data-tag');
            if (tag && !excludeTags.includes(tag)) {
                excludeTags.push(tag);
                saveExcludeTags();
                updateExcludeTagsDisplay();
            }
        };
    });
    
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => closeModal();
    }
    
    window.onclick = (event) => {
        const modal = document.getElementById('reviewsModal');
        if (event.target === modal) {
            closeModal();
        }
    };
}

window.searchMovies = async function() 
    const yearFrom = parseInt(document.getElementById('yearFrom').value) || 1890;
    const yearTo = parseInt(document.getElementById('yearTo').value) || 2026;
    const genreId = document.getElementById('genre').value;
    const ratingFrom = parseFloat(document.getElementById('ratingFrom').value) || 0;
    
    if (yearFrom > yearTo) {
        showNotification('Ошибка: год "от" не может быть больше года "до"', 'error');
        return;
    }
    
    currentFilters = {
        yearFrom,
        yearTo,
        genreId,
        ratingFrom
    };
    
    currentPage = 1;
    
    showLoading();
    
    try {
        const movies = await fetchMovies();
        displayMovies(movies);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showError('Не удалось загрузить фильмы. Проверьте API ключ и интернет-соединение.');
    }
};

async function fetchMovies() {
    const { yearFrom, yearTo, genreId, ratingFrom } = currentFilters;
    
    let url = `${API_BASE_URL}/v2.2/films?`;
    const params = [];
    
    if (yearFrom && yearTo) {
        params.push(`yearFrom=${yearFrom}`);
        params.push(`yearTo=${yearTo}`);
    }
    
    if (genreId) {
        params.push(`genres=${genreId}`);
    }
    
    if (ratingFrom) {
        params.push(`ratingFrom=${ratingFrom}`);
    }
    
    params.push(`page=${currentPage}`);
    params.push(`order=RATING`); 
    
    url += params.join('&');
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Неверный API ключ');
        }
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    totalPages = data.totalPages || 0;
    
    let filteredMovies = data.items || [];
    
    if (excludeTags.length > 0) {
        filteredMovies = filteredMovies.filter(movie => {
            const description = (movie.description || movie.shortDescription || '').toLowerCase();
            for (const tag of excludeTags) {
                if (description.includes(tag.toLowerCase())) {
                    return false; 
                }
            }
            return true;
        });
    }
    
    return filteredMovies;
}

window.loadMore = async function() {
    if (currentPage >= totalPages) {
        showNotification('Это все фильмы!', 'info');
        return;
    }
    
    currentPage++;
    
    try {
        const moreMovies = await fetchMovies();
        displayMovies(moreMovies, true); 
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showNotification('Ошибка загрузки дополнительных фильмов', 'error');
    }
};

function displayMovies(movies, append = false) {
    const container = document.getElementById('moviesContainer');
    const resultsCount = document.getElementById('resultsCount');
    const paginationDiv = document.getElementById('pagination');
    
    if (!append) {
        container.innerHTML = '';
    }
    
    if (!movies || movies.length === 0) {
        if (!append) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-sad-tear"></i>
                    <p>Фильмы не найдены. Попробуйте изменить параметры поиска.</p>
                </div>
            `;
            resultsCount.textContent = '0 фильмов';
        }
        paginationDiv.style.display = 'none';
        return;
    }
    
    const currentCount = append ? parseInt(resultsCount.textContent.split(' ')[0]) : 0;
    resultsCount.textContent = `${currentCount + movies.length} фильмов`;
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
    
    if (currentPage < totalPages && movies.length > 0) {
        paginationDiv.style.display = 'block';
    } else {
        paginationDiv.style.display = 'none';
    }
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.kinopoiskId || movie.filmId);
    
    const posterUrl = movie.posterUrlPreview || movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster';
    const title = movie.nameRu || movie.nameOriginal || 'Название неизвестно';
    const year = movie.year || 'Год не указан';
    const rating = movie.ratingKinopoisk || movie.rating || '0';
    const description = (movie.description || movie.shortDescription || 'Описание отсутствует').substring(0, 150);
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <div class="movie-rating">
                <i class="fas fa-star"></i> ${rating}
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${escapeHtml(title)}</h3>
            <div class="movie-year">
                <i class="far fa-calendar-alt"></i> ${year}
            </div>
            <div class="movie-description">${escapeHtml(description)}...</div>
            <div class="movie-actions">
                <button class="review-btn" onclick="window.showReviews(${movie.kinopoiskId || movie.filmId})">
                    <i class="fas fa-comment-dots"></i> Рецензии
                </button>
            </div>
        </div>
    `;
    
    return card;
}

window.showReviews = async function(movieId) {
    const modal = document.getElementById('reviewsModal');
    const reviewsContent = document.getElementById('reviewsContent');
    
    modal.style.display = 'block';
    reviewsContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Загрузка рецензий...</p>';
    
    try {
        const reviews = await fetchReviews(movieId);
        displayReviews(reviews);
    } catch (error) {
        console.error('Ошибка загрузки рецензий:', error);
        reviewsContent.innerHTML = '<p class="no-reviews">❌ Не удалось загрузить рецензии</p>';
    }
};

async function fetchReviews(movieId) {
    const url = `${API_BASE_URL}/v2.2/films/${movieId}/reviews`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
}

function displayReviews(reviews) {
    const reviewsContent = document.getElementById('reviewsContent');
    
    if (!reviews || reviews.length === 0) {
        reviewsContent.innerHTML = '<p class="no-reviews">📝 Рецензий на этот фильм пока нет</p>';
        return;
    }
    
    reviewsContent.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item';
        reviewDiv.innerHTML = `
            <div class="review-author">
                <i class="fas fa-user"></i> ${escapeHtml(review.author || 'Аноним')}
                ${review.type ? `<span style="color: #6366f1; margin-left: 10px;">(${review.type})</span>` : ''}
            </div>
            <div class="review-text">${escapeHtml(review.title ? review.title + ': ' : '')}${escapeHtml(review.description || review.review || 'Нет текста рецензии')}</div>
        `;
        reviewsContent.appendChild(reviewDiv);
    });
}

function addExcludeTag() {
    const customInput = document.getElementById('customExclude');
    const newTag = customInput.value.trim().toLowerCase();
    
    if (newTag && !excludeTags.includes(newTag)) {
        excludeTags.push(newTag);
        saveExcludeTags();
        updateExcludeTagsDisplay();
        customInput.value = '';
    } else if (excludeTags.includes(newTag)) {
        showNotification('Этот тег уже добавлен', 'warning');
    }
}

function removeExcludeTag(tag) {
    excludeTags = excludeTags.filter(t => t !== tag);
    saveExcludeTags();
    updateExcludeTagsDisplay();
}

function updateExcludeTagsDisplay() {
    const container = document.getElementById('activeExcludesList');
    
    if (excludeTags.length === 0) {
        container.innerHTML = '<span style="color: #94a3b8;">Нет активных исключений</span>';
        return;
    }
    
    container.innerHTML = excludeTags.map(tag => `
        <span class="exclude-badge" onclick="window.removeExcludeTag('${tag}')">
            ${tag} ✕
        </span>
    `).join('');
}

function saveExcludeTags() {
    localStorage.setItem('excludeTags', JSON.stringify(excludeTags));
}

function loadExcludeTags() {
    const saved = localStorage.getItem('excludeTags');
    if (saved) {
        try {
            excludeTags = JSON.parse(saved);
            updateExcludeTagsDisplay();
        } catch (e) {
            console.error('Ошибка загрузки тегов:', e);
        }
    }
}

window.resetFilters = function() {
    document.getElementById('yearFrom').value = '2010';
    document.getElementById('yearTo').value = '2024';
    document.getElementById('genre').value = '';
    document.getElementById('
