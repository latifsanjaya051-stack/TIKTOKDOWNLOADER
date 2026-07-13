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
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    urlInput.value = text.trim();
                    urlInput.focus();
                    showToast('Tautan berhasil ditempel!', 'success');
                } else {
                    showToast('Clipboard kosong.', 'info');
                }
            } catch (err) {
                showToast('Tidak dapat mengakses clipboard.', 'error');
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
    const container = document.querySelector('.container');
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
})();
