import requests
from datetime import datetime, timedelta
import json
import mysql.connector
from mysql.connector import Error
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'weather_db'
}
TABLES = {}
TABLES['current_weather'] = (
    "CREATE TABLE IF NOT EXISTS `current_weather` ("
    "  `id` int(11) NOT NULL AUTO_INCREMENT,"
    "  `city` varchar(100) NOT NULL,"
    "  `source` varchar(100),"
    "  `updated_at` datetime NOT NULL,"
    "  `forecast_time` datetime NOT NULL,"
    "  `temperature` float NOT NULL,"
    "  `precipitation` float NOT NULL,"
    "  `wind_speed` float NOT NULL,"
    "  `wind_direction` varchar(50),"
    "  `weather_code` int,"
    "  `weather_description` varchar(255),"
    "  PRIMARY KEY (`id`),"
    "  UNIQUE KEY `city_unique` (`city`)"
    ") ENGINE=InnoDB"
)
TABLES['daily_forecasts'] = (
    "CREATE TABLE IF NOT EXISTS `daily_forecasts` ("
    "  `id` int(11) NOT NULL AUTO_INCREMENT,"
    "  `city` varchar(100) NOT NULL,"
    "  `forecast_date` date NOT NULL,"
    "  `source` varchar(100),"
    "  `temp_max` float NOT NULL,"
    "  `temp_min` float NOT NULL,"
    "  `precipitation_sum` float NOT NULL,"
    "  PRIMARY KEY (`id`),"
    "  UNIQUE KEY `city_date_unique` (`city`, `forecast_date`)"
    ") ENGINE=InnoDB"
)
TABLES['hourly_forecasts'] = (
    "CREATE TABLE IF NOT EXISTS `hourly_forecasts` ("
    "  `id` int(11) NOT NULL AUTO_INCREMENT,"
    "  `daily_forecast_id` int(11) NOT NULL,"
    "  `forecast_time` datetime NOT NULL,"
    "  `temperature` float NOT NULL,"
    "  `precipitation` float NOT NULL,"
    "  `wind_speed` float NOT NULL,"
    "  `wind_direction` varchar(50),"
    "  `weather_code` int,"
    "  `weather_description` varchar(255),"
    "  PRIMARY KEY (`id`),"
    "  UNIQUE KEY `daily_time_unique` (`daily_forecast_id`, `forecast_time`),"
    "  FOREIGN KEY (`daily_forecast_id`)"
    "  REFERENCES `daily_forecasts`(`id`)"
    "  ON DELETE CASCADE"
    ") ENGINE=InnoDB"
)
class NASAWeather:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    def fetch_weather_data(self, city_name, latitude, longitude):
        url = "https://api.open-meteo.com/v1/forecast"
        today = datetime.now()
        start_date = today.strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=1)).strftime('%Y-%m-%d')
        params = {
            'latitude': latitude,
            'longitude': longitude,
            'hourly': 'temperature_2m,precipitation,wind_speed_10m,weather_code,wind_direction_10m',
            'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum',
            'timezone': 'auto',
            'start_date': start_date,
            'end_date': end_date
        }
        try:
            print(f"Đang lấy dữ liệu thời tiết cho '{city_name}'...")
            response = self.session.get(url, params=params, timeout=30)
            if response.status_code == 200:
                print("✅ Lấy dữ liệu API thành công!")
                data = response.json()
                return self.process_data(data, city_name)
            else:
                print(f"❌ Lỗi API: {response.status_code}")
                return None, None
        except Exception as e:
            print(f"❌ Lỗi kết nối: {e}")
            return None, None

    def process_data(self, data, city_name):
        try:
            print("Đang xử lý dữ liệu...")
            now = datetime.now()
            hourly_data = data['hourly']
            daily_data = data['daily']
            current_hour_str = now.strftime('%Y-%m-%dT%H:00')
            current_weather_raw = None
            for i, time_str in enumerate(hourly_data['time']):
                if time_str == current_hour_str:
                    current_weather_raw = {
                        'thoi_gian': time_str,
                        'nhiet_do': hourly_data['temperature_2m'][i],
                        'luong_mua': hourly_data['precipitation'][i],
                        'gio_toc_do': hourly_data['wind_speed_10m'][i],
                        'gio_huong': self._xac_dinh_huong_gio(hourly_data['wind_direction_10m'][i]),
                        'ma_thoi_tiet': hourly_data['weather_code'][i],
                        'mo_ta_thoi_tiet': self._get_weather_description(hourly_data['weather_code'][i])
                    }
                    break
            current_weather_processed = {
                'thanh_pho': city_name,
                'nguon': 'NASA GMAO Model via Open-Meteo',
                'thoi_gian_cap_nhat': now.strftime("%Y-%m-%d %H:%M:%S"),
                'du_lieu_hien_tai': current_weather_raw
            }
            tomorrow_str = (now + timedelta(days=1)).strftime('%Y-%m-%d')
            tomorrow_hourly_forecast = []
            for i, time_str in enumerate(hourly_data['time']):
                if time_str.startswith(tomorrow_str):
                    tomorrow_hourly_forecast.append({
                        'thoi_gian': time_str,
                        'nhiet_do': hourly_data['temperature_2m'][i],
                        'luong_mua': hourly_data['precipitation'][i],
                        'gio_toc_do': hourly_data['wind_speed_10m'][i],
                        'gio_huong': self._xac_dinh_huong_gio(hourly_data['wind_direction_10m'][i]),
                        'ma_thoi_tiet': hourly_data['weather_code'][i],
                        'mo_ta_thoi_tiet': self._get_weather_description(hourly_data['weather_code'][i])
                    })
            tomorrow_daily_data_index = 1 if len(daily_data['time']) > 1 else 0
            tomorrow_forecast_processed = {
                'thanh_pho': city_name,
                'nguon': 'NASA GMAO Model via Open-Meteo',
                'ngay_du_bao': tomorrow_str,
                'nhiet_do_cao_nhat_ngay': daily_data['temperature_2m_max'][tomorrow_daily_data_index],
                'nhiet_do_thap_nhat_ngay': daily_data['temperature_2m_min'][tomorrow_daily_data_index],
                'tong_luong_mua_ngay': daily_data['precipitation_sum'][tomorrow_daily_data_index],
                'du_bao_chi_tiet_24h': tomorrow_hourly_forecast
            }
            print("✅ Xử lý dữ liệu hoàn tất.")
            return current_weather_processed, tomorrow_forecast_processed
        except (KeyError, IndexError) as e:
            print(f"❌ Lỗi xử lý dữ liệu: {e}")
            return None, None

    def _xac_dinh_huong_gio(self, wind_direction):
        directions = [(0, 22.5, "Bắc"), (22.5, 67.5, "Đông Bắc"), (67.5, 112.5, "Đông"),
                      (112.5, 157.5, "Đông Nam"), (157.5, 202.5, "Nam"), (202.5, 247.5, "Tây Nam"),
                      (247.5, 292.5, "Tây"), (292.5, 337.5, "Tây Bắc"), (337.5, 360, "Bắc")]
        for min_deg, max_deg, direction in directions:
            if min_deg <= wind_direction < max_deg: return direction
        return "Không xác định"

    def _get_weather_description(self, weather_code):
        weather_codes = {0: "Trời quang", 1: "Chủ yếu quang", 2: "Ít mây", 3: "Nhiều mây",
                         45: "Sương mù", 48: "Sương mù", 51: "Mưa phùn nhẹ", 53: "Mưa phùn vừa",
                         55: "Mưa phùn nặng", 61: "Mưa nhẹ", 63: "Mưa vừa", 65: "Mưa nặng",
                         80: "Mưa rào nhẹ", 81: "Mưa rào vừa", 82: "Mưa rào nặng", 95: "Giông bão",
                         96: "Giông bão có mưa đá", 99: "Giông bão nặng có mưa đá"}
        return weather_codes.get(weather_code, "Không xác định")
def create_database_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("✅ Kết nối tới MySQL thành công!")
            return connection
    except Error as e:
        print(f"❌ Lỗi khi kết nối tới MySQL: {e}")
        return None
def create_tables(cursor):
    ordered_tables = ['current_weather', 'daily_forecasts', 'hourly_forecasts']
    try:
        for table_name in ordered_tables:
            table_description = TABLES[table_name]
            print(f"🛠️ Đang kiểm tra/tạo bảng '{table_name}'... ", end='')
            cursor.execute(table_description)
            print("OK")
    except Error as e:
        print(f"\n❌ Lỗi nghiêm trọng khi tạo bảng '{table_name}': {e}")
def insert_current_weather(cursor, data):
    try:
        city = data.get('thanh_pho')
        source = data.get('nguon')
        updated_at = datetime.strptime(data.get('thoi_gian_cap_nhat'), "%Y-%m-%d %H:%M:%S")
        current_data = data.get('du_lieu_hien_tai', {})
        
        if not current_data:
            print("⚠️ Không có 'du_lieu_hien_tai'. Bỏ qua.")
            return

        query = (
            "INSERT INTO current_weather "
            "(city, source, updated_at, forecast_time, temperature, precipitation, "
            "wind_speed, wind_direction, weather_code, weather_description) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON DUPLICATE KEY UPDATE "
            "source = VALUES(source), updated_at = VALUES(updated_at), "
            "forecast_time = VALUES(forecast_time), temperature = VALUES(temperature), "
            "precipitation = VALUES(precipitation), wind_speed = VALUES(wind_speed), "
            "wind_direction = VALUES(wind_direction), weather_code = VALUES(weather_code), "
            "weather_description = VALUES(weather_description)"
        )
        
        forecast_time_str = current_data.get('thoi_gian')
        forecast_time = datetime.fromisoformat(forecast_time_str) if forecast_time_str else None
        
        values = (city, source, updated_at, forecast_time,
                  current_data.get('nhiet_do'), current_data.get('luong_mua'),
                  current_data.get('gio_toc_do'), current_data.get('gio_huong'),
                  current_data.get('ma_thoi_tiet'), current_data.get('mo_ta_thoi_tiet'))
        
        cursor.execute(query, values)
        print(f"✅ Đã thêm/cập nhật dữ liệu thời tiết hiện tại cho '{city}'.")
    except Exception as e:
        print(f"❌ Lỗi khi xử lý dữ liệu thời tiết hiện tại: {e}")
def insert_forecast_data(cursor, data):
    try:
        # Bỏ bước đọc file
        city = data.get('thanh_pho')
        source = data.get('nguon')
        forecast_date_str = data.get('ngay_du_bao')
        forecast_date = datetime.strptime(forecast_date_str, "%Y-%m-%d").date()

        delete_query = "DELETE FROM daily_forecasts WHERE city = %s AND forecast_date = %s"
        cursor.execute(delete_query, (city, forecast_date))
        print(f"⚠️ Đã xóa dữ liệu dự báo cũ (nếu có) cho '{city}' ngày '{forecast_date_str}'.")

        daily_query = (
            "INSERT INTO daily_forecasts "
            "(city, forecast_date, source, temp_max, temp_min, precipitation_sum) "
            "VALUES (%s, %s, %s, %s, %s, %s)"
        )
        daily_values = (city, forecast_date, source, data.get('nhiet_do_cao_nhat_ngay'),
                        data.get('nhiet_do_thap_nhat_ngay'), data.get('tong_luong_mua_ngay'))
        
        cursor.execute(daily_query, daily_values)
        daily_forecast_id = cursor.lastrowid
        print(f"✅ Đã thêm dự báo tổng quan (ID: {daily_forecast_id}) cho '{city}' ngày '{forecast_date_str}'.")

        hourly_data = data.get('du_bao_chi_tiet_24h', [])
        if not hourly_data:
            print("⚠️ Không có dữ liệu dự báo theo giờ. Bỏ qua.")
            return

        hourly_query = (
            "INSERT INTO hourly_forecasts "
            "(daily_forecast_id, forecast_time, temperature, precipitation, wind_speed, wind_direction, weather_code, weather_description) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        )
        
        hourly_values_list = []
        for hour in hourly_data:
             forecast_time_str_hour = hour.get('thoi_gian')
             forecast_time_hour = datetime.fromisoformat(forecast_time_str_hour) if forecast_time_str_hour else None
             hourly_values_list.append((
                daily_forecast_id, forecast_time_hour, hour.get('nhiet_do'),
                hour.get('luong_mua'), hour.get('gio_toc_do'), hour.get('gio_huong'),
                hour.get('ma_thoi_tiet'), hour.get('mo_ta_thoi_tiet')
             ))
        
        cursor.executemany(hourly_query, hourly_values_list)
        print(f"✅ Đã thêm {len(hourly_values_list)} mục dự báo theo giờ.")
    except Error as e:
        print(f"❌ Lỗi MySQL khi xử lý dự báo: {e}")
    except Exception as e:
        print(f"❌ Lỗi chung khi xử lý dữ liệu dự báo: {e}")
def main():
    city_name = "Ninh Bình"
    coords = (20.2506, 105.9745)
    nasa_client = NASAWeather()
    current_weather_data, tomorrow_forecast_data = nasa_client.fetch_weather_data(city_name, coords[0], coords[1])
    if not current_weather_data or not tomorrow_forecast_data:
        print("\nDừng chương trình do không thể lấy hoặc xử lý dữ liệu thời tiết.")
        return
    connection = create_database_connection()
    if not connection:
        return

    try:
        cursor = connection.cursor()
        print("\n--- BƯỚC A: KIỂM TRA VÀ TẠO BẢNG ---")
        create_tables(cursor)
        print("\n--- BƯỚC B: ĐẨY DỮ LIỆU THỜI TIẾT HIỆN TẠI ---")
        insert_current_weather(cursor, current_weather_data) # Truyền thẳng object data
        print("\n--- BƯỚC C: ĐẨY DỮ LIỆU DỰ BÁO ---")
        insert_forecast_data(cursor, tomorrow_forecast_data) # Truyền thẳng object data
        connection.commit()
        print("\n🎉 **COMMIT THÀNH CÔNG:** Các thay đổi đã được lưu vĩnh viễn vào database.")

    except Error as e:
        print(f"\n❌ Lỗi trong quá trình thao tác database: {e}")
        connection.rollback()
        print("Đã thực hiện ROLLBACK.")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            print("Đã đóng kết nối MySQL.")
        print("\nQuy trình hoàn tất.")
if __name__ == "__main__":
    main()