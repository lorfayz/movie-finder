const API_KEY = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88'; 
const API_BASE_URL = 'https://kinopoiskapiunofficial.tech/api';

let currentPage = 1;
let totalPages = 0;
let totalMoviesFound = 0;
let currentFilters = {
    yearFrom: 2010,
    yearTo: 2024,
    genreId: '',
    ratingFrom: 7.0
};
let excludeTags = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('MovieFinder инициализирован');
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showNotification('⚠️ Внимание! Получите бесплатный API ключ на kinopoiskapiunofficial.tech и вставьте его в script.js (строка 8)', 'warning', 10000);
    }
    
    loadExcludeTagsFromStorage();
    
    updateExcludeTagsDisplay();
});

window.searchMovies = async function() {
    console.log('▶ Выполняется поиск фильмов...');
    
    const yearFrom = parseInt(document.getElementById('yearFrom').value) || 1890;
    const yearTo = parseInt(document.getElementById('yearTo').value) || 2026;
    const genreId = document.getElementById('genre').value;
    const ratingFrom = parseFloat(document.getElementById('ratingFrom').value) || 0;
    
    if (yearFrom > yearTo) {
        showNotification('❌ Ошибка: год "от" не может быть больше года "до"', 'error');
        return;
    }
    
    currentFilters = { yearFrom, yearTo, genreId, ratingFrom };
    currentPage = 1;
    
    showLoadingState();
    
    try {
        const movies = await fetchMoviesFromAPI();
        displayMoviesInGrid(movies, false);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        showNotification('❌ Не удалось загрузить фильмы. Проверьте API ключ и интернет-соединение', 'error');
        showEmptyState();
    }
};

window.loadMoreMovies = async function() {
    console.log('▶ Загрузка дополнительных фильмов...');
    
    if (currentPage >= totalPages) {
        showNotification('📽 Это все фильмы! Больше нет', 'info');
        return;
    }
    
    currentPage++;
    
    try {
        const moreMovies = await fetchMoviesFromAPI();
        displayMoviesInGrid(moreMovies, true);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showNotification('❌ Ошибка загрузки дополнительных фильмов', 'error');
        currentPage--;
    }
};
async function fetchMoviesFromAPI() {
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
    
    console.log('Запрос к API:', url);
    
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
    totalMoviesFound = data.totalElements || 0;
    
    let movies = data.items || [];
    
    // Фильтрация по исключаемым темам
    if (excludeTags.length > 0) {
        const beforeCount = movies.length;
        movies = movies.filter(movie => {
            const description = (movie.description || movie.shortDescription || '').toLowerCase();
            for (const tag of excludeTags) {
                if (description.includes(tag.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
        console.log(`Исключено ${beforeCount - movies.length} фильмов по темам: ${excludeTags.join(', ')}`);
    }
    
    return movies;
}

function displayMoviesInGrid(movies, append = false) {
    const container = document.getElementById('moviesContainer');
    const resultsCount = document.getElementById('resultsCount');
    const paginationDiv = document.getElementById('pagination');
    
    if (!append) {
        container.innerHTML = '';
    }
    
    if (!movies || movies.length === 0) {
        if (!append) {
            showEmptyState();
            resultsCount.textContent = '0 фильмов';
        }
        paginationDiv.style.display = 'none';
        return;
    }
    
    const currentDisplayCount = container.children.length;
    const newTotalCount = currentDisplayCount + movies.length;
    resultsCount.textContent = `${newTotalCount} фильмов`;
    
    movies.forEach(movie => {
        const movieCard = createMovieCardElement(movie);
        container.appendChild(movieCard);
    });
    
    if (currentPage < totalPages && movies.length > 0) {
        paginationDiv.style.display = 'block';
    } else {
        paginationDiv.style.display = 'none';
    }
}

function createMovieCardElement(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const movieId = movie.kinopoiskId || movie.filmId;
    const posterUrl = movie.posterUrlPreview || movie.posterUrl || 'https://via.placeholder.com/300x450?text=Нет+постера';
    const title = movie.nameRu || movie.nameOriginal || 'Название неизвестно';
    const year = movie.year || 'Год не указан';
    const rating = movie.ratingKinopoisk || movie.rating || '0';
    const description = (movie.description || movie.shortDescription || 'Описание отсутствует').substring(0, 150);
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" alt="${escapeHtml(title)}" loading="lazy" 
                 onerror="this.src='https://via.placeholder.com/300x450?text=Изображение+недоступно'">
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
                <button class="review-btn" onclick="window.showMovieReviews(${movieId})">
                    <i class="fas fa-comment-dots"></i> Читать рецензии
                </button>
            </div>
        </div>
    `;
    
    return card;
}

window.showMovieReviews = async function(movieId) {
    console.log(`▶ Загрузка рецензий для фильма ID: ${movieId}`);
    
    const modal = document.getElementById('reviewsModal');
    const reviewsContent = document.getElementById('reviewsContent');
    
    modal.style.display = 'block';
    reviewsContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Загрузка рецензий...</p>';
    
    try {
        const reviews = await fetchReviewsFromAPI(movieId);
        displayReviewsInModal(reviews);
    } catch (error) {
        console.error('Ошибка загрузки рецензий:', error);
        reviewsContent.innerHTML = '<p class="no-reviews">❌ Не удалось загрузить рецензии</p>';
    }
};

async function fetchReviewsFromAPI(movieId) {
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

function displayReviewsInModal(reviews) {
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
                <i class="fas fa-user"></i> ${escapeHtml(review.author || 'Анонимный зритель')}
                ${review.type ? `<span style="color: #6366f1; margin-left: 10px; font-size: 12px;">(${review.type})</span>` : ''}
            </div>
            <div class="review-text">${escapeHtml(review.title ? review.title + ': ' : '')}${escapeHtml(review.description || review.review || 'Текст рецензии отсутствует')}</div>
        `;
        reviewsContent.appendChild(reviewDiv);
    });
}

window.closeReviewsModal = function() {
    const modal = document.getElementById('reviewsModal');
    modal.style.display = 'none';
};

window.addQuickExcludeTag = function(tag) {
    console.log(`▶ Добавление тега исключения: ${tag}`);
    
    if (!excludeTags.includes(tag)) {
        excludeTags.push(tag);
        saveExcludeTagsToStorage();
        updateExcludeTagsDisplay();
        showNotification(`✓ Добавлено исключение: "${tag}"`, 'success', 2000);
    } else {
        showNotification(`⚠ Тег "${tag}" уже в списке исключений`, 'warning', 1500);
    }
};

window.addCustomExcludeTag = function() {
    const customInput = document.getElementById('customExclude');
    const newTag = customInput.value.trim().toLowerCase();
    
    console.log(`▶ Добавление пользовательского тега: ${newTag}`);
    
    if (!newTag) {
        showNotification('⚠ Введите текст для исключения', 'warning');
        return;
    }
    
    if (newTag.length < 2) {
        showNotification('⚠ Тема должна содержать минимум 2 символа', 'warning');
        return;
    }
    
    if (!excludeTags.includes(newTag)) {
        excludeTags.push(newTag);
        saveExcludeTagsToStorage();
        updateExcludeTagsDisplay();
        customInput.value = '';
        showNotification(`✓ Добавлено исключение: "${newTag}"`, 'success', 2000);
    } else {
        showNotification(`⚠ Тема "${newTag}" уже в списке исключений`, 'warning',
