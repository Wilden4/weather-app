// ========================
//  Visual Crossing Weather API
//  Спокойный дизайн + Enter
// ========================

const apiKey = '53JSDMNHRMUAPX5P2ZTCLAPXF'; // ⚠️ ВСТАВЬ СВОЙ API-КЛЮЧ!
const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');
const currentDiv = document.getElementById('currentWeather');
const forecastDiv = document.getElementById('forecast');

// ---------- ПОИСК ПО ENTER ----------
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
    }
});

// ---------- ОСНОВНАЯ ФУНКЦИЯ ЗАПРОСА ----------
async function getWeather(city) {
    try {
        currentDiv.innerHTML = '<p style="text-align:center; padding: 30px;">⏳ Загружаем погоду...</p>';
        forecastDiv.innerHTML = '';

        const unitGroup = 'metric'; // metric = °C, км/ч | us = °F, миль/ч
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=${unitGroup}&key=${apiKey}&contentType=json`;

        console.log('🔍 Запрос к API:', url.replace(apiKey, '***'));

        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка ${response.status}: город не найден или ключ недействителен.`);
        }

        const data = await response.json();
        displayCurrentWeather(data);
        displayForecast(data);
    } catch (error) {
        console.error(error);
        currentDiv.innerHTML = `<p style="color: #a05c5c; text-align:center; padding: 20px;">
            ❌ ${error.message}<br>
            <small style="color:#6f8f9f;">Попробуйте ввести город на английском (например, Moscow, London).</small>
        </p>`;
    }
}

// ---------- ТЕКУЩАЯ ПОГОДА ----------
function displayCurrentWeather(data) {
    const address = data.resolvedAddress || data.address;
    const current = data.currentConditions;

    if (!current) {
        currentDiv.innerHTML = '<p style="text-align:center;">Нет данных о текущей погоде</p>';
        return;
    }

    const temp = Math.round(current.temp);
    const feelsLike = Math.round(current.feelslike);
    const humidity = current.humidity;
    const windSpeed = current.windspeed;
    const conditions = current.conditions || 'ясно';
    const icon = current.icon || 'clear-day';

    // Иконка Visual Crossing (с запасным вариантом)
    const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Realtime/${icon}.png`;

    const html = `
        <div class="city-name">${address}</div>
        <img src="${iconUrl}" alt="${conditions}" style="width: 80px; height: 80px;" 
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

// ---------- ПРОГНОЗ НА 5 ДНЕЙ ----------
function displayForecast(data) {
    const forecastDays = data.days.slice(1, 6);
    if (!forecastDays.length) {
        forecastDiv.innerHTML = '<p style="text-align:center;">Прогноз недоступен</p>';
        return;
    }

    let html = '';
    forecastDays.forEach(day => {
        const date = new Date(day.datetime);
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        const dateStr = date.toLocaleDateString('ru-RU', options).replace(/\./g, '');
        
        const tempMax = Math.round(day.tempmax);
        const tempMin = Math.round(day.tempmin);
        const icon = day.icon || 'clear-day';
        const conditions = day.conditions || 'ясно';
        const iconUrl = `https://raw.githubusercontent.com/visualcrossing/WeatherIcons/main/PNG/2nd%20Set%20-%20Realtime/${icon}.png`;

        html += `
            <div class="forecast-card">
                <div class="forecast-day">${dateStr}</div>
                <div class="forecast-icon">
                    <img src="${iconUrl}" alt="${conditions}" 
                         onerror="this.src='https://openweathermap.org/img/wn/02d@2x.png';">
                </div>
                <div class="forecast-temp">${tempMax}°/${tempMin}°</div>
                <div class="forecast-desc">${conditions}</div>
            </div>
        `;
    });

    forecastDiv.innerHTML = html;
}

// ---------- ЗАПУСК ПО КНОПКЕ ----------
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

// ---------- СТАРТОВЫЙ ГОРОД ----------
window.addEventListener('load', () => {
    getWeather('Moscow');
});