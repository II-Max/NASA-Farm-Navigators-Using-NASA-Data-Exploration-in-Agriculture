<?php
// Tên file: greenhouse.php
// Phiên bản: Hoàn chỉnh - Khắc phục lỗi và tối ưu

// --- PHẦN 1: KẾT NỐI DATABASE (TÙY CHỌN) ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "weather_db";
$tablename = "hourly_forecasts";
$fetchedWeatherScenario = [];
$error_message = "";

@$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    $error_message = "Không thể kết nối CSDL. Trò chơi sẽ sử dụng dữ liệu thời tiết mặc định.";
} else {
    $conn->set_charset("utf8mb4");
    $sql = "SELECT HOUR(forecast_time) AS hour, ROUND(temperature) AS temp, weather_description AS weather_type_vi FROM $tablename ORDER BY forecast_time ASC LIMIT 24";
    $stmt = $conn->prepare($sql);
    
    if ($stmt && $stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows == 24) { 
            while($row = $result->fetch_assoc()) {
                $fetchedWeatherScenario[] = ['hour' => (int)$row['hour'], 'temp' => (int)$row['temp'], 'weather_type_vi' => trim($row['weather_type_vi'])];
            }
        } else {
            $error_message = "Không tìm thấy đủ 24 giờ dữ liệu, sử dụng kịch bản mặc định.";
        }
    } else {
        $error_message = "Lỗi truy vấn SQL, sử dụng kịch bản mặc định.";
    }
    $conn->close();
}

$json_weather_data = json_encode($fetchedWeatherScenario);
$json_error = json_encode($error_message);
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trò Chơi Trồng Cây - Vườn Ươm Cà Chua</title>
    <link rel="stylesheet" href="greenhouse.css">
    <script src="../config.js"></script>
</head>
<body>
    <div id="welcome-screen" class="modal-overlay">
        <div class="modal-content">
            <div id="breed-selection-step">
                <h2 style="margin-bottom: 10px;">Chào mừng đến Vườn Ươm Cà Chua!</h2>
                <p style="text-align: center; margin-bottom: 25px;">Hãy chọn giống cà chua bạn muốn trồng! <a href="info.html">Xem Thêm...</a></p>
                <div class="breed-selection">
                    <div class="breed-card">
                        <img src="../img/Beefsteak.png" alt="Cà chua Beefsteak">
                        <h3>Cà chua Beefsteak</h3>
                        <p class="breed-desc">Giống lớn, mọng nước. Cần nhiệt độ từ <strong>15°C - 30°C</strong>.</p>
                        <button class="breed-select-btn" data-breed="beefsteak">Chọn Beefsteak</button>
                    </div>
                    <div class="breed-card">
                        <img src="../img/cachuacherry.png" alt="Cà chua Cherry">
                        <h3>Cà chua Cherry</h3>
                        <p class="breed-desc">Kích thước nhỏ, ngọt. Cần nhiệt độ từ <strong>18°C - 32°C</strong>.</p>
                        <button class="breed-select-btn" data-breed="cherry">Chọn Cherry</button>
                    </div>
                    <div class="breed-card">
                        <img src="../img/Plum.png" alt="Cà chua Plum">
                        <h3>Cà chua Plum</h3>
                        <p class="breed-desc">Hình dáng dài, ít nước. Cần nhiệt độ từ <strong>16°C - 31°C</strong>.</p>
                        <button class="breed-select-btn" data-breed="plum">Chọn Plum</button>
                    </div>
                    <button class="back-btn" id="btn_back">⬅️ Về Menu</button>
                </div>
            </div>
            <div id="difficulty-selection-step" class="hidden">
                <h2 id="difficulty-title">Chọn Độ Khó</h2>
                <div class="difficulty-selection">
                    <button class="difficulty-select-btn" data-difficulty-id="0">Cực Dễ</button>
                    <button class="difficulty-select-btn" data-difficulty-id="1">Dễ</button>
                    <button class="difficulty-select-btn" data-difficulty-id="2">Trung Bình</button>
                    <button class="difficulty-select-btn" data-difficulty-id="3">Khó</button>
                    <button class="difficulty-select-btn" data-difficulty-id="4">Thử Thách</button>
                    <button class="difficulty-select-btn" data-difficulty-id="5">Thực Tế (MySQL)</button>
                </div>
                <button id="back-to-breed-select" class="back-btnn"> Quay Lại</button>
            </div>
        </div>
    </div>

    <div id="clock-container"><p id="game-time">00:00</p></div>    
    <div class="connection-log-container" style="display:none">
        <div id="connectionStatus" class="status-indicator"></div>
        <div id="statusText">Chưa kết nối Node-RED</div>
        <div id="logContainer" class="log-box"></div>
    </div>
    
    <div class="top-info-bar">
        <div id="day-display">Ngày: 1/1</div>
        <div id="money-display">💰 Tiền: 400</div>
        <div id="difficulty-display">Độ Khó: Trung Bình</div>
    </div>
    
    <div class="container">
        <div class="side-info-group">
            <div class="info-box" id="weather-info"><h3>Thời tiết</h3><div class="weather-icon">☀️</div><div class="weather-text">Nắng</div></div>
            <div class="info-box" id="plant-status-info"><h3>Trạng thái Cây</h3><div class="plant-status-icon">😊</div><div class="plant-status-text">Tươi tốt</div></div>
            <div class="info-box" id="temp-control-box">
                <h3>Nhiệt độ & Ánh sáng</h3>
                <div class="temp-display-container">🌡️ <span id="temp-display">25°C</span></div>
                <div class="temp-controls-group">
                    <div class="control-pair">
                        <button class="action-btn heat" data-action="heatOn">🔥 Bật Sưởi (-50)</button>
                        <button class="action-btn heat-off" data-action="heatOff">🧊 Tắt Sưởi</button>
                    </div>
                     <div class="control-pair">
                        <button class="action-btn fan-on" data-action="fanOn">🌬️ Bật Quạt (-30)</button>
                        <button class="action-btn fan-off" data-action="fanOff">✖️ Tắt Quạt</button>
                    </div>
                    <div class="control-pair">
                        <button class="action-btn curtain-open" data-action="curtainOpen">☀️ Đóng Rèm (-10)</button>
                        <button class="action-btn curtain-close" data-action="curtainClose">☀️ Mở Rèm</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="game-area">
            <div class="farm-area" id="farm-area"><img src="../img/cachua1.png" alt="Cây cà chua" class="plant"></div>
            <div class="stats-area">
                <div class="stat nutrition"><div class="stat-label">Dinh Dưỡng</div><div class="stat-bar"><div class="stat-fill"></div></div><div class="stat-value">80%</div></div>
                <div class="stat water"><div class="stat-label">Nước</div><div class="stat-bar"><div class="stat-fill"></div></div><div class="stat-value">70%</div></div>
                <div class="stat health"><div class="stat-label">Sức Khỏe</div><div class="stat-bar"><div class="stat-fill"></div></div><div class="stat-value">90%</div></div>
                <div class="stat growth"><div class="stat-label">Sinh Trưởng</div><div class="stat-bar"><div class="stat-fill"></div></div><div class="stat-value">0%</div></div>
                <div class="stat quality"><div class="stat-label">Chất Lượng</div><div class="stat-bar"><div class="stat-fill"></div></div><div class="stat-value">100%</div></div>
                <div id="plant-star-rating-container"><div id="plant-star-rating">⭐⭐⭐⭐⭐</div></div>
                <p class="message">...</p>
                <div class="actions">
                    <div class="action-pair">
                        <button class="action-btn water-plant" data-action="waterPlantStart">💧 Bắt đầu Tưới</button>
                        <button class="action-btn water-plant-stop" data-action="waterPlantStop">🛑 Dừng Tưới</button>
                    </div>
                    <div class="action-pair">
                        <button class="action-btn fertilize" data-action="fertilizeStart">🌿 Bắt đầu Bón Phân</button> 
                        <button class="action-btn fertilize-stop" data-action="fertilizeStop">🛑 Dừng Bón Phân</button>
                    </div>
                    <div class="single-actions">
                        <button class="action-btn spray" data-action="spray">💊 Phun Thuốc (-100)</button>
                        <button class="action-btn tend" data-action="tend">❤️ Chăm Sóc (-10)</button>
                        <button class="action-btn exit" data-action="exit">🚪 Thu Hoạch Ngay</button> 
                    </div>
                    <div class="turn-based-actions">
                        <button id="continue-btn" class="action-btn hidden" data-action="advanceHour">➡️ Tiếp Tục (Qua 1 Giờ)</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="game-over modal-overlay">
        <div class="game-over-content modal-content">
            <h2 id="final-result-title">Vụ Mùa Hoàn Tất!</h2>
            <div id="game-over-reason"></div>
            <div id="final-feedback" class="modal-section">
                <h3>Nhận Xét & Kinh Nghiệm</h3>
                <ul id="feedback-list"></ul>
            </div>
            <div class="game-over-actions">
                <a href="../index.php" class="exit-btn">Về Màn Hình Chính</a>
            </div>
        </div>
    </div>
    <div id="game-data" data-weather-data='<?php echo htmlspecialchars($json_weather_data, ENT_QUOTES, 'UTF-8'); ?>' data-error-message='<?php echo htmlspecialchars($json_error, ENT_QUOTES, 'UTF-8'); ?>'></div>
    <script src="greenhouse.js" defer></script>
</body>
</html>