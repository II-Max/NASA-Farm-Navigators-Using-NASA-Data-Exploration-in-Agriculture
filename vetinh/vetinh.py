import earthaccess
import h5py
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def get_image_for_location():
    """
    Tìm kiếm, tải và xử lý dữ liệu vệ tinh cho một vị trí cụ thể.
    """
    # ---- 1. THIẾT LẬP CÁC THÔNG SỐ TÌM KIẾM ----
    
    # Tọa độ hộp giới hạn cho tỉnh Ninh Bình (kinh độ, vĩ độ)
    # [Tây, Nam, Đông, Bắc]
    bounding_box = (105.75, 20.05, 106.20, 20.45) 
    
    # Phạm vi thời gian: tìm trong 10 ngày gần nhất
    end_date = datetime.now()
    start_date = end_date - timedelta(days=10)
    temporal_range = (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
    
    # Tên bộ dữ liệu: VIIRS Surface Reflectance (cung cấp ảnh màu tự nhiên)
    # Đây là dữ liệu từ vệ tinh Suomi NPP, độ phân giải vừa phải
    short_name = "VNP09GA" 
    
    # ---- 2. ĐĂNG NHẬP VÀ TÌM KIẾM DỮ LIỆU ----
    print("Đang đăng nhập vào NASA Earthdata...")
    try:
        earthaccess.login(strategy="netrc")
    except Exception as e:
        print(f"Lỗi đăng nhập! Hãy kiểm tra lại tệp .netrc. Lỗi: {e}")
        return

    print(f"Đang tìm kiếm dữ liệu cho khu vực Ninh Bình từ {temporal_range[0]} đến {temporal_range[1]}...")
    
    results = earthaccess.search_data(
        short_name=short_name,
        bounding_box=bounding_box,
        temporal=temporal_range,
        count=5 # Giới hạn 5 kết quả để tránh quá nhiều
    )
    
    if not results:
        print("Không tìm thấy dữ liệu nào phù hợp. Có thể do mây che phủ hoặc không có vệ tinh bay qua.")
        return
        
    print(f"Tìm thấy {len(results)} tệp dữ liệu. Sẽ xử lý tệp đầu tiên.")
    
    # ---- 3. TẢI DỮ LIỆU ----
    print("Đang tải tệp dữ liệu (có thể mất vài phút)...")
    try:
        file_paths = earthaccess.download(results[0], local_path=".")
        if not file_paths:
            print("Tải file thất bại.")
            return
        hdf_file_path = file_paths[0]
    except Exception as e:
        print(f"Lỗi khi tải file: {e}")
        return

    # ---- 4. XỬ LÝ DỮ LIỆU VÀ TẠO ẢNH ----
    print(f"Đang xử lý tệp: {hdf_file_path}")
    try:
        with h5py.File(hdf_file_path, 'r') as hdf:
            # Đường dẫn tới các dải băng màu trong tệp HDF5 cho sản phẩm VNP09GA
            # M5=Red, M4=Green, M3=Blue (cho VIIRS 750m)
            base_path = 'HDFEOS/GRIDS/VNP_Grid_750m_2D/Data Fields/'
            
            # Đọc dữ liệu thô
            red_raw = hdf[base_path + 'SurfReflect_M5_1'][:]
            green_raw = hdf[base_path + 'SurfReflect_M4_1'][:]
            blue_raw = hdf[base_path + 'SurfReflect_M3_1'][:]

            # Dữ liệu thô cần được nhân với hệ số scale_factor để ra giá trị phản xạ
            scale_factor = 0.0001
            
            # Hàm để tăng cường độ tương phản cho ảnh đẹp hơn
            def normalize(band):
                band_min, band_max = np.percentile(band, [2, 98])
                return np.clip((band - band_min) / (band_max - band_min), 0, 1)

            red = normalize(red_raw * scale_factor)
            green = normalize(green_raw * scale_factor)
            blue = normalize(blue_raw * scale_factor)
            
            # Ghép 3 kênh màu lại thành một ảnh RGB
            rgb_image = np.dstack((red, green, blue))

            # ---- 5. LƯU VÀ HIỂN THỊ ẢNH ----
            output_filename = "ninh_binh_satellite_image.png"
            plt.figure(figsize=(10, 10))
            plt.imshow(rgb_image)
            plt.title(f"Ảnh vệ tinh khu vực Ninh Bình\n{hdf_file_path.split('/')[-1]}")
            plt.axis('off') # Ẩn các trục tọa độ
            plt.savefig(output_filename, bbox_inches='tight', pad_inches=0)
            print(f"\nThành công! Đã lưu hình ảnh với tên: {output_filename}")
            plt.show()

    except Exception as e:
        print(f"Lỗi khi xử lý tệp HDF5: {e}")

if __name__ == "__main__":
    get_image_for_location()