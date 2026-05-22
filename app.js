const API_KEY  = '2b8b737c-2fb6-4c31-8e0c-62c9a2a1dc88';
const API_BASE = 'https://kinopoiskapiunofficial.tech/api';

let excludedKeywords = new Set();

const yearInput         = document.getElementById('yearInput');
const genreSelect       = document.getElementById('genreSelect');
const searchBtn         = document.getElementById('searchBtn');
const resultsContainer  = document.getElementById('resultsContainer');
const loadingIndicator  = document.getElementById('loadingIndicator');
const errorMessageDiv   = document.getElementById('errorMessage');
const customExcludeInput= document.getElementById('customExclude');
const addExcludeBtn     = document.getElementById('addExcludeBtn');
const activeExcludesDiv = document.getElementById('activeExcludes');

document.querySelectorAll('.exclude-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const keyword = tag.getAttribute('data-tag');
        if (keyword && !excludedKeywords.has(keyword)) {
            excludedKeywords.add(keyword);
            renderExcludeBadges();
        }
    });
});

addExcludeBtn.addEventListener('click', addCustomExclude);

customExcludeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addCustomExclude();
});

function addCustomExclude() {
    const word = customExcludeInput.value.trim().toLowerCase();
    if (word && !excludedKeywords.has(word)) {
        excludedKeywords.add(word);
        renderExcludeBadges();
        customExcludeInput.value = '';
    }
}

function renderExcludeBadges() {
    activeExcludesDiv.innerHTML = '';

    excludedKeywords.forEach(keyword => {
        const badge = document.createElement('div');
        badge.className = 'exclude-badge';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-exclude';
        removeBtn.textContent = '✕';
        removeBtn.setAttribute('aria-label', `Удалить "${keyword}"`);
        removeBtn.addEventListener('click', () => {
            excludedKeywords.delete(keyword);
            renderExcludeBadges();
        });

        badge.textContent = `🚫 ${keyword} `;
        badge.appendChild(removeBtn);
        activeExcludesDiv.appendChild(badge);
    });
}

function isDescriptionValid(description) {
    if (!description) return true;
    const lower = description.toLowerCase();
    for (const kw of excludedKeywords) {
        if (lower.includes(kw)) {
            console.log(`[фильтр] Исключено из-за слова: "${kw}"`);
            return false;
        }
    }
    return true;
}

async function searchMovies() {
    const year  = yearInput.value.trim();
    const genre = genreSelect.value;

    if (!year || year < 1890 || year > 2030) {
        showError('Введите корректный год (1890–2030)');
        return;
    }

    showLoading(true);
    resultsContainer.innerHTML = '';
    errorMessageDiv.classList.add('hidden');

    try {
        const url =
            `${API_BASE}/v2.2/films` +
            `?order=RATING&type=ALL&ratingFrom=1` +
            `&yearFrom=${year}&yearTo=${year}&page=1`;

        const response = await fetch(url, {
            headers: {
                'X-API-KEY'   : API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401)
                throw new Error('Неверный API-ключ. Получите новый на kinopoiskapiunofficial.tech');
            throw new Error(`Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        let movies = data.items || [];

        if (genre) {
            movies = movies.filter(m =>
                Array.isArray(m.genres) &&
                m.genres.some(g => g.genre.toLowerCase().includes(genre.toLowerCase()))
            );
        }

        const fullMovies = [];
        for (const movie of movies.slice(0, 15)) {
            try {
                const details = await fetchMovieDetails(movie.filmId);
                if (!details) continue;

                if (isDescriptionValid(details.description)) {
                    fullMovies.push({
                        ...movie,
                        description: details.description || 'Описание отсутствует',
                        reviews    : details.reviews || []
                    });
                } else {
                    console.log(`[фильтр] Пропущен: "${movie.nameRu}"`);
                }
            } catch (err) {
                console.warn(`Ошибка деталей id=${movie.filmId}:`, err);
            }
        }

        displayMovies(fullMovies);

        if (fullMovies.length === 0) {
            resultsContainer.innerHTML =
                `<div class="error-message" style="display:block;grid-column:1/-1;">
                    😢 Нет фильмов, подходящих под все критерии.<br>
                    Попробуйте другой год или уберите лишние исключения.
                 </div>`;
        }

    } catch (error) {
        console.error(error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

async function fetchMovieDetails(filmId) {
    const resp = await fetch(`${API_BASE}/v2.2/films/${filmId}`, {
        headers: { 'X-API-KEY': API_KEY }
    });
    if (!resp.ok) return null;

    const film = await resp.json();
    const description = film.description || film.shortDescription || '';

    let reviews = [];
    try {
        const revResp = await fetch(
            `${API_BASE}/v2.2/films/${filmId}/reviews?page=1`,
            { headers: { 'X-API-KEY': API_KEY } }
        );
        if (revResp.ok) {
            const revData = await revResp.json();
            reviews = (revData.items || []).slice(0, 1);
        }
    } catch (_) { /* рецензии — необязательно */ }

    return { description, reviews };
}

function displayMovies(movies) {
    if (!movies.length) return;

    resultsContainer.innerHTML = movies.map(movie => {
        const poster  = movie.posterUrlPreview
            || 'https://via.placeholder.com/300x400?text=Нет+постера';
        const title   = movie.nameRu || movie.nameOriginal || 'Без названия';
        const rating  = movie.ratingKinopoisk
            ? `⭐ ${movie.ratingKinopoisk.toFixed(1)}`
            : 'Нет рейтинга';
        const desc    = movie.description || 'Описание не загружено';
        const shortDesc = escapeHtml(desc.substring(0, 150)) + (desc.length > 150 ? '…' : '');

        let reviewHtml = '📝 Рецензий пока нет';
        if (movie.reviews && movie.reviews[0]) {
            const rev = movie.reviews[0];
            const revText = (rev.review || '').substring(0, 120);
            reviewHtml = `🗣 ${escapeHtml(rev.title || 'Рецензия')}: ${escapeHtml(revText)}…`;
        }

        return `
            <div class="movie-card">
                <img
                    class="movie-poster"
                    src="${poster}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/300x400?text=Постер+недоступен'"
                >
                <div class="movie-info">
                    <div class="movie-title">${escapeHtml(title)}</div>
                    <div class="movie-year">${movie.year || '?'} • ${rating}</div>
                    <div class="description">${shortDesc}</div>
                    <div class="review">${reviewHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function showError(msg) {
    errorMessageDiv.textContent = `⚠️ ${msg}`;
    errorMessageDiv.classList.remove('hidden');
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ищем...';
    } else {
        loadingIndicator.classList.add('hidden');
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Найти идеальный фильм';
    }
}

searchBtn.addEventListener('click', searchMovies);

yearInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchMovies();
});

renderExcludeBadges();
