// ======================================================
// 1. НАСТРОЙКИ API
// ======================================================

// Вставь сюда свой TMDB API Key.
// Получить можно здесь: https://www.themoviedb.org/settings/api
const TMDB_API_KEY = "ВСТАВЬ_СЮДА_TMDB_API_KEY";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";


// ======================================================
// 2. DOM-ЭЛЕМЕНТЫ
// ======================================================

const searchForm = document.getElementById("searchForm");
const yearInput = document.getElementById("yearInput");
const genreSelect = document.getElementById("genreSelect");
const excludeInput = document.getElementById("excludeInput");

const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const loadMoreBtn = document.getElementById("loadMoreBtn");

const statusText = document.getElementById("statusText");
const results = document.getElementById("results");


// ======================================================
// 3. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
// ======================================================

let currentPage = 1;
let totalPages = 1;
let lastSearchParams = null;
let genresMap = new Map();


// ======================================================
// 4. УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ЗАПРОСА К TMDB
// ======================================================

async function tmdbRequest(path, params = {}) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "ВСТАВЬ_СЮДА_TMDB_API_KEY") {
    throw new Error("Не указан TMDB API Key. Вставь ключ в app.js.");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);

  url.searchParams.set("api_key", TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ошибка TMDB API: ${response.status}`);
  }

  return response.json();
}


// ======================================================
// 5. ЗАГРУЗКА ЖАНРОВ
// ======================================================

async function loadGenres() {
  try {
    setStatus("Загружаем жанры...");

    const data = await tmdbRequest("/genre/movie/list", {
      language: "ru-RU"
    });

    genreSelect.innerHTML = `<option value="">Любой жанр</option>`;

    data.genres.forEach((genre) => {
      genresMap.set(genre.id, genre.name);

      const option = document.createElement("option");
      option.value = genre.id;
      option.textContent = genre.name;

      genreSelect.appendChild(option);
    });

    setStatus("Выбери параметры и нажми «Найти фильмы».");
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}


// ======================================================
// 6. ПРИВЯЗКА КНОПКИ «НАЙТИ ФИЛЬМЫ»
// ======================================================
//
// Кнопка «Найти фильмы» находится внутри формы.
// Поэтому событие submit формы запускает функцию searchMovies().

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  currentPage = 1;
  results.innerHTML = "";

  const params = getSearchParams();
  lastSearchParams = params;

  searchMovies(params, false);
});


// ======================================================
// 7. ПРИВЯЗКА КНОПКИ «СБРОСИТЬ»
// ======================================================
//
// resetBtn отвечает за очистку формы, результатов и состояния.

resetBtn.addEventListener("click", function () {
  searchForm.reset();

  currentPage = 1;
  totalPages = 1;
  lastSearchParams = null;

  results.innerHTML = "";
  loadMoreBtn.classList.add("hidden");

  setStatus("Фильтры сброшены. Выбери параметры заново.");
});


// ======================================================
// 8. ПРИВЯЗКА КНОПКИ «ПОКАЗАТЬ ЕЩЁ»
// ======================================================
//
// loadMoreBtn догружает следующую страницу фильмов из TMDB.

loadMoreBtn.addEventListener("click", function () {
  if (!lastSearchParams) return;

  currentPage += 1;
  searchMovies(lastSearchParams, true);
});


// ======================================================
// 9. ДЕЛЕГИРОВАНИЕ КНОПОК «РЕЦЕНЗИИ»
// ======================================================
//
// У каждой карточки фильма есть кнопка с data-action="reviews".
// Вместо отдельного обработчика на каждую кнопку используем один общий
// обработчик клика на контейнере results.

results.addEventListener("click", function (event) {
  const button = event.target.closest('[data-action="reviews"]');

  if (!button) return;

  const movieId = button.dataset.movieId;
  const panel = document.getElementById(`reviews-${movieId}`);

  toggleReviews(movieId, button, panel);
});


// ======================================================
// 10. ПОЛУЧЕНИЕ ПАРАМЕТРОВ ПОИСКА
// ======================================================

function getSearchParams() {
  return {
    year: yearInput.value.trim(),
    genre: genreSelect.value,
    excludedTopics: parseExcludedTopics(excludeInput.value)
  };
}


// ======================================================
// 11. ОБРАБОТКА ИСКЛЮЧАЕМЫХ ТЕМ
// ======================================================
//
// Пользователь вводит:
// война, зомби, политика
//
// Получаем массив:
// ["война", "зомби", "политика"]

function parseExcludedTopics(value) {
  return value
    .split(",")
    .map((topic) => topic.trim().toLowerCase())
    .filter(Boolean);
}


// ======================================================
// 12. ПОИСК ФИЛЬМОВ
// ======================================================

async function searchMovies(params, append = false) {
  try {
    searchBtn.disabled = true;
    loadMoreBtn.disabled = true;

    setStatus("Ищем подходящие фильмы...");

    const data = await tmdbRequest("/discover/movie", {
      language: "ru-RU",
      sort_by: "popularity.desc",
      include_adult: false,
      include_video: false,
      page: currentPage,
      primary_release_year: params.year,
      with_genres: params.genre,
      "vote_count.gte": 30
    });

    totalPages = Math.min(data.total_pages, 500);

    const filteredMovies = filterMoviesByExcludedTopics(
      data.results,
      params.excludedTopics
    );

    if (!append && filteredMovies.length === 0) {
      results.innerHTML = "";
    }

    renderMovies(filteredMovies, append);

    updateLoadMoreButton();

    if (filteredMovies.length === 0) {
      setStatus(
        "На этой странице подходящих фильмов не найдено. Попробуй другой год, жанр или убери часть исключений."
      );
    } else {
      setStatus(
        `Найдено фильмов на странице: ${filteredMovies.length}. Страница ${currentPage} из ${totalPages}.`
      );
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  } finally {
    searchBtn.disabled = false;
    loadMoreBtn.disabled = false;
  }
}


// ======================================================
// 13. ФИЛЬТРАЦИЯ ПО НЕЖЕЛАТЕЛЬНЫМ ТЕМАМ
// ======================================================
//
// Проверяем название и описание фильма.
// Если там есть запрещённое слово — фильм исключается.

function filterMoviesByExcludedTopics(movies, excludedTopics) {
  if (!excludedTopics.length) {
    return movies;
  }

  return movies.filter((movie) => {
    const text = `${movie.title || ""} ${movie.overview || ""}`.toLowerCase();

    return !excludedTopics.some((topic) => text.includes(topic));
  });
}


// ======================================================
// 14. ОТРИСОВКА ФИЛЬМОВ
// ======================================================

function renderMovies(movies, append) {
  if (!append) {
    results.innerHTML = "";
  }

  const html = movies.map(createMovieCard).join("");

  results.insertAdjacentHTML("beforeend", html);
}


// ======================================================
// 15. СОЗДАНИЕ HTML-КАРТОЧКИ ФИЛЬМА
// ======================================================

function createMovieCard(movie) {
  const poster = movie.poster_path
    ? `${TMDB_IMAGE_URL}${movie.poster_path}`
    : "";

  const year = movie.release_date
    ? movie.release_date.slice(0, 4)
    : "Год неизвестен";

  const rating = movie.vote_average
    ? movie.vote_average.toFixed(1)
    : "—";

  const genres = movie.genre_ids
    .map((id) => genresMap.get(id))
    .filter(Boolean)
    .slice(0, 3);

  const overview = movie.overview
    ? movie.overview
    : "Описание для этого фильма отсутствует.";

  return `
    <article class="movie-card">
      <div class="movie-poster">
        ${
          poster
            ? `<img src="${poster}" alt="${escapeHtml(movie.title)}">`
            : ""
        }
        <div class="rating">★ ${rating}</div>
      </div>

      <div class="movie-body">
        <h2 class="movie-title">${escapeHtml(movie.title)}</h2>

        <div class="meta">
          <span class="badge">${year}</span>
          ${genres.map((genre) => `<span class="badge">${escapeHtml(genre)}</span>`).join("")}
        </div>

        <p class="overview">${escapeHtml(overview)}</p>

        <div class="card-actions">
          <button
            class="btn btn--ghost"
            type="button"
            data-action="reviews"
            data-movie-id="${movie.id}"
          >
            Показать рецензии
          </button>
        </div>

        <div id="reviews-${movie.id}" class="review-panel"></div>
      </div>
    </article>
  `;
}


// ======================================================
// 16. ПОКАЗ И СКРЫТИЕ РЕЦЕНЗИЙ
// ======================================================

async function toggleReviews(movieId, button, panel) {
  const isOpen = panel.classList.contains("open");

  if (isOpen) {
    panel.classList.remove("open");
    button.textContent = "Показать рецензии";
    return;
  }

  panel.classList.add("open");
  button.textContent = "Скрыть рецензии";

  if (panel.dataset.loaded === "true") {
    return;
  }

  panel.innerHTML = `<p class="overview">Загружаем рецензии...</p>`;

  try {
    const reviews = await loadMovieReviews(movieId);

    panel.dataset.loaded = "true";

    if (!reviews.length) {
      panel.innerHTML = `
        <p class="overview">
          У этого фильма пока нет рецензий в TMDB.
        </p>
      `;
      return;
    }

    panel.innerHTML = reviews
      .slice(0, 3)
      .map(createReviewHtml)
      .join("");
  } catch (error) {
    console.error(error);
    panel.innerHTML = `
      <p class="overview">
        Не удалось загрузить рецензии.
      </p>
    `;
  }
}


// ======================================================
// 17. ЗАГРУЗКА РЕЦЕНЗИЙ ФИЛЬМА
// ======================================================
//
// Сначала пробуем получить русскоязычные рецензии.
// Если их нет, пробуем английские.

async function loadMovieReviews(movieId) {
  const ruData = await tmdbRequest(`/movie/${movieId}/reviews`, {
    language: "ru-RU",
    page: 1
  });

  if (ruData.results && ruData.results.length > 0) {
    return ruData.results;
  }

  const enData = await tmdbRequest(`/movie/${movieId}/reviews`, {
    language: "en-US",
    page: 1
  });

  return enData.results || [];
}


// ======================================================
// 18. HTML ДЛЯ ОДНОЙ РЕЦЕНЗИИ
// ======================================================

function createReviewHtml(review) {
  const author = review.author || "Аноним";
  const rating = review.author_details?.rating;

  const ratingText = rating
    ? `Оценка автора: ${rating}/10`
    : "Без оценки автора";

  const content = truncateText(review.content || "", 650);

  return `
    <div class="review">
      <strong>${escapeHtml(author)} · ${escapeHtml(ratingText)}</strong>
      <p>${escapeHtml(content)}</p>
      ${
        review.url
          ? `<a href="${review.url}" target="_blank" rel="noopener noreferrer">Читать полностью</a>`
          : ""
      }
    </div>
  `;
}


// ======================================================
// 19. УПРАВЛЕНИЕ КНОПКОЙ «ПОКАЗАТЬ ЕЩЁ»
// ======================================================

function updateLoadMoreButton() {
  if (currentPage < totalPages) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
}


// ======================================================
// 20. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ======================================================

function setStatus(message) {
  statusText.textContent = message;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ======================================================
// 21. ЗАПУСК ПРИЛОЖЕНИЯ
// ======================================================

loadGenres();
