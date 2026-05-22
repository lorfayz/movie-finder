const API_KEY = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88'; 
const API_BASE_URL = 'https://kinopoiskapiunofficial.tech/api';

let currentPage = 1;
let totalPages = 0;
let currentFilters = {};
let excludeTags = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('Сайт загружен, привязываем кнопки...');
  
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchMovies);
        console.log('✓ Кнопка поиска привязана');
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
        console.log('✓ Кнопка сброса привязана');
    }
    
    const excludeViolenceBtn = document.getElementById('excludeViolenceBtn');
    if (excludeViolenceBtn) {
        excludeViolenceBtn.addEventListener('click', () => addExcludeTag('насилие'));
        console.log('✓ Кнопка исключения "насилие" привязана');
    }
    
    const excludeCrueltyBtn = document.getElementById('excludeCrueltyBtn');
    if (excludeCrueltyBtn) {
        excludeCrueltyBtn.addEventListener('click', () => addExcludeTag('жестокость'));
        console.log('✓ Кнопка исключения "жестокость" привязана');
    }
    
    const excludeBloodBtn = document.getElementById('excludeBloodBtn');
    if (excludeBloodBtn) {
        excludeBloodBtn.addEventListener('click', () => addExcludeTag('кровь'));
        console.log('✓ Кнопка исключения "кровь" привязана');
    }
    
    const excludeHorrorBtn = document.getElementById('excludeHorrorBtn');
    if (excludeHorrorBtn) {
        excludeHorrorBtn.addEventListener('click', () => addExcludeTag('ужасы'));
        console.log('✓ Кнопка исключения "ужасы" привязана');
    }
    
    const excludeDepressionBtn = document.getElementById('excludeDepressionBtn');
    if (excludeDepressionBtn) {
        excludeDepressionBtn.addEventListener('click', () => addExcludeTag('депрессия'));
        console.log('✓ Кнопка исключения "депрессия" привязана');
    }
    
    const excludeTragedyBtn = document.getElementById('excludeTragedyBtn');
    if (excludeTragedyBtn) {
        excludeTragedyBtn.addEventListener('click', () => addExcludeTag('трагедия'));
        console.log('✓ Кнопка исключения "трагедия" привязана');
    }
    
    const addExcludeBtn = document.getElementById('addExcludeBtn');
    if (addExcludeBtn) {
        addExcludeBtn.addEventListener('click', addCustomExcludeTag);
        console.log('✓ Кнопка добавления своей темы привязана');
    }
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMore);
        console.log('✓ Кнопка загрузки ещё привязана');
    }
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
        console.log('✓ Кнопка закрытия модального окна привязана');
    }
    
    const modal = document.getElementById('reviewsModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
        console.log('✓ Закрытие модального окна по клику вне его привязано');
    }
    
    loadExcludeTags();
    
    console.log('Все кнопки успешно привязаны!');
});

async function searchMovies() {
    console.log('🔍 Выполняется поиск фильмов...');
    
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
        console.log(`✅ Найдено ${movies.length} фильмов`);
    } catch (error) {
        console.error('❌ Ошибка поиска:', error);
        showError('Не удалось загрузить фильмы. Проверьте API ключ и интернет-соединение.');
    }
}

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
    
    console.log('📡 Запрос к API:', url);
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-API-KEY': API_KEY,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Неверный API ключ. Получите ключ на kinopoiskapiunofficial.tech');
        }
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    totalPages = data.totalPages || 0;
    
    let filteredMovies = data.items || [];
    
    if (excludeTags.length > 0) {
        console.log(`🔍 Фильтрация по исключаемым темам: ${excludeTags.join(', ')}`);
        filteredMovies = filteredMovies.filter(movie => {
            const description = (movie.description || movie.shortDescription || '').toLowerCase();
            const name = (movie.nameRu || movie.nameOriginal || '').toLowerCase();
            const fullText = description + ' ' + name;
            
            for (const tag of excludeTags) {
                if (fullText.includes(tag.toLowerCase())) {
                    console.log(`❌ Исключён фильм "${movie.nameRu}" из-за темы "${tag}"`);
                    return false;
                }
            }
            return true;
        });
        console.log(`✅ После фильтрации осталось ${filteredMovies.length} фильмов`);
    }
    
    return filteredMovies;
}

async function loadMore() {
    console.log('📥 Загрузка дополнительных фильмов...');
    
    if (currentPage >= totalPages) {
        showNotification('Это все фильмы!', 'info');
        return;
    }
    
    currentPage++;
    
    try {
        const moreMovies = await fetchMovies();
        displayMovies(moreMovies, true);
        console.log(`✅ Загружено ещё ${moreMovies.length} фильмов`);
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        showNotification('Ошибка загрузки дополнительных фильмов', 'error');
    }
}

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
                    <p>Фильмы не найдены. Попробуйте изменить параметры поиска или убрать исключения.</p>
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
    
    const posterUrl = movie.posterUrlPreview || movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster';
    const title = movie.nameRu || movie.nameOriginal || 'Название неизвестно';
    const year = movie.year || 'Год не указан';
    const rating = movie.ratingKinopoisk || movie.rating || '0';
    const description = (movie.description || movie.shortDescription || 'Описание отсутствует').substring(0, 150);
    const movieId = movie.kinopoiskId || movie.filmId;
    
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
                <button class="review-btn" data-movie-id="${movieId}">
                    <i class="fas fa-comment-dots"></i> Рецензии
                </button>
            </div>
        </div>
    `;
    
    const reviewBtn = card.querySelector('.review-btn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showReviews(movieId);
        });
    }
    
    return card;
}

async function showReviews(movieId) {
    console.log(`📖 Загрузка рецензий для фильма ID: ${movieId}`);
    
    const modal = document.getElementById('reviewsModal');
    const reviewsContent = document.getElementById('reviewsContent');
    
    modal.style.display = 'block';
    reviewsContent.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Загрузка рецензий...</p>';
    
    try {
        const reviews = await fetchReviews(movieId);
        displayReviews(reviews);
        console.log(`✅ Загружено ${reviews.length} рецензий`);
    } catch (error) {
        console.error('❌ Ошибка загрузки рецензий:', error);
        reviewsContent.innerHTML = '<p class="no-reviews">❌ Не удалось загрузить рецензии</p>';
    }
}

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
                ${review.date ? `<span style="color: #94a3b8; margin-left: 10px; font-size: 12px;">${review.date}</span>` : ''}
            </div>
            <div class="review-text">${escapeHtml(review.title ? review.title + ': ' : '')}${escapeHtml(review.description || review.review || 'Нет текста рецензии')}</div>
        `;
        reviewsContent.appendChild(reviewDiv);
    });
}

function addExcludeTag(tag) {
    console.log(`🚫 Добавление тега исключения: ${tag}`);
    
    if (!excludeTags.includes(tag)) {
        excludeTags.push(tag);
        saveExcludeTags();
        updateExcludeTagsDisplay();
        showNotification(`Тема "${tag}" добавлена в исключения`, 'success');
        console.log(`✅ Тег "${tag}" добавлен. Все теги: ${excludeTags.join(', ')}`);
    } else {
        showNotification(`Тема "${tag}" уже в списке исключений`, 'warning');
    }
}

function addCustomExcludeTag() {
    const customInput = document.getElementById('customExclude');
    const newTag = customInput.value.trim().toLowerCase();
    
    if (newTag && !excludeTags.includes(newTag)) {
        addExcludeTag(newTag);
        customInput.value = '';
    } else if (excludeTags.includes(newTag)) {
        showNotification('Эта тема уже добавлена в исключения', 'warning');
    } else if (!newTag) {
        showNotification('Введите тему для исключения', 'warning');
    }
}

function removeExcludeTag(tag) {
    console.log(`✅ Удаление тега исключения: ${tag}`);
    excludeTags = excludeTags.filter(t => t !== tag);
    saveExcludeTags();
    updateExcludeTagsDisplay();
    showNotification(`Тема "${tag}" удалена из исключений`, 'info');
}

function updateExcludeTagsDisplay() {
    const container = document.getElementById('activeExcludesList');
    
    if (excludeTags.length === 0) {
        container.innerHTML = '<span style="color: #94a3b8;">Нет активных исключений</span>';
        return;
    }
    
    container.innerHTML = excludeTags.map(tag => `
        <span class="exclude-badge" data-tag="${tag}">
            ${tag} ✕
        </span>
    `).join('');
    
    document.querySelectorAll('.exclude-badge').forEach(badge => {
        badge.addEventListener('click', () => {
            const tag = badge.getAttribute('data-tag');
            removeExcludeTag(tag);
        });
    });
}

function saveExcludeTags() {
    localStorage.setItem('excludeTags', JSON.stringify(excludeTags));
    console.log('💾 Теги сохранены в localStorage');
}

function loadExcludeTags() {
    const saved = localStorage.getItem('excludeTags');
    if (saved) {
        try {
            excludeTags = JSON.parse(saved);
            updateExcludeTagsDisplay();
            console.log(`📂 Загружены сохранённые теги: ${excludeTags.join(', ')}`);
        } catch (e) {
            console.error('Ошибка загрузки тегов:', e);
        }
    }
}

function resetFilters() {
    console.log('🔄 Сброс всех фильтров...');
    
    document.getElementById('yearFrom').value = '2010';
    document.getElementById('yearTo').value = '2024';
    document.getElementById('genre').value = '';
    document.getElementById('ratingFrom').value = '7.0';
    
    excludeTags = [];
    saveExcludeTags();
    updateExcludeTagsDisplay();
    
    const container = document.getElementById('moviesContainer');
    container.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-search"></i>
            <p>Фильтры сброшены. Настройте параметры и нажмите "Найти фильм"</p>
        </div>
    `;
    document.getElementById('resultsCount').textContent = '0 фильмов';
    document.getElementById('pagination').style.display = 'none';
    
    showNotification('Все фильтры сброшены', 'success');
    console.log('✅ Фильтры сброшены');
}

function closeModal() {
    const modal = document.getElementById('reviewsModal');
    modal.style.display = 'none';
    console.log('❌ Модальное окно закрыто');
}

function showLoading() {
    const container = document.getElementById('moviesContainer');
    container.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Поиск идеального фильма...</p>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#6366f1'};
            color: white;
            border-radius: 12px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: 500;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const container = document.getElementById('moviesContainer');
    container.innerHTML = `
        <div class="loading-placeholder">
            <i class="fas fa-exclamation-triangle"></i>
            <p style="color: #ef4444;">${message}</p>
        </div>
    `;
    showNotification(message, 'error');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
console.log('🚀 MovieFinder готов к работе!');
console.log('📌 Все кнопки привязаны: Поиск, Сброс, Исключения, Рецензии, Пагинация');
