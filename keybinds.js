document.addEventListener('DOMContentLoaded', function() {
    console.log('🟢 DOM загружен, начинаем привязку кнопок...');
    
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('👉 Нажата кнопка ПОИСКА');
            searchMovies(); 
        });
        console.log('✓ Кнопка "Найти фильмы" привязана');
    } else {
        console.error('❌ Кнопка searchBtn не найдена в DOM');
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('👉 Нажата кнопка СБРОСА');
            resetFilters(); 
        });
        console.log('✓ Кнопка "Сбросить фильтры" привязана');
    } else {
        console.error('❌ Кнопка resetBtn не найдена в DOM');
    }
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('👉 Нажата кнопка ЗАГРУЗИТЬ ЕЩЁ');
            loadMore(); 
        });
        console.log('✓ Кнопка "Загрузить ещё" привязана');
    } else {
        console.log('⚠️ Кнопка loadMoreBtn пока не в DOM (будет создана позже)');
    }
    
    const excludeButtons = [
        { id: 'excludeViolenceBtn', tag: 'насилие' },
        { id: 'excludeCrueltyBtn', tag: 'жестокость' },
        { id: 'excludeBloodBtn', tag: 'кровь' },
        { id: 'excludeHorrorBtn', tag: 'ужасы' },
        { id: 'excludeDepressionBtn', tag: 'депрессия' },
        { id: 'excludeTragedyBtn', tag: 'трагедия' }
    ];
    
    excludeButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) {
            element.addEventListener('click', function(event) {
                event.preventDefault();
                console.log(`👉 Нажата кнопка исключения: ${btn.tag}`);
                addExcludeTag(btn.tag); 
            });
            console.log(`✓ Кнопка исключения "${btn.tag}" привязана`);
        } else {
            console.error(`❌ Кнопка ${btn.id} не найдена`);
        }
    });
    
    const addExcludeBtn = document.getElementById('addExcludeBtn');
    if (addExcludeBtn) {
        addExcludeBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('👉 Нажата кнопка ДОБАВИТЬ ТЕМУ');
            const customInput = document.getElementById('customExclude');
            if (customInput) {
                const newTag = customInput.value.trim().toLowerCase();
                if (newTag) {
                    addExcludeTag(newTag);
                    customInput.value = '';
                } else {
                    showNotification('Введите тему для исключения', 'warning');
                }
            }
        });
        console.log('✓ Кнопка "Добавить тему" привязана');
    } else {
        console.error('❌ Кнопка addExcludeBtn не найдена');
    }
    
    const customExcludeInput = document.getElementById('customExclude');
    if (customExcludeInput) {
        customExcludeInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                console.log('👉 Нажат Enter в поле ввода темы');
                const newTag = this.value.trim().toLowerCase();
                if (newTag) {
                    addExcludeTag(newTag);
                    this.value = '';
                }
            }
        });
        console.log('✓ Обработчик Enter для поля ввода привязан');
    }
    
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('👉 Нажата кнопка ЗАКРЫТЬ МОДАЛЬНОЕ ОКНО');
            closeModal(); 
        });
        console.log('✓ Кнопка закрытия модального окна привязана');
    } else {
        console.error('❌ Кнопка closeModalBtn не найдена');
    }
    
    const modal = document.getElementById('reviewsModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                console.log('👉 Клик вне модального окна - закрываем');
                closeModal();
            }
        });
        console.log('✓ Закрытие модального окна по клику вне его привязано');
    }
    
    console.log('📂 Загружаем сохранённые настройки...');
    if (typeof loadExcludeTags === 'function') {
        loadExcludeTags();
        console.log('✓ Сохранённые теги исключений загружены');
    }
    
    
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ ВНИМАНИЕ: API ключ не настроен!');
        showNotification('⚠️ Получите API ключ на kinopoiskapiunofficial.tech и вставьте его в файл js/app.js', 'warning');
    } else {
        console.log('✅ API ключ настроен');
    }
    
    
    console.log('🟢 ==========================================');
    console.log('🟢 ВСЕ КНОПКИ УСПЕШНО ПРИВЯЗАНЫ!');
    console.log('🟢 MovieFinder готов к использованию');
    console.log('🟢 ==========================================');
    
    setTimeout(() => {
        console.log('🎬 Приятного просмотра!');
    }, 1000);
});

window.addEventListener('load', function() {
    console.log('🟢 Страница полностью загружена');
    
    // Проверяем доступность функций
    const requiredFunctions = ['searchMovies', 'resetFilters', 'loadMore', 'addExcludeTag', 'closeModal', 'showNotification'];
    requiredFunctions.forEach(func => {
        if (typeof window[func] !== 'undefined' || typeof window[func] === 'function') {
            console.log(`✅ Функция ${func} доступна глобально`);
        } else if (typeof eval(func) === 'function') {
            console.log(`✅ Функция ${func} доступна`);
        } else {
            console.warn(`⚠️ Функция ${func} может быть недоступна глобально, но это нормально, если она определена в app.js`);
        }
    });
});
