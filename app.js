const API_KEY = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88'; 
const API_HOST = 'kinopoiskapiunofficial.tech';

// Генерация списка годов (1950 - текущий)
function populateYears() {
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1950; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }
}

// Исключённые ключевые слова
function containsExcludedKeywords(description, excludeList) {
    if (!description || excludeList.length === 0) return false;
    const lowerDesc = description.toLowerCase();
    return excludeList.some(keyword => 
        lowerDesc.includes(keyword.toLowerCase().trim())
    );
}

// Получение рецензий
async function fetchReviews(movieId) {
    try {
        const response = await fetch(`https://${API_HOST}/api/v2.2/films/${movieId}/reviews`, {
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items.slice(0, 2).map(review => ({
                author: review.author,
                text: review.review.substring(0, 200) + (review.review.length > 200 ? '...' : ''),
                rating: review.type
            }));
        }
        return [];
    } catch (e) {
        console.error('Ошибка загрузки рецензий', e);
        return [];
    }
}

// Основной поиск
async function searchMovies() {
    const year = document.getElementById('year').value;
    const genreId = document.getElementById('genre').value;
    const excludeRaw = document.getElementById('excludeKeywords').value;
    const excludeKeywords = excludeRaw ? excludeRaw.split(',').map(k => k.trim()) : [];
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<div class="no-results">⏳ Ищем идеальный фильм...</div>';
    
    // Формируем запрос к API (ищем по году)
    let url = `https://${API_HOST}/api/v2.2/films?order=RATING&type=ALL&ratingFrom=1&ratingTo=10&yearFrom=${year}&yearTo=${year}`;
    if (genreId) {
        url += `&genres=${genreId}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: {
                'X-API-KEY': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка API');
        
        const data = await response.json();
        let movies = data.items || [];
        
        // Фильтрация по исключённым словам в описании
        const filteredMovies = [];
        for (const movie of movies) {
            // Получаем полное описание фильма (нужен отдельный запрос)
            const detailResponse = await fetch(`https://${API_HOST}/api/v2.2/films/${movie.kinopoiskId}`, {
                headers: { 'X-API-KEY': API_KEY }
            });
            const details = await detailResponse.json();
            const description = details.description || details.shortDescription || '';
            
            if (containsExcludedKeywords(description, excludeKeywords)) {
                continue; // Пропускаем неподходящие фильмы
            }
            
            // Загружаем рецензии
            const reviews = await fetchReviews(movie.kinopoiskId);
            
            filteredMovies.push({
                ...movie,
                fullDescription: description,
                reviews: reviews
            });
            
            if (filteredMovies.length >= 10) break; // не перегружаем API
        }
        
        displayResults(filteredMovies, excludeKeywords);
        
    } catch (error) {
        console.error(error);
        resultsDiv.innerHTML = '<div class="no-results">❌ Ошибка загрузки. Проверь API-ключ.</div>';
    }
}

// Отображение результатов
function displayResults(movies, excludeKeywords) {
    const resultsDiv = document.getElementById('results');
    
    if (movies.length === 0) {
        resultsDiv.innerHTML = `<div class="no-results">😢 Нет фильмов без тем: ${excludeKeywords.join(', ') || '—'}</div>`;
        return;
    }
    
    resultsDiv.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <img class="movie-poster" src="${movie.posterUrlPreview || 'https://via.placeholder.com/200x300?text=Нет+постера'}" alt="${movie.nameRu}">
            <div class="movie-title">${movie.nameRu || movie.nameEn || 'Без названия'}</div>
            <div class="movie-year">${movie.year} | Рейтинг: ${movie.ratingKinopoisk || '—'}</div>
            <div class="movie-description">${movie.fullDescription || 'Описание отсутствует'}</div>
            ${renderReviews(movie.reviews)}
        </div>
    `).join('');
}

function renderReviews(reviews) {
    if (!reviews || reviews.length === 0) {
        return '<div class="review">⭐ Нет рецензий</div>';
    }
    return reviews.map(r => `
        <div class="review">
            <div class="review-author">✍️ ${r.author}</div>
            <div>${r.text}</div>
        </div>
    `).join('');
}

// Запуск
populateYears();
document.getElementById('searchBtn').addEventListener('click', searchMovies);
