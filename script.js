// ========================
//  Visual Crossing + Wikipedia (без ошибок)
// ========================

// Дождёмся полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {

    // -------- ПОИСК ЭЛЕМЕНТОВ С ПРОВЕРКОЙ --------
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');
    const currentDiv = document.getElementById('currentWeather');
    const forecastDiv = document.getElementById('forecast');
    const wikiDiv = document.getElementById('cityInfo');

    // Если какого-то элемента нет — выходим и пишем ошибку в консоль
    if (!searchBtn || !cityInput || !currentDiv || !forecastDiv || !wikiDiv) {
        console.error('❌ Ошибка: не найдены необходимые элементы на странице.');
        return;
    }

    // ⚠️ ВСТАВЬ СВОЙ API-КЛЮЧ VISUAL CROSSING
    const apiKey = '53JSDMNHRMUAPX5P2ZTCLAPXF'; 

    // ---------- ПОИСК ПО ENTER ----------
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // ---------- ОСНОВНАЯ ФУНКЦИЯ ----------
    async function getWeather(city) {
        try {
            // Показываем загрузку
            currentDiv.innerHTML = '<p style="text-align:center; padding: 40px;">⏳ Загружаем погоду...</p>';
            wikiDiv.innerHTML = '<p style="text-align:center; padding: 40px;">⏳ Загружаем информацию о городе...</p>';
            forecastDiv.innerHTML = '';

            // ЕСЛИ КЛЮЧ НЕ ВСТАВЛЕН - ИСПОЛЬЗУЕМ ЗАГЛУШКУ
            if (!apiKey || apiKey === 'ТВОЙ_КЛЮЧ_ЗДЕСЬ') {
                console.warn('⚠️ API-ключ не вставлен. Используем демо-данные.');
                useFakeWeather(city);
                fetchWikipediaInfo(city); // всё равно пытаемся загрузить вики
                return;
            }

            // Настоящий запрос к Visual Crossing
            const unitGroup = 'metric';
            const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Город не найден (код ${response.status})`);
            }

            const data = await response.json();
            
            displayCurrentWeather(data);
            displayForecast(data);
            fetchWikipediaInfo(city);
            
        } catch (error) {
            console.error(error);
            currentDiv.innerHTML = `<p style="color: #a05c5c; text-align:center; padding: 30px;">
                ❌ ${error.message}<br>
                <small style="color:#6f8f9f;">Попробуйте ввести город на английском (например, Moscow, London).</small>
            </p>`;
            // Не трогаем wikiDiv — там может уже быть вики-информация
        }
    }

    // ---------- ЗАГЛУШКА ДЛЯ ПОГОДЫ (без API) ----------
    function useFakeWeather(city) {
        const fakeData = {
            resolvedAddress: city,
            currentConditions: {
                temp: 22,
                feelslike: 20,
                humidity: 65,
                windspeed: 12,
                conditions: "Ясно",
                icon: "clear-day"
            },
            days: [
                { datetime: new Date().toISOString().split('T')[0], tempmax: 23, tempmin: 15, conditions: "Ясно", icon: "clear-day" },
                { datetime: new Date(Date.now() + 86400000).toISOString().split('T')[0], tempmax: 20, tempmin: 14, conditions: "Облачно", icon: "partly-cloudy-day" },
                { datetime: new Date(Date.now() + 2*86400000).toISOString().split('T')[0], tempmax: 18, tempmin: 12, conditions: "Дождь", icon: "rain" },
                { datetime: new Date(Date.now() + 3*86400000).toISOString().split('T')[0], tempmax: 19, tempmin: 11, conditions: "Облачно", icon: "cloudy" },
                { datetime: new Date(Date.now() + 4*86400000).toISOString().split('T')[0], tempmax: 21, tempmin: 13, conditions: "Ясно", icon: "clear-day" }
            ]
        };
        displayCurrentWeather(fakeData);
        displayForecast(fakeData);
    }

    // ---------- ТЕКУЩАЯ ПОГОДА ----------
    function displayCurrentWeather(data) {
        const address = data.resolvedAddress || data.address || 'Город';
        const current = data.currentConditions || data.days?.[0]?.hours?.[0] || {};

        const temp = Math.round(current.temp ?? 0);
        const feelsLike = Math.round(current.feelslike ?? 0);
        const humidity = current.humidity ?? '—';
        const windSpeed = current.windspeed ?? '—';
        const conditions = current.conditions || '—';
        const icon = current.icon || 'clear-day';
        const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Realtime/${icon}.png`;

        const html = `
            <div class="city-name">${address}</div>
            <img src="${iconUrl}" alt="${conditions}" style="width: 100px; height: 100px;" 
                 onerror="this.src='https://openweathermap.org/img/wn/02d@2x.png';">
            <div class="temperature">${temp}°C</div>
            <div class="description">${conditions}</div>
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">Ощущается</div>
                    <div class="detail-value">${feelsLike}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Влажность</div>
                    <div class="detail-value">${humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Ветер</div>
                    <div class="detail-value">${windSpeed} км/ч</div>
                </div>
            </div>
        `;

        currentDiv.innerHTML = html;
    }

// ---------- ПРОГНОЗ НА 5 ДНЕЙ С КЛИКАБЕЛЬНОСТЬЮ ----------
function displayForecast(data) {
    const forecastDays = data.days?.slice(1, 6) || [];
    if (forecastDays.length === 0) {
        forecastDiv.innerHTML = '<p style="text-align:center;">Прогноз недоступен</p>';
        return;
    }

    // Сохраняем данные дней в глобальную переменную, чтобы использовать в обработчиках кликов
    window.forecastDaysData = forecastDays;

    let html = '';
    forecastDays.forEach((day, index) => {
        const date = new Date(day.datetime);
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        const dateStr = date.toLocaleDateString('ru-RU', options).replace(/\./g, '');
        
        // Корректируем температуры
        let tempMax = Math.round(day.tempmax ?? 0);
        let tempMin = Math.round(day.tempmin ?? 0);
        if (tempMin > tempMax) [tempMax, tempMin] = [tempMin, tempMax];

        const icon = day.icon || 'clear-day';
        const conditions = day.conditions || '—';
        const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Realtime/${icon}.png`;

        // Добавляем data-атрибут с индексом и пустой контейнер для деталей
        html += `
            <div class="forecast-card" data-index="${index}" style="--i: ${index};">
                <div class="forecast-day">${dateStr}</div>
                <div class="forecast-icon">
                    <img src="${iconUrl}" alt="${conditions}" 
                         onerror="this.src='https://openweathermap.org/img/wn/02d@2x.png';">
                </div>
                <div class="forecast-temp">${tempMax}°/${tempMin}°</div>
                <div class="forecast-desc">${conditions}</div>
                <div class="forecast-details" style="display: none;">
                    <!-- Сюда будет подставлена информация при клике -->
                </div>
            </div>
        `;
    });

    forecastDiv.innerHTML = html;

    // ----- ДОБАВЛЯЕМ ОБРАБОТЧИКИ КЛИКОВ НА КАЖДУЮ КАРТОЧКУ -----
    document.querySelectorAll('.forecast-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Предотвращаем всплытие, если клик по ссылке внутри (но у нас ссылок нет)
            e.stopPropagation();
            
            const index = this.dataset.index;
            const dayData = window.forecastDaysData[index];
            const detailsDiv = this.querySelector('.forecast-details');

            // Если карточка уже раскрыта — просто сворачиваем
            if (this.classList.contains('expanded')) {
                this.classList.remove('expanded');
                // Не очищаем details, чтобы при повторном открытии быстро показать
                return;
            }

            // Сворачиваем все другие карточки
            document.querySelectorAll('.forecast-card').forEach(c => {
                c.classList.remove('expanded');
            });

            // Раскрываем текущую
            this.classList.add('expanded');

            // Заполняем детали, если они ещё не заполнены
            if (detailsDiv.innerHTML.trim() === '') {
                detailsDiv.innerHTML = generateForecastDetails(dayData);
            }
            detailsDiv.style.display = 'block'; // CSS transition сработает через max-height
        });
    });
}

// ---------- ГЕНЕРАЦИЯ ПОДРОБНОЙ ИНФОРМАЦИИ ДЛЯ ДНЯ ----------
function generateForecastDetails(day) {
    // Основные показатели
    const humidity = day.humidity ?? '—';
    const windspeed = day.windspeed ?? '—';
    const pressure = day.pressure ?? '—';
    const precipprob = day.precipprob ?? '—';
    const uvindex = day.uvindex ?? '—';
    const sunrise = day.sunrise || '—';
    const sunset = day.sunset || '—';
    
    // Почасовой прогноз (первые 6 часов, например)
    let hourlyHtml = '';
    if (day.hours && day.hours.length > 0) {
        // Берём каждый 4-й час, чтобы не перегружать (0, 4, 8, 12, 16, 20)
        const hours = day.hours.filter((h, i) => i % 4 === 0).slice(0, 6);
        hours.forEach(hour => {
            const time = hour.datetime.slice(0, 5); // "13:00:00" -> "13:00"
            const temp = Math.round(hour.temp);
            const icon = hour.icon || 'clear-day';
            const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Realtime/${icon}.png`;
            hourlyHtml += `
                <div class="hour-item">
                    <div class="hour-time">${time}</div>
                    <div class="hour-icon">
                        <img src="${iconUrl}" alt="" style="width:30px; height:30px;" 
                             onerror="this.src='https://openweathermap.org/img/wn/02d@2x.png';">
                    </div>
                    <div class="hour-temp">${temp}°</div>
                </div>
            `;
        });
    }

    return `
        <div class="detail-row">
            <span class="detail-label">💧 Влажность</span>
            <span class="detail-value">${humidity}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">💨 Ветер</span>
            <span class="detail-value">${windspeed} км/ч</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">📊 Давление</span>
            <span class="detail-value">${pressure} гПа</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">☔ Вероятность осадков</span>
            <span class="detail-value">${precipprob}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">☀️ УФ-индекс</span>
            <span class="detail-value">${uvindex}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">🌅 Восход</span>
            <span class="detail-value">${sunrise}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">🌇 Закат</span>
            <span class="detail-value">${sunset}</span>
        </div>
        ${hourlyHtml ? `<div class="hourly-forecast">${hourlyHtml}</div>` : ''}
    `;
}
    // ---------- ВИКИПЕДИЯ ----------
    async function fetchWikipediaInfo(cityName) {
        try {
            const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Статья не найдена');
            }
            
            const data = await response.json();
            displayWikipediaInfo(data);
        } catch (error) {
            console.warn('Википедия:', error.message);
            wikiDiv.innerHTML = `
                <div class="wiki-card">
                    <div class="wiki-title">ℹ️ Информация</div>
                    <p style="color: #5a7e8c; font-size: 1.1rem;">Не удалось загрузить данные из Википедии для этого города.</p>
                </div>
            `;
        }
    }

    function displayWikipediaInfo(data) {
        const title = data.title || 'Город';
        const extract = data.extract || 'Описание отсутствует.';
        const thumbnail = data.thumbnail?.source || '';
        const pageUrl = data.content_urls?.desktop?.page || `https://ru.wikipedia.org/wiki/${encodeURIComponent(data.title || cityInput.value)}`;
        
        let thumbnailHtml = '';
        if (thumbnail) {
            thumbnailHtml = `<img src="${thumbnail}" alt="${title}" class="wiki-thumbnail">`;
        }
        
        const html = `
            <div class="wiki-card">
                <div class="wiki-title">📖 ${title}</div>
                ${thumbnailHtml}
                <div class="wiki-extract">${extract}</div>
                <a href="${pageUrl}" target="_blank" class="wiki-link">Читать в Википедии →</a>
            </div>
        `;
        
        wikiDiv.innerHTML = html;
    }

    // ---------- ЗАПУСК ПО КНОПКЕ ----------
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) getWeather(city);
    });

    // ---------- СТАРТОВЫЙ ГОРОД ----------
    getWeather('Moscow');

}); // конец DOMContentLoaded