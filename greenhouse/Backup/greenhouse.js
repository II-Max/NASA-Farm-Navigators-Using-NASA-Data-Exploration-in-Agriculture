document.addEventListener('DOMContentLoaded', () => {

    const gameDataElement = document.getElementById('game-data');
    const fetchedWeatherScenario = JSON.parse(gameDataElement.dataset.weatherData);
    const initialErrorMessage = JSON.parse(gameDataElement.dataset.errorMessage);

    const statusText = document.getElementById('statusText');
    const connectionStatus = document.getElementById('connectionStatus');
    const logContainer = document.getElementById('logContainer');

    function addToLog(message, type = '') {
        if (!logContainer) return;
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function setStatus(text, type) {
        if (!statusText || !connectionStatus) return;
        statusText.textContent = text;
        if (type === 'success') connectionStatus.style.backgroundColor = '#27ae60';
        else if (type === 'error') connectionStatus.style.backgroundColor = '#c0392b';
        else connectionStatus.style.backgroundColor = '#f39c12';
    }

    async function sendSignal(signal) {
        if (!signal) {
            console.log("Hành động này không có tín hiệu Node-RED.");
            return;
        }
        const nodeRedUrl = 'http://127.0.0.1:1880/choice';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        addToLog(`Đang gửi: ${signal}`);
        setStatus(`Đang gửi lệnh: ${signal}...`, 'sending');
        try {
            const response = await fetch(nodeRedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    signal
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
            const data = await response.json();
            const message = data.message || `Phản hồi thành công cho: ${signal}`;
            addToLog(`Phản hồi: ${message}`, 'response');
            setStatus('Gửi lệnh thành công!', 'success');
        } catch (error) {
            clearTimeout(timeoutId);
            let errorMessage = (error.name === 'AbortError') ? 'Lỗi: Hết thời gian chờ. Node-RED không phản hồi.' : `Lỗi kết nối: ${error.message}.`;
            addToLog(errorMessage, 'error');
            setStatus('Lỗi kết nối', 'error');
        }
    }
    
    const breedSettings = {
        beefsteak: { name: 'Beefsteak', minTemp: 15, maxTemp: 30, img: { day: '../img/Beefsteak.png', sick: '../img/cachuasau.png' } },
        cherry: { name: 'Cherry', minTemp: 18, maxTemp: 32, img: { day: '../img/cachuacherry.png', sick: '../img/cachuasau.png' } },
        plum: { name: 'Plum', minTemp: 16, maxTemp: 31, img: { day: '../img/Plum.png', sick: '../img/cachuasau.png' } }
    };
    
    const weatherMapping = {
        'Nhiều mây': 'cloudy', 'Nắng': 'sunny', 'Mưa': 'rainy', 'Mưa nhẹ': 'rainy', 'Gió': 'windy', 'Trời trong': 'perfect', 'Nóng': 'hot', 'Tuyết': 'cold', 'Mưa rào nhẹ': 'rainy', 'Mưa dông': 'rainy', 'Ít mây': 'perfect', 'Không xác định': 'cloudy', 'Giông bão': 'rainy'
    };
    
    // THAY ĐỔI: Thêm độ khó "Cực Dễ" (id: 0)
    const difficultySettings = {
        0: { name: 'Cực Dễ', statDecreaseRate: 2.0, initialMoney: 600, tempScenario: [20, 20, 19, 20, 21, 22, 24, 26, 28, 30, 33, 35, 36, 34, 32, 30, 28, 26, 24, 22, 21, 20, 20, 20], timePaused: true },
        1: { name: 'Dễ', statDecreaseRate: 1.5, initialMoney: 500, tempScenario: [22, 21, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 27, 26, 25, 24, 23, 23, 22, 22, 22, 22, 22, 22] },
        2: { name: 'Trung Bình', statDecreaseRate: 2.0, initialMoney: 400, tempScenario: [20, 20, 19, 20, 21, 22, 24, 26, 28, 30, 33, 35, 36, 34, 32, 30, 28, 26, 24, 22, 21, 20, 20, 20] },
        3: { name: 'Khó', statDecreaseRate: 2.5, initialMoney: 300, tempScenario: [18, 17, 17, 17, 17, 18, 21, 25, 28, 29, 30, 30, 30, 30, 30, 29, 26, 22, 19, 18, 18, 17, 17, 17] },
        4: { name: 'Thử Thách', statDecreaseRate: 3.0, initialMoney: 250, tempScenario: [15, 13, 11, 10, 12, 18, 25, 30, 35, 38, 40, 41, 40, 38, 35, 30, 25, 20, 18, 16, 15, 14, 13, 12] },
        5: { name: 'Thực Tế (MySQL)', statDecreaseRate: 2.2, initialMoney: 400, tempScenario: [] }
    };
    
    const actionCosts = { tend: 10, spray: 100 };
    const gameConfig = {
        realSecondsPerGameHour: 1, hoursPerDay: 24, totalDays: 1, baseSellPrice: 1000, heaterHourlyCost: 20, fanHourlyCost: 10, curtainHourlyCost: 5, wateringHourlyCost: 15, fertilizingHourlyCost: 25, heaterInitCost: 50, fanInitCost: 30, curtainInitCost: 10, heaterBonusTemp: 3, fanBonusTemp: -2, wateringHourlyEffect: 10, fertilizingHourlyEffect: 5, sunlightGrowthBonus: 2.5, baseInfectionChance: 0.05, nightInfectionChance: 0.1, coldWetInfectionBonus: 0.2, maxInfectionCount: 2, qualityDegradationPerEffect: 2
    };

    let gameState = {};
    let selectedBreed = null;
    let currentConfig = {};
    let gameLoopInterval;

    // THAY ĐỔI: Thêm nút "Tiếp tục" vào DOM
    const dom = {
        welcomeScreen: document.getElementById('welcome-screen'),
        breedSelectionStep: document.getElementById('breed-selection-step'),
        difficultySelectionStep: document.getElementById('difficulty-selection-step'),
        difficultyTitle: document.getElementById('difficulty-title'),
        backToBreedSelectBtn: document.getElementById('back-to-breed-select'),
        plant: document.querySelector('.plant'),
        weatherIcon: document.querySelector('.weather-icon'),
        weatherText: document.querySelector('.weather-text'),
        plantStatusIcon: document.querySelector('.plant-status-icon'),
        plantStatusText: document.querySelector('.plant-status-text'),
        message: document.querySelector('.message'),
        gameOverScreen: document.querySelector('.game-over'),
        finalResultTitle: document.getElementById('final-result-title'),
        gameOverReason: document.getElementById('game-over-reason'),
        feedbackList: document.getElementById('feedback-list'),
        moneyDisplay: document.getElementById('money-display'),
        gameTime: document.getElementById('game-time'),
        dayDisplay: document.getElementById('day-display'),
        tempDisplay: document.getElementById('temp-display'),
        plantStarRating: document.getElementById('plant-star-rating'),
        actionButtons: document.querySelectorAll('.action-btn'),
        difficultyDisplay: document.getElementById('difficulty-display'),
        continueBtn: document.getElementById('continue-btn')
    };

    function initGame() {
        dom.difficultyDisplay.textContent = `Độ Khó: ${currentConfig.name}`;
        gameState = {
            money: currentConfig.initialMoney,
            day: 1,
            gameHour: 0,
            stats: { nutrition: 80, water: 70, health: 90, growth: 0, quality: 100 },
            weather: { type: 'sunny', name: 'Đang tải...' },
            currentTemp: 25,
            baseTemp: 25,
            isHeaterOn: false, isFanOn: false, isCurtainOpen: false, isWatering: false, isFertilizing: false,
            infectionCount: 0,
            currentMessage: initialErrorMessage || `Bắt đầu chăm sóc cây!`,
            gameOver: false,
            tendUsed: false,
            events: { wasSick: false, wasWilting: false, wasStunted: false, hadGreatSunlight: false }
        };
        dom.gameOverScreen.style.display = 'none';
        
        // THAY ĐỔI: Logic xử lý vòng lặp game dựa trên độ khó
        clearInterval(gameLoopInterval);
        if (currentConfig.timePaused) {
            // Chế độ "Cực Dễ": Hiện nút Tiếp Tục và không tự chạy game
            dom.continueBtn.classList.remove('hidden');
        } else {
            // Các chế độ khác: Ẩn nút và tự chạy game
            dom.continueBtn.classList.add('hidden');
            gameLoopInterval = setInterval(gameLoop, gameConfig.realSecondsPerGameHour * 1000);
        }

        updateWeatherAndTemp(0);
        updateAllUI();
        
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                handleAction(e.target.dataset.action);
            });
        });
    }
    
    function gameLoop() {
        if (gameState.gameOver) return;
        let primaryMessage = '';
        if (gameState.isHeaterOn) gameState.money -= gameConfig.heaterHourlyCost;
        if (gameState.isFanOn) gameState.money -= gameConfig.fanHourlyCost;
        if (gameState.isCurtainOpen) gameState.money -= gameConfig.curtainHourlyCost;
        if (gameState.isWatering) {
            if (gameState.money >= gameConfig.wateringHourlyCost && gameState.stats.water < 95) {
                gameState.money -= gameConfig.wateringHourlyCost;
                gameState.stats.water = Math.min(100, gameState.stats.water + gameConfig.wateringHourlyEffect);
                primaryMessage += `💧 Đang tưới... `;
            } else { gameState.isWatering = false; }
        }
        if (gameState.isFertilizing) {
            if (gameState.money >= gameConfig.fertilizingHourlyCost && gameState.stats.nutrition < 95) {
                gameState.money -= gameConfig.fertilizingHourlyCost;
                gameState.stats.nutrition = Math.min(100, gameState.stats.nutrition + gameConfig.fertilizingHourlyEffect);
                primaryMessage += `🌿 Đang bón phân... `;
            } else { gameState.isFertilizing = false; }
        }
        const conditionsGood = gameState.stats.health > 50 && gameState.stats.water > 30 && gameState.stats.nutrition > 30 && gameState.currentTemp >= selectedBreed.minTemp && gameState.currentTemp <= selectedBreed.maxTemp;
        if (conditionsGood) {
            gameState.stats.growth = Math.min(100, gameState.stats.growth + (100 / gameConfig.hoursPerDay));
        }
        if (gameState.isCurtainOpen) {
            const isDayTime = gameState.gameHour >= 6 && gameState.gameHour < 18;
            const isGoodWeather = ['sunny', 'perfect'].includes(gameState.weather.type);
            if (isDayTime && isGoodWeather) {
                gameState.stats.growth = Math.min(100, gameState.stats.growth + gameConfig.sunlightGrowthBonus);
                if (!primaryMessage) primaryMessage = `☀️ Cây nhận được ánh nắng, sinh trưởng tăng!`;
                gameState.events.hadGreatSunlight = true;
            }
        }
        let tempPenalty = 0;
        if (gameState.currentTemp < selectedBreed.minTemp) tempPenalty = selectedBreed.minTemp - gameState.currentTemp;
        else if (gameState.currentTemp > selectedBreed.maxTemp) tempPenalty = gameState.currentTemp - selectedBreed.maxTemp;
        if (tempPenalty > 0) gameState.stats.health = Math.max(0, gameState.stats.health - tempPenalty * 0.2);
        if (gameState.infectionCount > 0) gameState.stats.health = Math.max(0, gameState.stats.health - gameState.infectionCount * 3);
        let currentInfectionChance = (gameState.gameHour >= 20 || gameState.gameHour < 6) ? gameConfig.nightInfectionChance : gameConfig.baseInfectionChance;
        if (gameState.currentTemp < selectedBreed.minTemp && gameState.weather.type === 'rainy' && gameState.isCurtainOpen) {
            currentInfectionChance += gameConfig.coldWetInfectionBonus;
            if (!primaryMessage) primaryMessage = `☔ Cây bị lạnh và úng nước! Tỉ lệ mắc bệnh tăng vọt!`;
        }
        if (Math.random() < currentInfectionChance && gameState.infectionCount < gameConfig.maxInfectionCount) {
            gameState.infectionCount++;
            gameState.events.wasSick = true;
            if (!primaryMessage) primaryMessage = `🔔 Cây đã mắc bệnh lần ${gameState.infectionCount}/${gameConfig.maxInfectionCount}!`;
        }
        let qualityLoss = 0;
        if (gameState.infectionCount > 0) qualityLoss += gameConfig.qualityDegradationPerEffect;
        if (gameState.stats.nutrition < 30) {
            qualityLoss += gameConfig.qualityDegradationPerEffect;
            gameState.events.wasWilting = true;
        }
        if (gameState.stats.water < 30) {
            qualityLoss += gameConfig.qualityDegradationPerEffect;
            gameState.events.wasWilting = true;
        }
        if (tempPenalty > 0) {
            qualityLoss += gameConfig.qualityDegradationPerEffect;
            gameState.events.wasStunted = true;
        }
        if (qualityLoss > 0) {
            gameState.stats.quality = Math.max(0, gameState.stats.quality - qualityLoss);
            if (!primaryMessage) primaryMessage = `⚠️ Chất lượng hoa màu giảm do điều kiện xấu!`;
        }
        gameState.currentMessage = primaryMessage || 'Mọi thứ đều ổn.';
        ['nutrition', 'water', 'health'].forEach(stat => {
            let decreaseAmount = currentConfig.statDecreaseRate;
            if (stat === 'water' && ['hot', 'sunny'].includes(gameState.weather.type)) decreaseAmount *= 1.5;
            gameState.stats[stat] = Math.max(0, gameState.stats[stat] - decreaseAmount);
        });
        advanceGameHour();
        updateAllUI();
    }

    function generateFeedback() {
        const { stats, events } = gameState;
        const feedback = [];
        if (stats.quality >= 95) feedback.push("🌟 Chất lượng TUYỆT HẢO! Bạn đã tạo ra một vụ mùa cà chua hoàn hảo!");
        else if (stats.quality >= 75) feedback.push("👍 Chất lượng tốt! Cây được chăm sóc trong môi trường gần như lý tưởng.");
        else if (stats.quality < 40) feedback.push("🔻 Chất lượng chưa cao. Hãy chú ý hơn đến nhiệt độ và các chỉ số dinh dưỡng/nước.");
        if (events.wasSick) feedback.push("🤒 Cây đã từng bị bệnh. Phun thuốc kịp thời đã giúp cây hồi phục.");
        else feedback.push("💪 Sức khỏe cây rất tốt, không hề bị nhiễm bệnh lần nào!");
        if (stats.growth < 50) feedback.push("🌱 Cây phát triển hơi chậm. Mở rèm vào ban ngày có nắng đẹp sẽ giúp cây quang hợp tốt hơn.");
        if (events.hadGreatSunlight) feedback.push("☀️ Bạn đã tận dụng rất tốt ánh nắng mặt trời để cây sinh trưởng.");
        if (events.wasWilting) feedback.push("💧 Cây đã có lúc bị héo. Hãy duy trì chỉ số Nước và Dinh dưỡng trên 30% nhé.");
        if (feedback.length === 0) feedback.push("Ổn định! Bạn đã duy trì các chỉ số ở mức cân bằng trong suốt quá trình.");
        return feedback;
    }

    function endSale(isEndOfDay) {
        if (gameState.gameOver) return;
        gameState.gameOver = true;
        clearInterval(gameLoopInterval);
        const sellPrice = calculateSellPrice();
        const finalMoney = gameState.money + sellPrice;
        const { health, quality } = gameState.stats;
        dom.finalResultTitle.textContent = "🎉 Vụ Mùa Hoàn Tất! 🎉";
        let timeMessage = isEndOfDay ? "Bạn đã kiên trì đến cuối ngày để có được giá tốt nhất!" : `Bạn đã thu hoạch sớm vào lúc ${String(gameState.gameHour).padStart(2, '0')}:00.`;
        dom.gameOverReason.innerHTML = `${timeMessage}<br><br>Sức khỏe cây: <b>${Math.round(health)}%</b><br>Chất lượng hoa màu: <b>${Math.round(quality)}% (${getStarRating(quality)})</b><br><hr>Số tiền bán được: <b style="color: green;">+${sellPrice}</b><br><b>Tổng tài sản cuối cùng: ${finalMoney}</b>`;
        const feedbackItems = generateFeedback();
        dom.feedbackList.innerHTML = '';
        feedbackItems.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item;
            dom.feedbackList.appendChild(li);
        });
        dom.gameOverScreen.style.display = 'flex';
    }

    function getStarRating(quality) {
        const q = Math.round(quality);
        if (q >= 90) return '⭐⭐⭐⭐⭐';
        if (q >= 70) return '⭐⭐⭐⭐';
        if (q >= 50) return '⭐⭐⭐';
        if (q >= 30) return '⭐⭐';
        if (q >= 1) return '⭐';
        return '❌';
    }

    function calculateSellPrice() {
        const { stats, gameHour } = gameState;
        const { health, quality, growth } = stats;
        if (health <= 10 || quality <= 10) return 0;
        const statMultiplier = (health * 0.3 + quality * 0.5 + growth * 0.2) / 100;
        const timeMultiplier = 0.4 + (gameHour / 30);
        return Math.round(gameConfig.baseSellPrice * statMultiplier * timeMultiplier);
    }

    function advanceGameHour() {
        if (gameState.gameOver) return;
        gameState.gameHour++;
        if (gameState.gameHour >= gameConfig.hoursPerDay) {
            endSale(true);
            return;
        }
        updateWeatherAndTemp(gameState.gameHour);
    }

    function updateWeatherAndTemp(hour) {
        const hourIndex = hour % gameConfig.hoursPerDay;
        const useApiData = fetchedWeatherScenario.length >= gameConfig.hoursPerDay && currentConfig.name === 'Thực Tế (MySQL)';
        let rawTemp;
        if (useApiData) {
            const d = fetchedWeatherScenario[hourIndex];
            rawTemp = d.temp;
            gameState.weather = { type: weatherMapping[d.weather_type_vi] || 'cloudy', name: d.weather_type_vi };
        } else {
            rawTemp = currentConfig.tempScenario[hourIndex];
            gameState.weather = { type: 'cloudy', name: 'Nhiều mây' };
        }
        gameState.baseTemp = rawTemp;
        updateCurrentTemp();
    }

    function updateCurrentTemp() {
        let tempAdjustment = 0;
        if (gameState.isHeaterOn) tempAdjustment += gameConfig.heaterBonusTemp;
        if (gameState.isFanOn) tempAdjustment += gameConfig.fanBonusTemp;
        let finalTemp = gameState.baseTemp + tempAdjustment;
        if (gameState.isCurtainOpen) finalTemp = (finalTemp + gameState.baseTemp) / 2;
        gameState.currentTemp = Math.round(finalTemp);
    }

    function updatePlantStatus() {
        if (gameState.infectionCount >= gameConfig.maxInfectionCount) return { text: 'Nguy kịch', icon: '💀' };
        if (gameState.infectionCount > 0) return { text: `Bị bệnh (${gameState.infectionCount}/${gameConfig.maxInfectionCount})`, icon: '🤒' };
        if (gameState.currentTemp < selectedBreed.minTemp) return { text: 'Bị lạnh', icon: '🥶' };
        if (gameState.currentTemp > selectedBreed.maxTemp) return { text: 'Quá nóng', icon: '🥵' };
        if (gameState.stats.water < 30) return { text: 'Bị héo', icon: '🥀' };
        if (gameState.isCurtainOpen && gameState.weather.type === 'rainy') return { text: 'Bị úng nước', icon: '🌧️'};
        return { text: 'Tươi tốt', icon: '😊' };
    }

    function getPlantImage(growth) {
        if (gameState.infectionCount > 0) return selectedBreed.img.sick;
        return selectedBreed.img.day;
    }

    function updateAllUI() {
        if (gameState.gameOver) return;
        dom.gameTime.textContent = `${String(gameState.gameHour).padStart(2, '0')}:00`;
        dom.dayDisplay.textContent = `Ngày: ${gameState.day}/${gameConfig.totalDays}`;
        dom.moneyDisplay.textContent = `💰 Tiền: ${Math.round(gameState.money)}`;
        dom.tempDisplay.textContent = `${gameState.currentTemp}°C`;
        dom.tempDisplay.parentElement.style.color = gameState.isHeaterOn ? '#FF5722' : (gameState.isFanOn ? '#03A9F4' : '#333');
        const weatherIcons = {'cold': '❄️', 'rainy': '🌧️', 'windy': '💨', 'perfect': '🌈', 'sunny': '☀️', 'hot': '🔥', 'cloudy': '☁️'};
        dom.weatherIcon.textContent = weatherIcons[gameState.weather.type] || '☁️';
        dom.weatherText.textContent = gameState.weather.name;
        const newStatus = updatePlantStatus();
        dom.plantStatusIcon.textContent = newStatus.icon;
        dom.plantStatusText.textContent = newStatus.text;
        dom.plant.src = getPlantImage(gameState.stats.growth);
        dom.plant.className = 'plant';
        if (gameState.stats.health < 40 || gameState.infectionCount > 0 || gameState.stats.water < 30) dom.plant.classList.add('wilting');
        else if (gameState.stats.growth > 80) dom.plant.classList.add('healthy');
        Object.keys(gameState.stats).forEach(stat => {
            const value = Math.round(gameState.stats[stat]);
            const statEl = document.querySelector(`.${stat}`);
            if (statEl) {
                statEl.querySelector('.stat-fill').style.width = `${value}%`;
                statEl.querySelector('.stat-value').textContent = `${value}%`;
            }
        });
        dom.plantStarRating.textContent = getStarRating(gameState.stats.quality);
        dom.message.textContent = gameState.currentMessage;
        updateButtons();
    }

    // THAY ĐỔI: Thêm action "advanceHour"
    function handleAction(action) {
        if (gameState.gameOver) return;
        const actionsConfig = {
            'heatOn': () => { setDeviceState('heater', true); sendSignal('suoi1'); },
            'heatOff': () => { setDeviceState('heater', false); sendSignal('suoi2'); },
            'fanOn': () => { setDeviceState('fan', true); sendSignal('quat1'); },
            'fanOff': () => { setDeviceState('fan', false); sendSignal('quat2'); },
            'curtainOpen': () => { setDeviceState('curtain', true); sendSignal('rem1'); },
            'curtainClose': () => { setDeviceState('curtain', false); sendSignal('rem2'); },
            'waterPlantStart': () => { setContinuousAction('isWatering', true); sendSignal('nuoc1'); },
            'waterPlantStop': () => { setContinuousAction('isWatering', false); sendSignal('nuoc2'); },
            'fertilizeStart': () => { setContinuousAction('isFertilizing', true); sendSignal('phan1'); },
            'fertilizeStop': () => { setContinuousAction('isFertilizing', false); sendSignal('phan2'); },
            'exit': () => endSale(false),
            'advanceHour': () => {
                if (!gameState.gameOver) {
                    gameLoop(); // Chỉ cần gọi gameLoop một lần để game trôi qua 1 giờ
                }
            },
            'tend': () => {
                if (gameState.tendUsed) {
                    gameState.currentMessage = 'Bạn đã chăm sóc cây rồi!';
                } else if (gameState.money >= actionCosts.tend) {
                    gameState.money -= actionCosts.tend;
                    gameState.stats.growth = Math.min(100, gameState.stats.growth + 5);
                    gameState.stats.health = Math.min(100, gameState.stats.health + 10);
                    gameState.currentMessage = '❤️ Đã chăm sóc cây (+10 Sức khỏe)!';
                    gameState.tendUsed = true;
                } else {
                    gameState.currentMessage = 'Không đủ tiền để chăm sóc!';
                }
                updateAllUI();
            },
            'spray': () => {
                if (gameState.infectionCount <= 0) {
                    gameState.currentMessage = "Cây không bị bệnh!";
                } else if (gameState.money < actionCosts.spray) {
                    gameState.currentMessage = "Không đủ tiền!";
                } else {
                    gameState.money -= actionCosts.spray;
                    gameState.infectionCount = 0;
                    gameState.stats.health = Math.min(100, gameState.stats.health + 35);
                    gameState.currentMessage = `💊 Đã phun thuốc đặc trị, cây khỏi bệnh hoàn toàn!`;
                    sendSignal('thuoc1');
                }
                updateAllUI();
            }
        };
        if (actionsConfig[action]) {
            actionsConfig[action]();
        }
    }

    function setContinuousAction(flag, state) {
        if (state) {
            gameState.isWatering = false;
            gameState.isFertilizing = false;
        }
        gameState[flag] = state;
        updateAllUI();
    }

    function setDeviceState(device, state) {
        if (gameState.gameOver) return;
        const config = {
            heater: { flag: 'isHeaterOn', cost: gameConfig.heaterInitCost, onMsg: '🔥 Đã BẬT SƯỞI!', offMsg: '🧊 Đã TẮT Sưởi.' },
            fan: { flag: 'isFanOn', cost: gameConfig.fanInitCost, onMsg: '🌬️ Đã BẬT Quạt!', offMsg: '✖️ Đã TẮT Quạt.' },
            curtain: { flag: 'isCurtainOpen', cost: gameConfig.curtainInitCost, onMsg: '☀️ Đã MỞ Rèm!', offMsg: '🌙 Đã ĐÓNG Rèm.' }
        };
        const dev = config[device];
        if (state && !gameState[dev.flag]) {
            if (gameState.money < dev.cost) {
                gameState.currentMessage = `Không đủ tiền (cần ${dev.cost})!`;
            } else {
                gameState.money -= dev.cost;
                gameState[dev.flag] = true;
                gameState.currentMessage = dev.onMsg;
            }
        } else if (!state && gameState[dev.flag]) {
            gameState[dev.flag] = false;
            gameState.currentMessage = dev.offMsg;
        }
        updateCurrentTemp();
        updateAllUI();
    }

    function updateButtons() {
        document.querySelector('[data-action="heatOn"]').disabled = gameState.isHeaterOn;
        document.querySelector('[data-action="heatOff"]').disabled = !gameState.isHeaterOn;
        document.querySelector('[data-action="fanOn"]').disabled = gameState.isFanOn;
        document.querySelector('[data-action="fanOff"]').disabled = !gameState.isFanOn;
        document.querySelector('[data-action="curtainOpen"]').disabled = gameState.isCurtainOpen;
        document.querySelector('[data-action="curtainClose"]').disabled = !gameState.isCurtainOpen;
        document.querySelector('[data-action="waterPlantStart"]').disabled = gameState.isWatering || gameState.stats.water > 95;
        document.querySelector('[data-action="waterPlantStop"]').disabled = !gameState.isWatering;
        document.querySelector('[data-action="fertilizeStart"]').disabled = gameState.isFertilizing || gameState.stats.nutrition > 95;
        document.querySelector('[data-action="fertilizeStop"]').disabled = !gameState.isFertilizing;
        document.querySelector('[data-action="spray"]').disabled = gameState.infectionCount === 0 || gameState.money < actionCosts.spray;
        document.querySelector('[data-action="tend"]').disabled = gameState.money < actionCosts.tend || gameState.tendUsed;
    }
    
    document.querySelectorAll('.breed-select-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedBreed = breedSettings[event.target.dataset.breed];
            document.getElementById('difficulty-title').textContent = `Chọn Độ Khó cho Cà chua ${selectedBreed.name}`;
            document.getElementById('breed-selection-step').classList.add('hidden');
            document.getElementById('difficulty-selection-step').classList.remove('hidden');
        });
    });

    document.getElementById('back-to-breed-select').addEventListener('click', () => {
        document.getElementById('difficulty-selection-step').classList.add('hidden');
        document.getElementById('breed-selection-step').classList.remove('hidden');
    });

    document.querySelectorAll('.difficulty-select-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const difficultyId = event.target.dataset.difficultyId;
            currentConfig = difficultySettings[difficultyId];
            document.getElementById('welcome-screen').classList.add('hidden');
            initGame();
        });
    });
    
    document.getElementById('welcome-screen').classList.remove('hidden');
    document.getElementById('breed-selection-step').classList.remove('hidden');
    document.getElementById('difficulty-selection-step').classList.add('hidden');
});