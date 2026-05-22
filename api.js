const API_KEY = 'f6cd8b128495cd6bb3ab36b3c8877464';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_LARGE_URL = 'https://image.tmdb.org/t/p/w780';


async function fetchGenres() {
    try {
        const response = await fetch(
            `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=ru-RU`
        );
        const data = await response.json();
        return data.genres || [];
    } catch (error) {
        console.error('Ошибка при загрузке жанров:', error);
        return [];
    }
}


async function searchMovies(filters) {
    try {
        const {
            yearFrom,
            yearTo,
            genres,
            sortBy,
            minRating,
            page = 1
        } = filters;

        const params = new URLSearchParams({
            api_key: API_KEY,
            language: 'ru-RU',
            sort_by: sortBy || 'popularity.desc',
            page: page,
            'vote_average.gte': minRating || 0,
            'release_date.gte': `${yearFrom}-01-01`,
            'release_date.lte': `${yearTo}-12-31`,
            with_genres: genres.join(','),
            include_adult: false,
            region: 'RU'
        });

        const response = await fetch(
            `${BASE_URL}/discover/movie?${params.toString()}`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Ошибка при поиске фильмов:', error);
        return [];
    }
}

async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ru-RU`
        );
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке деталей фильма:', error);
        return null;
    }
}


async function fetchMovieReviews(movieId) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}/reviews?api_key=${API_KEY}&language=ru-RU`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Ошибка при загрузке рецензий:', error);
        return [];
    }
}

async function fetchMovieRatings(movieId) {
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=ru-RU`
        );
        const data = await response.json();
        return [
            {
                source: 'TMDB',
                rating: data.vote_average.toFixed(1),
                count: data.vote_count
            }
        ];
    } catch (error) {
        console.error('Ошибка при загрузке рейтингов:', error);
        return [];
    }
}

function formatCurrency(amount) {
    if (!amount) return 'Неизвестно';
    if (amount >= 1000000000) {
        return `$${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString()}`;
}

function getCountryName(code) {
    const countries = {
        'US': 'США',
        'GB': 'Великобритания',
        'FR': 'Франция',
        'DE': 'Германия',
        'JP': 'Япония',
        'RU': 'Россия',
        'KR': 'Южная Корея',
        'IN': 'Индия',
        'CN': 'Китай'
    };
    return countries[code] || code;
}

function getLanguageName(code) {
    const languages = {
        'en': 'Английский',
        'ru': 'Русский',
        'fr': 'Французский',
        'de': 'Немецкий',
        'es': 'Испанский',
        'ja': 'Японский',
        'ko': 'Корейский',
        'zh': 'Китайский',
        'hi': 'Хинди'
    };
    return languages[code] || code;
}
