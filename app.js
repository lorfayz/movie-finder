const TMDB_API_KEY = 'f6cd8b128495cd6bb3ab36b3c8877464'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let excludedKeywords = new Set();

const yearInput = document.getElementById('yearInput');
const genreSelect = document.getElementById('genreSelect');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessageDiv = document.getElementById('errorMessage');
const customExcludeInput = document.getElementById('customExclude');
const addExcludeBtn = document.getElementById('addExcludeBtn');
const activeExcludesDiv = document.getElementById('activeExcludes');

document.querySelectorAll('.exclude-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const keyword = tag.getAttribute('data-tag');
        if (!excludedKeywords.has(keyword)) {
            excludedKeywords.add(keyword);
            renderExcludeBadges();
        }
    });
});

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
async function searchMovies() {
    const year = yearInput.value.trim();
    const genreId = genreSelect.value;
    
    if (!year || year < 1890 || year > 2030) {
        showError('Введите корректный год (1890-2030)');
        return;
    }
    
    showLoading(true);
    resultsContainer.innerHTML = '';
    errorMessageDiv.classList.add('hidden');
    
    try {
        let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ru-RU&sort_by=vote_count.desc&primary_release_year=${year}&page=1`;
        
        if (genreId) {
            url += `&with_genres=${genreId}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Неверный API ключ TMDB. Получите бесплатный ключ на themoviedb.org');
            }
            throw new Error(`Ошибка API: ${response.status}`);
        }
        
        const data = await response.json();
        let movies = data.results || [];
        
        if (movies.length === 0) {
            resultsContainer.innerHTML = `<div class="error-message" style="display:block; grid-column:1/-1;">😢 Нет фильмов за ${year} год. Попробуйте другой год.</div>`;
            showLoading(false);
            return;
        }
        
        const fullMovies = [];
        for (let movie of movies.slice(0, 12)) { 
            try {
                const details = await fetchMovieDetails(movie.id);
                const reviews = await fetchMovieReviews(movie.id);
                
                if (details && isDescriptionValid(details.overview)) {
                    fullMovies.push({
                        ...movie,
                        overview: details.overview || 'Описание отсутствует',
                        vote_average: movie.vote_average || 0,
                        reviews: reviews,
                        release_date: movie.release_date
                    });
                } else if (details && !isDescriptionValid(details.overview)) {
                    console.log(`Фильм "${movie.title}" исключен по описанию`);
                }
            } catch (err) {
                console.warn(`Ошибка загрузки деталей фильма ${movie.id}`, err);
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

async function fetchMovieDetails(movieId) {
    const detailUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ru-RU`;
    const resp = await fetch(detailUrl);
    if (!resp.ok) return null;
    return await resp.json();
}

async function fetchMovieReviews(movieId) {
    try {
        const reviewUrl = `${TMDB_BASE_URL}/movie/${movieId}/reviews?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
        const resp = await fetch(reviewUrl);
        if (!resp.ok) return [];
        const data = await resp.json();
        return data.results || [];
    } catch(e) {
        console.warn('Ошибка загрузки рецензий', e);
        return [];
    }
}

function displayMovies(movies) {
    if (!movies.length) return;
    
    resultsContainer.innerHTML = movies.map(movie => {
        const posterUrl = movie.poster_path 
            ? `${IMAGE_BASE_URL}${movie.poster_path}` 
            : 'https://via.placeholder.com/300x450?text=Нет+постера';
        
        const title = movie.title || movie.original_title || 'Без названия';
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? `⭐ ${movie.vote_average.toFixed(1)}/10` : 'Нет рейтинга';
        const descriptionText = movie.overview || 'Описание не загружено';
        
        let reviewsHtml = '';
        if (movie.reviews && movie.reviews.length > 0) {
            const topReview = movie.reviews[0];
            reviewsHtml = `
                <div class="review">
                    <strong>✍️ ${topReview.author || 'Критик'}:</strong><br>
                    "${topReview.content ? topReview.content.substring(0, 120) : 'Нет текста'}${topReview.content?.length > 120 ? '…' : ''}"
                </div>
            `;
        } else {
            reviewsHtml = `<div class="review">📝 Рецензий пока нет</div>`;
        }
        
        return `
            <div class="movie-card">
                <img class="movie-poster" src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Постер+недоступен'">
                <div class="movie-info">
                    <div class="movie-title">${escapeHtml(title)}</div>
                    <div class="movie-year">${year} • ${rating}</div>
                    <div class="description">${escapeHtml(descriptionText.substring(0, 150))}${descriptionText.length > 150 ? '…' : ''}</div>
                    ${reviewsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    if (e.key === 'Enter' && document.activeElement !== customExcludeInput) {
        searchMovies();
    }
});

renderExcludeBadges();

if (TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
    showError('⚠️ Пожалуйста, получите бесплатный API ключ на themoviedb.org и вставьте его в script.js (TMDB_API_KEY)');
}
