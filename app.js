const API_KEY = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88'; 
const API_BASE = 'https://kinopoiskapiunofficial.tech/api';

// Состояние приложения
let excludedKeywords = new Set();

// DOM элементы
const yearInput = document.getElementById('yearInput');
const genreSelect = document.getElementById('genreSelect');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessageDiv = document.getElementById('errorMessage');
const customExcludeInput = document.getElementById('customExclude');
const addExcludeBtn = document.getElementById('addExcludeBtn');
const activeExcludesDiv = document.getElementById('activeExcludes');

// Добавление тегов исключений из готовых чипов
document.querySelectorAll('.exclude-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const keyword = tag.getAttribute('data-tag');
        if (!excludedKeywords.has(keyword)) {
            excludedKeywords.add(keyword);
            renderExcludeBadges();
        }
    });
});

// Добавление своей темы
addExcludeBtn.addEventListener('click', () => {
    const customWord = customExcludeInput.value.trim().toLowerCase();
    if (customWord && !excludedKeywords.has(customWord)) {
        excludedKeywords.add(customWord);
        renderExcludeBadges();
        customExcludeInput.value = '';
    }
});

function renderExcludeBadges() {
    activeExcludesDiv.innerHTML = '';
    excludedKeywords.forEach(keyword => {
        const badge = document.createElement('div');
        badge.className = 'exclude-badge';
        badge.innerHTML = `🚫 ${keyword} <button class="remove-exclude" data-word="${keyword}">✕</button>`;
        activeExcludesDiv.appendChild(badge);
    });
    
    document.querySelectorAll('.remove-exclude').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const word = btn.getAttribute('data-word');
            excludedKeywords.delete(word);
            renderExcludeBadges();
        });
    });
}

// Проверка описания на запрещенные слова
function isDescriptionValid(description) {
    if (!description) return true;
    const lowerDesc = description.toLowerCase();
    for (let keyword of excludedKeywords) {
        if (lowerDesc.includes(keyword)) {
            console.log(`Исключено из-за: ${keyword}`);
            return false;
        }
    }
    return true;
}

// Получение фильмов по году и жанру (используем поиск + фильтрация)
async function searchMovies() {
    const year = yearInput.value.trim();
    const genre = genreSelect.value;
    
    if (!year || year < 1890 || year > 2030) {
        showError('Введите корректный год (1890-2030)');
        return;
    }
    
    showLoading(true);
    resultsContainer.innerHTML = '';
    errorMessageDiv.classList.add('hidden');
    
    try {
        // Шаг 1: Получаем фильмы по году через топ-листы или поиск
        // Используем API: /api/v2.2/films?order=RATING&type=ALL&ratingFrom=0&yearFrom={year}&yearTo={year}
        let url = `${API_BASE}/v2.2/films?order=RATING&type=ALL&ratingFrom=1&yearFrom=${year}&yearTo=${year}&page=1`;
        
        if (genre) {
            // Получаем ID жанра (упрощенно — в реальном API нужно передавать жанр через фильтр)
            // kinopoisk api имеет фильтр "genres" но требует ID. Для демо сделаем клиентскую фильтрацию.
            url = `${API_BASE}/v2.2/films?order=RATING&type=ALL&ratingFrom=1&yearFrom=${year}&yearTo=${year}&page=1`;
        }
        
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) throw new Error('Неверный API ключ. Получите ключ на kinopoiskapiunofficial.tech');
            throw new Error(`Ошибка API: ${response.status}`);
        }
        
        const data = await response.json();
        let movies = data.items || [];
        
        // Фильтрация по жанру (на клиенте, т.к. API v2.2 фильтрует сложнее)
        if (genre) {
            movies = movies.filter(movie => {
                if (!movie.genres) return false;
                return movie.genres.some(g => g.genre.toLowerCase().includes(genre.toLowerCase()));
            });
        }
        
        // Добираем рецензии и описания для каждого фильма
        const fullMovies = [];
        for (let movie of movies.slice(0, 15)) { // лимит 15 фильмов
            try {
                const details = await fetchMovieDetails(movie.filmId);
                if (details && isDescriptionValid(details.description)) {
                    fullMovies.push({
                        ...movie,
                        description: details.description || 'Описание отсутствует',
                        reviews: details.reviews || []
                    });
                } else if (details && !isDescriptionValid(details.description)) {
                    console.log(`Фильм "${movie.nameRu}" исключен по описанию`);
                }
            } catch (err) {
                console.warn(`Ошибка загрузки деталей ${movie.filmId}`, err);
            }
        }
        
        displayMovies(fullMovies);
        
        if (fullMovies.length === 0) {
            resultsContainer.innerHTML = `<div class="error-message" style="display:block; grid-column:1/-1;">😢 Нет фильмов, подходящих под все критерии. Попробуйте другой год или исключите меньше тем.</div>`;
        }
        
    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function fetchMovieDetails(filmId) {
    const detailUrl = `${API_BASE}/v2.2/films/${filmId}`;
    const resp = await fetch(detailUrl, {
        headers: { 'X-API-KEY': API_KEY }
    });
    if (!resp.ok) return null;
    const filmData = await resp.json();
    
    let description = filmData.description || filmData.shortDescription || '';
    
    // Пытаемся получить рецензии (для красоты)
    let reviews = [];
    try {
        const reviewUrl = `${API_BASE}/v2.2/films/${filmId}/reviews?page=1`;
        const revResp = await fetch(reviewUrl, {
            headers: { 'X-API-KEY': API_KEY }
        });
        if (revResp.ok) {
            const revData = await revResp.json();
            reviews = revData.items?.slice(0, 1) || [];
        }
    } catch(e) {}
    
    return { description, reviews };
}

function displayMovies(movies) {
    if (!movies.length) return;
    
    resultsContainer.innerHTML = movies.map(movie => {
        const posterUrl = movie.posterUrlPreview || 'https://via.placeholder.com/300x400?text=Нет+постера';
        const title = movie.nameRu || movie.nameOriginal || 'Без названия';
        const yearMovie = movie.year;
        const rating = movie.ratingKinopoisk ? `⭐ ${movie.ratingKinopoisk.toFixed(1)}` : 'Нет рейтинга';
        const descriptionText = movie.description || 'Описание не загружено';
        const reviewText = movie.reviews && movie.reviews[0] ? 
            `🗣 Рецензия: ${movie.reviews[0].title || 'Мнение'}: ${movie.reviews[0].review?.substring(0, 120)}...` : 
            '📝 Рецензий пока нет';
        
        return `
            <div class="movie-card">
                <img class="movie-poster" src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=Постер+недоступен'">
                <div class="movie-info">
                    <div class="movie-title">${title}</div>
                    <div class="movie-year">${yearMovie} • ${rating}</div>
                    <div class="description">${escapeHtml(descriptionText.substring(0, 150))}${descriptionText.length > 150 ? '…' : ''}</div>
                    <div class="review">${escapeHtml(reviewText)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

function showError(msg) {
    errorMessageDiv.textContent = `⚠️ ${msg}`;
    errorMessageDiv.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
    } else {
        loadingIndicator.classList.add('hidden');
        searchBtn.disabled = false;
    }
}

searchBtn.addEventListener('click', searchMovies);
window.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
});

// Инициализация
renderExcludeBadges();
