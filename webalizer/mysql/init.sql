-- Tạo database
CREATE DATABASE IF NOT EXISTS weather_db;

-- Tạo user và cấp quyền
CREATE USER IF NOT EXISTS 'myuser'@'%' IDENTIFIED BY 'mypassword';
GRANT ALL PRIVILEGES ON weather_db.* TO 'myuser'@'%';
FLUSH PRIVILEGES;

-- Sử dụng database
USE weather_db;

-- Tạo các bảng cho dữ liệu thời tiết
CREATE TABLE IF NOT EXISTS weather_main (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thanh_pho VARCHAR(100),
    nguon VARCHAR(200),
    ngay_du_bao DATE,
    thoi_gian_cap_nhat DATETIME,
    nhiet_do_hien_tai FLOAT,
    do_am VARCHAR(50),
    luong_mua_hien_tai FLOAT,
    gio_toc_do_hien_tai FLOAT,
    ma_thoi_tiet INT,
    mo_ta_thoi_tiet VARCHAR(100),
    nhiet_do_cao_nhat_ngay FLOAT,
    nhiet_do_thap_nhat_ngay FLOAT,
    tong_luong_mua_ngay FLOAT,
    trang_thai_mua VARCHAR(100),
    loai_ngay VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weather_forecast_24h (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weather_main_id INT,
    time DATETIME,
    temperature_2m FLOAT,
    precipitation FLOAT,
    wind_speed_10m FLOAT,
    weather_code INT,
    weather_description VARCHAR(100),
    FOREIGN KEY (weather_main_id) REFERENCES weather_main(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS weather_time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    weather_main_id INT,
    time_slot_type VARCHAR(20),
    time DATETIME,
    temperature_2m FLOAT,
    precipitation FLOAT,
    wind_speed_10m FLOAT,
    weather_code INT,
    weather_description VARCHAR(100),
    FOREIGN KEY (weather_main_id) REFERENCES weather_main(id) ON DELETE CASCADE
);