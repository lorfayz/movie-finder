const TMDB_API_KEY = 'f6cd8b128495cd6bb3ab36b3c8877464';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentFilters = {
    year: null,
    genreId: null,
    excludeKeywords: []
};
let totalResults = 0;

function populateYears() {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    
    for (let y = currentYear; y >= 1950; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = `${y} год`;
        yearSelect.appendChild(option);
    }
}

function updateStatus(message, isError = false) {
    const statusBar = document.getElementById('statusBar');
    statusBar.textContent = message;
    statusBar.style.color = isError ? '#ff6b6b' : '#aaa';

    setTimeout(() => {
        if (statusBar.textContent === message) {
            statusBar.textContent = 'Готов к поиску';
            statusBar.style.color = '#aaa';
        }
    }, 3000);
}

function containsExcludedKeywords(text, excludeList) {
    if (!text || excludeList.length === 0) return false;
    const lowerText = text.toLowerCase();
    return excludeList.some(keyword => {
        const trimmedKeyword = keyword.toLowerCase().trim();
        return trimmedKeyword && lowerText.includes(trimmedKeyword);
    });
}

async function fetchReviews(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}/reviews?api_key=${TMDB_API_KEY}&language=ru-RU`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results.slice(0, 2).map(review => ({
                author: review.author,
                text: review.content.substring(0, 200) + (review.content.length > 200 ? '...' : ''),
                rating: review.author_details.rating || 'нет оценки'
            }));
        }
        return [];
    } catch (e) {
        console.error('Ошибка рецензий:', e);
        return [];
    }
}

async function searchMovies(page = 1, isLoadMore = false) {
    const yearSelect = document.getElementById('year');
    const genreSelect = document.getElementById('genre');
    const excludeInput = document.getElementById('excludeKeywords');
    
    const year = yearSelect.value;
    const genreId = genreSelect.value;
    const excludeRaw = excludeInput.value;
    const excludeKeywords = excludeRaw ? excludeRaw.split(',').map(k => k.trim()).filter(k => k) : [];
    
    currentFilters = { year, genreId, excludeKeywords };
    currentPage = page;
    
    const resultsDiv = document.getElementById('results');
    
    if (!isLoadMore) {
        resultsDiv.innerHTML = '<div class="no-results">⏳ Ищем идеальный фильм...</div>';
        document.getElementById('loadMoreBtn').style.display = 'none';
    }
    
    updateStatus(`🔍 Поиск фильмов за ${year} год...`);
    
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ru-RU&sort_by=vote_average.desc&vote_count.gte=50&primary_release_year=${year}&page=${page}`;
    
    if (genreId) {
        url += `&with_genres=${genreId}`;
    }
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        let movies = data.results || [];
        totalResults = data.total_results;
        
        if (movies.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">😢 Нет фильмов за этот год</div>';
            updateStatus('❌ Фильмы не найдены', true);
            return;
        }
        
        updateStatus(`📊 Найдено ${totalResults} фильмов, фильтруем...`);
        
        const filteredMovies = [];
        
        for (const movie of movies) {
            const detailResponse = await fetch(
                `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=ru-RU`
            );
            const details = await detailResponse.json();
            const description = details.overview || '';
            
            if (containsExcludedKeywords(description, excludeKeywords)) {
                continue;
            }
            
            const reviews = await fetchReviews(movie.id);
            
            filteredMovies.push({
                id: movie.id,
                title: movie.title,
                year: movie.release_date ? movie.release_date.split('-')[0] : year,
                rating: movie.vote_average ? movie.vote_average.toFixed(1) : '—',
                posterPath: movie.poster_path,
                description: description,
                reviews: reviews
            });
            
            if (filteredMovies.length >= 9) break;
        }
        
        displayResults(filteredMovies, excludeKeywords);
        
        if (filteredMovies.length > 0 && data.page < data.total_pages) {
            document.getElementById('loadMoreBtn').style.display = 'inline-block';
        } else {
            document.getElementById('loadMoreBtn').style.display = 'none';
        }
        
        updateStatus(`✅ Найдено ${filteredMovies.length} подходящих фильмов`);
        
    } catch (error) {
        console.error('Ошибка:', error);
        resultsDiv.innerHTML = `<div class="no-results">
            ❌ Ошибка: ${error.message}<br><br>
            🔑 Проверь API ключ в коде
        </div>`;
        updateStatus('❌ Ошибка подключения к TMDB', true);
    }
}

async function loadMoreMovies() {
    const nextPage = currentPage + 1;
    updateStatus(`📥 Загружаем страницу ${nextPage}...`);
    await searchMovies(nextPage, true);
}

function clearFilters() {
   
    const yearSelect = document.getElementById('year');
    const genreSelect = document.getElementById('genre');
    const excludeInput = document.getElementById('excludeKeywords');
    
    yearSelect.value = '';
    genreSelect.value = '';
    excludeInput.value = '';

    document.getElementById('loadMoreBtn').style.display = 'none';
    
    document.getElementById('results').innerHTML = '<div class="no-results">✨ Фильтры очищены. Выберите параметры и нажмите "Искать"</div>';
    
    updateStatus('🧹 Все фильтры очищены');
}

async function randomMovie() {
    updateStatus('🎲 Ищем случайный фильм...');
    
    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * (currentYear - 1970 + 1) + 1970);
    
    const yearSelect = document.getElementById('year');
    yearSelect.value = randomYear;
    
    await searchMovies(1, false);
    
    updateStatus(`🎲 Случайный год: ${randomYear}`);
}

function setupEnterSearch() {
    const excludeInput = document.getElementById('excludeKeywords');
    excludeInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchMovies(1, false);
        }
    });
}

function displayResults(movies, excludeKeywords) {
    const resultsDiv = document.getElementById('results');
    
    if (movies.length === 0) {
        resultsDiv.innerHTML = `<div class="no-results">
            😢 Нет фильмов без тем: <strong>${excludeKeywords.join(', ') || '—'}</strong><br><br>
            💡 Попробуйте:<br>
            • Убрать некоторые исключения<br>
            • Выбрать другой год<br>
            • Сменить жанр
        </div>`;
        return;
    }
    
    resultsDiv.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <img class="movie-poster" 
                 src="${movie.posterPath ? TMDB_IMAGE_URL + movie.posterPath : 'https://via.placeholder.com/500x750?text=Нет+постера'}" 
                 alt="${movie.title}">
            <div class="movie-title">🎬 ${movie.title}</div>
            <div class="movie-year">📅 ${movie.year} | ⭐ Рейтинг: ${movie.rating}/10</div>
            <div class="movie-description">📝 ${movie.description || 'Описание отсутствует'}</div>
            ${renderReviews(movie.reviews)}
        </div>
    `).join('');
}

function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<div class="review">📝 Нет доступных рецензий</div>';
    }
    
    return reviews.map(r => `
        <div class="review">
            <div class="review-author">✍️ ${r.author}</div>
            <div>💬 ${r.text}</div>
            ${r.rating !== 'нет оценки' ? `<div>⭐ Оценка: ${r.rating}/10</div>` : ''}
        </div>
    `).join('');
}

function setupEventListeners() {
    const searchButton = document.getElementById('searchBtn');
    searchButton.addEventListener('click', () => searchMovies(1, false));
    
    const clearButton = document.getElementById('clearFiltersBtn');
    clearButton.addEventListener('click', clearFilters);
    
    const loadMoreButton = document.getElementById('loadMoreBtn');
    loadMoreButton.addEventListener('click', loadMoreMovies);
    
    const randomButton = document.getElementById('randomMovieBtn');
    randomButton.addEventListener('click', randomMovie);
    
    setupEnterSearch();
    
    console.log('✅ Все связи интерфейса настроены!');
}

populateYears();
setupEventListeners();

console.log('🎬 Приложение готово! Связи:');
console.log('• Кнопка "Искать" → searchMovies()');
console.log('• Кнопка "Очистить" → clearFilters()');
console.log('• Кнопка "Загрузить ещё" → loadMoreMovies()');
console.log('• Кнопка "Случайный фильм" → randomMovie()');
console.log('• Поле исключений + Enter → searchMovies()');
