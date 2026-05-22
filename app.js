const appState = {
    allGenres: [],
    selectedGenres: [],
    excludedKeywords: [],
    currentMovies: [],
    filters: {
        yearFrom: 2000,
        yearTo: 2024,
        genres: [],
        sortBy: 'popularity.desc',
        minRating: 0
    }
};


const DOM = {
    yearFrom: document.getElementById('year-from'),
    yearTo: document.getElementById('year-to'),
    yearFromValue: document.getElementById('year-from-value'),
    yearToValue: document.getElementById('year-to-value'),
    genresContainer: document.getElementById('genres-container'),
    keywordInput: document.getElementById('keyword-input'),
    excludeKeywordsContainer: document.getElementById('exclude-keywords'),
    sortBy: document.getElementById('sort-by'),
    ratingFilter: document.getElementById('rating-filter'),
    ratingValue: document.getElementById('rating-value'),
    searchBtn: document.getElementById('search-btn'),

    moviesGrid: document.getElementById('movies-grid'),
    loading: document.getElementById('loading'),
    noResults: document.getElementById('no-results'),

    modal: document.getElementById('modal'),
    modalClose: document.getElementById('modal-close'),
    modalPoster: document.getElementById('modal-poster'),
    modalTitle: document.getElementById('modal-title'),
    modalYear: document.getElementById('modal-year'),
    modalGenre: document.getElementById('modal-genre'),
    modalRating: document.getElementById('modal-rating'),
    modalOverview: document.getElementById('modal-overview'),
    modalReviews: document.getElementById('modal-reviews'),
    modalVoteCount: document.getElementById('modal-vote-count'),
    modalRuntime: document.getElementById('modal-runtime'),
    modalCountry: document.getElementById('modal-country'),
    modalLanguage: document.getElementById('modal-language'),
    modalBudget: document.getElementById('modal-budget'),
    modalRevenue: document.getElementById('modal-revenue'),
    modalTmdbLink: document.getElementById('modal-tmdb-link')
};

async function initApp() {
    console.log('🎬 Инициализация FilmFinder...');
    
 
    appState.allGenres = await fetchGenres();
    renderGenres();


    attachEventListeners();

    console.log('✅ FilmFinder готов к работе');
}

function attachEventListeners() {

    DOM.searchBtn.addEventListener('click', handleSearch);

    DOM.yearFrom.addEventListener('input', updateYearValues);
    DOM.yearTo.addEventListener('input', updateYearValues);

    DOM.sortBy.addEventListener('change', updateFilters);
    DOM.ratingFilter.addEventListener('input', updateRatingValue);

    DOM.keywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addExcludedKeyword();
        }
    });

    DOM.modalClose.addEventListener('click', closeModal);
    DOM.modal.addEventListener('click', (e) => {
        if (e.target === DOM.modal) {
            closeModal();
        }
    });

    console.log('✅ Слушатели событий установлены');
}

function renderGenres() {
    DOM.genresContainer.innerHTML = '';
    appState.allGenres.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = 'genre-btn';
        btn.textContent = genre.name;
        btn.dataset.id = genre.id;
        
        btn.addEventListener('click', () => toggleGenre(genre.id, btn));
        
        DOM.genresContainer.appendChild(btn);
    });
}


function toggleGenre(genreId, btn) {
    const index = appState.selectedGenres.indexOf(genreId);
    
    if (index > -1) {
        appState.selectedGenres.splice(index, 1);
        btn.classList.remove('active');
    } else {
        appState.selectedGenres.push(genreId);
        btn.classList.add('active');
    }

    appState.filters.genres = appState.selectedGenres;
    console.log('🎬 Выбранные жанры:', appState.selectedGenres);
}


function updateYearValues() {
    let valueFrom = parseInt(DOM.yearFrom.value);
    let valueTo = parseInt(DOM.yearTo.
    if (valueFrom > valueTo) {
        [valueFrom, valueTo] = [valueTo, valueFrom];
        DOM.yearFrom.value = valueFrom;
        DOM.yearTo.value = valueTo;
    }

    DOM.yearFromValue.textContent = valueFrom;
    DOM.yearToValue.textContent = valueTo;

    appState.filters.yearFrom = valueFrom;
    appState.filters.yearTo = valueTo;

    console.log(`📅 Год: ${valueFrom} - ${valueTo}`);
}
function addExcludedKeyword() {
    const keyword = DOM.keywordInput.value.trim().toLowerCase();

    if (!keyword) return;
    if (appState.excludedKeywords.includes(keyword)) {
        alert('Это слово уже добавлено!');
        return;
    }

    appState.excludedKeywords.push(keyword);
    DOM.keywordInput.value = '';
    renderExcludedKeywords();

    console.log('🚫 Исключённые слова:', appState.excludedKeywords);
}

function renderExcludedKeywords() {
    DOM.excludeKeywordsContainer.innerHTML = '';
    appState.excludedKeywords.forEach(keyword => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${keyword}
            <button type="button" title="Удалить">×</button>
        `;

        tag.querySelector('button').addEventListener('click', () => {
            removeExcludedKeyword(keyword);
        });

        DOM.excludeKeywordsContainer.appendChild(tag);
    });
}

function removeExcludedKeyword(keyword) {
    appState.excludedKeywords = appState.excludedKeywords.filter(k => k !== keyword);
    renderExcludedKeywords();
    console.log('🚫 Слово удалено:', keyword);
}

function containsExcludedKeywords(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return appState.excludedKeywords.some(keyword => 
        lowerText.includes(keyword)
    );
}

 * Отфильтровать фильмы по исключённым словам
 * ПРИВЯЗКА: handleSearch() → f
function filterMoviesByKeywords(movies) {
    return movies.filter(movie => {
        const overview = movie.overview || '';
        const title = movie.title || '';
        
        return !containsExcludedKeywords(overview) && 
               !containsExcludedKeywords(title);
    });
}

function updateRatingValue() {
    const value = DOM.ratingFilter.value;
    DOM.ratingValue.textContent = value;
    appState.filters.minRating = parseFloat(value);
    console.log('⭐ Минимальный рейтинг:', appState.filters.minRating);
}

function updateFilters() {
    appState.filters.sortBy = DOM.sortBy.value;
    console.log('🔄 Сортировка:', appState.filters.sortBy);
}

async function handleSearch() {
    console.log('🔍 Начинаю поиск с фильтрами:', appState.filters);

    showLoading();

    try {
        const movies = await searchMovies(appState.filters);
        console.log(`📽️ Найдено фильмов: ${movies.length}`);

        const filtered = filterMoviesByKeywords(movies);
        console.log(`✅ После фильтрации по словам: ${filtered.length}`);

        appState.currentMovies = filtered;

        renderMovies(filtered);

    } catch (error) {
        console.error('❌ Ошибка при поиске:', error);
    } finally {
        hideLoading();
    }
}

function renderMovies(movies) {
    DOM.moviesGrid.innerHTML = '';

    if (movies.length === 0) {
        DOM.noResults.classList.remove('hidden');
        return;
    }

    DOM.noResults.classList.add('hidden');

    movies.forEach(movie => {
        const card = createMovieCard(movie);
        DOM.moviesGrid.appendChild(card);

        // Привязать клик к карточке
        card.addEventListener('click', () => openMovieModal(movie.id));
    });

    console.log(`🎬 Отрендерено ${movies.length} фильмов`);
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.cursor = 'pointer';

    const genreNames = (movie.genre_ids || [])
        .map(id => {
            const genre = appState.allGenres.find(g => g.id === id);
            return genre ? genre.name : '';
        })
        .filter(Boolean);

    const posterHTML = movie.poster_path
        ? `<img src="${IMG_BASE_URL}${movie.poster_path}" alt="${movie.title}" loading="lazy">`
        : '<div class="movie-no-image"><i class="fas fa-image"></i></div>';

    const rating = (movie.vote_average || 0).toFixed(1);
    const ratingColor = rating >= 7 ? 'var(--success-color)' : 
                       rating >= 5 ? 'var(--warning-color)' : 
                       'var(--primary-color)';

    card.innerHTML = `
        <div class="movie-poster">
            ${posterHTML}
            <div class="movie-rating-badge" style="background: ${ratingColor}">
                ⭐ ${rating}
            </div>
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                <span class="movie-stars">⭐ ${rating}</span>
            </div>
            <p class="movie-description">${movie.overview ? movie.overview.substring(0, 100) + '...' : 'Описание недоступно'}</p>
            <div class="movie-genres">
                ${genreNames.slice(0, 3).map(genre => 
                    `<span class="genre-badge">${genre}</span>`
                ).join('')}
            </div>
        </div>
    `;

    return card;
}

async function openMovieModal(movieId) {
    console.log('📖 Открываю модальное окно для фильма:', movieId);

    DOM.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const [details, reviews] = await Promise.all([
        fetchMovieDetails(movieId),
        fetchMovieReviews(movieId)
    ]);

    if (!details) return;

    populateModal(details, reviews);
}


function populateModal(details, reviews) {
    const year = details.release_date ? details.release_date.split('-')[0] : 'N/A';
    const rating = (details.vote_average || 0).toFixed(1);
    const genres = details.genres.map(g => g.name).join(', ');
    const runtime = details.runtime ? `${details.runtime} мин` : 'N/A';


    DOM.modalPoster.src = details.poster_path 
        ? `${IMG_LARGE_URL}${details.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Image';
    
    DOM.modalTitle.textContent = details.title;
    DOM.modalYear.textContent = year;
    DOM.modalGenre.textContent = genres || 'Неизвестно';
    DOM.modalRating.textContent = `${rating} / 10`;
    DOM.modalOverview.textContent = details.overview || 'Описание недоступно';
    DOM.modalVoteCount.textContent = (details.vote_count || 0).toLocaleString();
    DOM.modalRuntime.textContent = runtime;

    const countries = (details.production_countries || [])
        .map(c => getCountryName(c.iso_3166_1))
        .join(', ');
    
    const languages = (details.spoken_languages || [])
        .map(l => getLanguageName(l.iso_639_1))
        .join(', ');

    DOM.modalCountry.textContent = countries || 'Неизвестно';
    DOM.modalLanguage.textContent = languages || 'Неизвестно';
    DOM.modalBudget.textContent = formatCurrency(details.budget);
    DOM.modalRevenue.textContent = formatCurrency(details.revenue);

    DOM.modalTmdbLink.href = `https://www.themoviedb.org/movie/${details.id}`;

    renderReviews(reviews);

    console.log('✅ Модальное окно заполнено');
}
function renderReviews(reviews) {
    DOM.modalReviews.innerHTML = '';

    if (reviews.length === 0) {
        DOM.modalReviews.innerHTML = '<p style="color: var(--text-secondary);">Рецензии не найдены</p>';
        return;
    }

    reviews.slice(0, 5).forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review';

        const rating = review.author_details?.rating 
            ? `⭐ ${review.author_details.rating} / 10`
            : '';

        reviewEl.innerHTML = `
            <div class="review-author">👤 ${review.author}</div>
            ${rating ? `<div class="review-rating">${rating}</div>` : ''}
            <div class="review-text">${review.content.substring(0, 300)}...</div>
        `;

        DOM.modalReviews.appendChild(reviewEl);
    });
}

function closeModal() {
    DOM.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    console.log('❌ Модальное окно закрыто');
}

function showLoading() {
    DOM.loading.classList.remove('hidden');
    DOM.moviesGrid.innerHTML = '';
    DOM.noResults.classList.add('hidden');
}

function hideLoading() {
    DOM.loading.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initApp);
