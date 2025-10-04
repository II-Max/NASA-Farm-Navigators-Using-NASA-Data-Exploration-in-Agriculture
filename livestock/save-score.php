<?php
// File: save-score.php (Đã cập nhật để lưu cả 'name')

header('Content-Type: application/json');

// --- THÔNG TIN KẾT NỐI DATABASE ---
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "weather_db";
$tablename = "scoreboard";

// Lấy dữ liệu được gửi từ JavaScript
$data = json_decode(file_get_contents('php://input'), true);

// --- CẬP NHẬT: Kiểm tra cả 'score' và 'name' ---
if (!isset($data['score']) || !is_numeric($data['score']) || !isset($data['name']) || empty(trim($data['name']))) {
    echo json_encode(['status' => 'error', 'message' => 'Dữ liệu điểm hoặc tên chương trình không hợp lệ.']);
    exit();
}

$score = intval($data['score']);
$name = trim($data['name']); // Lấy tên chương trình và xóa khoảng trắng thừa

// --- TIẾN HÀNH LƯU VÀO DATABASE ---
try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Lỗi kết nối CSDL: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");

    // --- CẬP NHẬT: Thêm cột 'name' vào câu lệnh SQL ---
    $sql = "INSERT INTO $tablename (score, name) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        throw new Exception("Lỗi khi chuẩn bị câu lệnh SQL: " . $conn->error);
    }

    // --- CẬP NHẬT: Ràng buộc 2 tham số: "i" cho score (integer) và "s" cho name (string) ---
    $stmt->bind_param("is", $score, $name);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Đã lưu điểm và tên thành công!']);
    } else {
        throw new Exception("Lỗi khi thực thi câu lệnh: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>