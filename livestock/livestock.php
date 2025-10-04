<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trò Chơi Nuôi Bò</title>
    <script src="../config.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="time-sáng">
    <div id="welcome-screen">
        <div class="welcome-content">
            <div id="breed-selection-step">
                <h2 style="margin-bottom: 10px;">Chọn Giống Bò Của Bạn</h2>
                <p style="text-align: center; margin-bottom: 25px;">Mỗi giống bò có một ngưỡng chịu nhiệt khác nhau, hãy chọn một cách khôn ngoan! <a href="info.html">Xem Thêm...</a></p>
                <div class="breed-selection">
                    <div class="breed-card">
                        <img src="../img/Holstein_Friesian.png" alt="Bò Holstein">
                        <h3>Bò Holstein</h3>
                        <p class="breed-desc">"Nữ hoàng sữa" đến từ vùng ôn đới. Rất nhạy cảm với nhiệt độ cao.<br><br> Nhiệt độ thích hợp: 10°C - 25°C</p>
                        <button class="breed-select-btn" data-breed="holstein" data-breed-name="Bò Holstein">Chọn Holstein</button>
                    </div>
                    <div class="breed-card">
                        <img src="../img/Angus.png" alt="Bò Angus">
                        <h3>Bò Angus</h3>
                        <p class="breed-desc">Giống bò cho thịt hảo hạng, cứng cáp và có khả năng thích nghi tốt.<br><br> Nhiệt độ thích hợp: 15°C - 28°C</p>
                        <button class="breed-select-btn" data-breed="angus" data-breed-name="Bò Angus">Chọn Angus</button>
                    </div>
                    <div class="breed-card">
                        <img src="../img/Brahman.png" alt="Bò Brahman">
                        <h3>Bò Brahman</h3>
                        <p class="breed-desc">Bậc thầy chịu nhiệt đến từ xứ nóng, nhưng không chịu được lạnh.<br><br> Nhiệt độ thích hợp: 22°C - 35°C</p>
                        <button class="breed-select-btn" data-breed="brahman" data-breed-name="Bò Brahman">Chọn Brahman</button>
                    </div>
                </div>
            </div>

            <div id="difficulty-selection-step" class="hidden">
                <h2 id="difficulty-title">Chọn Độ Khó</h2>
                <div class="difficulty-selection">
                    <button class="difficulty-select-btn" data-difficulty-id="1">Dễ</button>
                    <button class="difficulty-select-btn" data-difficulty-id="2">Trung Bình</button>
                    <button class="difficulty-select-btn" data-difficulty-id="3">Khó</button>
                    <button class="difficulty-select-btn" data-difficulty-id="4">Thử Thách</button>
                    <button class="difficulty-select-btn" data-difficulty-id="5">Thực Tế (MySQL)</button>
                    <button class="difficulty-select-btn" data-difficulty-id="7">Siêu Dễ (Thủ công)</button>
                </div>
                <button id="back-to-breed-select" class="back-btn"> Quay Lại</button>
            </div>
        </div>
    </div>

    <div id="game-container" class="hidden">
        <h1>Trang Trại Vui Vẻ</h1>
        <div class="stats-header">
            <div id="day-display">Ngày: 1/1</div>
            <div id="game-time">Thời gian: ...</div>
            <div id="money-display">💰 Tiền: ...</div>
            <div id="difficulty-display">Độ Khó: ...</div>
        </div>
        <div class="container">
            <div class="side-info-group">
                <div class="info-box" id="weather-info">
                    <h3>Thời tiết</h3>
                    <div class="weather-icon">...</div>
                    <div class="weather-text">...</div>
                </div>
                <div class="info-box" id="cow-feeling-info">
                    <h3>Cảm Xúc Của Bò</h3>
                    <div class="cow-feeling-icon">...</div>
                    <div class="cow-feeling-text">...</div>
                </div>
                <div class="info-box" id="temp-control-box">
                    <h3>Nhiệt Độ Chuồng</h3>
                    <div id="temp-display" style="font-size: 2rem; margin-bottom: 10px;">...°C</div>
                    <div class="temp-controls-group">
                        <div class="control-pair"><button class="action-btn" data-action="heatOn"><span>🔥</span>Bật Sưởi</button><button class="action-btn" data-action="heatOff">Tắt</button></div>
                        <div class="control-pair"><button class="action-btn" data-action="fanOn"><span>🌬️</span>Bật Quạt</button><button class="action-btn" data-action="fanOff">Tắt</button></div>
                    </div>
                </div>
            </div>
            <div class="game-area">
                <div class="farm-area"><img src="../img/Angus.png" alt="Hình ảnh con bò" class="cow"></div>
                <div class="stats-area">
                    <div class="stat hunger"><div class="stat-label">Độ no</div><div class="stat-bar"><div class="stat-fill"></div></div></div>
                    <div class="stat thirst"><div class="stat-label">Độ khát</div><div class="stat-bar"><div class="stat-fill"></div></div></div>
                    <div class="stat health"><div class="stat-label">Sức khỏe</div><div class="stat-bar"><div class="stat-fill"></div></div></div>
                    <div class="stat happiness"><div class="stat-label">Hạnh phúc</div><div class="stat-bar"><div class="stat-fill"></div></div></div>
                    <div class="stat quality"><div class="stat-label">Chất lượng</div><div class="stat-bar"><div class="stat-fill"></div></div></div>
                    
                    <div class="game-info"><p class="message">...</p></div>

                    <div class="actions">
                        <div class="action-pair">
                            <button class="action-btn feed" data-action="feedStart"><span>🍎</span> Cho Ăn</button>
                            <button class="action-btn feed-stop" data-action="feedStop"><span>🛑</span> Dừng</button>
                        </div>
                        <div class="action-pair">
                            <button class="action-btn water" data-action="waterStart"><span>💧</span> Cho Uống</button>
                            <button class="action-btn water-stop" data-action="waterStop"><span>🛑</span> Dừng</button>
                        </div>
                        <button class="action-btn medicine" data-action="medicine"><span>💊</span> Chữa Bệnh</button>
                        <button class="action-btn play" data-action="play"><span>🎾</span> Chơi Đùa</button>
                        <button class="action-btn work" data-action="work"><span>💰</span> Đi Làm</button>
                        <button class="action-btn exit" data-action="exit"><span>🚪</span> Bán Bò</button>
                        <button class="action-btn next-hour-btn hidden" data-action="nextHour"><span>➡️</span> Tiếp Tục</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="game-over">
        <div class="game-over-content">
            <h2 id="final-result-title">Kết Thúc</h2>
            <p id="game-over-reason"></p>
            <div id="game-advice"></div>
            <div class="game-over-actions">
                <button class="restart-btn">Chơi Lại</button>
                <a href="../index.php" class="restart-btn exit-btn">Thoát</a>
            </div>
        </div>
    </div>
    <script src="script.js" defer></script>
</body>
</html>