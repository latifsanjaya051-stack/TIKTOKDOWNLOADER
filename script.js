/* ============================================================
   script.js — Interaktivitas tambahan untuk website
   (partikel, cursor glow, toast, ripple, paste, confetti, dll)
   ============================================================ */

(function () {
    'use strict';

    /* ---------- 1. Partikel latar belakang (canvas) ---------- */
    const canvas = document.getElementById('particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h, particles = [];
        const COLORS = ['#25f4ee', '#fe2c55', '#7b2ff7', '#ffffff'];

        function resize() {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }

        function makeParticles() {
            const count = Math.min(70, Math.floor((w * h) / 22000));
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    r: Math.random() * 2 + 0.6,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    c: COLORS[Math.floor(Math.random() * COLORS.length)],
                    a: Math.random() * 0.5 + 0.2
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.c;
                ctx.globalAlpha = p.a;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }

        resize();
        makeParticles();
        draw();
        window.addEventListener('resize', () => { resize(); makeParticles(); });
    }

    /* ---------- 2. Cursor glow mengikuti mouse ---------- */
    const glow = document.querySelector('.cursor-glow');
    if (glow && window.matchMedia('(pointer:fine)').matches) {
        let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
        let tx = gx, ty = gy;
        window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
        (function loop() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
            requestAnimationFrame(loop);
        })();
    } else if (glow) {
        glow.style.display = 'none';
    }

    /* ---------- 3. Toast notification ---------- */
    function showToast(message, type) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + (type || 'info');
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast-show'));
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
    window.showToast = showToast;

    /* ---------- 4. Ripple effect pada tombol ---------- */
    function attachRipple(el) {
        el.addEventListener('click', function (e) {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }
    document.querySelectorAll('.download-btn, .btn-download').forEach(attachRipple);

    /* ---------- 5. Tombol tempel (paste) dari clipboard ---------- */
    const pasteBtn = document.getElementById('pasteBtn');
    const urlInput = document.getElementById('tiktokUrl');
    if (pasteBtn && urlInput) {
        pasteBtn.addEventListener('click', async () => {
            const T = (window.i18n && window.i18n[window.getLang ? window.getLang() : 'id']) || {};
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    urlInput.value = text.trim();
                    urlInput.focus();
                    showToast(T.pasted || 'Tautan berhasil ditempel!', 'success');
                } else {
                    showToast(T.emptyClip || 'Clipboard kosong.', 'info');
                }
            } catch (err) {
                showToast(T.noClip || 'Tidak dapat mengakses clipboard.', 'error');
            }
        });
    }

    /* ---------- 6. Enter untuk mendownload ---------- */
    if (urlInput) {
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof processDownload === 'function') processDownload();
            }
        });
    }

    /* ---------- 7. Parallax tilt pada container ---------- */
    const container = document.querySelector('.app-container');
    if (container && window.matchMedia('(pointer:fine)').matches) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            container.style.transform = `perspective(1000px) rotateY(${px * 4}deg) rotateX(${-py * 4}deg)`;
        });
        container.addEventListener('mouseleave', () => {
            container.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
        });
    }

    /* ---------- 8. Confetti saat hasil berhasil ---------- */
    function launchConfetti() {
        const colors = ['#25f4ee', '#fe2c55', '#7b2ff7', '#ffffff', '#00cec9'];
        for (let i = 0; i < 60; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = (Math.random() * 0.4) + 's';
            c.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 2600);
        }
    }
    window.launchConfetti = launchConfetti;

    /* ---------- 9. Animasi ketik pada sub-heading ---------- */
    const headerP = document.querySelector('header p');
    if (headerP) {
        const full = headerP.textContent;
        headerP.textContent = '';
        let i = 0;
        const typer = setInterval(() => {
            headerP.textContent = full.slice(0, i++);
            if (i > full.length) clearInterval(typer);
        }, 28);
    }

    /* ---------- 10. Reaksi tombol download (hook) ---------- */
    const dlBtn = document.getElementById('downloadBtn');
    if (dlBtn) {
        dlBtn.addEventListener('click', () => {
            dlBtn.classList.add('btn-loading');
            setTimeout(() => dlBtn.classList.remove('btn-loading'), 1500);
        });
    }

    /* ---------- 11. Statistik / Counter kepercayaan ---------- */
    const statDownloads = document.getElementById('statDownloads');
    const statSatisfaction = document.getElementById('statSatisfaction');
    const statSpeed = document.getElementById('statSpeed');

    // Animasi hitung naik ke nilai target saat load
    function animateCount(el, target, duration, decimals) {
        if (!el) return;
        const start = performance.now();
        const from = 0;
        function step(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            const val = from + (target - from) * eased;
            el.textContent = val.toLocaleString('id-ID', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    if (statDownloads) {
        const target = parseInt(statDownloads.dataset.target, 10) || 0;
        animateCount(statDownloads, target, 2000, 0);
    }

    // Update "real-time": total unduhan naik acak, kepuasan & kecepatan berfluktuasi
    function tickStats() {
        if (statDownloads) {
            const cur = parseInt(statDownloads.textContent.replace(/\D/g, ''), 10) || 0;
            statDownloads.textContent = (cur + Math.floor(Math.random() * 4) + 1)
                .toLocaleString('id-ID');
        }
        if (statSatisfaction) {
            const sat = 97.5 + Math.random() * 2.4; // 97.5 - 99.9
            statSatisfaction.textContent = sat.toFixed(1);
        }
        if (statSpeed) {
            const spd = 1.2 + Math.random() * 1.4; // 1.2s - 2.6s
            statSpeed.textContent = spd.toFixed(1);
        }
    }
    setInterval(tickStats, 3000);

    /* ---------- 12. Jam & tanggal real-time ---------- */
    const liveClock = document.getElementById('liveClock');
    const liveDate = document.getElementById('liveDate');
    function updateClock() {
        if (!liveClock || !liveDate) return;
        const now = new Date();
        const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        liveClock.textContent = time;
        liveDate.textContent = date;
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ---------- 13. Pilihan bahasa ---------- */
    const langBtn = document.getElementById('langBtn');
    const langMenu = document.getElementById('langMenu');
    const langLabel = document.getElementById('langLabel');
    const langOptions = document.querySelectorAll('.lang-option');

    const i18n = {
        id: {
            title: 'TikTok Downloader',
            subtitle: 'Unduh video TikTok tanpa watermark dengan mudah dan cepat',
            status: 'Layanan Aktif',
            placeholder: 'Tempel tautan video TikTok di sini, contoh: https://vt.tiktok.com/...',
            download: 'Download',
            loading: 'Memproses video, mohon tunggu...',
            successTitle: 'Video Berhasil Diproses!',
            noWm: 'Download Tanpa Watermark',
            mp3: 'Download MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@author',
            statDownloads: 'Total Unduhan',
            statSatisfaction: 'Kepuasan',
            statSpeed: 'Proses',
            footer: 'Layanan ini tidak berafiliasi dengan TikTok.',
            empty: 'Silakan tempel link TikTok terlebih dahulu!',
            fail: 'Gagal memproses video. Pastikan tautan valid.',
            ok: 'Video berhasil diproses!',
            pasted: 'Tautan berhasil ditempel!',
            emptyClip: 'Clipboard kosong.',
            noClip: 'Tidak dapat mengakses clipboard.',
        },
        en: {
            title: 'TikTok Downloader',
            subtitle: 'Download TikTok videos without watermark easily and fast',
            status: 'Service Active',
            placeholder: 'Paste the TikTok video link here, e.g.: https://vt.tiktok.com/...',
            download: 'Download',
            loading: 'Processing video, please wait...',
            successTitle: 'Video Processed Successfully!',
            noWm: 'Download Without Watermark',
            mp3: 'Download MP3',
            defaultTitle: 'TikTok Video',
            defaultAuthor: '@author',
            statDownloads: 'Total Downloads',
            statSatisfaction: 'Satisfaction',
            statSpeed: 'Process',
            footer: 'This service is not affiliated with TikTok.',
            empty: 'Please paste the TikTok link first!',
            fail: 'Failed to process video. Make sure the link is valid.',
            ok: 'Video processed successfully!',
            pasted: 'Link pasted successfully!',
            emptyClip: 'Clipboard is empty.',
            noClip: 'Unable to access clipboard.',
        },
    };

    function applyLang(lang) {
        const t = i18n[lang];
        if (!t) return;
        const set = (sel, text) => { const el = document.querySelector(sel); if (el) el.textContent = text; };
        set('header h1', t.title);
        set('header p', t.subtitle);
        set('#statusText', t.status);
        const input = document.getElementById('tiktokUrl');
        if (input) input.placeholder = t.placeholder;
        set('#downloadBtnText', t.download);
        set('#loading p', t.loading);
        set('.result-header h3', t.successTitle);
        set('#downloadNoWm span', t.noWm);
        set('#downloadMp3 span', t.mp3);
        set('#videoTitle', t.defaultTitle);
        set('#videoAuthor', t.defaultAuthor);
        const labels = document.querySelectorAll('.stat-label');
        if (labels[0]) labels[0].textContent = t.statDownloads;
        if (labels[1]) labels[1].textContent = t.statSatisfaction;
        if (labels[2]) labels[2].textContent = t.statSpeed;
        const foot = document.querySelector('footer p');
        if (foot) foot.textContent = '© Dev Muhammad Allatif. ' + t.footer;
        if (langLabel) langLabel.textContent = lang.toUpperCase();
        // simpan ke localStorage
        try { localStorage.setItem('siteLang', lang); } catch (e) {}
    }

    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => langMenu.classList.add('hidden'));
        langMenu.addEventListener('click', (e) => e.stopPropagation());
    }

    langOptions.forEach((opt) => {
        opt.addEventListener('click', () => {
            applyLang(opt.dataset.lang);
            langMenu.classList.add('hidden');
        });
    });

    // muat bahasa tersimpan (default id)
    let savedLang = 'id';
    try { savedLang = localStorage.getItem('siteLang') || 'id'; } catch (e) {}
    applyLang(savedLang);

    // ekspos ke global agar script inline bisa pakai terjemahan
    window.i18n = i18n;
    window.getLang = () => (document.getElementById('langLabel') || {}).textContent?.toLowerCase() || 'id';
})();
