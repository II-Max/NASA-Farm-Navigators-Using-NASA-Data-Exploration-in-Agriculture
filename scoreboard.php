<?php
// File: scoreboard.php

// --- THÔNG TIN KẾT NỐI DATABASE (giống các file trước) ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "weather_db";
$tablename = "scoreboard";

$scores_by_game = [];
$error_message = "";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Không thể kết nối với Cơ sở dữ liệu.");
    }
    $conn->set_charset("utf8mb4");

    // Lấy tất cả điểm, sắp xếp theo tên game và điểm số giảm dần
    $sql = "SELECT name, score, play_time FROM $tablename ORDER BY name ASC, score DESC";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Nhóm các điểm số theo tên game
            $scores_by_game[$row['name']][] = [
                'score' => $row['score'],
                'play_time' => date("H:i, d-m-Y", strtotime($row['play_time'])) // Định dạng lại ngày giờ cho dễ đọc
            ];
        }
    } else {
        $error_message = "Chưa có điểm nào được ghi lại. Hãy chơi một ván game!";
    }
    $conn->close();
} catch (Exception $e) {
    $error_message = "Lỗi hệ thống: " . $e->getMessage();
}
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng Xếp Hạng</title>
    <link rel="stylesheet" href="scoreboard-style.css">
</head>
<body>

    <div class="container">
        <h1>🏆 Bảng Xếp Hạng 🏆</h1>

        <?php if (!empty($error_message)): ?>
            <p class="error-message"><?php echo htmlspecialchars($error_message); ?></p>
        <?php else: ?>
            <?php foreach ($scores_by_game as $game_name => $scores): ?>
                <div class="scoreboard-card">
                    <h2><?php echo htmlspecialchars($game_name); ?></h2>
                    <ol class="score-list">
                        <?php 
                        // Chỉ hiển thị top 10 điểm cao nhất cho mỗi game
                        $top_scores = array_slice($scores, 0, 10);
                        foreach ($top_scores as $index => $score_data): 
                            $medal = '';
                            if ($index == 0) $medal = '🥇';
                            if ($index == 1) $medal = '🥈';
                            if ($index == 2) $medal = '🥉';
                        ?>
                            <li>
                                <span class="rank"><?php echo $medal; ?></span>
                                <span class="score"><strong><?php echo number_format($score_data['score']); ?></strong> điểm</span>
                                <span class="time"><?php echo $score_data['play_time']; ?></span>
                            </li>
                        <?php endforeach; ?>
                    </ol>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <div class="back-link-container">
            <a href="../index.php" class="back-link">Quay Về Trang Chủ</a>
        </div>
    </div>

</body>
</html>
