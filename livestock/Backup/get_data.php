<?php
// Tên file: get_data.php (DÀNH CHO GAME NUÔI BÒ)
header('Content-Type: application/json; charset=utf-8');

// --- PHẦN 1: KẾT NỐI VÀ TRUY VẤN DATABASE ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "weather_db";
$tablename = "hourly_forecasts";

$fetchedWeatherScenario = [];
$error_message = "";

// Lấy độ khó từ tham số URL, mặc định là 2 nếu không có
$gameDifficultyID = isset($_GET['difficulty']) ? intval($_GET['difficulty']) : 2;

// --- PHẦN 2: CẤU HÌNH GAME NUÔI BÒ ---
$difficultySettings = [
    1 => [
        'id' => 1,
        'name' => 'Dễ',
        'statDecreaseRate' => 2.0,
        'initialMoney' => 500,
        'workProfit' => 150,
        'cowMinTemp' => 20,
        'tempScenario' => [22, 21, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 27, 26, 25, 24, 23, 23, 22, 22, 22, 22, 22, 22]
    ],
    2 => [
        'id' => 2,
        'name' => 'Trung Bình',
        'statDecreaseRate' => 3.0,
        'initialMoney' => 300,
        'workProfit' => 120,
        'cowMinTemp' => 20,
        'tempScenario' => [19, 18, 17, 17, 18, 20, 22, 24, 26, 28, 29, 30, 30, 29, 28, 27, 25, 23, 22, 21, 20, 19, 19, 19]
    ],
    3 => [
        'id' => 3,
        'name' => 'Khó',
        'statDecreaseRate' => 4.5,
        'initialMoney' => 150,
        'workProfit' => 100,
        'cowMinTemp' => 20,
        'tempScenario' => [18, 17, 17, 17, 17, 18, 21, 25, 28, 29, 30, 30, 30, 30, 30, 29, 26, 22, 19, 18, 18, 17, 17, 17]
    ],
    4 => [
        'id' => 4,
        'name' => 'Thử Thách',
        'statDecreaseRate' => 3.5,
        'initialMoney' => 250,
        'workProfit' => 110,
        'cowMinTemp' => 20,
        'tempScenario' => [15, 13, 11, 10, 12, 18, 25, 30, 35, 38, 40, 41, 40, 38, 35, 30, 25, 20, 18, 16, 15, 14, 13, 12]
    ],
    5 => [
        'id' => 5,
        'name' => 'Thực Tế',
        'statDecreaseRate' => 3.0,
        'initialMoney' => 300,
        'workProfit' => 120,
        'cowMinTemp' => 20,
        'tempScenario' => []
    ],
    7 => [
        'id' => 7,
        'name' => 'Siêu Dễ (Thủ công)',
        'statDecreaseRate' => 1.0,
        'initialMoney' => 1000,
        'workProfit' => 200,
        'cowMinTemp' => 20,
        'tempScenario' => [22, 21, 20, 20, 21, 22, 23, 24, 25, 26, 27, 27, 27, 26, 25, 24, 23, 23, 22, 22, 22, 22, 22, 22]
    ]
];

// Lấy độ khó từ tham số URL, mặc định là 2 nếu không có
$currentDifficulty = $difficultySettings[$gameDifficultyID] ?? $difficultySettings[2];

// CHỈ KẾT NỐI VÀ LẤY DỮ LIỆU TỪ DB NẾU NGƯỜI DÙNG CHỌN ĐỘ KHÓ 'THỰC TẾ' (ID 5)
if ($gameDifficultyID == 5) {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        $error_message = "Lỗi kết nối CSDL: " . $conn->connect_error . ". Game sẽ dùng kịch bản thời tiết mặc định.";
    } else {
        $conn->set_charset("utf8");
        $sql = "SELECT temperature AS temp, weather_description AS weather_type_vi FROM $tablename ORDER BY forecast_time ASC LIMIT 24";
        $result = $conn->query($sql);
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $row['temp'] = (float)$row['temp'];
                $fetchedWeatherScenario[] = $row;
            }
        } else {
            $error_message = "Không tìm thấy dữ liệu thời tiết trong CSDL hoặc có lỗi truy vấn. Game sẽ dùng kịch bản thời tiết mặc định.";
        }
        $conn->close();
    }
}

// Nếu không có dữ liệu thời tiết thực tế (do không chọn Thực tế hoặc lỗi), sử dụng kịch bản mặc định
if (empty($fetchedWeatherScenario)) {
    $fetchedWeatherScenario = $currentDifficulty['tempScenario'];
    $error_message .= " Đã áp dụng kịch bản nhiệt độ mặc định.";
}

// Gán ID vào đối tượng độ khó trước khi trả về
$currentDifficulty['id'] = $gameDifficultyID;

// --- PHẦN 3: TỔNG HỢP VÀ TRẢ VỀ JSON ---
$response_data = [
    'difficulty' => $currentDifficulty,
    'weatherData' => $fetchedWeatherScenario,
    'errorMessage' => trim($error_message),
];

echo json_encode($response_data);
?>