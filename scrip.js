// =========================================================================
// SAE ZHCET RACING - JAVASCRIPT ENGINE
// Preloader, Cockpit HUD, Web Audio, Telemetry Chart, Aero Arrows,
// Mentorship Form and Three.js 3D Exploded CAD Engine
// Requires: three.min.js (r128) + OrbitControls.js loaded BEFORE this file
// =========================================================================

// -------------------------------------------------------------------------
// 1. FAST PRELOADER DISMISSAL & REAL F1 CAR INITIALIZATION
// -------------------------------------------------------------------------
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderNum = document.getElementById('preloader-num');

let loadPct = 0;
const preloaderTimer = setInterval(() => {
    loadPct += 25;
    if (preloaderBar) preloaderBar.style.width = Math.min(100, loadPct) + '%';
    if (preloaderNum) preloaderNum.innerText = Math.min(100, loadPct) + '%';
    if (loadPct >= 100) {
        clearInterval(preloaderTimer);
        setTimeout(dismissPreloader, 150);
    }
}, 50);

function dismissPreloader() {
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.style.pointerEvents = 'none';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 400);
    }
}

// View Mode Switcher between 3D WebGL Engine and 2D Blueprint Diagram
window.switchExplodedViewMode = function(mode) {
    const canvasEl = document.getElementById('exploded-three-canvas');
    const blueprintEl = document.getElementById('blueprint-view');
    const btn3d = document.getElementById('btn-mode-3d');
    const btnBlueprint = document.getElementById('btn-mode-blueprint');

    if (mode === 'blueprint') {
        if (canvasEl) canvasEl.style.display = 'none';
        if (blueprintEl) blueprintEl.style.display = 'block';
        if (btn3d) btn3d.classList.remove('active');
        if (btnBlueprint) btnBlueprint.classList.add('active');
    } else {
        if (canvasEl) canvasEl.style.display = 'block';
        if (blueprintEl) blueprintEl.style.display = 'none';
        if (btn3d) btn3d.classList.add('active');
        if (btnBlueprint) btnBlueprint.classList.remove('active');
    }
};

// Trigger hydraulic mechanical whoosh audio when exploding/assembling
function playExplodeSound(isExploding) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Low servo noise
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        if (isExploding) {
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(380, now + 0.35);
        } else {
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
        }

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
    } catch (e) {}
}

// -------------------------------------------------------------------------
// 2. LIVE COCKPIT TELEMETRY & WEB AUDIO ENGINE
// -------------------------------------------------------------------------
let currentSpeed = 138;
let currentRpm = 11400;

function simulateCockpit() {
    if (isAudioRevving) return;
    currentSpeed = Math.floor(130 + Math.random() * 22);
    document.getElementById('speed-indicator').innerHTML = `${currentSpeed} <span>KM/H</span>`;

    currentRpm = Math.floor(10800 + Math.random() * 2400);
    document.getElementById('rpm-text').innerText = `${currentRpm.toLocaleString()} RPM`;

    const rpmPercent = Math.min(100, Math.max(10, ((currentRpm - 6000) / 7500) * 100));
    document.getElementById('rpm-bar').style.width = `${rpmPercent}%`;

    const leds = [
        document.getElementById('led-1'),
        document.getElementById('led-2'),
        document.getElementById('led-3'),
        document.getElementById('led-4'),
        document.getElementById('led-5')
    ];

    leds.forEach((led, index) => {
        if (rpmPercent > (index + 1) * 18) {
            led.style.opacity = '1';
        } else {
            led.style.opacity = '0.2';
        }
    });
}

setInterval(simulateCockpit, 400);

// Realistic Car Start (Ignition Crank) + Aggressive Engine Roar Audio Engine
let isAudioRevving = false;

function triggerEngineRev() {
    if (isAudioRevving) return;
    isAudioRevving = true;

    const btn = document.getElementById('audio-rev-btn');
    const btnLabel = document.getElementById('rev-btn-label');
    if (btn) btn.classList.add('active-rev');
    if (btnLabel) btnLabel.innerText = "CRANKING IGNITION...";

    // Web Audio Synthesis (Ignition Crank -> Fireup -> Massive Roar -> Idle)
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const now = ctx.currentTime;

            // Starter Motor Crank Clicks (0s - 0.7s)
            for (let t = 0; t < 0.7; t += 0.12) {
                const clickOsc = ctx.createOscillator();
                const clickGain = ctx.createGain();
                clickOsc.type = 'sawtooth';
                clickOsc.frequency.setValueAtTime(90 + Math.random() * 20, now + t);
                clickGain.gain.setValueAtTime(0.3, now + t);
                clickGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
                clickOsc.connect(clickGain);
                clickGain.connect(ctx.destination);
                clickOsc.start(now + t);
                clickOsc.stop(now + t + 0.09);
            }

            // Main Engine Roar Oscillators (0.7s - 3.8s)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const subBass = ctx.createOscillator();
            const mainGain = ctx.createGain();

            const dist = ctx.createWaveShaper();
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            for (let i = 0; i < n_samples; ++i) {
                const x = (i * 2) / n_samples - 1;
                curve[i] = ((Math.PI + 8) * x) / (Math.PI + 8 * Math.abs(x));
            }
            dist.curve = curve;

            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            subBass.type = 'triangle';

            // Ignition Catch at 0.7s
            const fireTime = now + 0.7;
            osc1.frequency.setValueAtTime(80, fireTime);
            osc2.frequency.setValueAtTime(85, fireTime);
            subBass.frequency.setValueAtTime(45, fireTime);

            // Sudden Roar Surge (0.7s -> 1.6s)
            osc1.frequency.exponentialRampToValueAtTime(920, fireTime + 0.9);
            osc2.frequency.exponentialRampToValueAtTime(930, fireTime + 0.9);
            subBass.frequency.exponentialRampToValueAtTime(460, fireTime + 0.9);

            // Secondary Throttle Scream (1.6s -> 2.5s)
            osc1.frequency.setValueAtTime(480, fireTime + 1.1);
            osc1.frequency.exponentialRampToValueAtTime(1250, fireTime + 1.8);
            osc2.frequency.setValueAtTime(485, fireTime + 1.1);
            osc2.frequency.exponentialRampToValueAtTime(1260, fireTime + 1.8);

            // Throttle Drop & Settling into Racing Idle (2.5s -> 3.6s)
            osc1.frequency.exponentialRampToValueAtTime(95, fireTime + 2.9);
            osc2.frequency.exponentialRampToValueAtTime(95, fireTime + 2.9);
            subBass.frequency.exponentialRampToValueAtTime(48, fireTime + 2.9);

            // Volume Envelope
            mainGain.gain.setValueAtTime(0.001, now);
            mainGain.gain.setValueAtTime(0.01, fireTime);
            mainGain.gain.linearRampToValueAtTime(0.45, fireTime + 0.2);
            mainGain.gain.setValueAtTime(0.45, fireTime + 1.8);
            mainGain.gain.exponentialRampToValueAtTime(0.001, fireTime + 3.0);

            osc1.connect(dist);
            osc2.connect(dist);
            subBass.connect(dist);
            dist.connect(mainGain);
            mainGain.connect(ctx.destination);

            osc1.start(fireTime);
            osc2.start(fireTime);
            subBass.start(fireTime);
            osc1.stop(fireTime + 3.1);
            osc2.stop(fireTime + 3.1);
            subBass.stop(fireTime + 3.1);
        }
    } catch (err) {}

    // Synchronized Visual Starter & Roar Progression on Cockpit HUD
    let step = 0;
    const animTimer = setInterval(() => {
        step += 100;
        if (step < 700) {
            if (btnLabel) btnLabel.innerText = "IGNITION CRANKING...";
            document.getElementById('gear-indicator').innerText = "N";
            document.getElementById('speed-indicator').innerHTML = `0 <span>KM/H</span>`;
            document.getElementById('rpm-text').innerText = `${Math.floor(350 + Math.random() * 200)} RPM`;
            document.getElementById('rpm-bar').style.width = `8%`;
        } else if (step < 1700) {
            if (btnLabel) btnLabel.innerText = "🔥 ENGINE FIRED! ROARING...";
            document.getElementById('gear-indicator').innerText = "1";
            document.getElementById('speed-indicator').innerHTML = `${Math.floor(45 + (step - 700) * 0.08)} <span>KM/H</span>`;
            document.getElementById('rpm-text').innerText = `${Math.floor(6000 + (step - 700) * 7.5)} RPM`;
            document.getElementById('rpm-bar').style.width = `${Math.min(100, 45 + (step - 700) * 0.055)}%`;
            for (let i = 1; i <= 5; i++) {
                const led = document.getElementById(`led-${i}`);
                if (led) led.style.opacity = '1';
            }
        } else if (step < 2900) {
            if (btnLabel) btnLabel.innerText = "⚡ V10 THROTTLE BLAST // 13,800 RPM";
            document.getElementById('gear-indicator').innerText = "2";
            document.getElementById('speed-indicator').innerHTML = `${Math.floor(120 + (step - 1700) * 0.05)} <span>KM/H</span>`;
            document.getElementById('rpm-text').innerText = `13,800 RPM`;
            document.getElementById('rpm-bar').style.width = `100%`;
        } else {
            clearInterval(animTimer);
            if (btnLabel) btnLabel.innerText = "ENGINE IDLE // READY";
            document.getElementById('gear-indicator').innerText = "N";
            document.getElementById('rpm-text').innerText = `1,100 RPM`;
            document.getElementById('rpm-bar').style.width = `12%`;
            setTimeout(() => {
                if (btn) btn.classList.remove('active-rev');
                if (btnLabel) btnLabel.innerText = "PLAY ENGINE ROAR";
                isAudioRevving = false;
            }, 1200);
        }
    }, 100);
}

// -------------------------------------------------------------------------
// 3. DYNAMIC CAN-BUS TELEMETRY CHART
// -------------------------------------------------------------------------
const chartCanvas = document.getElementById('telemetry-chart');
const chartCtx = chartCanvas.getContext('2d');
let chartPoints = [];
let currentMode = 'qualifying';

function resizeChart() {
    chartCanvas.width = chartCanvas.parentElement.clientWidth;
    chartCanvas.height = 260;
    generateChartData();
    drawTelemetryChart();
}

function generateChartData() {
    chartPoints = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
        let speed, throttle, lateralG;
        if (currentMode === 'qualifying') {
            speed = 60 + Math.sin(i * 0.15) * 50 + (i * 0.8);
            throttle = Math.min(100, Math.max(20, Math.cos(i * 0.18) * 60 + 50));
            lateralG = 1.0 + Math.sin(i * 0.22) * 0.85;
        } else if (currentMode === 'race') {
            speed = 50 + Math.sin(i * 0.12) * 38 + (i * 0.5);
            throttle = Math.min(90, Math.max(30, Math.cos(i * 0.14) * 45 + 50));
            lateralG = 0.8 + Math.sin(i * 0.18) * 0.65;
        } else {
            speed = 40 + Math.sin(i * 0.1) * 25 + (i * 0.3);
            throttle = Math.min(75, Math.max(15, Math.cos(i * 0.12) * 35 + 40));
            lateralG = 0.5 + Math.sin(i * 0.15) * 0.45;
        }
        chartPoints.push({ speed, throttle, lateralG });
    }
}

function drawTelemetryChart() {
    const w = chartCanvas.width;
    const h = chartCanvas.height;
    chartCtx.clearRect(0, 0, w, h);

    // Draw Grid Lines
    chartCtx.strokeStyle = '#1a1a26';
    chartCtx.lineWidth = 1;
    for (let y = 30; y < h; y += 40) {
        chartCtx.beginPath();
        chartCtx.moveTo(0, y);
        chartCtx.lineTo(w, y);
        chartCtx.stroke();
    }

    // Draw Speed Line (Red)
    chartCtx.strokeStyle = '#ff003c';
    chartCtx.lineWidth = 2.5;
    chartCtx.beginPath();
    chartPoints.forEach((pt, i) => {
        const x = (i / (chartPoints.length - 1)) * w;
        const y = h - (pt.speed / 160) * (h - 50) - 20;
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();

    // Draw Throttle Line (Cyan)
    chartCtx.strokeStyle = '#00f0ff';
    chartCtx.lineWidth = 1.8;
    chartCtx.beginPath();
    chartPoints.forEach((pt, i) => {
        const x = (i / (chartPoints.length - 1)) * w;
        const y = h - (pt.throttle / 100) * (h - 50) - 20;
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
    });
    chartCtx.stroke();

    // Legend
    chartCtx.font = '11px Orbitron, monospace';
    chartCtx.fillStyle = '#ff003c';
    chartCtx.fillText('━ SPEED (KM/H)', 20, 25);
    chartCtx.fillStyle = '#00f0ff';
    chartCtx.fillText('━ THROTTLE %', 140, 25);
    chartCtx.fillStyle = '#888';
    chartCtx.fillText('CIRCUIT SECTOR 1 -> SECTOR 3', w - 210, 25);
}

function setTelemetryMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(mode.substring(0, 3))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    generateChartData();
    drawTelemetryChart();
}

window.addEventListener('resize', resizeChart);
setTimeout(resizeChart, 100);

// -------------------------------------------------------------------------
// 4. AMBIENT LIVE TELEMETRY ARROWS ENGINE (Aerodynamic Chevrons & Airflow Vectors)
// -------------------------------------------------------------------------
const speedCanvas = document.getElementById('speed-canvas');
const speedCtx = speedCanvas.getContext('2d');
let sw, sh, aeroArrows = [];
let mouseX = -1000, mouseY = -1000;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
}, { passive: true });

function resizeSpeedCanvas() {
    sw = speedCanvas.width = window.innerWidth;
    sh = speedCanvas.height = window.innerHeight;
    aeroArrows = [];

    // High-density distribution across full viewport height
    const arrowCount = window.innerWidth < 768 ? 40 : 75;

    for (let i = 0; i < arrowCount; i++) {
        const layer = Math.random();
        let color, glow, speed, size, tailLen, lineWidth, type;

        // 0: Delta arrow, 1: Dual/Triple chevrons, 2: Streamline flow arrow
        const typeRand = Math.random();
        if (typeRand > 0.52) {
            type = 0;
        } else if (typeRand > 0.22) {
            type = 1;
        } else {
            type = 2;
        }

        if (layer > 0.65) {
            // F1 Crimson Telemetry
            color = 'rgba(255, 0, 60, 0.18)';
            glow = 'rgba(255, 0, 60, 0.12)';
            speed = Math.random() * 1.3 + 0.75;
            size = Math.random() * 6 + 14;
            tailLen = Math.random() * 35 + 25;
            lineWidth = Math.random() * 0.6 + 1.2;
        } else if (layer > 0.30) {
            // Cyan Aerodynamic Streamline
            color = 'rgba(0, 240, 255, 0.16)';
            glow = 'rgba(0, 240, 255, 0.10)';
            speed = Math.random() * 1.5 + 0.85;
            size = Math.random() * 6 + 13;
            tailLen = Math.random() * 35 + 25;
            lineWidth = Math.random() * 0.6 + 1.1;
        } else if (layer > 0.12) {
            // ERS Hybrid Green Vector
            color = 'rgba(0, 255, 136, 0.15)';
            glow = 'rgba(0, 255, 136, 0.09)';
            speed = Math.random() * 1.6 + 0.95;
            size = Math.random() * 5 + 13;
            tailLen = Math.random() * 30 + 20;
            lineWidth = Math.random() * 0.5 + 1.1;
        } else {
            // Stealth Titanium / White
            color = 'rgba(220, 230, 245, 0.14)';
            glow = 'rgba(200, 215, 235, 0.08)';
            speed = Math.random() * 1.8 + 1.0;
            size = Math.random() * 5 + 12;
            tailLen = Math.random() * 40 + 25;
            lineWidth = Math.random() * 0.6 + 1.1;
        }

        const bandHeight = sh / arrowCount;
        const baseY = (i * bandHeight) + (Math.random() * bandHeight * 0.85);

        aeroArrows.push({
            x: Math.random() * (sw + 200) - 100,
            baseY: baseY,
            bandIndex: i,
            y: baseY,
            size: size,
            tailLen: tailLen,
            speed: speed,
            lineWidth: lineWidth,
            color: color,
            glow: glow,
            type: type,
            chevronCount: Math.random() > 0.4 ? 2 : 3,
            waveFreq: Math.random() * 0.0016 + 0.0008,
            waveAmp: Math.random() * 10 + 4,
            phase: Math.random() * Math.PI * 2
        });
    }
}

window.addEventListener('resize', resizeSpeedCanvas);
resizeSpeedCanvas();

function drawAeroArrows(now) {
    speedCtx.clearRect(0, 0, sw, sh);
    const time = now || performance.now();

    for (let i = 0; i < aeroArrows.length; i++) {
        const a = aeroArrows[i];

        // Smooth sinusoidal wave glide
        const waveOffset = Math.sin(time * a.waveFreq + a.phase) * a.waveAmp;
        a.y = a.baseY + waveOffset;

        // Pitch angle based on wave trajectory
        const waveSlope = Math.cos(time * a.waveFreq + a.phase) * (a.waveAmp * a.waveFreq * 16);
        const angle = Math.atan2(waveSlope, a.speed);

        // Subtle mouse breeze interaction
        let boost = 0;
        const dx = a.x - mouseX;
        const dy = a.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
            boost = (1 - dist / 140) * 1.5;
        }

        speedCtx.save();
        speedCtx.translate(a.x, a.y);
        speedCtx.rotate(angle);

        // 1. Streamline Trail
        if (a.tailLen > 0) {
            const grad = speedCtx.createLinearGradient(0, 0, -a.tailLen, 0);
            grad.addColorStop(0, a.color);
            grad.addColorStop(0.35, a.glow);
            grad.addColorStop(1, 'transparent');

            speedCtx.strokeStyle = grad;
            speedCtx.lineWidth = a.lineWidth;
            speedCtx.beginPath();
            speedCtx.moveTo(0, 0);
            speedCtx.lineTo(-a.tailLen, 0);
            speedCtx.stroke();
        }

        speedCtx.shadowBlur = 4;
        speedCtx.shadowColor = a.glow;

        // 2. Arrowhead
        if (a.type === 0) {
            // Delta Supersonic Arrow
            speedCtx.fillStyle = a.color;
            speedCtx.beginPath();
            speedCtx.moveTo(a.size * 0.7, 0);
            speedCtx.lineTo(-a.size * 0.7, -a.size * 0.55);
            speedCtx.lineTo(-a.size * 0.35, 0);
            speedCtx.lineTo(-a.size * 0.7, a.size * 0.55);
            speedCtx.closePath();
            speedCtx.fill();

            speedCtx.strokeStyle = a.color;
            speedCtx.lineWidth = 1.0;
            speedCtx.stroke();

        } else if (a.type === 1) {
            // Dual/Triple Racing Chevrons
            speedCtx.strokeStyle = a.color;
            speedCtx.lineWidth = Math.max(1.6, a.lineWidth * 1.4);
            speedCtx.lineCap = 'round';
            speedCtx.lineJoin = 'miter';

            const count = a.chevronCount || 2;
            for (let c = 0; c < count; c++) {
                const cx = -c * (a.size * 0.55);
                speedCtx.beginPath();
                speedCtx.moveTo(cx - a.size * 0.6, -a.size * 0.55);
                speedCtx.lineTo(cx, 0);
                speedCtx.lineTo(cx - a.size * 0.6, a.size * 0.55);
                speedCtx.stroke();
            }

        } else {
            // Wind-Tunnel Streamline Vector
            speedCtx.fillStyle = a.color;
            speedCtx.beginPath();
            speedCtx.moveTo(a.size * 0.75, 0);
            speedCtx.lineTo(-a.size * 0.5, -a.size * 0.45);
            speedCtx.lineTo(-a.size * 0.5, a.size * 0.45);
            speedCtx.closePath();
            speedCtx.fill();

            speedCtx.fillStyle = '#fff';
            speedCtx.globalAlpha = 0.5;
            speedCtx.beginPath();
            speedCtx.arc(a.size * 0.75, 0, 1.4, 0, Math.PI * 2);
            speedCtx.fill();
            speedCtx.globalAlpha = 1.0;
        }

        speedCtx.restore();

        // Advance arrow across screen
        a.x += a.speed + boost;

        // Loop back to left edge
        if (a.x > sw + a.tailLen + 60) {
            a.x = -a.tailLen - 40;
            const bandHeight = sh / aeroArrows.length;
            a.baseY = (a.bandIndex * bandHeight) + (Math.random() * bandHeight * 0.85);
            a.phase = Math.random() * Math.PI * 2;
        }
    }

    requestAnimationFrame(drawAeroArrows);
}
requestAnimationFrame(drawAeroArrows);

// -------------------------------------------------------------------------
// 5. MENTORSHIP FORM SUBMISSION HANDLER
// -------------------------------------------------------------------------
function submitMentorshipForm(e) {
    e.preventDefault();
    const name = document.getElementById('applicant-name').value;
    const email = document.getElementById('applicant-email').value;
    const phone = document.getElementById('applicant-phone').value;
    const dept = document.getElementById('applicant-dept').value;
    const domain = document.getElementById('applicant-domain').value;
    const message = document.getElementById('applicant-message').value;

    const submitBtn = document.getElementById('form-submit-btn');

    submitBtn.innerHTML = '<span>⚡ TRANSMITTING TO PIT WALL...</span>';
    submitBtn.style.opacity = '0.75';
    submitBtn.style.pointerEvents = 'none';

    setTimeout(() => {
        document.getElementById('mentorship-form').style.display = 'none';
        const banner = document.getElementById('form-success-banner');
        document.getElementById('success-name').innerText = name;
        document.getElementById('success-email').innerText = email;
        banner.style.display = 'block';

        triggerEngineRev();
        // TODO: connect to a real backend (Google Forms / Formspree / EmailJS / own API)
        console.log("Mentorship Application Logged:", { name, email, phone, dept, domain, message });
    }, 900);
}

// =========================================================================
// 6. REAL-TIME 3D CAD EXPLODED & DISASSEMBLY ENGINE (THREE.JS)
// =========================================================================
(function initThreeExplodedEngine() {
    const container = document.getElementById('exploded-experience');
    const canvas = document.getElementById('exploded-three-canvas');
    if (!container || !canvas || typeof THREE === 'undefined') return;

    // --- 1. Scene, Camera & Renderer Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040408, 0.025);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(11, 5.5, 12);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // --- 2. Orbit Controls ---
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 28;
        controls.minDistance = 4.5;
        controls.maxPolarAngle = Math.PI / 2 + 0.15;
        controls.target.set(0, 0, 0);
    }

    // --- 3. Studio & Neon Cyber Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(8, 15, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.8);
    fillLight.position.set(-10, 8, -8);
    scene.add(fillLight);

    // Neon F1 Red Rim Light
    const redRimLight = new THREE.DirectionalLight(0xff003c, 3.2);
    redRimLight.position.set(-12, 4, 8);
    scene.add(redRimLight);

    // Telemetry Cyan Rim Light
    const cyanRimLight = new THREE.DirectionalLight(0x00f0ff, 2.8);
    cyanRimLight.position.set(12, 4, -8);
    scene.add(cyanRimLight);

    // Underbody Ground Glow
    const groundCyanLight = new THREE.PointLight(0x00f0ff, 2.5, 14);
    groundCyanLight.position.set(0, -1.2, 0);
    scene.add(groundCyanLight);

    // Turbo Core Heat Light
    const engineHeatLight = new THREE.PointLight(0xff2200, 3.5, 9);
    engineHeatLight.position.set(0, 1.2, -1.2);
    scene.add(engineHeatLight);

    // --- 4. Cyber Studio Grid Floor ---
    const gridHelper = new THREE.GridHelper(36, 36, 0x00f0ff, 0x161626);
    gridHelper.position.y = -1.8;
    gridHelper.material.opacity = 0.45;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Radial Floor Rings
    const ringGeo = new THREE.RingGeometry(5, 5.08, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -1.79;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(9, 9.1, 64), ringMat);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -1.79;
    scene.add(ring2);

    // Shadow Floor Plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(36, 36);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.55 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.795;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // --- 5. High-Fidelity Materials ---
    const mats = {
        carbonGloss: new THREE.MeshPhysicalMaterial({
            color: 0x111116,
            roughness: 0.25,
            metalness: 0.3,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        }),
        racingRed: new THREE.MeshPhysicalMaterial({
            color: 0xff003c,
            roughness: 0.2,
            metalness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
        }),
        matteGraphite: new THREE.MeshStandardMaterial({
            color: 0x1e1e24,
            roughness: 0.65,
            metalness: 0.25
        }),
        titanium: new THREE.MeshStandardMaterial({
            color: 0xdddded,
            roughness: 0.22,
            metalness: 0.92
        }),
        goldShield: new THREE.MeshStandardMaterial({
            color: 0xffb700,
            roughness: 0.28,
            metalness: 0.9
        }),
        neonCyan: new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 1.6,
            roughness: 0.2
        }),
        neonRed: new THREE.MeshStandardMaterial({
            color: 0xff003c,
            emissive: 0xff003c,
            emissiveIntensity: 1.8,
            roughness: 0.2
        }),
        rubberTyre: new THREE.MeshStandardMaterial({
            color: 0x141416,
            roughness: 0.85,
            metalness: 0.05
        }),
        satinRim: new THREE.MeshStandardMaterial({
            color: 0x0c0c10,
            roughness: 0.3,
            metalness: 0.75
        }),
        brakeDisc: new THREE.MeshStandardMaterial({
            color: 0x383840,
            roughness: 0.38,
            metalness: 0.65
        }),
        caliperRed: new THREE.MeshStandardMaterial({
            color: 0xff003c,
            roughness: 0.3,
            metalness: 0.4
        }),
        wireframeMat: new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true
        })
    };

    // Master Car Group
    const carRootGroup = new THREE.Group();
    scene.add(carRootGroup);

    // Laser Guidelines Group
    const laserLinesGroup = new THREE.Group();
    scene.add(laserLinesGroup);

    // --- 6. Procedural 3D Sub-Assemblies Generation ---
    const explodedParts = [];

    function registerPart(name, group, explodedPos, explodedRot, annotationPos, labelKey) {
        carRootGroup.add(group);

        // Base transform
        const basePos = group.position.clone();
        const baseRot = group.rotation.clone();

        // Laser guideline
        const laserGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        const laserMat = new THREE.LineDashedMaterial({
            color: 0x00f0ff,
            dashSize: 0.25,
            gapSize: 0.15,
            transparent: true,
            opacity: 0.0,
            linewidth: 1
        });
        const laserLine = new THREE.Line(laserGeo, laserMat);
        laserLinesGroup.add(laserLine);

        explodedParts.push({
            name: name,
            group: group,
            basePos: basePos,
            explodedPos: explodedPos,
            baseRot: baseRot,
            explodedRot: explodedRot,
            annotationPos: annotationPos,
            labelKey: labelKey,
            laserLine: laserLine
        });
    }

    // -----------------------------------------------------------------
    // PART 1: FRONT AERO WING & NEEDLE NOSECONE
    // -----------------------------------------------------------------
    const frontWingGroup = new THREE.Group();
    {
        const noseGeo = new THREE.CylinderGeometry(0.12, 0.58, 3.6, 32);
        noseGeo.rotateX(Math.PI / 2);
        noseGeo.scale(0.85, 0.45, 1);
        const noseMesh = new THREE.Mesh(noseGeo, mats.racingRed);
        noseMesh.position.set(0, 0.16, 2.7);
        noseMesh.castShadow = true;
        frontWingGroup.add(noseMesh);

        const tipGeo = new THREE.SphereGeometry(0.13, 24, 16);
        tipGeo.scale(0.8, 0.5, 1.4);
        const tipMesh = new THREE.Mesh(tipGeo, mats.carbonGloss);
        tipMesh.position.set(0, 0.15, 4.5);
        frontWingGroup.add(tipMesh);

        const spineGeo = new THREE.BoxGeometry(0.18, 0.06, 3.2);
        const spineMesh = new THREE.Mesh(spineGeo, mats.carbonGloss);
        spineMesh.position.set(0, 0.32, 2.7);
        frontWingGroup.add(spineMesh);

        // Dual Camera Pods
        [-0.32, 0.32].forEach(x => {
            const podGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12);
            podGeo.rotateX(Math.PI / 2);
            const podMesh = new THREE.Mesh(podGeo, mats.carbonGloss);
            podMesh.position.set(x, 0.32, 3.2);
            frontWingGroup.add(podMesh);

            const stalkGeo = new THREE.BoxGeometry(0.12, 0.02, 0.05);
            const stalkMesh = new THREE.Mesh(stalkGeo, mats.carbonGloss);
            stalkMesh.position.set(x * 0.7, 0.3, 3.2);
            frontWingGroup.add(stalkMesh);
        });

        // Mainplane
        const wing1Geo = new THREE.BoxGeometry(4.4, 0.035, 0.6);
        const wing1Mesh = new THREE.Mesh(wing1Geo, mats.carbonGloss);
        wing1Mesh.position.set(0, -0.20, 3.9);
        wing1Mesh.castShadow = true;
        frontWingGroup.add(wing1Mesh);

        // Flap 2
        const wing2Geo = new THREE.BoxGeometry(4.2, 0.03, 0.42);
        const wing2Mesh = new THREE.Mesh(wing2Geo, mats.racingRed);
        wing2Mesh.position.set(0, -0.08, 3.78);
        wing2Mesh.rotation.x = -0.16;
        frontWingGroup.add(wing2Mesh);

        // Flap 3
        const wing3Geo = new THREE.BoxGeometry(3.9, 0.025, 0.32);
        const wing3Mesh = new THREE.Mesh(wing3Geo, mats.carbonGloss);
        wing3Mesh.position.set(0, 0.04, 3.65);
        wing3Mesh.rotation.x = -0.24;
        frontWingGroup.add(wing3Mesh);

        // Endplates
        [-2.2, 2.2].forEach(x => {
            const epGeo = new THREE.BoxGeometry(0.04, 0.65, 1.15);
            const epMesh = new THREE.Mesh(epGeo, mats.racingRed);
            epMesh.position.set(x, 0.02, 3.85);
            epMesh.rotation.y = (x > 0 ? -0.06 : 0.06);
            frontWingGroup.add(epMesh);

            const footGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 12);
            footGeo.rotateX(Math.PI / 2);
            const footMesh = new THREE.Mesh(footGeo, mats.carbonGloss);
            footMesh.position.set(x + (x > 0 ? 0.05 : -0.05), -0.22, 3.85);
            frontWingGroup.add(footMesh);

            const diveGeo = new THREE.BoxGeometry(0.28, 0.025, 0.35);
            const diveMesh = new THREE.Mesh(diveGeo, mats.carbonGloss);
            diveMesh.position.set(x + (x > 0 ? -0.12 : 0.12), 0.18, 3.75);
            diveMesh.rotation.z = (x > 0 ? 0.18 : -0.18);
            frontWingGroup.add(diveMesh);
        });
    }
    registerPart('frontWing', frontWingGroup,
        new THREE.Vector3(0, 0.6, 5.2),
        new THREE.Euler(-0.18, 0, 0),
        new THREE.Vector3(0, 0.6, 5.2),
        'frontWing'
    );

    // -----------------------------------------------------------------
    // PART 2: TITANIUM HALO & COCKPIT
    // -----------------------------------------------------------------
    const haloGroup = new THREE.Group();
    {
        const haloTorusGeo = new THREE.TorusGeometry(0.58, 0.065, 24, 48, Math.PI * 0.95);
        const haloArch = new THREE.Mesh(haloTorusGeo, mats.titanium);
        haloArch.rotation.x = Math.PI / 2 + 0.08;
        haloArch.rotation.z = Math.PI;
        haloArch.position.set(0, 0.98, 0.12);
        haloArch.castShadow = true;
        haloGroup.add(haloArch);

        const pillarGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.72, 16);
        const pillar = new THREE.Mesh(pillarGeo, mats.titanium);
        pillar.position.set(0, 0.66, 0.68);
        pillar.rotation.x = 0.48;
        haloGroup.add(pillar);

        [-0.52, 0.52].forEach(x => {
            const mountGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.45, 12);
            const mount = new THREE.Mesh(mountGeo, mats.titanium);
            mount.position.set(x, 0.78, -0.32);
            mount.rotation.x = -0.35;
            haloGroup.add(mount);
        });

        const screenGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.15, 24, 1, true, -Math.PI * 0.4, Math.PI * 0.8);
        const screenMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.45, roughness: 0.1 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.rotation.x = 0.5;
        screen.position.set(0, 0.55, 0.75);
        haloGroup.add(screen);

        // Steering Wheel
        const steerGroup = new THREE.Group();
        const wheelBodyGeo = new THREE.BoxGeometry(0.38, 0.22, 0.06);
        const wheelBody = new THREE.Mesh(wheelBodyGeo, mats.carbonGloss);
        steerGroup.add(wheelBody);

        [-0.18, 0.18].forEach(x => {
            const gripGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.25, 12);
            const grip = new THREE.Mesh(gripGeo, mats.rubberTyre);
            grip.position.set(x, 0, 0);
            steerGroup.add(grip);
        });

        const oledGeo = new THREE.PlaneGeometry(0.18, 0.09);
        const oledMesh = new THREE.Mesh(oledGeo, mats.neonCyan);
        oledMesh.position.set(0, 0.02, 0.035);
        steerGroup.add(oledMesh);

        const revLedGeo = new THREE.BoxGeometry(0.24, 0.02, 0.02);
        const revLedMesh = new THREE.Mesh(revLedGeo, mats.neonRed);
        revLedMesh.position.set(0, 0.08, 0.035);
        steerGroup.add(revLedMesh);

        steerGroup.position.set(0, 0.56, 0.62);
        steerGroup.rotation.x = -0.38;
        haloGroup.add(steerGroup);

        const headrestGeo = new THREE.BoxGeometry(0.52, 0.38, 0.5);
        const headrest = new THREE.Mesh(headrestGeo, mats.matteGraphite);
        headrest.position.set(0, 0.68, -0.32);
        haloGroup.add(headrest);
    }
    registerPart('halo', haloGroup,
        new THREE.Vector3(0, 3.4, 0.3),
        new THREE.Euler(0.14, 0, 0),
        new THREE.Vector3(0, 3.4, 0.3),
        'halo'
    );

    // -----------------------------------------------------------------
    // PART 3: MONOCOQUE & CHASSIS CORE (ANCHOR)
    // -----------------------------------------------------------------
    const chassisGroup = new THREE.Group();
    {
        const tubFrontGeo = new THREE.CylinderGeometry(0.48, 0.62, 2.2, 24);
        tubFrontGeo.rotateX(Math.PI / 2);
        tubFrontGeo.scale(1.15, 0.72, 1);
        const tubFront = new THREE.Mesh(tubFrontGeo, mats.carbonGloss);
        tubFront.position.set(0, 0.22, 1.2);
        tubFront.castShadow = true;
        chassisGroup.add(tubFront);

        const tubRearGeo = new THREE.CylinderGeometry(0.55, 0.42, 2.2, 24);
        tubRearGeo.rotateX(Math.PI / 2);
        tubRearGeo.scale(1.1, 0.78, 1);
        const tubRear = new THREE.Mesh(tubRearGeo, mats.racingRed);
        tubRear.position.set(0, 0.28, -0.9);
        tubRear.castShadow = true;
        chassisGroup.add(tubRear);

        const airboxGeo = new THREE.CylinderGeometry(0.24, 0.32, 1.6, 20);
        airboxGeo.rotateX(Math.PI / 2);
        airboxGeo.scale(0.85, 1.35, 1);
        const airboxMesh = new THREE.Mesh(airboxGeo, mats.racingRed);
        airboxMesh.position.set(0, 0.95, -0.55);
        airboxMesh.castShadow = true;
        chassisGroup.add(airboxMesh);

        const holeGeo = new THREE.TorusGeometry(0.18, 0.04, 12, 24, Math.PI * 1.5);
        const holeMesh = new THREE.Mesh(holeGeo, mats.carbonGloss);
        holeMesh.position.set(0, 1.06, 0.15);
        chassisGroup.add(holeMesh);

        const finGeo = new THREE.BoxGeometry(0.035, 0.75, 2.2);
        const finMesh = new THREE.Mesh(finGeo, mats.carbonGloss);
        finMesh.position.set(0, 1.20, -1.6);
        chassisGroup.add(finMesh);

        const rimGeo = new THREE.TorusGeometry(0.42, 0.05, 16, 32, Math.PI);
        const rimMesh = new THREE.Mesh(rimGeo, mats.racingRed);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.set(0, 0.52, 0.25);
        chassisGroup.add(rimMesh);
    }
    registerPart('chassis', chassisGroup,
        new THREE.Vector3(0, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Vector3(0, 0.5, 0),
        'chassis'
    );

    // -----------------------------------------------------------------
    // PART 4: LEFT SIDEPOD & RADIATOR COOLING MATRIX
    // -----------------------------------------------------------------
    const leftSidepodGroup = new THREE.Group();
    {
        const podGeo = new THREE.CylinderGeometry(0.48, 0.38, 2.6, 24);
        podGeo.rotateX(Math.PI / 2);
        podGeo.scale(0.85, 0.75, 1);
        const podMesh = new THREE.Mesh(podGeo, mats.racingRed);
        podMesh.position.set(-1.08, 0.24, -0.2);
        podMesh.rotation.y = 0.08;
        podMesh.castShadow = true;
        leftSidepodGroup.add(podMesh);

        const underGeo = new THREE.BoxGeometry(0.75, 0.12, 2.6);
        const underMesh = new THREE.Mesh(underGeo, mats.carbonGloss);
        underMesh.position.set(-1.08, -0.12, -0.2);
        leftSidepodGroup.add(underMesh);

        const mouthGeo = new THREE.BoxGeometry(0.65, 0.42, 0.15);
        const mouthMesh = new THREE.Mesh(mouthGeo, mats.carbonGloss);
        mouthMesh.position.set(-1.05, 0.28, 1.05);
        leftSidepodGroup.add(mouthMesh);

        const matrixGeo = new THREE.BoxGeometry(0.58, 0.36, 0.08);
        const matrixMesh = new THREE.Mesh(matrixGeo, mats.neonCyan);
        matrixMesh.position.set(-1.05, 0.28, 0.95);
        leftSidepodGroup.add(matrixMesh);

        const bbGeo = new THREE.BoxGeometry(0.04, 0.55, 0.95);
        const bbMesh = new THREE.Mesh(bbGeo, mats.carbonGloss);
        bbMesh.position.set(-1.55, 0.16, 1.15);
        bbMesh.rotation.y = -0.28;
        leftSidepodGroup.add(bbMesh);
    }
    registerPart('leftSidepod', leftSidepodGroup,
        new THREE.Vector3(-3.8, 0.5, 0.2),
        new THREE.Euler(0, -0.25, -0.12),
        new THREE.Vector3(-3.8, 0.5, 0.2),
        'sidepod'
    );

    // -----------------------------------------------------------------
    // PART 5: RIGHT SIDEPOD & ECU HYBRID TELEMETRY
    // -----------------------------------------------------------------
    const rightSidepodGroup = new THREE.Group();
    {
        const podGeo = new THREE.CylinderGeometry(0.48, 0.38, 2.6, 24);
        podGeo.rotateX(Math.PI / 2);
        podGeo.scale(0.85, 0.75, 1);
        const podMesh = new THREE.Mesh(podGeo, mats.racingRed);
        podMesh.position.set(1.08, 0.24, -0.2);
        podMesh.rotation.y = -0.08;
        podMesh.castShadow = true;
        rightSidepodGroup.add(podMesh);

        const underGeo = new THREE.BoxGeometry(0.75, 0.12, 2.6);
        const underMesh = new THREE.Mesh(underGeo, mats.carbonGloss);
        underMesh.position.set(1.08, -0.12, -0.2);
        rightSidepodGroup.add(underMesh);

        const mouthGeo = new THREE.BoxGeometry(0.65, 0.42, 0.15);
        const mouthMesh = new THREE.Mesh(mouthGeo, mats.carbonGloss);
        mouthMesh.position.set(1.05, 0.28, 1.05);
        rightSidepodGroup.add(mouthMesh);

        const ecuGeo = new THREE.BoxGeometry(0.55, 0.35, 0.35);
        const ecuMesh = new THREE.Mesh(ecuGeo, mats.goldShield);
        ecuMesh.position.set(1.05, 0.28, 0.75);
        rightSidepodGroup.add(ecuMesh);

        const ledStripGeo = new THREE.BoxGeometry(0.45, 0.04, 0.04);
        const ledStrip = new THREE.Mesh(ledStripGeo, mats.neonCyan);
        ledStrip.position.set(1.05, 0.46, 0.75);
        rightSidepodGroup.add(ledStrip);

        const bbGeo = new THREE.BoxGeometry(0.04, 0.55, 0.95);
        const bbMesh = new THREE.Mesh(bbGeo, mats.carbonGloss);
        bbMesh.position.set(1.55, 0.16, 1.15);
        bbMesh.rotation.y = 0.28;
        rightSidepodGroup.add(bbMesh);
    }
    registerPart('rightSidepod', rightSidepodGroup,
        new THREE.Vector3(3.8, 0.5, 0.2),
        new THREE.Euler(0, 0.25, 0.12),
        new THREE.Vector3(3.8, 0.5, 0.2),
        'sidepod'
    );

    // -----------------------------------------------------------------
    // PART 6: V6 TURBOCHARGED ENGINE & EXHAUST HEADERS
    // -----------------------------------------------------------------
    const engineGroup = new THREE.Group();
    {
        const blockGeo = new THREE.BoxGeometry(0.85, 0.68, 1.35);
        const blockMesh = new THREE.Mesh(blockGeo, mats.titanium);
        blockMesh.position.set(0, 0.28, -1.4);
        blockMesh.castShadow = true;
        engineGroup.add(blockMesh);

        [-0.22, 0.22].forEach(x => {
            [-1.12, -1.38, -1.64].forEach(z => {
                const trumpGeo = new THREE.CylinderGeometry(0.065, 0.04, 0.24, 16);
                const trumpMesh = new THREE.Mesh(trumpGeo, mats.goldShield);
                trumpMesh.position.set(x, 0.72, z);
                engineGroup.add(trumpMesh);
            });
        });

        [-0.46, 0.46].forEach(x => {
            const exGeo = new THREE.TorusGeometry(0.35, 0.075, 14, 28, Math.PI * 0.92);
            const exMesh = new THREE.Mesh(exGeo, mats.neonRed);
            exMesh.rotation.y = Math.PI / 2;
            exMesh.rotation.z = (x > 0 ? 0.35 : -0.35);
            exMesh.position.set(x, 0.38, -1.42);
            engineGroup.add(exMesh);
        });

        const turboGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 20);
        turboGeo.rotateZ(Math.PI / 2);
        const turboMesh = new THREE.Mesh(turboGeo, mats.titanium);
        turboMesh.position.set(0, 0.52, -2.15);
        engineGroup.add(turboMesh);

        const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.65, 16);
        pipeGeo.rotateX(Math.PI / 2);
        const pipeMesh = new THREE.Mesh(pipeGeo, mats.titanium);
        pipeMesh.position.set(0, 0.48, -2.5);
        engineGroup.add(pipeMesh);

        const gboxGeo = new THREE.BoxGeometry(0.62, 0.48, 0.92);
        const gboxMesh = new THREE.Mesh(gboxGeo, mats.matteGraphite);
        gboxMesh.position.set(0, 0.15, -2.45);
        engineGroup.add(gboxMesh);
    }
    registerPart('engine', engineGroup,
        new THREE.Vector3(0, 2.7, -2.4),
        new THREE.Euler(0.25, 0, 0),
        new THREE.Vector3(0, 2.7, -2.4),
        'engine'
    );

    // -----------------------------------------------------------------
    // PART 7: REAR WING, ACTIVE DRS & CRASH STRUCTURE
    // -----------------------------------------------------------------
    const rearWingGroup = new THREE.Group();
    {
        const mainGeo = new THREE.BoxGeometry(3.6, 0.06, 0.65);
        const mainMesh = new THREE.Mesh(mainGeo, mats.carbonGloss);
        mainMesh.position.set(0, 1.28, -3.2);
        mainMesh.rotation.x = 0.16;
        mainMesh.castShadow = true;
        rearWingGroup.add(mainMesh);

        const drsGeo = new THREE.BoxGeometry(3.45, 0.05, 0.42);
        const drsMesh = new THREE.Mesh(drsGeo, mats.racingRed);
        drsMesh.position.set(0, 1.52, -3.32);
        drsMesh.rotation.x = 0.34;
        rearWingGroup.add(drsMesh);

        const actGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.32, 12);
        const actMesh = new THREE.Mesh(actGeo, mats.carbonGloss);
        actMesh.position.set(0, 1.42, -3.22);
        rearWingGroup.add(actMesh);

        [-0.48, 0.48].forEach(x => {
            const pylonGeo = new THREE.BoxGeometry(0.05, 1.25, 0.28);
            const pylonMesh = new THREE.Mesh(pylonGeo, mats.carbonGloss);
            pylonMesh.position.set(x, 0.82, -3.05);
            pylonMesh.rotation.x = -0.22;
            rearWingGroup.add(pylonMesh);
        });

        [-1.85, 1.85].forEach(x => {
            const epGeo = new THREE.BoxGeometry(0.05, 0.95, 1.15);
            const epMesh = new THREE.Mesh(epGeo, mats.racingRed);
            epMesh.position.set(x, 1.38, -3.25);
            rearWingGroup.add(epMesh);

            const gurneyGeo = new THREE.BoxGeometry(0.03, 0.9, 0.05);
            const gurneyMesh = new THREE.Mesh(gurneyGeo, mats.carbonGloss);
            gurneyMesh.position.set(x, 1.38, -3.8);
            rearWingGroup.add(gurneyMesh);
        });

        const fiaLightGeo = new THREE.BoxGeometry(0.24, 0.14, 0.08);
        const fiaLightMesh = new THREE.Mesh(fiaLightGeo, mats.neonRed);
        fiaLightMesh.position.set(0, 0.16, -3.22);
        rearWingGroup.add(fiaLightMesh);
    }
    registerPart('rearWing', rearWingGroup,
        new THREE.Vector3(0, 2.9, -5.5),
        new THREE.Euler(0.2, 0, 0),
        new THREE.Vector3(0, 2.9, -5.5),
        'rearWing'
    );

    // -----------------------------------------------------------------
    // PART 8: VENTURI FLOOR & REAR DIFFUSER
    // -----------------------------------------------------------------
    const floorGroup = new THREE.Group();
    {
        const floorGeo = new THREE.BoxGeometry(2.9, 0.05, 4.9);
        const floorMesh = new THREE.Mesh(floorGeo, mats.carbonGloss);
        floorMesh.position.set(0, -0.22, 0);
        floorMesh.castShadow = true;
        floorGroup.add(floorMesh);

        const plankGeo = new THREE.BoxGeometry(0.68, 0.028, 3.9);
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x966036, roughness: 0.82 });
        const plankMesh = new THREE.Mesh(plankGeo, plankMat);
        plankMesh.position.set(0, -0.255, 0);
        floorGroup.add(plankMesh);

        const diffGeo = new THREE.BoxGeometry(2.5, 0.48, 1.25);
        const diffMesh = new THREE.Mesh(diffGeo, mats.carbonGloss);
        diffMesh.position.set(0, 0.06, -2.65);
        diffMesh.rotation.x = -0.32;
        floorGroup.add(diffMesh);

        [-0.85, -0.28, 0.28, 0.85].forEach(x => {
            const strakeGeo = new THREE.BoxGeometry(0.035, 0.42, 1.15);
            const strakeMesh = new THREE.Mesh(strakeGeo, mats.neonCyan);
            strakeMesh.position.set(x, 0.06, -2.65);
            strakeMesh.rotation.x = -0.32;
            floorGroup.add(strakeMesh);
        });
    }
    registerPart('floor', floorGroup,
        new THREE.Vector3(0, -2.6, 0),
        new THREE.Euler(-0.06, 0, 0),
        new THREE.Vector3(0, -2.6, 0),
        'floor'
    );

    // -----------------------------------------------------------------
    // PART 9-12: WHEELS, BRAKES & WISHBONES
    // -----------------------------------------------------------------
    function buildRealisticWheelUnit(isFront, isLeft) {
        const wheelUnit = new THREE.Group();
        const signX = isLeft ? -1 : 1;
        const radius = isFront ? 0.74 : 0.82;
        const width = isFront ? 0.68 : 0.88;

        // Slick Tyre
        const tyreCenterGeo = new THREE.CylinderGeometry(radius, radius, width * 0.75, 32);
        tyreCenterGeo.rotateZ(Math.PI / 2);
        const tyreCenter = new THREE.Mesh(tyreCenterGeo, mats.rubberTyre);
        tyreCenter.castShadow = true;
        wheelUnit.add(tyreCenter);

        // Rounded Shoulder
        const shoulderGeo = new THREE.TorusGeometry(radius * 0.88, radius * 0.12, 16, 32);
        shoulderGeo.rotateY(Math.PI / 2);
        const shoulder1 = new THREE.Mesh(shoulderGeo, mats.rubberTyre);
        shoulder1.position.x = (width * 0.38) * signX;
        wheelUnit.add(shoulder1);

        // Yellow Sidewall Ring
        const stripeRingGeo = new THREE.RingGeometry(radius * 0.62, radius * 0.70, 32);
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
        const stripeMesh = new THREE.Mesh(stripeRingGeo, stripeMat);
        stripeMesh.rotation.y = Math.PI / 2;
        stripeMesh.position.x = (width / 2 + 0.008) * signX;
        wheelUnit.add(stripeMesh);

        // Alloy Rim
        const rimOuterGeo = new THREE.CylinderGeometry(radius * 0.60, radius * 0.52, width * 0.92, 24);
        rimOuterGeo.rotateZ(Math.PI / 2);
        const rimOuter = new THREE.Mesh(rimOuterGeo, mats.satinRim);
        wheelUnit.add(rimOuter);

        // Spokes
        for (let a = 0; a < 10; a++) {
            const angle = (a / 10) * Math.PI * 2;
            const spokeGeo = new THREE.BoxGeometry(width * 0.15, radius * 0.52, 0.04);
            const spoke = new THREE.Mesh(spokeGeo, mats.satinRim);
            spoke.position.set((width * 0.4) * signX, Math.cos(angle) * radius * 0.26, Math.sin(angle) * radius * 0.26);
            spoke.rotation.x = -angle;
            wheelUnit.add(spoke);
        }

        // Centerlock Wheel Nut
        const nutGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.16, 6);
        nutGeo.rotateZ(Math.PI / 2);
        const nutMat = isLeft ? mats.neonRed : mats.neonCyan;
        const nutMesh = new THREE.Mesh(nutGeo, nutMat);
        nutMesh.position.x = (width / 2 + 0.06) * signX;
        wheelUnit.add(nutMesh);

        // Brake Rotor
        const rotorGeo = new THREE.CylinderGeometry(radius * 0.50, radius * 0.50, 0.065, 24);
        rotorGeo.rotateZ(Math.PI / 2);
        const rotorMesh = new THREE.Mesh(rotorGeo, mats.brakeDisc);
        rotorMesh.position.x = -(width * 0.22) * signX;
        wheelUnit.add(rotorMesh);

        // 4-Piston Caliper
        const caliperGeo = new THREE.BoxGeometry(0.12, 0.32, 0.38);
        const caliperMesh = new THREE.Mesh(caliperGeo, mats.caliperRed);
        caliperMesh.position.set(-(width * 0.2) * signX, radius * 0.24, 0);
        wheelUnit.add(caliperMesh);

        // Upper Wishbone
        const armGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.45, 8);
        const arm1 = new THREE.Mesh(armGeo, mats.carbonGloss);
        arm1.position.set(-signX * 0.72, 0.24, 0.15);
        arm1.rotation.z = signX * 0.34;
        arm1.rotation.y = 0.15;
        wheelUnit.add(arm1);

        // Lower Wishbone
        const arm2 = new THREE.Mesh(armGeo, mats.carbonGloss);
        arm2.position.set(-signX * 0.72, -0.16, -0.12);
        arm2.rotation.z = -signX * 0.22;
        arm2.rotation.y = -0.12;
        wheelUnit.add(arm2);

        // Pushrod
        const pushGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8);
        const pushrod = new THREE.Mesh(pushGeo, mats.titanium);
        pushrod.position.set(-signX * 0.75, 0.1, 0);
        pushrod.rotation.z = signX * 0.52;
        wheelUnit.add(pushrod);

        return wheelUnit;
    }

    // FL
    const wheelFL = buildRealisticWheelUnit(true, true);
    wheelFL.position.set(-1.88, 0.0, 2.2);
    registerPart('wheelFL', wheelFL,
        new THREE.Vector3(-3.6, 0.4, 3.2),
        new THREE.Euler(0, 0.35, 0),
        new THREE.Vector3(-3.6, 0.4, 3.2),
        'brakes'
    );

    // FR
    const wheelFR = buildRealisticWheelUnit(true, false);
    wheelFR.position.set(1.88, 0.0, 2.2);
    registerPart('wheelFR', wheelFR,
        new THREE.Vector3(3.6, 0.4, 3.2),
        new THREE.Euler(0, -0.35, 0),
        new THREE.Vector3(3.6, 0.4, 3.2),
        'brakes'
    );

    // RL
    const wheelRL = buildRealisticWheelUnit(false, true);
    wheelRL.position.set(-1.98, 0.06, -2.0);
    registerPart('wheelRL', wheelRL,
        new THREE.Vector3(-3.9, 0.4, -3.2),
        new THREE.Euler(0, -0.28, 0),
        new THREE.Vector3(-3.9, 0.4, -3.2),
        'brakes'
    );

    // RR
    const wheelRR = buildRealisticWheelUnit(false, false);
    wheelRR.position.set(1.98, 0.06, -2.0);
    registerPart('wheelRR', wheelRR,
        new THREE.Vector3(3.9, 0.4, -3.2),
        new THREE.Euler(0, 0.28, 0),
        new THREE.Vector3(3.9, 0.4, -3.2),
        'brakes'
    );

    // --- 7. Animation State & Lerp Engine ---
    let targetExplosion = 0.0;
    let currentExplosion = 0.0;
    let isExploded = false;
    let isWireframe = false;
    let isOrbiting = true;
    let isUserInteracting = false;

    // Camera target lerp
    let camTargetPos = camera.position.clone();
    let camLookTarget = new THREE.Vector3(0, 0, 0);

    // 3D-to-2D Tooltip Pins Projection Elements
    const pinElements = {
        frontWing: document.getElementById('pin-front-wing'),
        halo: document.getElementById('pin-halo'),
        engine: document.getElementById('pin-engine'),
        sidepod: document.getElementById('pin-sidepod'),
        brakes: document.getElementById('pin-brakes'),
        rearWing: document.getElementById('pin-rear-wing')
    };

    const pinWorldPositions = {
        frontWing: new THREE.Vector3(0, 0.6, 5.2),
        halo: new THREE.Vector3(0, 3.4, 0.3),
        engine: new THREE.Vector3(0, 2.7, -2.4),
        sidepod: new THREE.Vector3(-3.8, 0.5, 0.2),
        brakes: new THREE.Vector3(-3.6, 0.4, 3.2),
        rearWing: new THREE.Vector3(0, 2.9, -5.5)
    };

    // HUD UI Elements
    const pctBadge = document.getElementById('exploded-pct-badge');
    const slider = document.getElementById('explosion-slider');
    const sliderVal = document.getElementById('explosion-slider-val');
    const explodeBtnText = document.getElementById('explode-btn-text');
    const explodeBtnIcon = document.getElementById('explode-btn-icon');
    const orbitStatus = document.getElementById('orbit-status');

    // Phase Narrative Elements
    const phaseBadge = document.getElementById('exploded-phase-badge');
    const phaseTitle = document.getElementById('exploded-phase-title');
    const phaseDesc = document.getElementById('exploded-phase-desc');
    const statRigidity = document.getElementById('stat-rigidity');
    const statWeight = document.getElementById('stat-weight');

    // --- 8. Component Inspector Database ---
    const componentSpecs = {
        frontWing: {
            name: "CFRP Multi-Tier Front Aero Wing",
            desc: "Dual-plane carbon-fibre reinforced polymer wing engineered to generate 145 kg of downforce at 120 km/h with integrated vortex generators.",
            specs: [
                ["DOWNFORCE CAPACITY", "145 KG @ 120 KM/H"],
                ["WING ELEMENT ANGLE", "14.5° ATTACK"],
                ["MATERIAL MATRIX", "TORAY T800 CFRP"],
                ["MASS SPECIFICATION", "4.2 KG DRY"]
            ]
        },
        halo: {
            name: "Grade 5 Titanium Safety Halo",
            desc: "3D-curved Grade 5 (Ti-6Al-4V) titanium survival hoop capable of withstanding 125 kN vertical and lateral crash loads mandated by FIA.",
            specs: [
                ["MAX LOAD RATING", "125 kN MULTI-AXIS"],
                ["ALLOY SPEC", "GRADE 5 Ti-6Al-4V"],
                ["WALL THICKNESS", "4.0 MM SEAMLESS"],
                ["TOTAL MASS", "6.8 KG"]
            ]
        },
        engine: {
            name: "High-Rev V6 Turbocharged Power Unit",
            desc: "Custom race-tuned powertrain with CNC intake velocity stacks, ceramic coated turbo exhaust manifolds, and Drexler limited slip differential.",
            specs: [
                ["MAX RPM LIMIT", "13,500 RPM"],
                ["POWER OUTPUT", "88 BHP RACING TUNE"],
                ["EXHAUST MANIFOLD", "TITANIUM CERAMIC"],
                ["DIFFERENTIAL", "DREXLER LSD RACING"]
            ]
        },
        sidepod: {
            name: "Composite Sidepod & Cooling Matrix",
            desc: "Sculpted side impact structures housing dual water-to-air aluminum radiator cores and military-spec CAN-Bus battery telemetry logging.",
            specs: [
                ["HEAT DISSIPATION", "28.5 kW AT SPEED"],
                ["COOLING CORE", "ALUMINUM BRAZED"],
                ["CAN-BUS TELEMETRY", "1,000 HZ LOGGING"],
                ["IMPACT STRUCTURE", "FIA SIDE SPEC"]
            ]
        },
        brakes: {
            name: "Carbon-Ceramic Rotors & 4-Piston Calipers",
            desc: "Drilled carbon-ceramic ventilated discs clamped by Brembo 4-piston calipers, delivering 1.85G deceleration from 100 to 0 km/h in 28.4 meters.",
            specs: [
                ["PEAK DECELERATION", "1.85 G LATERAL/LONG"],
                ["100-0 KM/H DISTANCE", "28.4 METERS"],
                ["CALIPER SYSTEM", "BREMBO 4-PISTON"],
                ["SUSPENSION TYPE", "PUSHROD WISHBONE"]
            ]
        },
        rearWing: {
            name: "Dual-Tier Carbon Rear Wing & Active DRS",
            desc: "Swan-neck mounted rear aerofoil with pneumatic DRS actuator that opens the upper slot gap to reduce overall drag by 25% on straights.",
            specs: [
                ["DRS DRAG REDUCTION", "-25% COEFFICIENT"],
                ["DOWNFORCE GENERATION", "195 KG AT HIGH SPEED"],
                ["MOUNTING GEOMETRY", "TWIN SWAN-NECK"],
                ["SAFETY EMITTER", "FIA RED RAIN LED"]
            ]
        }
    };

    window.focusOnPart = function(partKey) {
        const data = componentSpecs[partKey];
        if (!data) return;

        // Smoothly scroll to exploded experience if user clicked from the hero
        const expEl = document.getElementById('exploded-experience');
        if (expEl && Math.abs(window.scrollY - expEl.offsetTop) > 200) {
            expEl.scrollIntoView({ behavior: 'smooth' });
        }

        // If currently not exploded, explode slightly to reveal the component
        if (targetExplosion < 0.35) {
            targetExplosion = 0.65;
        }

        // Update Inspector
        document.getElementById('inspect-name').innerText = data.name;
        document.getElementById('inspect-desc').innerText = data.desc;
        const specsGrid = document.getElementById('inspect-specs');
        specsGrid.innerHTML = data.specs.map(s =>
            `<div class="inspector-spec-row"><span>${s[0]}</span> <b>${s[1]}</b></div>`
        ).join('');

        // Smoothly focus camera
        if (pinWorldPositions[partKey]) {
            const target = pinWorldPositions[partKey];
            camLookTarget.copy(target);
            camTargetPos.set(target.x + 4.5, target.y + 2.5, target.z + 5.5);
        }
    };

    // --- 9. Scroll-Driven Disassembly Trigger ---
    function onScrollExplosion() {
        const rect = container.getBoundingClientRect();
        const winH = window.innerHeight;
        const totalScrollable = rect.height - winH;

        if (totalScrollable <= 0) return;

        const scrolledInto = -rect.top;
        const progress = Math.min(1.0, Math.max(0.0, scrolledInto / totalScrollable));

        targetExplosion = progress;
        if (slider) slider.value = Math.round(progress * 100);
    }

    window.addEventListener('scroll', onScrollExplosion, { passive: true });

    // Slider Manual Control
    window.onExplosionSlider = function(val) {
        targetExplosion = parseInt(val, 10) / 100;
    };

    // Toggle Explode / Assemble Button
    window.toggleExplosion = function() {
        if (currentExplosion > 0.4) {
            targetExplosion = 0.0;
            playExplodeSound(false);
        } else {
            targetExplosion = 1.0;
            playExplodeSound(true);
        }
    };

    // Toggle Orbit Mode
    window.toggleOrbitMode = function() {
        isOrbiting = !isOrbiting;
        if (orbitStatus) orbitStatus.innerText = isOrbiting ? 'ON' : 'OFF';
        if (controls) controls.autoRotate = isOrbiting;
    };

    // Toggle Wireframe Mode
    window.toggleWireframeMode = function() {
        isWireframe = !isWireframe;
        carRootGroup.traverse(child => {
            if (child.isMesh && child.material !== mats.neonCyan && child.material !== mats.neonRed) {
                child.material.wireframe = isWireframe;
            }
        });
    };

    // Camera Presets
    window.setCameraPreset = function(preset) {
        document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');

        camLookTarget.set(0, 0, 0);
        if (preset === 'iso') {
            camTargetPos.set(11, 5.5, 12);
        } else if (preset === 'top') {
            camTargetPos.set(0.1, 16, 0.1);
        } else if (preset === 'side') {
            camTargetPos.set(14, 2.5, 0);
        } else if (preset === 'engine') {
            camTargetPos.set(4.5, 4.5, -4);
            camLookTarget.set(0, 1.5, -2);
        } else if (preset === 'rear') {
            camTargetPos.set(3, 4, -13);
            camLookTarget.set(0, 1.5, -3);
        }
    };

    window.resetCameraView = function() {
        camTargetPos.set(11, 5.5, 12);
        camLookTarget.set(0, 0, 0);
        targetExplosion = 0.0;
    };

    // --- 10. Update HUD & Laser Lines Function ---
    function updateHUDAndLasers(factor) {
        const pct = Math.round(factor * 100);
        if (pctBadge) pctBadge.innerText = pct + '%';
        if (sliderVal) sliderVal.innerText = pct + '%';

        if (explodeBtnText && explodeBtnIcon) {
            if (factor > 0.5) {
                explodeBtnText.innerText = "REASSEMBLE MACHINE";
                explodeBtnIcon.innerText = "🔧";
            } else {
                explodeBtnText.innerText = "DISASSEMBLE ALL";
                explodeBtnIcon.innerText = "⚡";
            }
        }

        // Update Phase Narrative
        if (factor < 0.2) {
            if (phaseBadge) phaseBadge.innerText = "STAGE 01 // UNITED CHASSIS";
            if (phaseTitle) phaseTitle.innerText = "Fully Assembled Prototype";
            if (phaseDesc) phaseDesc.innerText = "Monocoque, aerodynamics, and powertrain unified in high-rigidity race setup. Scroll down to trigger automated component disassembly.";
            if (statRigidity) statRigidity.innerText = "2,450 Nm/deg";
            if (statWeight) statWeight.innerText = "195 KG";
        } else if (factor < 0.5) {
            if (phaseBadge) phaseBadge.innerText = "STAGE 02 // AERO SEPARATION";
            if (phaseTitle) phaseTitle.innerText = "Front Wing & Halo Extraction";
            if (phaseDesc) phaseDesc.innerText = "Aerodynamic multi-tier front wing telescopes forward while the Grade 5 titanium halo safety canopy elevates vertically.";
            if (statRigidity) statRigidity.innerText = "1,850 Nm/deg";
            if (statWeight) statWeight.innerText = "AERO DETACHED";
        } else if (factor < 0.8) {
            if (phaseBadge) phaseBadge.innerText = "STAGE 03 // POWERTRAIN & CHASSIS";
            if (phaseTitle) phaseTitle.innerText = "Engine & Suspension Wishbones";
            if (phaseDesc) phaseDesc.innerText = "High-rev V6 turbocharged block lifts out with glowing exhaust manifolds; all 4 double-wishbone pushrods expand laterally.";
            if (statRigidity) statRigidity.innerText = "CORE EXPOSED";
            if (statWeight) statWeight.innerText = "SUB-ASSEMBLY";
        } else {
            if (phaseBadge) phaseBadge.innerText = "STAGE 04 // FULL 3D EXPLODED CAD";
            if (phaseTitle) phaseTitle.innerText = "Aerospace Engineering Breakdown";
            if (phaseDesc) phaseDesc.innerText = "All 12 modular aerospace sub-assemblies isolated in 3D CAD space with active telemetry callouts. Hover/click any part to inspect.";
            if (statRigidity) statRigidity.innerText = "DISASSEMBLED";
            if (statWeight) statWeight.innerText = "12 SUB-SYSTEMS";
        }

        // Update 3D Laser Alignment Lines
        explodedParts.forEach(part => {
            const positions = part.laserLine.geometry.attributes.position.array;
            // Start at chassis center
            positions[0] = part.basePos.x;
            positions[1] = part.basePos.y;
            positions[2] = part.basePos.z;
            // End at current exploded group position
            positions[3] = part.group.position.x;
            positions[4] = part.group.position.y;
            positions[5] = part.group.position.z;
            part.laserLine.geometry.attributes.position.needsUpdate = true;
            part.laserLine.computeLineDistances();

            // Fade laser line in with explosion
            part.laserLine.material.opacity = Math.min(0.65, Math.max(0.0, (factor - 0.08) * 1.2));
        });
    }

    // --- 11. Update 3D Floating Tooltip Pins Projection ---
    const projVec = new THREE.Vector3();
    function updateAnnotationPins(factor) {
        const showPins = factor >= 0.25;
        const opacity = Math.min(1.0, (factor - 0.25) * 2.0);

        for (let key in pinElements) {
            const el = pinElements[key];
            const worldPos = pinWorldPositions[key];
            if (!el || !worldPos) continue;

            if (!showPins) {
                el.style.display = 'none';
                el.style.opacity = '0';
                continue;
            }

            // Project 3D coordinate to 2D screen coordinate
            projVec.copy(worldPos);
            projVec.project(camera);

            // Check if in front of camera
            if (projVec.z > 1.0) {
                el.style.display = 'none';
                continue;
            }

            const x = (projVec.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(projVec.y * 0.5) + 0.5) * window.innerHeight;

            el.style.display = 'flex';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.opacity = opacity;
        }
    }

    // --- 12. Main 60FPS Render & Animation Loop ---
    let clock = new THREE.Clock();

    function renderLoop() {
        requestAnimationFrame(renderLoop);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 1. Smoothly Lerp Explosion Factor
        currentExplosion += (targetExplosion - currentExplosion) * 0.08;
        if (Math.abs(currentExplosion - targetExplosion) < 0.001) {
            currentExplosion = targetExplosion;
        }

        // 2. Interpolate Each Exploded Sub-Assembly
        explodedParts.forEach(part => {
            part.group.position.lerpVectors(part.basePos, part.explodedPos, currentExplosion);
            part.group.rotation.x = THREE.MathUtils.lerp(part.baseRot.x, part.explodedRot.x, currentExplosion);
            part.group.rotation.y = THREE.MathUtils.lerp(part.baseRot.y, part.explodedRot.y, currentExplosion);
            part.group.rotation.z = THREE.MathUtils.lerp(part.baseRot.z, part.explodedRot.z, currentExplosion);
        });

        // 3. Smooth Camera Transitions
        camera.position.lerp(camTargetPos, 0.05);
        if (controls) {
            controls.target.lerp(camLookTarget, 0.05);
            controls.update();
        } else {
            camera.lookAt(camLookTarget);
        }

        // 4. Subtle Ambient Floating Motion when assembled
        if (currentExplosion < 0.1) {
            carRootGroup.position.y = Math.sin(time * 1.5) * 0.04;
        } else {
            carRootGroup.position.y = 0;
        }

        // 5. Flashing FIA safety light & turbo glow pulsation
        if (mats.neonRed) {
            mats.neonRed.emissiveIntensity = 1.4 + Math.sin(time * 6) * 0.5;
        }
        if (engineHeatLight) {
            engineHeatLight.intensity = 2.5 + Math.sin(time * 3) * 1.0;
        }

        // 6. Update HUD & Screen Projected Tooltip Pins
        updateHUDAndLasers(currentExplosion);
        updateAnnotationPins(currentExplosion);

        renderer.render(scene, camera);
    }

    renderLoop();

    // --- 13. High-DPI Window Resize Handler ---
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener('resize', onWindowResize);
})();
