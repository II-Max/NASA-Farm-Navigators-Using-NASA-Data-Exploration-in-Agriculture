<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Smart Farm — Menu</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="style.css">
  <style>
    :root{
      --overlay: rgba(0,0,0,0.55);
      --btn-bg: linear-gradient(145deg,#1f2937,#0f172a);
      --btn-hover: #22d3ee;
    }
    html,body{margin:0;height:100%;font-family:"Segoe UI",Arial,sans-serif;color:#fff;}
    body{
      background:url('assets/overview.png') no-repeat center/cover;
      overflow:hidden;
    }
    .overlay{position:fixed;inset:0;background:var(--overlay);z-index:0}

    #introOverlay {
      position: fixed;
      inset: 0;
      z-index: 10;
      background: #000;
    }
    #introOverlay video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    #skipIntroBtn{position:fixed;right:24px;top:24px;z-index:11;padding:10px 16px;border-radius:8px;border:none;background:rgba(0,0,0,0.6);color:#fff;font-weight:700;cursor:pointer}

    #mainMenu{position:relative;z-index:2;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center;padding:20px}
    .brand img{max-width:300px;width:80%;filter:drop-shadow(0 10px 30px rgba(0,0,0,0.6));animation:fadeIn .8s ease forwards;opacity:0}
    .brand h1{margin:12px 0 0;font-size:32px;text-shadow:0 6px 16px rgba(0,0,0,0.7);animation:fadeInUp 1s ease forwards;opacity:0}
    @keyframes fadeIn{to{opacity:1}}
    @keyframes fadeInUp{to{opacity:1;transform:none}}

    .menu-buttons{display:flex;flex-direction:column;gap:16px;align-items:center;animation:slideUp 1.2s ease forwards;opacity:0;transform:translateY(20px)}
    @keyframes slideUp{to{opacity:1;transform:none}}
    .menu-btn{width:260px;padding:14px 20px;border-radius:14px;border:none;background:var(--btn-bg);color:#e6f4f1;font-weight:800;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 25px rgba(0,0,0,0.6);transition:.18s}
    .menu-btn:hover{transform:scale(1.06);box-shadow:0 12px 32px rgba(0,0,0,0.7),0 0 12px var(--btn-hover)}
    .menu-btn span.emoji{font-size:20px}

    @media(max-width:800px){
      .menu-btn{width:80%}
      .brand h1{font-size:24px}
    }
  </style>
</head>
<body>
  <div class="overlay"></div>

  <div id="introOverlay">
    <video id="introVideo" autoplay muted playsinline>
      <source src="assets/intro.mp4" type="video/mp4">
    </video>
    <button id="skipIntroBtn">Skip</button>
  </div>

  <main id="mainMenu" style="display:none;">
    <div class="brand">
      <h1>🌾 Welcome to Smart Farm</h1>
    </div>

    <div class="menu-buttons">
      <button class="menu-btn" id="playBtn"><span class="emoji">🎮</span><span>Chơi</span></button>
      <button class="menu-btn" id="recordsBtn"><span class="emoji">📜</span><span>Kỉ lục</span></button>
      <button class="menu-btn" id="settingsBtn"><span class="emoji">⚙️</span><span>Tùy chỉnh</span></button>
      <button class="menu-btn" id="authorBtn"><span class="emoji">👤</span><span>Tác giả</span></button>
      <button class="menu-btn" id="creditsBtn"><span class="emoji">📚</span><span>Nguồn</span></button>
    </div>
  </main>
  
  <script src="script.js"></script>
  <script src="custom_mode.js"></script>
  
  <script>
    (function(){
      const intro = document.getElementById('introOverlay');
      const introVideo = document.getElementById('introVideo');
      const skipBtn = document.getElementById('skipIntroBtn');
      const main = document.getElementById('mainMenu');

      function showMenu(){ 
        intro.style.display='none'; 
        main.style.display='flex'; 
      }

      if(introVideo){
        introVideo.addEventListener('ended', showMenu);
        introVideo.addEventListener('error', showMenu);
      }
      if(skipBtn) {
        skipBtn.addEventListener('click', showMenu);
      }

      document.addEventListener('DOMContentLoaded', ()=>{
        document.getElementById('playBtn').onclick = () => location.href = 'home.html';
        document.getElementById('recordsBtn').onclick = () => location.href = 'scoreboard.php';
        document.getElementById('settingsBtn').onclick = () => location.href = 'options/options.html';
        document.getElementById('authorBtn').onclick = () => location.href = 'team.html';
        // DÒNG NÀY ĐÃ ĐƯỢC THAY ĐỔI
        document.getElementById('creditsBtn').onclick = () => location.href = 'nguon.html';
        document.getElementById('exitBtn').onclick = () => { 
          if(confirm('Bạn có chắc muốn thoát?')) {
            window.close(); 
          }
        };
      });
    })();
  </script>
</body>
</html>