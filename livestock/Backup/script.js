document.addEventListener('DOMContentLoaded', () => {
    const domElements = {
        welcomeScreen: document.getElementById('welcome-screen'),
        breedSelectionStep: document.getElementById('breed-selection-step'),
        difficultySelectionStep: document.getElementById('difficulty-selection-step'),
        difficultyTitle: document.getElementById('difficulty-title'),
        backToBreedSelectBtn: document.getElementById('back-to-breed-select'),
        gameContainer: document.getElementById('game-container'),
        messageElement: document.querySelector('.message'),
        bodyElement: document.body,
        cowElement: document.querySelector('.cow'),
        weatherIcon: document.querySelector('.weather-icon'),
        weatherText: document.querySelector('.weather-text'),
        cowFeelingIcon: document.querySelector('.cow-feeling-icon'),
        cowFeelingText: document.querySelector('.cow-feeling-text'),
        actionButtons: document.querySelectorAll('.action-btn'),
        gameOverScreen: document.querySelector('.game-over'),
        restartButton: document.querySelector('.game-over .restart-btn'),
        difficultyDisplay: document.getElementById('difficulty-display'),
        moneyDisplayEl: document.getElementById('money-display'),
        gameTimeEl: document.getElementById('game-time'),
        dayDisplayEl: document.getElementById('day-display'),
        tempDisplayEl: document.getElementById('temp-display'),
        gameAdviceEl: document.getElementById('game-advice'),
        nextHourBtn: document.querySelector('[data-action="nextHour"]')
    };
    
    let selectedBreed = null;

    document.querySelectorAll('.breed-select-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            selectedBreed = event.target.dataset.breed;
            const breedName = event.target.dataset.breedName;
            domElements.difficultyTitle.textContent = `Chọn Độ Khó cho ${breedName}`;
            domElements.breedSelectionStep.classList.add('hidden');
            domElements.difficultySelectionStep.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.difficulty-select-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const difficultyId = event.target.dataset.difficultyId;
            startGame(selectedBreed, difficultyId);
        });
    });

    domElements.backToBreedSelectBtn.addEventListener('click', () => {
        domElements.difficultySelectionStep.classList.add('hidden');
        domElements.breedSelectionStep.classList.remove('hidden');
    });

    domElements.restartButton.addEventListener('click', () => {
        domElements.gameOverScreen.style.display = 'none';
        domElements.gameContainer.classList.add('hidden');
        domElements.difficultySelectionStep.classList.add('hidden');
        domElements.breedSelectionStep.classList.remove('hidden');
        domElements.welcomeScreen.style.display = 'flex';
    });

    domElements.actionButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const action = button.dataset.action;
            if (action === 'nextHour') {
                gameLoop();
            } else {
                handleAction(action);
            }
        });
    });

    async function sendSignal(signal) {
        if (!signal) return;
        const nodeRedUrl = 'http://127.0.0.1:1880/choice';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(nodeRedUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signal }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
            await response.json();
            return true;
        } catch (error) {
            console.error(error.message);
            return false;
        }
    }

    async function startGame(breed, difficultyId) {
        try {
            domElements.gameContainer.classList.remove('hidden');
            domElements.welcomeScreen.style.display = 'none';
            domElements.gameOverScreen.style.display = 'none';
            domElements.messageElement.textContent = 'Đang tải dữ liệu...';

            const response = await fetch(`get_data.php?difficulty=${difficultyId}&_=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
            
            const serverData = await response.json();
            
            fetchedWeatherScenario = serverData.weatherData;

            initGame(serverData, breed);
        } catch (error) {
            domElements.messageElement.textContent = `Không thể tải game: ${error.message}.`;
        }
    }
    
    let gameState = {}, currentDifficulty = {}, actionCosts = {}, defaultSettings = {}, gameLoopInterval, fetchedWeatherScenario = [], chosenCowImages = {};
    const BASE_SALE_PRICE = 500;
    const TOTAL_DAYS = 1, HOURS_PER_DAY = 24, REAL_SECONDS_PER_GAME_HOUR = 3, GAME_LOOP_INTERVAL = REAL_SECONDS_PER_GAME_HOUR * 1000, HEATER_BONUS_TEMP = 5, HEATER_INIT_COST = 50, HEATER_HOURLY_COST = 25, FAN_BONUS_TEMP = -5, FAN_INIT_COST = 30, FAN_HOURLY_COST = 15, HOURLY_CONTINUOUS_COST = 25, STAT_INCREASE_PER_HOUR = 15, WORK_HAPPINESS_PENALTY = 20, MAX_INFECTION_COUNT = 3, MAX_PLAY_COUNT = 2;
    const TIME_RANGES = { 'Đêm': { start: 0, end: 6 }, 'Sáng': { start: 6, end: 10 }, 'Trưa': { start: 10, end: 14 }, 'Chiều': { start: 14, end: 18 }, 'Tối': { start: 18, end: 24 } };
    const WEATHER_MAPPING = { 'Nhiều mây': 'cloudy', 'Nắng': 'sunny', 'Mưa': 'rainy', 'Mưa nhẹ': 'rainy', 'Gió': 'windy', 'Trời trong': 'perfect', 'Nóng': 'hot', 'Tuyết': 'cold', 'Mưa rào nhẹ': 'rainy', 'Mưa dông': 'rainy', 'Ít mây': 'perfect', 'Không xác định': 'cloudy', 'Giông bão': 'rainy' };
    const weatherTypes = [ { type: 'cold', name: 'Lạnh', icon: '❄️' }, { type: 'rainy', name: 'Mưa', icon: '🌧️' }, { type: 'windy', name: 'Gió', icon: '💨' }, { type: 'perfect', name: 'Đẹp', icon: '🌈' }, { type: 'sunny', name: 'Nắng', icon: '☀️' }, { type: 'hot', name: 'Nóng', icon: '🔥' }, { type: 'cloudy', name: 'Nhiều mây', icon: '☁️' }];
    
    function initGame(serverData, breed) {
        const breedSettings = {
            holstein: { min: 10, max: 25, img: { day: '../img/Holstein_Friesian.png', sick: '../img/holstein_sick.png' } },
            angus:    { min: 15, max: 28, img: { day: '../img/Angus.png', sick: '../img/angus_sick.png' } },
            brahman:  { min: 22, max: 35, img: { day: '../img/Brahman.png', sick: '../img/brahman_sick.png' } }
        };
        const selectedBreed = breedSettings[breed] || breedSettings.angus;
        currentDifficulty = serverData.difficulty;
        actionCosts = { medicine: 100, play: 0, work: -currentDifficulty.workProfit };
        defaultSettings = { 
            statDecreaseRate: currentDifficulty.statDecreaseRate, 
            cowMinTemp: selectedBreed.min, 
            cowMaxTemp: selectedBreed.max 
        };
        chosenCowImages = selectedBreed.img;
        gameState = {
            money: currentDifficulty.initialMoney, day: 1, gameHour: 0,
            stats: { hunger: 80, thirst: 60, health: 100, happiness: 70, quality: 100 },
            weather: { type: 'sunny', name: '...', icon: '⌛' }, cowFeeling: { text: '...', icon: '⌛' },
            currentTemp: 25, baseTemp: 25, isHeaterOn: false, isFanOn: false,
            isFeeding: false, isWatering: false, infectionCount: 0, playCount: 0,
            isTreating: false,
            currentMessage: serverData.errorMessage || `Bắt đầu chăm sóc bò!`, gameOver: false,
            playHistory: { lowHealthHours: 0, lowHappinessHours: 0, timesWorked: 0, timesGotSick: 0 }
        };
        domElements.difficultyDisplay.textContent = `Độ Khó: ${currentDifficulty.name}`;
        document.querySelector('[data-action="work"]').textContent = `💰 Đi Làm (${currentDifficulty.workProfit})`;
        
        domElements.cowElement.src = chosenCowImages.day;

        updateWeatherAndTemp();
        updateTimeCSS();
        updateCowFeeling();
        updateUI();

        // THAY ĐỔI: Ẩn/hiện nút và điều khiển vòng lặp thời gian dựa trên ID độ khó
        if (currentDifficulty.id == 7) {
            clearInterval(gameLoopInterval);
            domElements.nextHourBtn.classList.remove('hidden');
        } else {
            domElements.nextHourBtn.classList.add('hidden');
            gameLoopInterval = setInterval(gameLoop, GAME_LOOP_INTERVAL);
        }
    }
    
    function handleAction(action) {
        if (gameState.gameOver || !action) return;
        const signalMap = { feedStart: 'tronthucan1', feedStop: 'tronthucan2', waterStart: 'nuocuong1', waterStop: 'nuocuong2', heatOn: 'densuoi1', heatOff: 'densuoi2', fanOn: 'quat1', fanOff: 'quat2' };
        if (signalMap[action]) { sendSignal(signalMap[action]); }
        if (action === 'medicine') {
            if (gameState.infectionCount > 0 && gameState.money >= actionCosts.medicine && !gameState.isTreating) {
                gameState.isTreating = true;
                gameState.money -= actionCosts.medicine;
                gameState.stats.health = Math.min(100, gameState.stats.health + 20);
                gameState.infectionCount = Math.max(0, gameState.infectionCount - 1);
                gameState.currentMessage = '💊 Đang cho bò uống thuốc...';
                sendSignal('thuoc1').then(success => {
                    if (success) {
                        setTimeout(() => {
                            sendSignal('thuoc2');
                            gameState.isTreating = false;
                            gameState.currentMessage = 'Bò đã uống thuốc xong!';
                            updateUI();
                        }, 3000);
                    } else {
                         gameState.isTreating = false;
                    }
                });
                updateUI();
            }
        } else {
            switch (action) {
                // Sửa lỗi: Cho phép work ở chế độ thủ công, nhưng không tự động advance giờ
                case 'work': if (gameState.stats.health > 50 && gameState.stats.hunger > 40 && gameState.infectionCount === 0) { gameState.playHistory.timesWorked++; let workMessage = `Bò đã làm việc và kiếm được ${currentDifficulty.workProfit} tiền.`; gameState.money += currentDifficulty.workProfit; gameState.stats.health = Math.max(0, gameState.stats.health - 10); gameState.stats.hunger = Math.max(0, gameState.stats.hunger - 15); gameState.stats.thirst = Math.max(0, gameState.stats.thirst - 20); gameState.stats.happiness = Math.max(0, gameState.stats.happiness - WORK_HAPPINESS_PENALTY); if (Math.random() < 0.25 && gameState.infectionCount < MAX_INFECTION_COUNT) { gameState.infectionCount++; gameState.playHistory.timesGotSick++; workMessage = `Bò đã làm việc vất vả và bị thương! (+${currentDifficulty.workProfit} tiền)`; } gameState.currentMessage = workMessage; if (currentDifficulty.id != 7) { advanceGameHour(); advanceGameHour(); } } break;
                case 'feedStart': gameState.isFeeding = true; gameState.isWatering = false; break;
                case 'feedStop': gameState.isFeeding = false; break;
                case 'waterStart': gameState.isWatering = true; gameState.isFeeding = false; break;
                case 'waterStop': gameState.isWatering = false; break;
                case 'heatOn': if (gameState.money >= HEATER_INIT_COST) { gameState.money -= HEATER_INIT_COST; gameState.isHeaterOn = true; recalculateCurrentTemp(); } break;
                case 'heatOff': gameState.isHeaterOn = false; recalculateCurrentTemp(); break;
                case 'fanOn': if (gameState.money >= FAN_INIT_COST) { gameState.money -= FAN_INIT_COST; gameState.isFanOn = true; recalculateCurrentTemp(); } break;
                case 'fanOff': gameState.isFanOn = false; recalculateCurrentTemp(); break;
                case 'play': if (gameState.playCount < MAX_PLAY_COUNT) { gameState.stats.happiness = Math.min(100, gameState.stats.happiness + 25); gameState.playCount++; } break;
                case 'exit': gameOver("Bạn đã bán bò sớm.", true, true); break;
            }
            updateCowFeeling();
            updateUI();
        }
    }

    function gameLoop() {
        if (!gameState || gameState.gameOver) return;
        let primaryMessage = '';

        if (gameState.isFeeding) { 
            if (gameState.money >= HOURLY_CONTINUOUS_COST) { 
                gameState.money -= HOURLY_CONTINUOUS_COST; 
                gameState.stats.hunger = Math.min(100, gameState.stats.hunger + STAT_INCREASE_PER_HOUR); 
                primaryMessage += `🍎 Đang cho ăn... `; 
            } else { 
                primaryMessage = "Không đủ tiền để cho ăn! Dừng lại.";
                handleAction('feedStop');
            } 
        }
        if (gameState.isWatering) { 
            if (gameState.money >= HOURLY_CONTINUOUS_COST) { 
                gameState.money -= HOURLY_CONTINUOUS_COST; 
                gameState.stats.thirst = Math.min(100, gameState.stats.thirst + STAT_INCREASE_PER_HOUR); 
                primaryMessage += `💧 Đang cho uống... `; 
            } else { 
                primaryMessage = "Không đủ tiền để cho uống! Dừng lại.";
                handleAction('waterStop');
            } 
        }

        if (gameState.isHeaterOn) {
            if (gameState.money >= HEATER_HOURLY_COST) {
                 gameState.money -= HEATER_HOURLY_COST;
            } else {
                gameState.isHeaterOn = false;
                recalculateCurrentTemp();
                primaryMessage = "Không đủ tiền để duy trì máy sưởi! Máy đã tắt.";
            }
        }
        if (gameState.isFanOn) {
            if (gameState.money >= FAN_HOURLY_COST) {
                 gameState.money -= FAN_HOURLY_COST;
            } else {
                gameState.isFanOn = false;
                recalculateCurrentTemp();
                primaryMessage = "Không đủ tiền để duy trì quạt! Quạt đã tắt.";
            }
        }

        let healthPenalty = 0;
        const { currentTemp, stats, infectionCount } = gameState;
        const { cowMinTemp, cowMaxTemp } = defaultSettings;
        if (currentTemp < cowMinTemp) healthPenalty += (cowMinTemp - currentTemp) * 0.5; else if (currentTemp > cowMaxTemp) healthPenalty += (currentTemp - cowMaxTemp) * 0.4;
        if (stats.hunger < 25) healthPenalty += 2; if (stats.thirst < 25) healthPenalty += 2;
        if (infectionCount > 0) healthPenalty += infectionCount * 5;
        if (stats.happiness < 50) { healthPenalty += 1.5; stats.quality = Math.max(0, stats.quality - 1); if (!primaryMessage) primaryMessage = "😟 Bò đang không vui!"; }
        if (stats.health < 40) gameState.playHistory.lowHealthHours++;
        if (stats.happiness < 50) gameState.playHistory.lowHappinessHours++;
        
        if (healthPenalty > 0) { stats.health = Math.max(0, stats.health - healthPenalty); } else { stats.health = Math.min(100, stats.health + 2); }

        Object.keys(gameState.stats).forEach(stat => {
            if (stat === 'health' || stat === 'quality') return;
            let decreaseAmount = defaultSettings.statDecreaseRate;
            let tempDifference = 0;
            if (currentTemp < cowMinTemp) tempDifference = cowMinTemp - currentTemp; else if (currentTemp > cowMaxTemp) tempDifference = currentTemp - cowMaxTemp;
            if (tempDifference > 0) { const tempFactor = 1 + (tempDifference / 5) * 0.20; decreaseAmount *= tempFactor; }
            gameState.stats[stat] = Math.max(0, gameState.stats[stat] - decreaseAmount);
        });
        gameState.currentMessage = primaryMessage || 'Mọi thứ đều ổn.';
        advanceGameHour(); updateCowFeeling(); updateUI(); checkGameOver();
    }
    
    function calculateSellPrice() { const { stats, gameHour } = gameState; const { health, quality, happiness } = stats; if (health <= 10 || quality <= 10) return 0; const statMultiplier = (health * 0.4 + quality * 0.4 + happiness * 0.2) / 100; const timeMultiplier = 0.7 + Math.pow(gameHour / (HOURS_PER_DAY - 1), 2) * 1.0; const finalPrice = BASE_SALE_PRICE * statMultiplier * timeMultiplier; return Math.round(finalPrice); }
    
    function updateWeatherAndTemp() {
        const hourIndex = gameState.gameHour % 24;
        const scenario = fetchedWeatherScenario;
        const forecastData = scenario[hourIndex];
        let rawTemp, weatherName;
        if (typeof forecastData === 'object' && forecastData !== null) {
            rawTemp = forecastData.temp;
            weatherName = forecastData.weather_type_vi;
        } else {
            rawTemp = forecastData;
            weatherName = 'Không xác định'; 
        }
        if (typeof rawTemp !== 'number') { rawTemp = 25; }
        const weatherType = WEATHER_MAPPING[weatherName] || 'cloudy';
        gameState.baseTemp = rawTemp;
        gameState.weather = { type: weatherType, name: weatherName };
        recalculateCurrentTemp();
    }

    function recalculateCurrentTemp() { let tempAdjustment = 0; if (gameState.isHeaterOn) tempAdjustment += HEATER_BONUS_TEMP; if (gameState.isFanOn) tempAdjustment += FAN_BONUS_TEMP; gameState.currentTemp = gameState.baseTemp + tempAdjustment; }
    
    function advanceGameHour() { if (gameState.gameOver) return; gameState.gameHour++; if (gameState.gameHour >= HOURS_PER_DAY) { if (gameState.day === TOTAL_DAYS) { gameOver("🥳 Chúc mừng!", true, true); return; } gameState.gameHour = 0; gameState.day++; gameState.playCount = 0; } updateWeatherAndTemp(); updateTimeCSS(); }
    
    function checkGameOver() { if (gameState.gameOver) return; let reason = null; if (gameState.money < 0) reason = "Bạn đã phá sản!"; else if (gameState.stats.health <= 0) reason = "Bò đã chết!"; else if (gameState.stats.hunger <= 0) reason = "Bò đã chết đói!"; else if (gameState.stats.thirst <= 0) reason = "Bò đã chết khát!"; if (reason) gameOver(reason, false, false); }
    
    function gameOver(reason, isWin, isSale) {
        gameState.gameOver = true;
        clearInterval(gameLoopInterval);
        let finalTitle = isWin ? "🎉 BẠN ĐÃ THẮNG! 🎉" : "GAME OVER";
        let finalReason = reason;
        let sellProfit = 0;
        if (isSale) {
            sellProfit = calculateSellPrice();
            finalTitle = "💰 GIAO DỊCH THÀNH CÔNG 💰";
            finalReason += `<br>Bò của bạn đã được bán với giá: <strong>${sellProfit}</strong> tiền.`;
        }
        const finalMoney = gameState.money + sellProfit;
        document.getElementById('final-result-title').textContent = finalTitle;
        document.getElementById('game-over-reason').innerHTML = `${finalReason}<br><br>Sức khỏe: <strong>${Math.round(gameState.stats.health)}%</strong><br>Chất lượng: <strong>${Math.round(gameState.stats.quality)}%</strong><br><hr>Tiền hiện có: <strong>${gameState.money}</strong><br>Tiền bán bò: <strong>${sellProfit}</strong><br><span style="font-size: 1.5rem; color: #4CAF50;">TỔNG CỘNG: <strong>${finalMoney}</strong></span>`;
        let goodPoints = [];
        let improvementPoints = [];
        const { playHistory, stats } = gameState;
        if (reason === "Bạn đã phá sản!") { improvementPoints.push("<strong>Khó khăn tài chính?</strong> Hãy cân bằng giữa việc 'Đi làm' để có thu nhập và chi tiêu hợp lý. Đôi khi, đầu tư vào sức khỏe bò sớm sẽ tiết kiệm chi phí thuốc men sau này."); }
        if (playHistory.lowHealthHours > 6) { improvementPoints.push("<strong>Sức khỏe báo động:</strong> Bò thường xuyên yếu, đây là nguyên nhân chính làm giảm Chất lượng. 💡 **Mẹo:** Luôn để mắt tới nhiệt độ chuồng và dùng máy sưởi/quạt khi cần. Đó là một khoản đầu tư đáng giá!"); }
        if (playHistory.lowHappinessHours > 8) { improvementPoints.push("<strong>Bò bị stress:</strong> Một chú bò không vui sẽ làm giảm sút Chất lượng đáng kể. 💡 **Mẹo:** Mỗi ngày chỉ cần 'Chơi đùa' 1-2 lần là đã tạo ra sự khác biệt lớn!"); }
        if (playHistory.timesGotSick > 1) { improvementPoints.push("<strong>Rủi ro khi đi làm:</strong> Bò bị thương nhiều lần cho thấy nó chưa đủ khỏe mạnh. 💡 **Chiến lược:** Hãy đảm bảo Sức khỏe trên 70% và Độ no trên 50% trước khi cho bò đi làm để tối đa hóa lợi nhuận và giảm rủi ro."); }
        if (stats.quality < 60 && (isWin || isSale)) { improvementPoints.push("<strong>Chất lượng chưa cao:</strong> Dù đã hoàn thành, nhưng giá trị bò có thể tốt hơn. Chất lượng là tấm gương phản chiếu sự chăm sóc toàn diện. Một chú bò luôn no đủ, khỏe mạnh và vui vẻ sẽ có chất lượng hảo hạng."); }
        if (isWin || isSale) {
            if (finalMoney > currentDifficulty.initialMoney * 2.5) { goodPoints.push("<strong>Nhà Kinh Tế Tài Ba!</strong> Bạn đã quản lý tài chính xuất sắc, thu về lợi nhuận ấn tượng. Đây là kỹ năng quan trọng nhất của một người nông dân hiện đại."); }
            if (stats.health > 90 && stats.happiness > 80) { goodPoints.push("<strong>Người Bạn Của Bò!</strong> Các chỉ số cuối cùng cho thấy bạn thực sự quan tâm đến phúc lợi của Bò Vàng. Một chú bò hạnh phúc chính là thành công lớn nhất."); }
            if (playHistory.timesGotSick === 0) { goodPoints.push("<strong>Chuyên Gia Sức Khỏe!</strong> Bạn đã giữ cho Bò Vàng không bị bệnh lần nào. Môi trường sống tốt và sự quan tâm kịp thời của bạn đã được đền đáp."); }
            if (stats.quality > 95) { goodPoints.push("<strong>Chất Lượng Thượng Hạng!</strong> Đạt được mức chất lượng này cho thấy bạn là một chuyên gia chăn nuôi, tối ưu trong mọi khía cạnh chăm sóc."); }
        }
        let adviceHTML = "";
        if (goodPoints.length > 0) { adviceHTML += "<h4>⭐ Những Điểm Làm Tốt</h4><ul>"; goodPoints.forEach(p => { adviceHTML += `<li>${p}</li>`; }); adviceHTML += "</ul>"; }
        if (improvementPoints.length > 0) { adviceHTML += "<h4>💡 Gợi Ý & Chiến Lược</h4><ul>"; improvementPoints.forEach(p => { adviceHTML += `<li>${p}</li>`; }); adviceHTML += "</ul>"; }
        if (adviceHTML === "") { adviceHTML = "<h4>🎉 Hoàn Hảo!</h4><p>Bạn đã hoàn thành xuất sắc thử thách mà không có lỗi nào đáng kể. Hãy thử sức ở độ khó cao hơn nhé!</p>"; }
        domElements.gameAdviceEl.innerHTML = adviceHTML;
        domElements.gameOverScreen.style.display = 'flex';
    }

    function updateUI() {
        if (!gameState || !currentDifficulty) return;
        const { gameTimeEl, dayDisplayEl, moneyDisplayEl, tempDisplayEl, weatherIcon, weatherText, cowFeelingIcon, cowFeelingText, messageElement, cowElement, actionButtons } = domElements;
        const weatherInfo = weatherTypes.find(w => w.type === gameState.weather.type) || { icon: '❓' };
        
        gameTimeEl.textContent = `Thời gian: ${getCurrentTimeLabel()}`;
        dayDisplayEl.textContent = `Ngày: ${gameState.day}/${TOTAL_DAYS}`;
        moneyDisplayEl.textContent = `💰 Tiền: ${Math.round(gameState.money)}`;
        tempDisplayEl.textContent = `${Math.round(gameState.currentTemp)}°C`;
        weatherIcon.textContent = weatherInfo.icon;
        weatherText.textContent = gameState.weather.name;
        cowFeelingIcon.textContent = gameState.cowFeeling.icon;
        cowFeelingText.textContent = gameState.cowFeeling.text;
        messageElement.textContent = gameState.currentMessage;

        Object.keys(gameState.stats).forEach(stat => {
            const statValue = Math.round(gameState.stats[stat]);
            const statElement = document.querySelector(`.${stat}`);
            if (statElement) {
                const fillElement = statElement.querySelector('.stat-fill');
                if (fillElement) { fillElement.style.width = `${statValue}%`; }
                if (statValue <= 30) { statElement.classList.add('low-stat'); } 
                else { statElement.classList.remove('low-stat'); }
            }
        });

        const isSick = gameState.infectionCount > 0 || gameState.stats.health < 30;
        cowElement.classList.toggle('sick', isSick);
        cowElement.classList.toggle('happy', gameState.stats.happiness > 80 && !isSick);

        if (isSick) { 
            cowElement.src = chosenCowImages.sick; 
        } else { 
            cowElement.src = chosenCowImages.day; 
        }
        
        actionButtons.forEach(button => {
            const action = button.dataset.action;
            let isDisabled = false; let title = "";
            switch (action) {
                case 'medicine': if (gameState.isTreating) { isDisabled = true; title = "Đang trong quá trình chữa bệnh..."; } else if (gameState.infectionCount === 0) { isDisabled = true; title = "Bò không bị bệnh!"; } else if (gameState.money < actionCosts.medicine) { isDisabled = true; title = `Không đủ tiền (cần ${actionCosts.medicine})`; } break;
                case 'play': if (gameState.playCount >= MAX_PLAY_COUNT) { isDisabled = true; title = `Đã chơi đủ ${MAX_PLAY_COUNT} lần hôm nay!`; } else if (gameState.stats.happiness >= 95) { isDisabled = true; title = "Bò đang rất vui rồi!"; } break;
                case 'work': if (gameState.stats.health < 50 || gameState.stats.hunger < 40) { isDisabled = true; title = "Bò quá yếu để đi làm!"; } else if (gameState.infectionCount > 0) { isDisabled = true; title = "Bò đang bị bệnh, không thể đi làm!"; } break;
                case 'feedStart': isDisabled = gameState.isFeeding || gameState.stats.hunger >= 100; break;
                case 'waterStart': isDisabled = gameState.isWatering || gameState.stats.thirst >= 100; break;
                case 'feedStop': isDisabled = !gameState.isFeeding; break;
                case 'waterStop': isDisabled = !gameState.isWatering; break;
                case 'heatOn': isDisabled = gameState.isHeaterOn || gameState.money < HEATER_INIT_COST; break;
                case 'heatOff': isDisabled = !gameState.isHeaterOn; break;
                case 'fanOn': isDisabled = gameState.isFanOn || gameState.money < FAN_INIT_COST; break;
                case 'fanOff': isDisabled = !gameState.isFanOn; break;
            }
            button.disabled = isDisabled; button.title = title;
        });
    }

    function updateCowFeeling() { const { currentTemp, stats, infectionCount } = gameState; const { cowMinTemp, cowMaxTemp } = defaultSettings; let feeling = { text: 'Thoải mái', icon: '😊' }; if (infectionCount > 0) feeling = { text: `Bị thương (${infectionCount}/3)`, icon: '🤒' }; else if (stats.health < 30) feeling = { text: 'Rất yếu', icon: '🤢' }; else if (stats.happiness < 50) feeling = { text: 'Buồn bã', icon: '😟' }; else if (currentTemp < cowMinTemp) feeling = { text: 'Hơi lạnh', icon: '😨' }; else if (currentTemp > cowMaxTemp) feeling = { text: 'Hơi nóng', icon: '🥵' }; gameState.cowFeeling = feeling; }
    
    function getCurrentTimeLabel() {
        const hour = gameState.gameHour;
        const formattedHour = hour.toString().padStart(2, '0');
        for (const label in TIME_RANGES) {
            if (hour >= TIME_RANGES[label].start && hour < TIME_RANGES[label].end) {
                return `${label} (${formattedHour}:00)`;
            }
        }
        return `Đêm (${formattedHour}:00)`;
    }
    
    function updateTimeCSS() { const currentTimeLabel = getCurrentTimeLabel(); const timeOfDay = currentTimeLabel.split(' ')[0]; const normalizedName = timeOfDay.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); domElements.bodyElement.className = `time-${normalizedName}`; }
});