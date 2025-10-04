// Bọc toàn bộ code trong một IIFE để tạo scope riêng, tránh xung đột biến
(function () {
  'use strict'; // Bật chế độ nghiêm ngặt để code an toàn hơn

  // ================== CONFIG & HELPERS ==================

  const API_BASE = "http://localhost:8000";

  /**
   * Hiển thị một thông báo popup ngắn.
   * @param {string} message - Nội dung thông báo cần hiển thị.
   */
  window.showNotification = function (message) {
    const popup = document.getElementById("notiPopup");
    const msgEl = document.getElementById("notiMessage");

    // Fallback nếu không tìm thấy phần tử popup
    if (!popup || !msgEl) {
      alert(message);
      return;
    }

    msgEl.innerText = message;
    popup.style.display = "flex";

    setTimeout(() => {
      popup.style.display = "none";
    }, 2000);
  };

  /**
   * Gửi một hành động tới backend API.
   * @param {string} module - Tên module (ví dụ: 'plant').
   * @param {string} action - Hành động cần thực hiện (ví dụ: 'water').
   * @returns {Promise<object|undefined>} - Dữ liệu JSON từ server hoặc undefined nếu lỗi.
   */
  window.doAction = async function (module, action) {
    try {
      const response = await fetch(`${API_BASE}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, action }),
      });

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Kết quả hành động:", result);
      return result;
    } catch (error) {
      console.error("❌ Lỗi khi gửi hành động:", error);
      window.showNotification("Gọi API thất bại. Vui lòng kiểm tra console.");
      return undefined; // Trả về undefined khi có lỗi
    }
  };


  // ================== MAIN LOGIC (khi DOM đã sẵn sàng) ==================

  document.addEventListener("DOMContentLoaded", () => {
    // --- Lấy các phần tử DOM ---
    const introOverlay = document.getElementById("introOverlay");
    const introVideo = document.getElementById("introVideo");
    const skipBtn = document.getElementById("skipIntroBtn");
    const mainMenu = document.getElementById("mainMenu");

    // Menu buttons
    const customBtn = document.getElementById("btn_custom_mode"); // Giả sử ID từ HTML trước
    const realtimeBtn = document.getElementById("btn_realtime"); // Giả sử ID từ HTML trước
    const recordsBtn = document.getElementById("recordsBtn");
    const authorBtn = document.getElementById("authorBtn");
    const exitBtn = document.getElementById("exitBtn");

    // --- Hàm xử lý logic ---
    
    /**
     * Ẩn màn hình intro và hiển thị menu chính.
     */
    const showMainMenu = () => {
      if (introOverlay) introOverlay.style.display = "none";
      if (mainMenu) mainMenu.style.display = "flex"; // Dùng flex để giữ layout
    };

    // --- Gán các sự kiện ---

    // 1. Xử lý Intro
    if (skipBtn) {
      skipBtn.addEventListener("click", showMainMenu);
    }
    if (introVideo) {
      introVideo.addEventListener("ended", showMainMenu);
      introVideo.addEventListener("error", showMainMenu); // Thêm: nếu video lỗi cũng bỏ qua
    }

    // 2. Xử lý các nút trong Menu chính
    if (customBtn) {
      customBtn.addEventListener("click", () => {
        console.log("➡ Chế độ tùy chỉnh");
        window.location.href = "home_custom.html";
      });
    }

    if (realtimeBtn) {
      realtimeBtn.addEventListener("click", () => {
        console.log("➡ Chế độ thời gian thực");
        window.location.href = "home.html";
      });
    }

    if (recordsBtn) {
      recordsBtn.addEventListener("click", () => {
        console.log("➡ Lịch sử");
        window.location.href = "scoreboard.php";
      });
    }
    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        if (confirm("Bạn có chắc muốn thoát?")) {
          // Lưu ý: window.close() thường chỉ hoạt động với cửa sổ được mở bằng script
          window.close();
        }
      });
    }
  });

})();