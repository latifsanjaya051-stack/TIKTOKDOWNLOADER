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
                let text = '';
                // Coba navigator.clipboard (browser biasa)
                if (navigator.clipboard && navigator.clipboard.readText) {
                    try { text = await navigator.clipboard.readText(); } catch (e) { text = ''; }
                }
                // Fallback ke bridge native Android (WebView sering blokir clipboard web)
                if (!text && window.AndroidBridge && typeof window.AndroidBridge.getClipboard === 'function') {
                    text = window.AndroidBridge.getClipboard();
                }
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

    /* ---------- 6b. Tombol Download APK (web + Android WebView) ---------- */
    // URL tempat file APK di-host. Ganti dengan link absolut (GitHub Releases,
    // Google Drive direct link, dll) ATAU letakkan file app-release.apk di
    // folder website ini agar path relatif berikut langsung berfungsi.
    const APK_DOWNLOAD_URL = 'app-release.apk';

    const apkBtn = document.getElementById('downloadApkBtn');
    if (apkBtn) {
        apkBtn.classList.remove('hidden');
        apkBtn.classList.add('flex');
        apkBtn.addEventListener('click', () => {
            const T = (window.i18n && window.i18n[window.getLang ? window.getLang() : 'id']) || {};
            const original = apkBtn.querySelector('#downloadApkText');
            const prev = original ? original.textContent : '';

            // Di dalam aplikasi Android: salin APK terinstall ke folder Download
            if (window.AndroidBridge && typeof window.AndroidBridge.copyApkToDownloads === 'function') {
                if (original) original.textContent = 'Memproses…';
                apkBtn.disabled = true;
                // copyApkToDownloads berjalan sinkron di native thread bridge
                const result = window.AndroidBridge.copyApkToDownloads('TTDownloader.apk');
                if (result === 'ok') {
                    showToast(T.apkOk || 'APK berhasil disalin ke folder Download.', 'success');
                } else {
                    showToast((T.apkFail || 'Gagal menyalin APK: ') + result, 'error');
                }
                if (original) original.textContent = prev;
                apkBtn.disabled = false;
                return;
            }

            // Di web: unduh APK dari URL yang di-host
            if (original) original.textContent = 'Mengunduh…';
            apkBtn.disabled = true;
            try {
                const a = document.createElement('a');
                a.href = APK_DOWNLOAD_URL;
                a.download = 'TTDownloader.apk';
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast(T.apkWebOk || 'Unduhan APK dimulai…', 'success');
            } catch (err) {
                showToast((T.apkWebFail || 'Gagal mengunduh APK: ') + err.message, 'error');
            }
            if (original) original.textContent = prev;
            apkBtn.disabled = false;
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
            navHome: 'Beranda',
            navHow: 'Cara Pakai',
            navFaq: 'FAQ',
            footer: 'Layanan ini tidak berafiliasi dengan TikTok.',
            empty: 'Silakan tempel link TikTok terlebih dahulu!',
            fail: 'Gagal memproses video. Pastikan tautan valid.',
            ok: 'Video berhasil diproses!',
            pasted: 'Tautan berhasil ditempel!',
            emptyClip: 'Clipboard kosong.',
            noClip: 'Tidak dapat mengakses clipboard.',
            apkOk: 'APK berhasil disalin ke folder Download.',
            apkFail: 'Gagal menyalin APK: ',
            apkWebOk: 'Unduhan APK dimulai…',
            apkWebFail: 'Gagal mengunduh APK: ',
            howTitle: 'Cara Download Video TikTok',
            step1Title: 'Salin Link Video',
            step1Desc: 'Buka aplikasi TikTok, cari video yang ingin diunduh, lalu ketuk tombol "Bagikan" dan pilih "Salin tautan".',
            step2Title: 'Tempel Link',
            step2Desc: 'Kembali ke halaman ini dan tempelkan tautan yang sudah disalin ke kolom input di atas, atau tekan tombol tempel.',
            step3Title: 'Klik Download',
            step3Desc: 'Tekan tombol "Download" dan tunggu beberapa detik hingga video selesai diproses oleh sistem.',
            step4Title: 'Simpan Video',
            step4Desc: 'Pilih "Download Tanpa Watermark" untuk video bersih, atau "Download MP3" jika hanya ingin mengambil audio.',
            faqTitle: 'Pertanyaan yang Sering Diajukan',
            faqQ1: 'Apakah download video TikTok di sini benar-benar tanpa watermark?',
            faqA1: 'Ya. Sistem kami memproses video melalui server dan mengembalikan versi tanpa watermark (logo pemilik video) secara otomatis.',
            faqQ2: 'Apakah layanan ini berbayar?',
            faqA2: 'Tidak. Layanan downloader ini 100% gratis dan dapat digunakan kapan saja tanpa perlu mendaftar akun.',
            faqQ3: 'Bisakah mengunduh video TikTok yang diprivasi?',
            faqA3: 'Tidak. Kami hanya bisa memproses video publik. Video dengan setelan privat tidak dapat diakses melalui layanan ini.',
            faqQ4: 'Apakah bisa mengunduh hanya audio (MP3)?',
            faqA4: 'Bisa. Setelah video diproses, pilih tombol "Download MP3" untuk menyimpan hanya bagian audio dari video tersebut.',
            faqQ5: 'Apakah data atau akun TikTok saya aman?',
            faqA5: 'Ya. Kami tidak meminta login atau kata sandi TikTok. Anda cukup menempelkan tautan publik dan kami tidak menyimpan data pribadi Anda.',
            faqQ6: 'Apakah mendukung video dari TikTok Lite atau versi web?',
            faqA6: 'Ya. Tautan dari aplikasi TikTok, TikTok Lite, maupun versi web (tiktok.com) dapat diproses selama video tersebut bersifat publik.',
            faqQ7: 'Mengapa kadang video gagal diproses?',
            faqA7: 'Hal ini biasanya terjadi jika tautan tidak valid, video diprivasi, atau server sedang sibuk. Coba salin ulang tautan dan pastikan koneksi internet Anda stabil.',
            faqQ8: 'Apakah ada batasan ukuran atau jumlah unduhan?',
            faqA8: 'Tidak ada batasan jumlah unduhan. Namun untuk menjaga kestabilan server, setiap proses dilakukan satu per satu sesuai antrean permintaan.',
            legalTitle: 'Legal',
            legalQ1: 'Kebijakan Privasi',
            legalA1: 'Kami menghargai privasi Anda. Layanan ini tidak meminta login TikTok dan tidak menyimpan data pribadi, kata sandi, atau video yang Anda unduh. Tautan yang Anda tempel hanya digunakan untuk memproses permintaan download secara sementara dan tidak kami simpan secara permanen.',
            legalQ2: 'Syarat Layanan',
            legalA2: 'Dengan menggunakan layanan ini, Anda menyetujui untuk menggunakannya hanya bagi konten yang Anda miliki atau memiliki izin. Layanan ini disediakan "sebagaimana adanya" tanpa jaminan. Kami tidak bertanggung jawab atas penyalahgunaan, pelanggaran hak cipta, atau kerugian yang timbul dari penggunaan layanan.',
            legalQ3: 'Kebijakan Cookie',
            legalA3: 'Kami menggunakan cookie lokal di peramban Anda hanya untuk menyimpan preferensi bahasa yang Anda pilih. Kami tidak menggunakan cookie pelacakan pihak ketiga untuk mengumpulkan data pribadi. Anda dapat menghapus cookie kapan saja melalui pengaturan peramban.',
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
            navHome: 'Home',
            navHow: 'How to Use',
            navFaq: 'FAQ',
            footer: 'This service is not affiliated with TikTok.',
            empty: 'Please paste the TikTok link first!',
            fail: 'Failed to process video. Make sure the link is valid.',
            ok: 'Video processed successfully!',
            pasted: 'Link pasted successfully!',
            emptyClip: 'Clipboard is empty.',
            noClip: 'Unable to access clipboard.',
            howTitle: 'How to Download TikTok Video',
            step1Title: 'Copy the Video Link',
            step1Desc: 'Open the TikTok app, find the video you want to download, then tap "Share" and choose "Copy link".',
            step2Title: 'Paste the Link',
            step2Desc: 'Come back to this page and paste the copied link into the input box above, or press the paste button.',
            step3Title: 'Click Download',
            step3Desc: 'Press the "Download" button and wait a few seconds until the video is processed by the system.',
            step4Title: 'Save the Video',
            step4Desc: 'Choose "Download Without Watermark" for a clean video, or "Download MP3" if you only want the audio.',
            faqTitle: 'Frequently Asked Questions',
            faqQ1: 'Are TikTok video downloads here really without watermark?',
            faqA1: 'Yes. Our system processes the video through a server and automatically returns the watermark-free version (without the owner video logo).',
            faqQ2: 'Is this service paid?',
            faqA2: 'No. This downloader service is 100% free and can be used anytime without registering an account.',
            faqQ3: 'Can I download private TikTok videos?',
            faqA3: 'No. We can only process public videos. Videos with private settings cannot be accessed through this service.',
            faqQ4: 'Can I download audio only (MP3)?',
            faqA4: 'Yes. After the video is processed, choose the "Download MP3" button to save only the audio part of the video.',
            faqQ5: 'Is my TikTok data or account safe?',
            faqA5: 'Yes. We do not ask for TikTok login or password. You only paste a public link and we do not store your personal data.',
            faqQ6: 'Does it support videos from TikTok Lite or the web version?',
            faqA6: 'Yes. Links from the TikTok app, TikTok Lite, and the web version (tiktok.com) can be processed as long as the video is public.',
            faqQ7: 'Why does the video sometimes fail to process?',
            faqA7: 'This usually happens if the link is invalid, the video is private, or the server is busy. Try copying the link again and make sure your internet connection is stable.',
            faqQ8: 'Is there a limit on size or number of downloads?',
            faqA8: 'There is no limit on the number of downloads. However, to keep the server stable, each process runs one by one according to the request queue.',
            legalTitle: 'Legal',
            legalQ1: 'Privacy Policy',
            legalA1: 'We respect your privacy. This service does not ask for TikTok login and does not store personal data, passwords, or the videos you download. The link you paste is only used to process the download request temporarily and is not stored permanently.',
            legalQ2: 'Terms of Service',
            legalA2: 'By using this service, you agree to use it only for content you own or have permission for. This service is provided "as is" without warranty. We are not responsible for misuse, copyright infringement, or losses arising from the use of the service.',
            legalQ3: 'Cookie Policy',
            legalA3: 'We use local cookies in your browser only to store your selected language preference. We do not use third-party tracking cookies to collect personal data. You can delete cookies anytime through your browser settings.',
        },
        es: {
            title: 'TikTok Downloader',
            subtitle: 'Descarga videos de TikTok sin marca de agua fácil y rápido',
            status: 'Servicio Activo',
            placeholder: 'Pega el enlace del video de TikTok aquí, ej.: https://vt.tiktok.com/...',
            download: 'Descargar',
            loading: 'Procesando video, por favor espera...',
            successTitle: '¡Video Procesado con Éxito!',
            noWm: 'Descargar Sin Marca de Agua',
            mp3: 'Descargar MP3',
            defaultTitle: 'Video de TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Descargas Totales',
            statSatisfaction: 'Satisfacción',
            statSpeed: 'Proceso',
            footer: 'Este servicio no está afiliado a TikTok.',
            empty: '¡Por favor pega el enlace de TikTok primero!',
            fail: 'Error al procesar el video. Asegúrate de que el enlace sea válido.',
            ok: '¡Video procesado con éxito!',
            pasted: '¡Enlace pegado con éxito!',
            emptyClip: 'El portapapeles está vacío.',
            noClip: 'No se puede acceder al portapapeles.',
        },
        pt: {
            title: 'TikTok Downloader',
            subtitle: 'Baixe vídeos do TikTok sem marca de agua com facilidade e rapidez',
            status: 'Serviço Ativo',
            placeholder: 'Cole o link do vídeo do TikTok aqui, ex.: https://vt.tiktok.com/...',
            download: 'Baixar',
            loading: 'Processando vídeo, aguarde...',
            successTitle: 'Vídeo Processado com Sucesso!',
            noWm: 'Baixar Sem Marca de Agua',
            mp3: 'Baixar MP3',
            defaultTitle: 'Vídeo do TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Total de Downloads',
            statSatisfaction: 'Satisfação',
            statSpeed: 'Processo',
            footer: 'Este serviço não é afiliado ao TikTok.',
            empty: 'Por favor cole o link do TikTok primeiro!',
            fail: 'Falha ao processar o vídeo. Certifique-se de que o link é válido.',
            ok: 'Vídeo processado com sucesso!',
            pasted: 'Link colado com sucesso!',
            emptyClip: 'A área de transferência está vazia.',
            noClip: 'Não foi possível acessar a área de transferência.',
        },
        fr: {
            title: 'TikTok Downloader',
            subtitle: 'Téléchargez des vidéos TikTok sans filigrane facilement et rapidement',
            status: 'Service Actif',
            placeholder: 'Collez le lien de la vidéo TikTok ici, ex. : https://vt.tiktok.com/...',
            download: 'Télécharger',
            loading: 'Traitement de la vidéo, veuillez patienter...',
            successTitle: 'Vidéo Traitée avec Succès !',
            noWm: 'Télécharger Sans Filigrane',
            mp3: 'Télécharger MP3',
            defaultTitle: 'Vidéo TikTok',
            defaultAuthor: '@auteur',
            statDownloads: 'Total de Téléchargements',
            statSatisfaction: 'Satisfaction',
            statSpeed: 'Processus',
            footer: 'Ce service n est pas affilié à TikTok.',
            empty: 'Veuillez d abord coller le lien TikTok !',
            fail: 'Échec du traitement de la vidéo. Assurez-vous que le lien est valide.',
            ok: 'Vidéo traitée avec succès !',
            pasted: 'Lien collé avec succès !',
            emptyClip: 'Le presse-papiers est vide.',
            noClip: 'Impossible d acceder au presse-papiers.',
        },
        de: {
            title: 'TikTok Downloader',
            subtitle: 'TikTok-Videos ohne Wasserzeichen einfach und schnell herunterladen',
            status: 'Dienst Aktiv',
            placeholder: 'Fügen Sie den TikTok-Videolink hier ein, z. B.: https://vt.tiktok.com/...',
            download: 'Herunterladen',
            loading: 'Video wird verarbeitet, bitte warten...',
            successTitle: 'Video Erfolgreich Verarbeitet!',
            noWm: 'Ohne Wasserzeichen Herunterladen',
            mp3: 'MP3 Herunterladen',
            defaultTitle: 'TikTok-Video',
            defaultAuthor: '@autor',
            statDownloads: 'Gesamte Downloads',
            statSatisfaction: 'Zufriedenheit',
            statSpeed: 'Prozess',
            footer: 'Dieser Dienst ist nicht mit TikTok verbunden.',
            empty: 'Bitte fügen Sie zuerst den TikTok-Link ein!',
            fail: 'Video konnte nicht verarbeitet werden. Stellen Sie sicher, dass der Link gültig ist.',
            ok: 'Video erfolgreich verarbeitet!',
            pasted: 'Link erfolgreich eingefügt!',
            emptyClip: 'Zwischenablage ist leer.',
            noClip: 'Auf die Zwischenablage kann nicht zugegriffen werden.',
        },
        it: {
            title: 'TikTok Downloader',
            subtitle: 'Scarica video di TikTok senza filigrana con facilità e velocità',
            status: 'Servizio Attivo',
            placeholder: 'Incolla qui il link del video TikTok, es.: https://vt.tiktok.com/...',
            download: 'Scarica',
            loading: 'Elaborazione video in corso, attendi...',
            successTitle: 'Video Elaborato con Successo!',
            noWm: 'Scarica Senza Filigrana',
            mp3: 'Scarica MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autore',
            statDownloads: 'Download Totali',
            statSatisfaction: 'Soddisfazione',
            statSpeed: 'Processo',
            footer: 'Questo servizio non è affiliato a TikTok.',
            empty: 'Incolla prima il link di TikTok!',
            fail: 'Impossibile elaborare il video. Assicurati che il link sia valido.',
            ok: 'Video elaborato con successo!',
            pasted: 'Link incollato con successo!',
            emptyClip: 'Gli appunti sono vuoti.',
            noClip: 'Impossibile accedere agli appunti.',
        },
        nl: {
            title: 'TikTok Downloader',
            subtitle: 'Download TikTok-video s zonder watermerk eenvoudig en snel',
            status: 'Service Actief',
            placeholder: 'Plak de TikTok-videolink hier, bijv.: https://vt.tiktok.com/...',
            download: 'Downloaden',
            loading: 'Video wordt verwerkt, even geduld...',
            successTitle: 'Video Met Succes Verwerkt!',
            noWm: 'Download Zonder Watermerk',
            mp3: 'Download MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@auteur',
            statDownloads: 'Totaal Downloads',
            statSatisfaction: 'Tevredenheid',
            statSpeed: 'Proces',
            footer: 'Deze service is niet gelieerd aan TikTok.',
            empty: 'Plak eerst de TikTok-link!',
            fail: 'Video verwerken mislukt. Zorg dat de link geldig is.',
            ok: 'Video met succes verwerkt!',
            pasted: 'Link met succes geplakt!',
            emptyClip: 'Klembord is leeg.',
            noClip: 'Kan geen toegang krijgen tot het klembord.',
        },
        ru: {
            title: 'TikTok Downloader',
            subtitle: 'Скачивайте видео TikTok без водяного знака легко и быстро',
            status: 'Сервис Активен',
            placeholder: 'Вставьте ссылку на видео TikTok здесь, напр.: https://vt.tiktok.com/...',
            download: 'Скачать',
            loading: 'Обработка видео, пожалуйста подождите...',
            successTitle: 'Видео Успешно Обработано!',
            noWm: 'Скачать Без Водяного Знака',
            mp3: 'Скачать MP3',
            defaultTitle: 'Видео TikTok',
            defaultAuthor: '@автор',
            statDownloads: 'Всего Загрузок',
            statSatisfaction: 'Удовлетворённость',
            statSpeed: 'Процесс',
            footer: 'Этот сервис не связан с TikTok.',
            empty: 'Сначала вставьте ссылку TikTok!',
            fail: 'Не удалось обработать видео. Убедитесь, что ссылка действительна.',
            ok: 'Видео успешно обработано!',
            pasted: 'Ссылка успешно вставлена!',
            emptyClip: 'Буфер обмена пуст.',
            noClip: 'Не удаётся получить доступ к буферу обмена.',
        },
        ar: {
            title: 'TikTok Downloader',
            subtitle: 'حمّل فيديوهات TikTok بدون علامة مائية بسهولة وسرعة',
            status: 'الخدمة نشطة',
            placeholder: 'الصق رابط فيديو TikTok هنا، مثال: https://vt.tiktok.com/...',
            download: 'تحميل',
            loading: 'جارٍ معالجة الفيديو، يرجى الانتظار...',
            successTitle: 'تمت معالجة الفيديو بنجاح!',
            noWm: 'تحميل بدون علامة مائية',
            mp3: 'تحميل MP3',
            defaultTitle: 'فيديو TikTok',
            defaultAuthor: '@المؤلف',
            statDownloads: 'إجمالي التنزيلات',
            statSatisfaction: 'الرضا',
            statSpeed: 'المعالجة',
            footer: 'هذه الخدمة غير تابعة لـ TikTok.',
            empty: 'يرجى لصق رابط TikTok أولاً!',
            fail: 'فشل معالجة الفيديو. تأكد من صحة الرابط.',
            ok: 'تمت معالجة الفيديو بنجاح!',
            pasted: 'تم لصق الرابط بنجاح!',
            emptyClip: 'الحافظة فارغة.',
            noClip: 'تعذر الوصول إلى الحافظة.',
        },
        zh: {
            title: 'TikTok Downloader',
            subtitle: '轻松快速下载无水印的 TikTok 视频',
            status: '服务运行中',
            placeholder: '在此粘贴 TikTok 视频链接，例如：https://vt.tiktok.com/...',
            download: '下载',
            loading: '正在处理视频，请稍候...',
            successTitle: '视频处理成功！',
            noWm: '下载无水印版本',
            mp3: '下载 MP3',
            defaultTitle: 'TikTok 视频',
            defaultAuthor: '@作者',
            statDownloads: '总下载量',
            statSatisfaction: '满意度',
            statSpeed: '处理速度',
            footer: '本服务与 TikTok 无关。',
            empty: '请先粘贴 TikTok 链接！',
            fail: '视频处理失败。请确保链接有效。',
            ok: '视频处理成功！',
            pasted: '链接已成功粘贴！',
            emptyClip: '剪贴板为空。',
            noClip: '无法访问剪贴板。',
        },
        ja: {
            title: 'TikTok Downloader',
            subtitle: '透かしなしでTikTok動画を簡単・高速にダウンロード',
            status: 'サービス稼働中',
            placeholder: 'ここにTikTok動画のリンクを貼り付け、例：https://vt.tiktok.com/...',
            download: 'ダウンロード',
            loading: '動画を処理中です、お待ちください...',
            successTitle: '動画の処理が完了しました！',
            noWm: '透かしなしでダウンロード',
            mp3: 'MP3をダウンロード',
            defaultTitle: 'TikTok動画',
            defaultAuthor: '@作者',
            statDownloads: '総ダウンロード数',
            statSatisfaction: '満足度',
            statSpeed: '処理時間',
            footer: 'このサービスはTikTokとは無関係です。',
            empty: 'まずTikTokのリンクを貼り付けてください！',
            fail: '動画の処理に失敗しました。リンクが有効か確認してください。',
            ok: '動画の処理が成功しました！',
            pasted: 'リンクを貼り付けました！',
            emptyClip: 'クリップボードは空です。',
            noClip: 'クリップボードにアクセスできません。',
        },
        ko: {
            title: 'TikTok Downloader',
            subtitle: '워터마크 없이 TikTok 동영상을 쉽고 빠르게 다운로드',
            status: '서비스 활성',
            placeholder: '여기에 TikTok 동영상 링크를 붙여넣으세요, 예: https://vt.tiktok.com/...',
            download: '다운로드',
            loading: '동영상을 처리하는 중입니다, 잠시만 기다려 주세요...',
            successTitle: '동영상 처리 완료!',
            noWm: '워터마크 없이 다운로드',
            mp3: 'MP3 다운로드',
            defaultTitle: 'TikTok 동영상',
            defaultAuthor: '@작성자',
            statDownloads: '총 다운로드',
            statSatisfaction: '만족도',
            statSpeed: '처리',
            footer: '이 서비스는 TikTok과 관련이 없습니다.',
            empty: '먼저 TikTok 링크를 붙여넣어 주세요!',
            fail: '동영상 처리에 실패했습니다. 링크가 유효한지 확인하세요.',
            ok: '동영상 처리 성공!',
            pasted: '링크가 붙여넣어졌습니다!',
            emptyClip: '클립보드가 비어 있습니다.',
            noClip: '클립보드에 접근할 수 없습니다.',
        },
        hi: {
            title: 'TikTok Downloader',
            subtitle: 'बिना वॉटरमार्क के TikTok वीडियो आसानी से और तेज़ी से डाउनलोड करें',
            status: 'सेवा सक्रिय',
            placeholder: 'यहाँ TikTok वीडियो लिंक चिपकाएँ, उदा.: https://vt.tiktok.com/...',
            download: 'डाउनलोड',
            loading: 'वीडियो प्रोसेस हो रहा है, कृपया प्रतीक्षा करें...',
            successTitle: 'वीडियो सफलतापूर्वक प्रोसेस हुआ!',
            noWm: 'बिना वॉटरमार्क के डाउनलोड करें',
            mp3: 'MP3 डाउनलोड करें',
            defaultTitle: 'TikTok वीडियो',
            defaultAuthor: '@लेखक',
            statDownloads: 'कुल डाउनलोड',
            statSatisfaction: 'संतुष्टि',
            statSpeed: 'प्रक्रिया',
            footer: 'यह सेवा TikTok से संबद्ध नहीं है।',
            empty: 'कृपया पहले TikTok लिंक चिपकाएँ!',
            fail: 'वीडियो प्रोसेस करने में विफल। सुनिश्चित करें कि लिंक वैध है।',
            ok: 'वीडियो सफलतापूर्वक प्रोसेस हुआ!',
            pasted: 'लिंक सफलतापूर्वक चिपकाया गया!',
            emptyClip: 'क्लिपबोर्ड खाली है।',
            noClip: 'क्लिपबोर्ड एक्सेस नहीं कर सकते।',
        },
        bn: {
            title: 'TikTok Downloader',
            subtitle: 'ওয়াটারমার্ক ছাড়াই সহজে ও দ্রুত TikTok ভিডিও ডাউনলোড করুন',
            status: 'সেবা সক্রিয়',
            placeholder: 'এখানে TikTok ভিডিও লিংক পেস্ট করুন, যেমন: https://vt.tiktok.com/...',
            download: 'ডাউনলোড',
            loading: 'ভিডিও প্রক্রিয়াকরণ হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...',
            successTitle: 'ভিডিও সফলভাবে প্রক্রিয়াকৃত হয়েছে!',
            noWm: 'ওয়াটারমার্ক ছাড়াই ডাউনলোড করুন',
            mp3: 'MP3 ডাউনলোড করুন',
            defaultTitle: 'TikTok ভিডিও',
            defaultAuthor: '@লেখক',
            statDownloads: 'মোট ডাউনলোড',
            statSatisfaction: 'সন্তুষ্টি',
            statSpeed: 'প্রক্রিয়া',
            footer: 'এই সেবা TikTok এর সাথে সংযুক্ত নয়।',
            empty: 'অনুগ্রহ করে প্রথমে TikTok লিংক পেস্ট করুন!',
            fail: 'ভিডিও প্রক্রিয়াকরণ ব্যর্থ। লিংক বৈধ কিনা নিশ্চিত করুন।',
            ok: 'ভিডিও সফলভাবে প্রক্রিয়াকৃত হয়েছে!',
            pasted: 'লিংক সফলভাবে পেস্ট করা হয়েছে!',
            emptyClip: 'ক্লিপবোর্ড খালি।',
            noClip: 'ক্লিপবোর্ড অ্যাক্সেস করা যাচ্ছে না।',
        },
        ur: {
            title: 'TikTok Downloader',
            subtitle: 'بغیر واٹر مارک کے TikTok ویڈیو آسانی سے اور تیزی سے ڈاؤن لوڈ کریں',
            status: 'سروس فعال',
            placeholder: 'یہاں TikTok ویڈیو لنک پیسٹ کریں، مثال: https://vt.tiktok.com/...',
            download: 'ڈاؤن لوڈ',
            loading: 'ویڈیو پروسیس ہو رہا ہے، براہ کرم انتظار کریں...',
            successTitle: 'ویڈیو کامیابی سے پروسیس ہو گیا!',
            noWm: 'بغیر واٹر مارک کے ڈاؤن لوڈ کریں',
            mp3: 'MP3 ڈاؤن لوڈ کریں',
            defaultTitle: 'TikTok ویڈیو',
            defaultAuthor: '@مصنف',
            statDownloads: 'کل ڈاؤن لوڈ',
            statSatisfaction: 'اطمینان',
            statSpeed: 'عمل',
            footer: 'یہ سروس TikTok سے وابستہ نہیں ہے۔',
            empty: 'براہ کرم پہلے TikTok لنک پیسٹ کریں!',
            fail: 'ویڈیو پروسیس کرنے میں ناکام۔ یقینی بنائیں کہ لنک درست ہے۔',
            ok: 'ویڈیو کامیابی سے پروسیس ہو گیا!',
            pasted: 'لنک کامیابی سے پیسٹ ہو گیا!',
            emptyClip: 'کلپ بورڈ خالی ہے۔',
            noClip: 'کلپ بورڈ تک رسائی ممکن نہیں۔',
        },
        tr: {
            title: 'TikTok Downloader',
            subtitle: 'TikTok videolarını filigransız olarak kolayca ve hızlıca indirin',
            status: 'Hizmet Aktif',
            placeholder: 'TikTok video bağlantısını buraya yapıştırın, örn.: https://vt.tiktok.com/...',
            download: 'İndir',
            loading: 'Video işleniyor, lütfen bekleyin...',
            successTitle: 'Video Başarıyla İşlendi!',
            noWm: 'Filigransız İndir',
            mp3: 'MP3 İndir',
            defaultTitle: 'TikTok Videosu',
            defaultAuthor: '@yazar',
            statDownloads: 'Toplam İndirme',
            statSatisfaction: 'Memnuniyet',
            statSpeed: 'İşlem',
            footer: 'Bu hizmet TikTok ile bağlantılı değildir.',
            empty: 'Lütfen önce TikTok bağlantısını yapıştırın!',
            fail: 'Video işlenemedi. Bağlantının geçerli olduğundan emin olun.',
            ok: 'Video başarıyla işlendi!',
            pasted: 'Bağlantı başarıyla yapıştırıldı!',
            emptyClip: 'Panoya boş.',
            noClip: 'Panoya erişilemiyor.',
        },
        fa: {
            title: 'TikTok Downloader',
            subtitle: 'ویدیوهای TikTok را بدون واترمارک به سادگی و سرعت دانلود کنید',
            status: 'سرویس فعال',
            placeholder: 'لینک ویدیوی TikTok را اینجا بچسبانید، مثال: https://vt.tiktok.com/...',
            download: 'دانلود',
            loading: 'در حال پردازش ویدیو، لطفاً صبر کنید...',
            successTitle: 'ویدیو با موفقیت پردازش شد!',
            noWm: 'دانلود بدون واترمارک',
            mp3: 'دانلود MP3',
            defaultTitle: 'ویدیو TikTok',
            defaultAuthor: '@نویسنده',
            statDownloads: 'مجموع دانلودها',
            statSatisfaction: 'رضایت',
            statSpeed: 'پردازش',
            footer: 'این سرویس وابسته به TikTok نیست.',
            empty: 'لطفاً ابتدا لینک TikTok را بچسبانید!',
            fail: 'پردازش ویدیو ناموفق بود. مطمئن شوید لینک معتبر است.',
            ok: 'ویدیو با موفقیت پردازش شد!',
            pasted: 'لینک با موفقیت چسبانده شد!',
            emptyClip: 'کلیپ‌بورد خالی است.',
            noClip: 'دسترسی به کلیپ‌بورد امکان‌پذیر نیست.',
        },
        vi: {
            title: 'TikTok Downloader',
            subtitle: 'Tải video TikTok không có watermark dễ dàng và nhanh chóng',
            status: 'Dịch Vụ Hoạt Động',
            placeholder: 'Dán liên kết video TikTok vào đây, ví dụ: https://vt.tiktok.com/...',
            download: 'Tải Xuống',
            loading: 'Đang xử lý video, vui lòng đợi...',
            successTitle: 'Xử Lý Video Thành Công!',
            noWm: 'Tải Không Watermark',
            mp3: 'Tải MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@tác giả',
            statDownloads: 'Tổng Lượt Tải',
            statSatisfaction: 'Hài Lòng',
            statSpeed: 'Xử Lý',
            footer: 'Dịch vụ này không liên kết với TikTok.',
            empty: 'Vui lòng dán liên kết TikTok trước!',
            fail: 'Xử lý video thất bại. Hãy đảm bảo liên kết hợp lệ.',
            ok: 'Xử lý video thành công!',
            pasted: 'Đã dán liên kết thành công!',
            emptyClip: 'Bộ nhớ tạm trống.',
            noClip: 'Không thể truy cập bộ nhớ tạm.',
        },
        th: {
            title: 'TikTok Downloader',
            subtitle: 'ดาวน์โหลดวิดีโอ TikTok โดยไม่มีลายน้ำได้ง่ายและรวดเร็ว',
            status: 'บริการทำงาน',
            placeholder: 'วางลิงก์วิดีโอ TikTok ที่นี่ ตัวอย่าง: https://vt.tiktok.com/...',
            download: 'ดาวน์โหลด',
            loading: 'กำลังประมวลผลวิดีโอ โปรดรอสักครู่...',
            successTitle: 'ประมวลผลวิดีโอสำเร็จ!',
            noWm: 'ดาวน์โหลดโดยไม่มีลายน้ำ',
            mp3: 'ดาวน์โหลด MP3',
            defaultTitle: 'วิดีโอ TikTok',
            defaultAuthor: '@ผู้เขียน',
            statDownloads: 'ยอดดาวน์โหลดทั้งหมด',
            statSatisfaction: 'ความพึงพอใจ',
            statSpeed: 'การประมวลผล',
            footer: 'บริการนี้ไม่เกี่ยวข้องกับ TikTok',
            empty: 'กรุณาวางลิงก์ TikTok ก่อน!',
            fail: 'ประมวลผลวิดีโอล้มเหลว โปรดตรวจสอบว่าลิงก์ถูกต้อง',
            ok: 'ประมวลผลวิดีโอสำเร็จ!',
            pasted: 'วางลิงก์สำเร็จ!',
            emptyClip: 'คลิปบอร์ดว่างเปล่า',
            noClip: 'ไม่สามารถเข้าถึงคลิปบอร์ดได้',
        },
        ms: {
            title: 'TikTok Downloader',
            subtitle: 'Muat turun video TikTok tanpa tera air dengan mudah dan pantas',
            status: 'Perkhidmatan Aktif',
            placeholder: 'Tampal pautan video TikTok di sini, cth.: https://vt.tiktok.com/...',
            download: 'Muat Turun',
            loading: 'Memproses video, sila tunggu...',
            successTitle: 'Video Berjaya Diproses!',
            noWm: 'Muat Turun Tanpa Tera Air',
            mp3: 'Muat Turun MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@pengarang',
            statDownloads: 'Jumlah Muat Turun',
            statSatisfaction: 'Kepuasan',
            statSpeed: 'Proses',
            footer: 'Perkhidmatan ini tidak berkaitan dengan TikTok.',
            empty: 'Sila tampal pautan TikTok dahulu!',
            fail: 'Gagal memproses video. Pastikan pautan sah.',
            ok: 'Video berjaya diproses!',
            pasted: 'Pautan berjaya ditampal!',
            emptyClip: 'Papan klip kosong.',
            noClip: 'Tidak dapat mengakses papan klip.',
        },
        tl: {
            title: 'TikTok Downloader',
            subtitle: 'I-download ang mga video ng TikTok nang walang watermark nang madali at mabilis',
            status: 'Aktibong Serbisyo',
            placeholder: 'I-paste ang link ng video ng TikTok dito, hal.: https://vt.tiktok.com/...',
            download: 'I-download',
            loading: 'Pinoproseso ang video, mangyaring maghintay...',
            successTitle: 'Matagumpay na Na-proseso ang Video!',
            noWm: 'I-download Nang Walang Watermark',
            mp3: 'I-download ang MP3',
            defaultTitle: 'Videong TikTok',
            defaultAuthor: '@may-akda',
            statDownloads: 'Kabuuang Download',
            statSatisfaction: 'Kasiyahan',
            statSpeed: 'Proseso',
            footer: 'Ang serbisyong ito ay hindi kaakibat ng TikTok.',
            empty: 'Mangyaring i-paste muna ang link ng TikTok!',
            fail: 'Nabigong iproseso ang video. Siguraduhing wasto ang link.',
            ok: 'Matagumpay na na-proseso ang video!',
            pasted: 'Matagumpay na na-paste ang link!',
            emptyClip: 'Ang clipboard ay walang laman.',
            noClip: 'Hindi ma-access ang clipboard.',
        },
        pl: {
            title: 'TikTok Downloader',
            subtitle: 'Pobieraj filmy z TikTok bez znaku wodnego łatwo i szybko',
            status: 'Usługa Aktywna',
            placeholder: 'Wklej link do filmu TikTok tutaj, np.: https://vt.tiktok.com/...',
            download: 'Pobierz',
            loading: 'Przetwarzanie wideo, proszę czekać...',
            successTitle: 'Wideo Przetworzone Pomyślnie!',
            noWm: 'Pobierz Bez Znaku Wodnego',
            mp3: 'Pobierz MP3',
            defaultTitle: 'Wideo TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Łączne Pobrania',
            statSatisfaction: 'Zadowolenie',
            statSpeed: 'Proces',
            footer: 'Ta usługa nie jest powiązana z TikTok.',
            empty: 'Najpierw wklej link TikTok!',
            fail: 'Nie udało się przetworzyć wideo. Upewnij się, że link jest poprawny.',
            ok: 'Wideo przetworzone pomyślnie!',
            pasted: 'Link wklejony pomyślnie!',
            emptyClip: 'Schowek jest pusty.',
            noClip: 'Brak dostępu do schowka.',
        },
        uk: {
            title: 'TikTok Downloader',
            subtitle: 'Завантажуйте відео TikTok без водяного знака легко і швидко',
            status: 'Сервіс Активний',
            placeholder: 'Вставте посилання на відео TikTok тут, напр.: https://vt.tiktok.com/...',
            download: 'Завантажити',
            loading: 'Обробка відео, будь ласка, зачекайте...',
            successTitle: 'Відео Успішно Оброблено!',
            noWm: 'Завантажити Без Водяного Знака',
            mp3: 'Завантажити MP3',
            defaultTitle: 'Відео TikTok',
            defaultAuthor: '@автор',
            statDownloads: 'Усього Завантажень',
            statSatisfaction: 'Задоволеність',
            statSpeed: 'Процес',
            footer: 'Цей сервіс не повязаний з TikTok.',
            empty: 'Спочатку вставте посилання TikTok!',
            fail: 'Не вдалося обробити відео. Переконайтеся, що посилання дійсне.',
            ok: 'Відео успішно оброблено!',
            pasted: 'Посилання успішно вставлено!',
            emptyClip: 'Буфер обміну порожній.',
            noClip: 'Не вдається отримати доступ до буфера обміну.',
        },
        ro: {
            title: 'TikTok Downloader',
            subtitle: 'Descarcă videoclipuri TikTok fără filigran ușor și rapid',
            status: 'Serviciu Activ',
            placeholder: 'Lipește linkul videoclipului TikTok aici, ex.: https://vt.tiktok.com/...',
            download: 'Descarcă',
            loading: 'Se procesează videoclipul, vă rugăm așteptați...',
            successTitle: 'Videoclip Procesat cu Succes!',
            noWm: 'Descarcă Fără Filigran',
            mp3: 'Descarcă MP3',
            defaultTitle: 'Videoclip TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Total Descărcări',
            statSatisfaction: 'Satisfacție',
            statSpeed: 'Proces',
            footer: 'Acest serviciu nu este afiliat cu TikTok.',
            empty: 'Vă rugăm mai întâi lipiți linkul TikTok!',
            fail: 'Procesarea videoclipului a eșuat. Asigurați-vă că linkul este valid.',
            ok: 'Videoclip procesat cu succes!',
            pasted: 'Link lipit cu succes!',
            emptyClip: 'Clipboard-ul este gol.',
            noClip: 'Nu se poate accesa clipboard-ul.',
        },
        el: {
            title: 'TikTok Downloader',
            subtitle: 'Κατεβάστε βίντεο TikTok χωρίς υδατογράφημα εύκολα και γρήγορα',
            status: 'Υπηρεσία Ενεργή',
            placeholder: 'Επικολλήστε τον σύνδεσμο βίντεο TikTok εδώ, π.χ.: https://vt.tiktok.com/...',
            download: 'Λήψη',
            loading: 'Επεξεργασία βίντεο, παρακαλώ περιμένετε...',
            successTitle: 'Το Βίντεο Επεξεργάστηκε με Επιτυχία!',
            noWm: 'Λήψη Χωρίς Υδατογράφημα',
            mp3: 'Λήψη MP3',
            defaultTitle: 'Βίντεο TikTok',
            defaultAuthor: '@συντάκτης',
            statDownloads: 'Σύνολο Λήψεων',
            statSatisfaction: 'Ικανοποίηση',
            statSpeed: 'Επεξεργασία',
            footer: 'Αυτή η υπηρεσία δεν συνδέεται με το TikTok.',
            empty: 'Παρακαλώ επικολλήστε πρώτα τον σύνδεσμο TikTok!',
            fail: 'Αποτυχία επεξεργασίας βίντεο. Βεβαιωθείτε ότι ο σύνδεσμος είναι έγκυρος.',
            ok: 'Το βίντεο επεξεργάστηκε με επιτυχία!',
            pasted: 'Ο σύνδεσμος επικολλήθηκε με επιτυχία!',
            emptyClip: 'Το πρόχειρο είναι κενό.',
            noClip: 'Δεν είναι δυνατή η πρόσβαση στο πρόχειρο.',
        },
        cs: {
            title: 'TikTok Downloader',
            subtitle: 'Stahujte videa z TikTok bez vodoznaku snadno a rychle',
            status: 'Služba Aktivní',
            placeholder: 'Vložte odkaz na video TikTok zde, např.: https://vt.tiktok.com/...',
            download: 'Stáhnout',
            loading: 'Zpracování videa, prosím čekejte...',
            successTitle: 'Video Bylo Úspěšně Zpracováno!',
            noWm: 'Stáhnout Bez Vodoznaku',
            mp3: 'Stáhnout MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Celkem Stažení',
            statSatisfaction: 'Spokojenost',
            statSpeed: 'Proces',
            footer: 'Tato služba není přidružena k TikTok.',
            empty: 'Nejprve vložte odkaz TikTok!',
            fail: 'Zpracování videa selhalo. Ujistěte se, že odkaz je platný.',
            ok: 'Video bylo úspěšně zpracováno!',
            pasted: 'Odkaz byl úspěšně vložen!',
            emptyClip: 'Schránka je prázdná.',
            noClip: 'Nelze získat přístup ke schránce.',
        },
        hu: {
            title: 'TikTok Downloader',
            subtitle: 'Töltsd le a TikTok videókat vízjel nélkül egyszerűen és gyorsan',
            status: 'Szolgáltatás Aktív',
            placeholder: 'Illeszd be a TikTok videó linkjét ide, pl.: https://vt.tiktok.com/...',
            download: 'Letöltés',
            loading: 'Videó feldolgozása, kérlek várj...',
            successTitle: 'Videó Sikeresen Feldolgozva!',
            noWm: 'Letöltés Vízjel Nélkül',
            mp3: 'MP3 Letöltése',
            defaultTitle: 'TikTok Videó',
            defaultAuthor: '@szerző',
            statDownloads: 'Összes Letöltés',
            statSatisfaction: 'Elégedettség',
            statSpeed: 'Folyamat',
            footer: 'Ez a szolgáltatás nem áll kapcsolatban a TikTokkal.',
            empty: 'Kérlek először illeszd be a TikTok linket!',
            fail: 'A videó feldolgozása sikertelen. Győződj meg róla, hogy a link érvényes.',
            ok: 'Videó sikeresen feldolgozva!',
            pasted: 'Link sikeresen beillesztve!',
            emptyClip: 'A vágólap üres.',
            noClip: 'Nem lehet hozzáférni a vágólaphoz.',
        },
        sv: {
            title: 'TikTok Downloader',
            subtitle: 'Ladda ner TikTok-videor utan vattenmärke enkelt och snabbt',
            status: 'Tjänst Aktiv',
            placeholder: 'Klistra in TikTok-videolänken här, t.ex.: https://vt.tiktok.com/...',
            download: 'Ladda Ner',
            loading: 'Bearbetar video, vänligen vänta...',
            successTitle: 'Video Bearbetad Framgångsrikt!',
            noWm: 'Ladda Ner Utan Vattenmärke',
            mp3: 'Ladda Ner MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@författare',
            statDownloads: 'Totala Nedladdningar',
            statSatisfaction: 'Nöjdhet',
            statSpeed: 'Process',
            footer: 'Denna tjänst är inte ansluten till TikTok.',
            empty: 'Vänligen klistra in TikTok-länken först!',
            fail: 'Det gick inte att bearbeta videon. Se till att länken är giltig.',
            ok: 'Video bearbetad framgångsrikt!',
            pasted: 'Länk klistrades in framgångsrikt!',
            emptyClip: 'Urklipp är tomt.',
            noClip: 'Kan inte komma åt urklipp.',
        },
        no: {
            title: 'TikTok Downloader',
            subtitle: 'Last ned TikTok-videoer uten vannmerke enkelt og raskt',
            status: 'Tjeneste Aktiv',
            placeholder: 'Lim inn TikTok-videolenken her, f.eks.: https://vt.tiktok.com/...',
            download: 'Last Ned',
            loading: 'Behandler video, vennligst vent...',
            successTitle: 'Video Behandlet Vellykket!',
            noWm: 'Last Ned Uten Vannmerke',
            mp3: 'Last Ned MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@forfatter',
            statDownloads: 'Totale Nedlastinger',
            statSatisfaction: 'Tilfredshet',
            statSpeed: 'Prosess',
            footer: 'Denne tjenesten er ikke tilknyttet TikTok.',
            empty: 'Vennligst lim inn TikTok-lenken først!',
            fail: 'Kunne ikke behandle videoen. Sørg for at lenken er gyldig.',
            ok: 'Video behandlet vellykket!',
            pasted: 'Lenke limt inn vellykket!',
            emptyClip: 'Utklippstavlen er tom.',
            noClip: 'Får ikke tilgang til utklippstavlen.',
        },
        da: {
            title: 'TikTok Downloader',
            subtitle: 'Download TikTok-videoer uden vandmærke nemt og hurtigt',
            status: 'Tjeneste Aktiv',
            placeholder: 'Indsæt TikTok-videolinket her, f.eks.: https://vt.tiktok.com/...',
            download: 'Download',
            loading: 'Behandler video, vent venligst...',
            successTitle: 'Video Behandlet Succesfuldt!',
            noWm: 'Download Uden Vandmærke',
            mp3: 'Download MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@forfatter',
            statDownloads: 'Samlede Downloads',
            statSatisfaction: 'Tilfredshed',
            statSpeed: 'Proces',
            footer: 'Denne tjeneste er ikke tilknyttet TikTok.',
            empty: 'Indsæt venligst TikTok-linket først!',
            fail: 'Kunne ikke behandle videoen. Sørg for, at linket er gyldigt.',
            ok: 'Video behandlet succesfuldt!',
            pasted: 'Link indsat succesfuldt!',
            emptyClip: 'Udklipsholderen er tom.',
            noClip: 'Kan ikke få adgang til udklipsholderen.',
        },
        fi: {
            title: 'TikTok Downloader',
            subtitle: 'Lataa TikTok-videoita ilman vesileimaa helposti ja nopeasti',
            status: 'Palvelu Aktiivinen',
            placeholder: 'Liitä TikTok-videolinkki tähän, esim.: https://vt.tiktok.com/...',
            download: 'Lataa',
            loading: 'Käsitellään videota, odota hetki...',
            successTitle: 'Video Käsitelty Onnistuneesti!',
            noWm: 'Lataa Ilman Vesileimaa',
            mp3: 'Lataa MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@tekijä',
            statDownloads: 'Lataukset Yhteensä',
            statSatisfaction: 'Tyytyväisyys',
            statSpeed: 'Prosessi',
            footer: 'Tämä palvelu ei ole yhteydessä TikTokiin.',
            empty: 'Liitä ensin TikTok-linkki!',
            fail: 'Videon käsittely epäonnistui. Varmista, että linkki on kelvollinen.',
            ok: 'Video käsitelty onnistuneesti!',
            pasted: 'Linkki liitetty onnistuneesti!',
            emptyClip: 'Leikepöytä on tyhjä.',
            noClip: 'Leikepöydälle ei saada pääsyä.',
        },
        he: {
            title: 'TikTok Downloader',
            subtitle: 'הורד סרטוני TikTok ללא סימן מים בקלות ובמהירות',
            status: 'שירות פעיל',
            placeholder: 'הדבק כאן את קישור סרטון TikTok, לדוגמה: https://vt.tiktok.com/...',
            download: 'הורד',
            loading: 'מעבד סרטון, נא להמתין...',
            successTitle: 'הסרטון עובד בהצלחה!',
            noWm: 'הורד ללא סימן מים',
            mp3: 'הורד MP3',
            defaultTitle: 'סרטון TikTok',
            defaultAuthor: '@מחבר',
            statDownloads: 'סה"כ הורדות',
            statSatisfaction: 'שביעות רצון',
            statSpeed: 'עיבוד',
            footer: 'שירות זה אינו קשור ל-TikTok.',
            empty: 'נא הדבק תחילה את קישור TikTok!',
            fail: 'עיבוד הסרטון נכשל. ודא שהקישור תקף.',
            ok: 'הסרטון עובד בהצלחה!',
            pasted: 'הקישור הודבק בהצלחה!',
            emptyClip: 'לוח הגזירים ריק.',
            noClip: 'לא ניתן לגשת ללוח הגזירים.',
        },
        sw: {
            title: 'TikTok Downloader',
            subtitle: 'Pakua video za TikTok bila alama ya maji kwa urahisi na haraka',
            status: 'Huduma Inaendelea',
            placeholder: 'Bandika kiungo cha video ya TikTok hapa, k.m.: https://vt.tiktok.com/...',
            download: 'Pakua',
            loading: 'Inashughulikia video, tafadhali subiri...',
            successTitle: 'Video Imeshughulikiwa Kwa Mafanikio!',
            noWm: 'Pakua Bila Alama ya Maji',
            mp3: 'Pakua MP3',
            defaultTitle: 'Video ya TikTok',
            defaultAuthor: '@mtunzi',
            statDownloads: 'Jumla ya Upakuaji',
            statSatisfaction: 'Kuridhika',
            statSpeed: 'Mchakato',
            footer: 'Huduma hii haihusiani na TikTok.',
            empty: 'Tafadhali bandika kiungo cha TikTok kwanza!',
            fail: 'Imeshindwa kushughulikia video. Hakikisha kiungo ni halali.',
            ok: 'Video imeshughulikiwa kwa mafanikio!',
            pasted: 'Kiungo kimebandikwa kwa mafanikio!',
            emptyClip: 'Ubao wa kunakili ni tupu.',
            noClip: 'Haiwezi kufikia ubao wa kunakili.',
        },
        ta: {
            title: 'TikTok Downloader',
            subtitle: 'வாட்டர் மார்க் இல்லாமல் TikTok வீடியோக்களை எளிதாகவும் வேகமாகவும் பதிவிறக்கவும்',
            status: 'சேவை செயலில்',
            placeholder: 'இங்கே TikTok வீடியோ இணைப்பை ஒட்டவும், எ.கா.: https://vt.tiktok.com/...',
            download: 'பதிவிறக்கம்',
            loading: 'வீடியோ செயலாக்கப்படுகிறது, தயவுசெய்து காத்திருங்கள்...',
            successTitle: 'வீடியோ வெற்றிகரமாக செயலாக்கப்பட்டது!',
            noWm: 'வாட்டர் மார்க் இல்லாமல் பதிவிறக்கவும்',
            mp3: 'MP3 பதிவிறக்கவும்',
            defaultTitle: 'TikTok வீடியோ',
            defaultAuthor: '@ஆசிரியர்',
            statDownloads: 'மொத்த பதிவிறக்கங்கள்',
            statSatisfaction: 'திருப்தி',
            statSpeed: 'செயலாக்கம்',
            footer: 'இந்த சேவை TikTok உடன் தொடர்புடையது அல்ல.',
            empty: 'முதலில் TikTok இணைப்பை ஒட்டவும்!',
            fail: 'வீடியோவை செயலாக்க முடியவில்லை. இணைப்பு சரியானது என்பதை உறுதிப்படுத்தவும்.',
            ok: 'வீடியோ வெற்றிகரமாக செயலாக்கப்பட்டது!',
            pasted: 'இணைப்பு வெற்றிகரமாக ஒட்டப்பட்டது!',
            emptyClip: 'கிளிப்போர்டு காலியாக உள்ளது.',
            noClip: 'கிளிப்போர்டை அணுக முடியவில்லை.',
        },
        te: {
            title: 'TikTok Downloader',
            subtitle: 'వాటర్‌మార్క్ లేకుండా TikTok వీడియోలను సులభంగా మరియు వేగంగా డౌన్‌లోడ్ చేయండి',
            status: 'సేవ క్రియాశీలంగా ఉంది',
            placeholder: 'ఇక్కడ TikTok వీడియో లింక్‌ను పేస్ట్ చేయండి, ఉదా.: https://vt.tiktok.com/...',
            download: 'డౌన్‌లోడ్',
            loading: 'వీడియోను ప్రాసెస్ చేస్తున్నాం, దయచేసి వేచి ఉండండి...',
            successTitle: 'వీడియో విజయవంతంగా ప్రాసెస్ చేయబడింది!',
            noWm: 'వాటర్‌మార్క్ లేకుండా డౌన్‌లోడ్ చేయండి',
            mp3: 'MP3 డౌన్‌లోడ్ చేయండి',
            defaultTitle: 'TikTok వీడియో',
            defaultAuthor: '@రచయిత',
            statDownloads: 'మొత్తం డౌన్‌లోడ్‌లు',
            statSatisfaction: 'సంతృప్తి',
            statSpeed: 'ప్రాసెస్',
            footer: 'ఈ సేవకు TikTokతో సంబంధం లేదు.',
            empty: 'దయచేసి ముందుగా TikTok లింక్‌ను పేస్ట్ చేయండి!',
            fail: 'వీడియోను ప్రాసెస్ చేయడం విఫలమైంది. లింక్ చెల్లుబాటు అయిందో నిర్ధారించుకోండి.',
            ok: 'వీడియో విజయవంతంగా ప్రాసెస్ చేయబడింది!',
            pasted: 'లింక్ విజయవంతంగా పేస్ట్ చేయబడింది!',
            emptyClip: 'క్లిప్‌బోర్డ్ ఖాళీగా ఉంది.',
            noClip: 'క్లిప్‌బోర్డ్‌ను యాక్సెస్ చేయలేకపోయాం.',
        },
        mr: {
            title: 'TikTok Downloader',
            subtitle: 'वॉटरमार्कशिवाय TikTok व्हिडिओ सहज आणि जलद डाउनलोड करा',
            status: 'सेवा सक्रिय',
            placeholder: 'येथे TikTok व्हिडिओ लिंक पेस्ट करा, उदा.: https://vt.tiktok.com/...',
            download: 'डाउनलोड',
            loading: 'व्हिडिओ प्रक्रिया करत आहे, कृपया प्रतीक्षा करा...',
            successTitle: 'व्हिडिओ यशस्वीरित्या प्रक्रिया केला!',
            noWm: 'वॉटरमार्कशिवाय डाउनलोड करा',
            mp3: 'MP3 डाउनलोड करा',
            defaultTitle: 'TikTok व्हिडिओ',
            defaultAuthor: '@लेखक',
            statDownloads: 'एकूण डाउनलोड',
            statSatisfaction: 'समाधान',
            statSpeed: 'प्रक्रिया',
            footer: 'ही सेवा TikTok शी संबंधित नाही.',
            empty: 'कृपया प्रथम TikTok लिंक पेस्ट करा!',
            fail: 'व्हिडिओ प्रक्रिया करण्यात अयशस्वी. लिंक वैध असल्याचे सुनिश्चित करा.',
            ok: 'व्हिडिओ यशस्वीरित्या प्रक्रिया केला!',
            pasted: 'लिंक यशस्वीरित्या पेस्ट केली!',
            emptyClip: 'क्लिपबोर्ड रिक्त आहे.',
            noClip: 'क्लिपबोर्ड अॅक्सेस करता येत नाही.',
        },
        gu: {
            title: 'TikTok Downloader',
            subtitle: 'વોટરમાર્ક વગર TikTok વીડિયો સરળતાથી અને ઝડપથી ડાઉનલોડ કરો',
            status: 'સેવા સક્રિય',
            placeholder: 'અહીં TikTok વીડિયો લિંક પેસ્ટ કરો, દા.ત.: https://vt.tiktok.com/...',
            download: 'ડાઉનલોડ',
            loading: 'વીડિયો પ્રોસેસ થઈ રહ્યો છે, કૃપા કરીને રાહ જુઓ...',
            successTitle: 'વીડિયો સફળતાપૂર્વક પ્રોસેસ થયો!',
            noWm: 'વોટરમાર્ક વગર ડાઉનલોડ કરો',
            mp3: 'MP3 ડાઉનલોડ કરો',
            defaultTitle: 'TikTok વીડિયો',
            defaultAuthor: '@લેખક',
            statDownloads: 'કુલ ડાઉનલોડ',
            statSatisfaction: 'સંતોષ',
            statSpeed: 'પ્રક્રિયા',
            footer: 'આ સેવા TikTok સાથે સંબંધિત નથી.',
            empty: 'કૃપા કરીને પહેલા TikTok લિંક પેસ્ટ કરો!',
            fail: 'વીડિયો પ્રોસેસ કરવામાં નિષ્ફળ. ખાતરી કરો કે લિંક માન્ય છે.',
            ok: 'વીડિયો સફળતાપૂર્વક પ્રોસેસ થયો!',
            pasted: 'લિંક સફળતાપૂર્વક પેસ્ટ થઈ!',
            emptyClip: 'ક્લિપબોર્ડ ખાલી છે.',
            noClip: 'ક્લિપબોર્ડ ઍક્સેસ કરી શકાતું નથી.',
        },
        pa: {
            title: 'TikTok Downloader',
            subtitle: 'ਵਾਟਰਮਾਰਕ ਤੋਂ ਬਿਨਾਂ TikTok ਵੀਡੀਓ ਆਸਾਨੀ ਅਤੇ ਤੇਜ਼ੀ ਨਾਲ ਡਾਊਨਲੋਡ ਕਰੋ',
            status: 'ਸੇਵਾ ਸਕਿਰਿਆ',
            placeholder: 'ਇੱਥੇ TikTok ਵੀਡੀਓ ਲਿੰਕ ਚਿਪਕਾਓ, ਜਿਵੇਂ: https://vt.tiktok.com/...',
            download: 'ਡਾਊਨਲੋਡ',
            loading: 'ਵੀਡੀਓ ਪ੍ਰੋਸੈਸ ਹੋ ਰਿਹਾ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ...',
            successTitle: 'ਵੀਡੀਓ ਸਫਲਤਾਪੂਰਵਕ ਪ੍ਰੋਸੈਸ ਹੋ ਗਿਆ!',
            noWm: 'ਵਾਟਰਮਾਰਕ ਤੋਂ ਬਿਨਾਂ ਡਾਊਨਲੋਡ ਕਰੋ',
            mp3: 'MP3 ਡਾਊਨਲੋਡ ਕਰੋ',
            defaultTitle: 'TikTok ਵੀਡੀਓ',
            defaultAuthor: '@ਲੇਖਕ',
            statDownloads: 'ਕੁੱਲ ਡਾਊਨਲੋਡ',
            statSatisfaction: 'ਸੰਤੁਸ਼ਟੀ',
            statSpeed: 'ਪ੍ਰਕਿਰਿਆ',
            footer: 'ਇਹ ਸੇਵਾ TikTok ਨਾਲ ਸਬੰਧਤ ਨਹੀਂ ਹੈ.',
            empty: 'ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ TikTok ਲਿੰਕ ਚਿਪਕਾਓ!',
            fail: 'ਵੀਡੀਓ ਪ੍ਰੋਸੈਸ ਕਰਨ ਵਿੱਚ ਅਸਫਲ। ਯਕੀਨੀ ਬਣਾਓ ਕਿ ਲਿੰਕ ਵੈਧ ਹੈ.',
            ok: 'ਵੀਡੀਓ ਸਫਲਤਾਪੂਰਵਕ ਪ੍ਰੋਸੈਸ ਹੋ ਗਿਆ!',
            pasted: 'ਲਿੰਕ ਸਫਲਤਾਪੂਰਵਕ ਚਿਪਕਾਇਆ ਗਿਆ!',
            emptyClip: 'ਕਲਿੱਪਬੋਰਡ ਖਾਲੀ ਹੈ.',
            noClip: 'ਕਲਿੱਪਬੋਰਡ ਐਕਸੈਸ ਨਹੀਂ ਕੀਤਾ ਜਾ ਸਕਦਾ.',
        },
        ne: {
            title: 'TikTok Downloader',
            subtitle: 'वाटरमार्क बिना TikTok भिडियो सजिलै र छिटो डाउनलोड गर्नुहोस्',
            status: 'सेवा सक्रिय',
            placeholder: 'यहाँ TikTok भिडियो लिङ्क टाँस्नुहोस्, उदा.: https://vt.tiktok.com/...',
            download: 'डाउनलोड',
            loading: 'भिडियो प्रशोधन गर्दै, कृपया पर्खनुहोस्...',
            successTitle: 'भिडियो सफलतापूर्वक प्रशोधन गरियो!',
            noWm: 'वाटरमार्क बिना डाउनलोड गर्नुहोस्',
            mp3: 'MP3 डाउनलोड गर्नुहोस्',
            defaultTitle: 'TikTok भिडियो',
            defaultAuthor: '@लेखक',
            statDownloads: 'कुल डाउनलोड',
            statSatisfaction: 'सन्तुष्टि',
            statSpeed: 'प्रक्रिया',
            footer: 'यो सेवा TikTok सँग सम्बन्धित छैन.',
            empty: 'कृपया पहिले TikTok लिङ्क टाँस्नुहोस्!',
            fail: 'भिडियो प्रशोधन असफल। लिङ्क वैध छ भनी सुनिश्चित गर्नुहोस्.',
            ok: 'भिडियो सफलतापूर्वक प्रशोधन गरियो!',
            pasted: 'लिङ्क सफलतापूर्वक टाँसियो!',
            emptyClip: 'क्लिपबोर्ड खाली छ.',
            noClip: 'क्लिपबोर्ड पहुँच गर्न सकिँदैन.',
        },
        si: {
            title: 'TikTok Downloader',
            subtitle: 'වොටර්මාර්ක් නොමැතිව TikTok වීඩියෝ පහසුවෙන් සහ වේගයෙන් බාගත කරන්න',
            status: 'සේවාව සක්‍රියයි',
            placeholder: 'ඔබේ TikTok වීඩියෝ සබැඳිය මෙහි අලවන්න, උදා.: https://vt.tiktok.com/...',
            download: 'බාගත කරන්න',
            loading: 'වීඩියෝව සැකසෙමින්, කරුණාකර රැඳී සිටින්න...',
            successTitle: 'වීඩියෝව සාර්ථකව සැකසිණි!',
            noWm: 'වොටර්මාර්ක් නොමැතිව බාගත කරන්න',
            mp3: 'MP3 බාගත කරන්න',
            defaultTitle: 'TikTok වීඩියෝව',
            defaultAuthor: '@කතෘ',
            statDownloads: 'මුළු බාගත කිරීම්',
            statSatisfaction: 'තෘප්තිමත් බව',
            statSpeed: 'සැකසීම',
            footer: 'මෙම සේවාව TikTok සමඟ නොබැඳේ.',
            empty: 'කරුණාකර පළමුව TikTok සබැඳිය අලවන්න!',
            fail: 'වීඩියෝව සැකසීමට අසමර්ථ විය. සබැඳිය වලංගු බව සහතික කරන්න.',
            ok: 'වීඩියෝව සාර්ථකව සැකසිණි!',
            pasted: 'සබැඳිය සාර්ථකව අලවා ඇත!',
            emptyClip: 'ක්ලිප්බෝඩ් එක හිස්ය.',
            noClip: 'ක්ලිප්බෝඩ් එකට ප්‍රවේශ විය නොහැක.',
        },
        my: {
            title: 'TikTok Downloader',
            subtitle: 'ရေစိုအမှတ်မပါဘဲ TikTok ဗီဒီယိုများကို လွယ်ကူမြန်ဆန်စွာ ဒေါင်းလုဒ်လုပ်ပါ',
            status: 'ဝန်ဆောင်မှု အသက်ဝင်နေသည်',
            placeholder: 'ဤနေရာတွင် TikTok ဗီဒီယို လင့်ခ်ကို ကပ်ထားပါ၊ ဥပမာ- https://vt.tiktok.com/...',
            download: 'ဒေါင်းလုဒ်',
            loading: 'ဗီဒီယိုကို စီမံဆောင်ရွက်နေသည်၊ ကျေးဇူးပြု၍ စောင့်ပါ...',
            successTitle: 'ဗီဒီယိုကို အောင်မြင်စွာ စီမံပြီးပါပြီ!',
            noWm: 'ရေစိုအမှတ်မပါဘဲ ဒေါင်းလုဒ်လုပ်ပါ',
            mp3: 'MP3 ဒေါင်းလုဒ်လုပ်ပါ',
            defaultTitle: 'TikTok ဗီဒီယို',
            defaultAuthor: '@စာရေးသူ',
            statDownloads: 'စုစုပေါင်း ဒေါင်းလုဒ်များ',
            statSatisfaction: 'ကျေနပ်မှု',
            statSpeed: 'လုပ်ငန်းစဉ်',
            footer: 'ဤဝန်ဆောင်မှုသည် TikTok နှင့် မသက်ဆိုင်ပါ။',
            empty: 'ကျေးဇူးပြု၍ အရင် TikTok လင့်ခ်ကို ကပ်ပါ!',
            fail: 'ဗီဒီယိုကို စီမံဆောင်ရွက်၍ မရပါ။ လင့်ခ် မှန်ကန်ကြောင်း သေချာပါစေ။',
            ok: 'ဗီဒီယိုကို အောင်မြင်စွာ စီမံပြီးပါပြီ!',
            pasted: 'လင့်ခ်ကို အောင်မြင်စွာ ကပ်ပြီးပါပြီ!',
            emptyClip: 'ကလစ်ဘုတ်သည် ဗလာဖြစ်နေသည်။',
            noClip: 'ကလစ်ဘုတ်ကို ဝင်ရောက်ကြည့်ရှုခွင့် မရပါ။',
        },
        km: {
            title: 'TikTok Downloader',
            subtitle: 'ទាញយកវីដេអូ TikTok ដោយគ្មានស្លាកទឹកបានយ៉ាងងាយស្រួល និងរហ័ស',
            status: 'សេវាកម្មសកម្ម',
            placeholder: 'បិទភ្ជាប់តំណវីដេអូ TikTok នៅទីនេះ ឧទា.៖ https://vt.tiktok.com/...',
            download: 'ទាញយក',
            loading: 'កំពុងដំណើរការវីដេអូ សូមរង់ចាំ...',
            successTitle: 'វីដេអូត្រូវបានដំណើរការដោយជោគជ័យ!',
            noWm: 'ទាញយកដោយគ្មានស្លាកទឹក',
            mp3: 'ទាញយក MP3',
            defaultTitle: 'វីដេអូ TikTok',
            defaultAuthor: '@អ្នកនិពន្ធ',
            statDownloads: 'ចំនួនទាញយកសរុប',
            statSatisfaction: 'ការពេញចិត្ត',
            statSpeed: 'ដំណើរការ',
            footer: 'សេវាកម្មនេះមិនទាក់ទងជាមួយ TikTok ទេ។',
            empty: 'សូមបិទភ្ជាប់តំណ TikTok ជាមុនសិន!',
            fail: 'បរាជ័យក្នុងការដំណើរការវីដេអូ។ សូមប្រាកដថាតំណត្រឹមត្រូវ។',
            ok: 'វីដេអូត្រូវបានដំណើរការដោយជោគជ័យ!',
            pasted: 'តំណត្រូវបានបិទភ្ជាប់ដោយជោគជ័យ!',
            emptyClip: 'ក្ដារតម្បៀតផ្ទុកទទេ។',
            noClip: 'មិនអាចចូលប្រើក្ដារតម្បៀតផ្ទុកបានទេ។',
        },
        lo: {
            title: 'TikTok Downloader',
            subtitle: 'ດາວໂຫລດວິດີໂອ TikTok ໂດຍບໍ່ມີຕາໜ້ານ້ຳໄດ້ງ່າຍໆ ແລະໄວ',
            status: 'ບໍລິການກຳລັງເຮັດວຽກ',
            placeholder: 'ແຊະລິ້ງວິດີໂອ TikTok ຕົງນີ້, ຕົວຢ່າງ: https://vt.tiktok.com/...',
            download: 'ດາວໂຫລດ',
            loading: 'ກຳລັງປະມວນຜົນວິດີໂອ, ກະລຸນາລໍຖ້າ...',
            successTitle: 'ປະມວນຜົນວິດີໂອສຳເລັດ!',
            noWm: 'ດາວໂຫລດໂດຍບໍ່ມີຕາໜ້ານ້ຳ',
            mp3: 'ດາວໂຫລດ MP3',
            defaultTitle: 'ວິດີໂອ TikTok',
            defaultAuthor: '@ຜູ້ຂຽນ',
            statDownloads: 'ຈຳນວນດາວໂຫລດທັງໝົດ',
            statSatisfaction: 'ຄວາມພໍໃຈ',
            statSpeed: 'ຂັ້ນຕອນ',
            footer: 'ບໍລິການນີ້ບໍ່ກ່ຽວຂ້ອງກັບ TikTok.',
            empty: 'ກະລຸນາແຊະລິ້ງລິ້ງ TikTok ກ່ອນ!',
            fail: 'ບໍ່ສາມາດປະມວນຜົນວິດີໂອໄດ້. ແກ້ໃຫ້ແນ່ໃຈວ່າລິ້ງຖືກຕ້ອງ.',
            ok: 'ປະມວນຜົນວິດີໂອສຳເລັດ!',
            pasted: 'ແຊະລິ້ງລິ້ງສຳເລັດ!',
            emptyClip: 'ຄລິບບອດວ່າງເປົ່າ.',
            noClip: 'ບໍ່ສາມາດເຂົ້າເຖິງຄລິບບອດໄດ້.',
        },
        bg: {
            title: 'TikTok Downloader',
            subtitle: 'Изтегляйте TikTok видеа без воден знак лесно и бързо',
            status: 'Услугата Активна',
            placeholder: 'Поставете връзката към TikTok видео тук, напр.: https://vt.tiktok.com/...',
            download: 'Изтегли',
            loading: 'Обработка на видеото, моля изчакайте...',
            successTitle: 'Видеото Е Обработено Успешно!',
            noWm: 'Изтегли Без Воден Знак',
            mp3: 'Изтегли MP3',
            defaultTitle: 'TikTok Видео',
            defaultAuthor: '@автор',
            statDownloads: 'Общо Изтегляния',
            statSatisfaction: 'Удовлетвореност',
            statSpeed: 'Процес',
            footer: 'Тази услуга не е свързана с TikTok.',
            empty: 'Моля първо поставете връзката към TikTok!',
            fail: 'Неуспешна обработка на видеото. Уверете се, че връзката е валидна.',
            ok: 'Видеото е обработено успешно!',
            pasted: 'Връзката е поставена успешно!',
            emptyClip: 'Клипбордът е празен.',
            noClip: 'Няма достъп до клипборда.',
        },
        hr: {
            title: 'TikTok Downloader',
            subtitle: 'Preuzmite TikTok videozapise bez vodene oznake lako i brzo',
            status: 'Usluga Aktivna',
            placeholder: 'Zalijepite poveznicu na TikTok videozapis ovdje, npr.: https://vt.tiktok.com/...',
            download: 'Preuzmi',
            loading: 'Obrađujem video, molim pričekajte...',
            successTitle: 'Video Uspješno Obrađen!',
            noWm: 'Preuzmi Bez Vodene Oznake',
            mp3: 'Preuzmi MP3',
            defaultTitle: 'TikTok Video',
            defaultAuthor: '@autor',
            statDownloads: 'Ukupno Preuzimanja',
            statSatisfaction: 'Zadovoljstvo',
            statSpeed: 'Proces',
            footer: 'Ova usluga nije povezana s TikTokom.',
            empty: 'Prvo zalijepite TikTok poveznicu!',
            fail: 'Obrada videa nije uspjela. Provjerite je li poveznica valjana.',
            ok: 'Video je uspješno obrađen!',
            pasted: 'Poveznica je uspješno zalijepljena!',
            emptyClip: 'Međuspremnik je prazan.',
            noClip: 'Nije moguće pristupiti međuspremniku.',
        },
        sr: {
            title: 'TikTok Downloader',
            subtitle: 'Preuzmite TikTok video zapise bez vodenog žiga lako i brzo',
            status: 'Usluga Aktivna',
            placeholder: 'Nalepite vezu ka TikTok videu ovde, npr.: https://vt.tiktok.com/...',
            download: 'Preuzmi',
            loading: 'Obrađujem video, molim sačekajte...',
            successTitle: 'Video Uspešno Obrađen!',
            noWm: 'Preuzmi Bez Vodenog Žiga',
            mp3: 'Preuzmi MP3',
            defaultTitle: 'TikTok Video',
            defaultAuthor: '@autor',
            statDownloads: 'Ukupno Preuzimanja',
            statSatisfaction: 'Zadovoljstvo',
            statSpeed: 'Proces',
            footer: 'Ova usluga nije povezana sa TikTokom.',
            empty: 'Prvo nalepite TikTok vezu!',
            fail: 'Obrada videa nije uspela. Uverite se da je veza važeća.',
            ok: 'Video je uspešno obrađen!',
            pasted: 'Veza je uspešno nalepljena!',
            emptyClip: 'Privremena memorija je prazna.',
            noClip: 'Nije moguće pristupiti privremenoj memoriji.',
        },
        sk: {
            title: 'TikTok Downloader',
            subtitle: 'Sťahujte videá z TikTok bez vodoznaku jednoducho a rýchlo',
            status: 'Služba Aktívna',
            placeholder: 'Vložte odkaz na video TikTok sem, napr.: https://vt.tiktok.com/...',
            download: 'Stiahnuť',
            loading: 'Spracúvam video, prosím čakajte...',
            successTitle: 'Video Bolo Úspešne Spracované!',
            noWm: 'Stiahnuť Bez Vodoznaku',
            mp3: 'Stiahnuť MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Celkom Stiahnutí',
            statSatisfaction: 'Spokojnosť',
            statSpeed: 'Proces',
            footer: 'Táto služba nie je pripojená k TikTok.',
            empty: 'Najprv vložte odkaz TikTok!',
            fail: 'Spracovanie videa zlyhalo. Uistite sa, že odkaz je platný.',
            ok: 'Video bolo úspešne spracované!',
            pasted: 'Odkaz bol úspešne vložený!',
            emptyClip: 'Schránka je prázdna.',
            noClip: 'Nedá sa pristúpiť k schránke.',
        },
        sl: {
            title: 'TikTok Downloader',
            subtitle: 'Prenesite videe z TikTok brez vodnega žiga enostavno in hitro',
            status: 'Storitev Aktivna',
            placeholder: 'Prilepite povezavo do videa TikTok tukaj, npr.: https://vt.tiktok.com/...',
            download: 'Prenesi',
            loading: 'Obdelujem video, prosimo počakajte...',
            successTitle: 'Video Uspešno Obdelan!',
            noWm: 'Prenesi Brez Vodnega Žiga',
            mp3: 'Prenesi MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@avtor',
            statDownloads: 'Skupaj Prenosov',
            statSatisfaction: 'Zadovoljstvo',
            statSpeed: 'Postopek',
            footer: 'Ta storitev ni povezana s TikTokom.',
            empty: 'Najprej prilepite povezavo TikTok!',
            fail: 'Obdelava videa ni uspela. Preverite, ali je povezava veljavna.',
            ok: 'Video je uspešno obdelan!',
            pasted: 'Povezava je uspešno prilepljena!',
            emptyClip: 'Odložišče je prazno.',
            noClip: 'Ni mogoče dostopati do odložišča.',
        },
        et: {
            title: 'TikTok Downloader',
            subtitle: 'Laadi TikToki videoid ilma vesimärgita hõlpsalt ja kiiresti',
            status: 'Teenus Aktiivne',
            placeholder: 'Kleebi TikToki video link siia, nt.: https://vt.tiktok.com/...',
            download: 'Laadi Alla',
            loading: 'Töötlen videot, palun oota...',
            successTitle: 'Video Edastatud Edukalt!',
            noWm: 'Laadi Alla Ilma Vesimärgita',
            mp3: 'Laadi Alla MP3',
            defaultTitle: 'TikToki Video',
            defaultAuthor: '@autor',
            statDownloads: 'Kokku Allalaadimisi',
            statSatisfaction: 'Rahulolu',
            statSpeed: 'Protsess',
            footer: 'See teenus ei ole seotud TikTokiga.',
            empty: 'Kleebi esmalt TikToki link!',
            fail: 'Video töötlemine ebaõnnestus. Veendu, et link on kehtiv.',
            ok: 'Video edastatud edukalt!',
            pasted: 'Link kleebiti edukalt!',
            emptyClip: 'Lõikelaual on tühi.',
            noClip: 'Lõikelauale ei pääse ligi.',
        },
        lv: {
            title: 'TikTok Downloader',
            subtitle: 'Lejupielādējiet TikTok video bez ūdenszīmes viegli un ātri',
            status: 'Pakalpojums Aktīvs',
            placeholder: 'Ievietojiet šeit TikTok video saiti, piem.: https://vt.tiktok.com/...',
            download: 'Lejupielādēt',
            loading: 'Apstrādāju video, lūdzu, uzgaidiet...',
            successTitle: 'Video Veiksmīgi Apstrādāts!',
            noWm: 'Lejupielādēt Bez Ūdenszīmes',
            mp3: 'Lejupielādēt MP3',
            defaultTitle: 'TikTok Video',
            defaultAuthor: '@autors',
            statDownloads: 'Kopā Lejupielādes',
            statSatisfaction: 'Apmierinātība',
            statSpeed: 'Process',
            footer: 'Šis pakalpojums nav saistīts ar TikTok.',
            empty: 'Lūdzu, vispirms ievietojiet TikTok saiti!',
            fail: 'Neizdevās apstrādāt video. Pārliecinieties, ka saite ir derīga.',
            ok: 'Video veiksmīgi apstrādāts!',
            pasted: 'Saite veiksmīgi ievietota!',
            emptyClip: 'Starpliktuve ir tukša.',
            noClip: 'Nevar piekļūt starpliktuvei.',
        },
        lt: {
            title: 'TikTok Downloader',
            subtitle: 'Atsisiųskite „TikTok“ vaizdo įrašus be vandens ženklo lengvai ir greitai',
            status: 'Paslauga Aktyvi',
            placeholder: 'Įklijuokite „TikTok“ vaizdo įrašo nuorodą čia, pvz.: https://vt.tiktok.com/...',
            download: 'Atsisiųsti',
            loading: 'Apdorojamas vaizdo įrašas, prašome palaukti...',
            successTitle: 'Vaizdo Įrašas Sėkmingai Apdorotas!',
            noWm: 'Atsisiųsti Be Vandens Ženklo',
            mp3: 'Atsisiųsti MP3',
            defaultTitle: 'TikTok Vaizdo Įrašas',
            defaultAuthor: '@autorius',
            statDownloads: 'Iš Viso Atsisiuntimų',
            statSatisfaction: 'Patenkintumas',
            statSpeed: 'Procesas',
            footer: 'Ši paslauga nėra susijusi su „TikTok“.',
            empty: 'Pirmiausia įklijuokite „TikTok“ nuorodą!',
            fail: 'Nepavyko apdoroti vaizdo įrašo. Įsitikinkite, kad nuoroda galioja.',
            ok: 'Vaizdo įrašas sėkmingai apdorotas!',
            pasted: 'Nuoroda sėkmingai įklijuota!',
            emptyClip: 'Iškarpinė tuščia.',
            noClip: 'Negalima pasiekti iškarpinės.',
        },
        is: {
            title: 'TikTok Downloader',
            subtitle: 'Sæktu TikTok myndbönd án vatnsmerkis auðveldlega og hratt',
            status: 'Þjónusta Virk',
            placeholder: 'Límdu TikTok myndbandshlekk hér, t.d.: https://vt.tiktok.com/...',
            download: 'Sækja',
            loading: 'Er að vinna myndband, biðjið þoli...',
            successTitle: 'Myndbandi Unnið Með Vel!',
            noWm: 'Sækja Án Vatnsmerkis',
            mp3: 'Sækja MP3',
            defaultTitle: 'TikTok Myndband',
            defaultAuthor: '@höfundur',
            statDownloads: 'Heildar Niðurhala',
            statSatisfaction: 'Ánægja',
            statSpeed: 'Ferli',
            footer: 'Þessi þjónusta er ekki tengd TikTok.',
            empty: 'Límdu fyrst TikTok hlekk!',
            fail: 'Mistókst að vinna myndband. Gakktu úr skugga um að hlekkurinn sé gildur.',
            ok: 'Myndbandi unnið með vel!',
            pasted: 'Hlekk límður inn með vel!',
            emptyClip: 'Klippispjald er tómt.',
            noClip: 'Getur ekki nálgast klippispjald.',
        },
        ca: {
            title: 'TikTok Downloader',
            subtitle: 'Descarrega videos de TikTok sense marca d aigua facil i rapid',
            status: 'Servei Actiu',
            placeholder: 'Enganxa l enllac del video de TikTok aqui, p. ex.: https://vt.tiktok.com/...',
            download: 'Descarregar',
            loading: 'S esta processant el video, si us plau espera...',
            successTitle: 'Video Processat amb Exit!',
            noWm: 'Descarregar Sense Marca d Aigua',
            mp3: 'Descarregar MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Descarregues Totals',
            statSatisfaction: 'Satisfaccio',
            statSpeed: 'Proces',
            footer: 'Aquest servei no esta afiliat a TikTok.',
            empty: 'Si us plau enganxa primer l enllac de TikTok!',
            fail: 'No s ha pogut processar el video. Assegura t que l enllac es valid.',
            ok: 'Video processat amb exit!',
            pasted: 'Enllac enganxat amb exit!',
            emptyClip: 'El porta-retalls es buit.',
            noClip: 'No es pot accedir al porta-retalls.',
        },
        af: {
            title: 'TikTok Downloader',
            subtitle: 'Laai TikTok-video s sonder watermerk maklik en vinnig af',
            status: 'Diens Aktief',
            placeholder: 'Plak die TikTok-videuskakel hier, bv.: https://vt.tiktok.com/...',
            download: 'Aflaai',
            loading: 'Video word verwerk, wag asseblief...',
            successTitle: 'Video Suksesvol Verwerk!',
            noWm: 'Aflaai Sonder Watermerk',
            mp3: 'Aflaai MP3',
            defaultTitle: 'TikTok-video',
            defaultAuthor: '@skrywer',
            statDownloads: 'Totale Aflaaie',
            statSatisfaction: 'Tevredenheid',
            statSpeed: 'Proses',
            footer: 'Hierdie diens is nie geaffilieer met TikTok nie.',
            empty: 'Plak eers die TikTok-skakel!',
            fail: 'Kon nie die video verwerk nie. Maak seker die skakel is geldig.',
            ok: 'Video suksesvol verwerk!',
            pasted: 'Skakel suksesvol geplak!',
            emptyClip: 'Knipbord is leeg.',
            noClip: 'Kan nie toegang tot knipbord kry nie.',
        },
        am: {
            title: 'TikTok Downloader',
            subtitle: 'ያልተሳየ የውሃ ምልክት ያለውን TikTok ቪዲዮ በቀላሉ እና በፍጥነት ያውርዱ',
            status: 'አገልግሎት ንቁ',
            placeholder: 'የ TikTok ቪዲዮ ማገናኛውን እዚህ ያለጥፉ፣ ለምሳሌ- https://vt.tiktok.com/...',
            download: 'አውርድ',
            loading: 'ቪዲዮ እያሰራ ነው፣ እባክዎ ይጠብቁ...',
            successTitle: 'ቪዲዮው በተሳካ ሁኔታ ተሰርቷል!',
            noWm: 'ያልተሳየ የውሃ ምልክት ያለውን ያውርዱ',
            mp3: 'MP3 ያውርዱ',
            defaultTitle: 'TikTok ቪዲዮ',
            defaultAuthor: '@ደራሲ',
            statDownloads: 'ጠቅላላ ማውረዶች',
            statSatisfaction: 'ቀነሰት',
            statSpeed: 'ሂደት',
            footer: 'ይህ አገልግሎት ከ TikTok ጋር የማይመደለ ነው።',
            empty: 'እባክዎ መጀመሪያ የ TikTok ማገናኛውን ያለጥፉ!',
            fail: 'ቪዲዮውን ማሰራት አልተሳካም። ማገናኛው ልክ እንደሆነ ያረጋግጡ።',
            ok: 'ቪዲዮው በተሳካ ሁኔታ ተሰርቷል!',
            pasted: 'ማገናኛው በተሳካ ሁኔታ ተለጥፏል!',
            emptyClip: 'ክሊፕቦርዱ ባዶ ነው።',
            noClip: 'ክሊፕቦርዱን መድረስ አይቻልም።',
        },
        ha: {
            title: 'TikTok Downloader',
            subtitle: 'Sauke bidiyoyin TikTok ba tare da alamar ruwa ba cikin sauƙi da sauri',
            status: 'Sabis Yana Aiki',
            placeholder: 'Manna hanyar bidiyo ta TikTok a nan, misali: https://vt.tiktok.com/...',
            download: 'Sauke',
            loading: 'Ana sarrafa bidiyo, don Allah jira...',
            successTitle: 'An Sarraki Bidiyo Cikin Nasara!',
            noWm: 'Sauke Ba Tare Da Alamar Ruwa Ba',
            mp3: 'Sauke MP3',
            defaultTitle: 'Bidiyo na TikTok',
            defaultAuthor: '@marubuci',
            statDownloads: 'Jimlar Saukewa',
            statSatisfaction: 'Gamsuwa',
            statSpeed: 'Tsari',
            footer: 'Wannan sabis ba shi da alaƙa da TikTok.',
            empty: 'Don Allah manna hanyar TikTok da farko!',
            fail: 'An kasa sarrafa bidiyo. Tabbatar hanyar tana da inganci.',
            ok: 'An sarraki bidiyo cikin nasara!',
            pasted: 'An manna hanyar cikin nasara!',
            emptyClip: 'Kwatancen allo babu kome.',
            noClip: 'Ba a iya isa ga kwatancen allo ba.',
        },
        yo: {
            title: 'TikTok Downloader',
            subtitle: 'Ṣe igbasilẹ awọn fidio TikTok laisi ami omi ni irọrun ati iyara',
            status: 'Iṣẹ Nṣiṣẹ',
            placeholder: 'Lẹ ami ọna fidio TikTok nibi, bẹẹni: https://vt.tiktok.com/...',
            download: 'Ṣe igbasilẹ',
            loading: 'N ṣe ilana fidio, jọwọ duro...',
            successTitle: 'A Ti Ṣe Ilana Fidio Ni Aṣeyọri!',
            noWm: 'Ṣe igbasilẹ Laisi Ami Omi',
            mp3: 'Ṣe igbasilẹ MP3',
            defaultTitle: 'Fidio TikTok',
            defaultAuthor: '@onkọwe',
            statDownloads: 'Apapọ Igbasilẹ',
            statSatisfaction: 'Itẹlọrun',
            statSpeed: 'Ilana',
            footer: 'Iṣẹ yii ko ni ibatan si TikTok.',
            empty: 'Jọwọ lẹ ami ọna TikTok ni akọkọ!',
            fail: 'Kuna lati ṣe ilana fidio. Rii daju pe ami ọna naa wulo.',
            ok: 'A ti ṣe ilana fidio ni aṣeyọri!',
            pasted: 'A ti lẹ ami ọna naa ni aṣeyọri!',
            emptyClip: 'Atilẹwa jẹ ofo.',
            noClip: 'Ko le wọle si atilẹwa.',
        },
        zu: {
            title: 'TikTok Downloader',
            subtitle: 'Landa amavidiyo e-TikTok ngaphandle kwe-watermark kalula nangesivinini',
            status: 'Isevisi Iyasebenza',
            placeholder: 'Namathisela isixhumanisi sevidiyo ye-TikTok lapha, isib.: https://vt.tiktok.com/...',
            download: 'Landa',
            loading: 'Iyacubungula ividiyo, sicela ulinde...',
            successTitle: 'Ividiyo Icubungulwe Ngempumelelo!',
            noWm: 'Landa Ngaphandle Kwe-Watermark',
            mp3: 'Landa i-MP3',
            defaultTitle: 'Ividiyo ye-TikTok',
            defaultAuthor: '@umbhali',
            statDownloads: 'Izindlela Zokulanda Zizonke',
            statSatisfaction: 'Ukweneliseka',
            statSpeed: 'Inqubo',
            footer: 'Le sevisi ayihlangene ne-TikTok.',
            empty: 'Sicela ufake isixhumanisi se-TikTok kuqala!',
            fail: 'Yehlulekile ukucubungula ividiyo. Qinisekisa ukuthi isixhumanisi sisebenza.',
            ok: 'Ividiyo icubungulwe ngempumelelo!',
            pasted: 'Isixhumanisi sinamathiselwe ngempumelelo!',
            emptyClip: 'I-clipboard igenhla.',
            noClip: 'Ayikwazi ukufinyelela i-clipboard.',
        },
        mn: {
            title: 'TikTok Downloader',
            subtitle: 'Усан тэмдэггүйгээр TikTok видеог хялбар ба хурдан татаж авна уу',
            status: 'Үйлчилгээ Идэвхтэй',
            placeholder: 'TikTok видео холбоосыг энд буулга, жишээ нь: https://vt.tiktok.com/...',
            download: 'Татах',
            loading: 'Видео боловсруулж байна, түр хүлээнэ үү...',
            successTitle: 'Видео Амжилттай Боловсрогдлоо!',
            noWm: 'Усан Тэмдэггүйгээр Татах',
            mp3: 'MP3 Татах',
            defaultTitle: 'TikTok Видео',
            defaultAuthor: '@зохиогч',
            statDownloads: 'Нийт Таталт',
            statSatisfaction: 'Сэтгэл ханамж',
            statSpeed: 'Процесс',
            footer: 'Энэхүү үйлчилгээ нь TikTok-той холбоогүй.',
            empty: 'Эхлээд TikTok холбоосыг буулгаарай!',
            fail: 'Видео боловсруулахад алдаа гарлаа. Холбоос зөв эсэхийг шалгана уу.',
            ok: 'Видео амжилттай боловсрогдлоо!',
            pasted: 'Холбоос амжилттай буулагалаа!',
            emptyClip: 'Клипборд хоосон байна.',
            noClip: 'Клипбортод хандах боломжгүй.',
        },
        kk: {
            title: 'TikTok Downloader',
            subtitle: 'Су таңбасыз TikTok бейнелерін оңай әрі жылдам жүктеп алыңыз',
            status: 'Қызмет Белсенді',
            placeholder: 'TikTok бейне сілтемесін осында қойыңыз, мыс.: https://vt.tiktok.com/...',
            download: 'Жүктеу',
            loading: 'Бейне өңделуде, күте тұрыңыз...',
            successTitle: 'Бейне Сәтті Өңделді!',
            noWm: 'Су Таңбасыз Жүктеу',
            mp3: 'MP3 Жүктеу',
            defaultTitle: 'TikTok Бейнесі',
            defaultAuthor: '@автор',
            statDownloads: 'Барлық Жүктеулер',
            statSatisfaction: 'Қанағаттану',
            statSpeed: 'Процесс',
            footer: 'Бұл қызмет TikTok-пен байланысты емес.',
            empty: 'Алдымен TikTok сілтемесін қойыңыз!',
            fail: 'Бейнені өңдеу сәтсіз аяқталды. Сілтеме жарамды екеніне көз жеткізіңіз.',
            ok: 'Бейне сәтті өңделді!',
            pasted: 'Сілтеме сәтті қойылды!',
            emptyClip: 'Алмасу буфері бос.',
            noClip: 'Алмасу буферіне қол жеткізу мүмкін емес.',
        },
        ka: {
            title: 'TikTok Downloader',
            subtitle: 'ჩატვირთეთ TikTok ვიდეოები წყლის ნიშნის გარეშე მარტივად და სწრაფად',
            status: 'სერვისი აქტიურია',
            placeholder: 'ჩასვით აქ TikTok ვიდეოს ბმული, მაგ.: https://vt.tiktok.com/...',
            download: 'ჩამოტვირთვა',
            loading: 'ვიდეოს დამუშავება, გთხოვთ მოიცადოთ...',
            successTitle: 'ვიდეო წარმატებით დამუშავდა!',
            noWm: 'ჩამოტვირთვა წყლის ნიშნის გარეშე',
            mp3: 'ჩამოტვირთვა MP3',
            defaultTitle: 'TikTok ვიდეო',
            defaultAuthor: '@ავტორი',
            statDownloads: 'სულ ჩამოტვირთვები',
            statSatisfaction: 'კმაყოფილება',
            statSpeed: 'პროცესი',
            footer: 'ეს სერვისი არ არის დაკავშირებული TikTok-თან.',
            empty: 'გთხოვთ ჯერ ჩასვათ TikTok ბმული!',
            fail: 'ვიდეოს დამუშავება ვერ მოხერხდა. დარწმუნდით, რომ ბმული სწორია.',
            ok: 'ვიდეო წარმატებით დამუშავდა!',
            pasted: 'ბმული წარმატებით ჩასმულია!',
            emptyClip: 'ბუფერი ცარიელია.',
            noClip: 'ბუფერთან წვდომა შეუძლებელია.',
        },
        hy: {
            title: 'TikTok Downloader',
            subtitle: 'Հեշտությամբ և արագ ներբեռնեք TikTok տեսանյութերը առանց ջրային նշանի',
            status: 'Ծառայությունը Ակտիվ է',
            placeholder: 'Այստեղ տեղադրեք TikTok տեսանյութի հղումը, օր.՝ https://vt.tiktok.com/...',
            download: 'Ներբեռնել',
            loading: 'Տեսանյութը մշակվում է, խնդրում ենք սպասել...',
            successTitle: 'Տեսանյութը Հաջողությամբ Մշակվեց!',
            noWm: 'Ներբեռնել Առանց Ջրային Նշանի',
            mp3: 'Ներբեռնել MP3',
            defaultTitle: 'TikTok Տեսանյութ',
            defaultAuthor: '@հեղինակ',
            statDownloads: 'Ընդհանուր Ներբեռնումներ',
            statSatisfaction: 'Գոհունակություն',
            statSpeed: 'Գործընթաց',
            footer: 'Այս ծառայությունը կապված չէ TikTok-ի հետ:',
            empty: 'Խնդրում ենք նախ տեղադրել TikTok հղումը!',
            fail: 'Տեսանյութի մշակումը ձախողվեց: Համոզվեք, որ հղումը վավեր է:',
            ok: 'Տեսանյութը հաջողությամբ մշակվեց!',
            pasted: 'Հղումը հաջողությամբ տեղադրվեց!',
            emptyClip: 'Սահմանափակումների բուֆերը դատարկ է:',
            noClip: 'Հնարավոր չէ մուտք գործել սահմանափակումների բուֆեր:',
        },
        az: {
            title: 'TikTok Downloader',
            subtitle: 'TikTok videolarını su nişanı olmadan asanlıqla və sürətlə endirin',
            status: 'Xidmət Aktivdir',
            placeholder: 'TikTok video linkini buraya yapışdırın, məs.: https://vt.tiktok.com/...',
            download: 'Endir',
            loading: 'Video emal olunur, zəhmət olmasa gözləyin...',
            successTitle: 'Video Uğurla Emal Edildi!',
            noWm: 'Su Nişanı Olmadan Endir',
            mp3: 'MP3 Endir',
            defaultTitle: 'TikTok Videosu',
            defaultAuthor: '@müəllif',
            statDownloads: 'Ümumi Endirmələr',
            statSatisfaction: 'Məmnuniyyət',
            statSpeed: 'Proses',
            footer: 'Bu xidmət TikTok ilə əlaqəli deyil.',
            empty: 'Əvvəlcə TikTok linkini yapışdırın!',
            fail: 'Video emal edilə bilmədi. Linkin etibarlı olduğuna əmin olun.',
            ok: 'Video uğurla emal edildi!',
            pasted: 'Link uğurla yapışdırıldı!',
            emptyClip: 'Mübadilə buferi boşdur.',
            noClip: 'Mübadilə buferinə giriş mümkün deyil.',
        },
        sq: {
            title: 'TikTok Downloader',
            subtitle: 'Shkarkoni videot e TikTok pa filigran me lehtësi dhe shpejt',
            status: 'Shërbimi Aktiv',
            placeholder: 'Ngjitni lidhjen e videos TikTok këtu, p.sh.: https://vt.tiktok.com/...',
            download: 'Shkarko',
            loading: 'Duke përpunuar videon, ju lutemi prisni...',
            successTitle: 'Video U Përpunua Me Sukses!',
            noWm: 'Shkarko Pa Filigran',
            mp3: 'Shkarko MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Shkarkime Totale',
            statSatisfaction: 'Kënaqësi',
            statSpeed: 'Proces',
            footer: 'Ky shërbim nuk është i lidhur me TikTok.',
            empty: 'Ju lutemi ngjitni fillimisht lidhjen e TikTok!',
            fail: 'Dështoi përpunimi i videos. Sigurohuni që lidhja është e vlefshme.',
            ok: 'Video u përpunua me sukses!',
            pasted: 'Lidhja u ngjit me sukses!',
            emptyClip: 'Bërlloku është bosh.',
            noClip: 'Nuk mund të hynte në bërllok.',
        },
        mk: {
            title: 'TikTok Downloader',
            subtitle: 'Превземете TikTok видеа без воден знак лесно и брзо',
            status: 'Услугата Активна',
            placeholder: 'Залепете ја врската до TikTok видео тука, пр.: https://vt.tiktok.com/...',
            download: 'Превземи',
            loading: 'Се обработува видеото, ве молиме почекајте...',
            successTitle: 'Видеото Е Успешно Обработено!',
            noWm: 'Превземи Без Воден Знак',
            mp3: 'Превземи MP3',
            defaultTitle: 'TikTok Видео',
            defaultAuthor: '@автор',
            statDownloads: 'Вкупно Превземања',
            statSatisfaction: 'Задоволство',
            statSpeed: 'Процес',
            footer: 'Оваа услуга не е поврзана со TikTok.',
            empty: 'Ве молиме прво залепете ја TikTok врската!',
            fail: 'Обработката на видеото не успеа. Уверете се дека врската е валидна.',
            ok: 'Видеото е успешно обработено!',
            pasted: 'Врската е успешно залепена!',
            emptyClip: 'Таблата за исечоци е празна.',
            noClip: 'Не може да се пристапи до таблата за исечоци.',
        },
        bs: {
            title: 'TikTok Downloader',
            subtitle: 'Preuzmite TikTok videozapise bez vodene oznake lako i brzo',
            status: 'Usluga Aktivna',
            placeholder: 'Zalijepite vezu do TikTok videa ovdje, npr.: https://vt.tiktok.com/...',
            download: 'Preuzmi',
            loading: 'Obrađujem video, molim sačekajte...',
            successTitle: 'Video Uspješno Obrađen!',
            noWm: 'Preuzmi Bez Vodene Oznake',
            mp3: 'Preuzmi MP3',
            defaultTitle: 'TikTok Video',
            defaultAuthor: '@autor',
            statDownloads: 'Ukupno Preuzimanja',
            statSatisfaction: 'Zadovoljstvo',
            statSpeed: 'Proces',
            footer: 'Ova usluga nije povezana s TikTokom.',
            empty: 'Prvo zalijepite TikTok vezu!',
            fail: 'Obrada videa nije uspjela. Provjerite je li veza važeća.',
            ok: 'Video je uspješno obrađen!',
            pasted: 'Veza je uspješno zalijepljena!',
            emptyClip: 'Međuspremnik je prazan.',
            noClip: 'Nije moguće pristupiti međuspremniku.',
        },
        cy: {
            title: 'TikTok Downloader',
            subtitle: 'Llwythwch fideoau TikTok heb filen dŵr yn hawdd ac yn gyflym',
            status: 'Gwasanaeth Actif',
            placeholder: 'Gludwch ddolen fideo TikTok yma, e.e.: https://vt.tiktok.com/...',
            download: 'Llwytho i Lawr',
            loading: 'Yn prosesu r fideo, arhoswch os gwelwch yn dda...',
            successTitle: 'Proseswyd y Fideo yn Llwyddiannus!',
            noWm: 'Llwytho i Lawr Heb Filen Dŵr',
            mp3: 'Llwytho i Lawr MP3',
            defaultTitle: 'Fideo TikTok',
            defaultAuthor: '@awdur',
            statDownloads: 'Cyfanswm Llwythiadau',
            statSatisfaction: 'Bodlonrwydd',
            statSpeed: 'Proses',
            footer: 'Nid yw r gwasanaeth hwn yn gysylltiedig a TikTok.',
            empty: 'Gludwch ddolen TikTok yn gyntaf os gwelwch yn dda!',
            fail: 'Methodd prosesu r fideo. Sicrhewch bod y ddolen yn ddilys.',
            ok: 'Proseswyd y fideo yn llwyddiannus!',
            pasted: 'Gludwyd y ddolen yn llwyddiannus!',
            emptyClip: 'Mae r clipfwrdd yn wag.',
            noClip: 'Methu cael mynediad at y clipfwrdd.',
        },
        ga: {
            title: 'TikTok Downloader',
            subtitle: 'Íoslódáil físeáin TikTok gan comhartha uisce go héasca agus go tapa',
            status: 'Seirbhís Gníomhach',
            placeholder: 'Greamaigh nasc físeáin TikTok anseo, m.sh.: https://vt.tiktok.com/...',
            download: 'Íoslódáil',
            loading: 'Ag próiseáil an fhíseán, fan le do thoil...',
            successTitle: 'Próiseáladh an Físeán go Rathúil!',
            noWm: 'Íoslódáil Gan Chomhartha Uisce',
            mp3: 'Íoslódáil MP3',
            defaultTitle: 'Físeán TikTok',
            defaultAuthor: '@údar',
            statDownloads: 'Iomlán Íoslódálacha',
            statSatisfaction: 'Sásamh',
            statSpeed: 'Próiseas',
            footer: 'Níl an tseirbhís seo ceangailte le TikTok.',
            empty: 'Greamaigh nasc TikTok ar dtús le do thoil!',
            fail: 'Theip ar phróiseáil an fhíseáin. Déan cinnte go bhfuil an nasc bailí.',
            ok: 'Próiseáladh an físeán go rathúil!',
            pasted: 'Greamaíodh an nasc go rathúil!',
            emptyClip: 'Tá an ghearrthaisce folamh.',
            noClip: 'Ní féidir rochtain a fháil ar an ngearrthaisce.',
        },
        eu: {
            title: 'TikTok Downloader',
            subtitle: 'Deskargatu TikTok bideoak ur-markarik gabe erraz eta azkar',
            status: 'Zerbitzua Aktibo',
            placeholder: 'Itsatsi TikTok bideoaren esteka hemen, adib.: https://vt.tiktok.com/...',
            download: 'Deskargatu',
            loading: 'Bideoa prozesatzen, itxaron mesedez...',
            successTitle: 'Bideoa Arrakastaz Prozesatu Da!',
            noWm: 'Deskargatu Ur-Markarik Gabe',
            mp3: 'Deskargatu MP3',
            defaultTitle: 'TikTok Bideoa',
            defaultAuthor: '@egilea',
            statDownloads: 'Guztira Deskargak',
            statSatisfaction: 'Asebetetze',
            statSpeed: 'Prozesua',
            footer: 'Zerbitzu hau ez dago TikTok-ekin lotuta.',
            empty: 'Itsatsi lehenik TikTok esteka!',
            fail: 'Huts egin du bideoa prozesatzean. Ziurtatu esteka baliozkoa dela.',
            ok: 'Bideoa arrakastaz prozesatu da!',
            pasted: 'Esteka arrakastaz itsatsi da!',
            emptyClip: 'Arbela hutsik dago.',
            noClip: 'Ezin da arbelatzera sartu.',
        },
        gl: {
            title: 'TikTok Downloader',
            subtitle: 'Descarga vídeos de TikTok sen marca de auga doadamente e rápido',
            status: 'Servizo Activo',
            placeholder: 'Pega a ligazón do vídeo de TikTok aquí, ex.: https://vt.tiktok.com/...',
            download: 'Descargar',
            loading: 'Procesando o vídeo, agarda por favor...',
            successTitle: 'Video Procesado con Exito!',
            noWm: 'Descargar Sen Marca de Auga',
            mp3: 'Descargar MP3',
            defaultTitle: 'Video TikTok',
            defaultAuthor: '@autor',
            statDownloads: 'Descargas Totais',
            statSatisfaction: 'Satisfaccion',
            statSpeed: 'Proceso',
            footer: 'Este servizo non está afiliado a TikTok.',
            empty: 'Por favor pega primeiro a ligazón de TikTok!',
            fail: 'Non se puido procesar o vídeo. Asegúrate de que a ligazón é válida.',
            ok: 'Video procesado con exito!',
            pasted: 'Ligazón pegada con exito!',
            emptyClip: 'O portapapeis esta baleiro.',
            noClip: 'Non se pode acceder ao portapapeis.',
        },
    };

    function applyLang(lang) {
        const t = Object.assign({}, i18n.en, i18n[lang] || {});
        if (!i18n[lang]) return;
        // Atur arah teks untuk bahasa RTL (Arab, Ibrani, Urdu, Persia)
        const rtlLangs = ['ar', 'he', 'ur', 'fa'];
        document.documentElement.setAttribute('dir', rtlLangs.includes(lang) ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
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
        // Bagian "Cara Download"
        set('#howTitle', t.howTitle);
        set('#step1Title', t.step1Title);
        set('#step1Desc', t.step1Desc);
        set('#step2Title', t.step2Title);
        set('#step2Desc', t.step2Desc);
        set('#step3Title', t.step3Title);
        set('#step3Desc', t.step3Desc);
        set('#step4Title', t.step4Title);
        set('#step4Desc', t.step4Desc);
        // Bagian FAQ
        set('#faqTitle', t.faqTitle);
        set('#faqQ1', t.faqQ1);
        set('#faqA1', t.faqA1);
        set('#faqQ2', t.faqQ2);
        set('#faqA2', t.faqA2);
        set('#faqQ3', t.faqQ3);
        set('#faqA3', t.faqA3);
        set('#faqQ4', t.faqQ4);
        set('#faqA4', t.faqA4);
        set('#faqQ5', t.faqQ5);
        set('#faqA5', t.faqA5);
        set('#faqQ6', t.faqQ6);
        set('#faqA6', t.faqA6);
        set('#faqQ7', t.faqQ7);
        set('#faqA7', t.faqA7);
        set('#faqQ8', t.faqQ8);
        set('#faqA8', t.faqA8);
        // Bagian Legal
        set('#legalTitle', t.legalTitle);
        set('#legalQ1', t.legalQ1);
        set('#legalA1', t.legalA1);
        set('#legalQ2', t.legalQ2);
        set('#legalA2', t.legalA2);
        set('#legalQ3', t.legalQ3);
        set('#legalA3', t.legalA3);
        // Navbar
        set('#navHome', t.navHome);
        set('#navHow', t.navHow);
        set('#navFaq', t.navFaq);
        const labels = document.querySelectorAll('.stat-label');
        if (labels[0]) labels[0].textContent = t.statDownloads;
        if (labels[1]) labels[1].textContent = t.statSatisfaction;
        if (labels[2]) labels[2].textContent = t.statSpeed;
        const foot = document.querySelector('footer p');
        if (foot) foot.textContent = '© Dev Allatif. ' + t.footer;
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

    // Scroll-spy: sorot menu navbar aktif sesuai bagian yang terlihat
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const sections = navLinks
        .map((l) => document.getElementById(l.dataset.target))
        .filter(Boolean);

    if (sections.length) {
        const spy = () => {
            const pos = window.scrollY + 120;
            let current = sections[0].id;
            for (const sec of sections) {
                if (sec.offsetTop <= pos) current = sec.id;
            }
            navLinks.forEach((l) => {
                l.classList.toggle('active', l.dataset.target === current);
            });
        };
        window.addEventListener('scroll', spy, { passive: true });
        window.addEventListener('resize', spy);
        spy();
    }
})();
