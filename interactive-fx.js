/* ============================================
   ReviewGuard AI — Interactive FX Module
   Visible, neat effects for any system theme
   ============================================ */

// ========================
// 1. SCROLL PROGRESS INDICATOR
// ========================
(function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'scrollProgressBar';
    document.body.appendChild(bar);

    window.addEventListener('scroll', function () {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - window.innerHeight;
        var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    }, { passive: true });
})();


// ========================
// 2. RIPPLE CLICK EFFECT ON BUTTONS
// ========================
(function initRippleEffect() {
    var selectors = '.analyze-btn, .example-chip, .star-btn, .clear-btn, .nav-pill';
    document.addEventListener('click', function (e) {
        var target = e.target.closest(selectors);
        if (!target) return;

        var rect = target.getBoundingClientRect();
        var ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        var size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

        target.style.position = target.style.position || 'relative';
        target.style.overflow = 'hidden';
        target.appendChild(ripple);

        ripple.addEventListener('animationend', function () {
            ripple.remove();
        });
    });
})();


// ========================
// 3. ANIMATED NUMBER COUNTERS
// ========================
window.animateCounter = function (element, target, duration, suffix) {
    if (!element) return;
    duration = duration || 1200;
    suffix = suffix || '';
    var start = 0;
    var startTime = null;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeOutCubic(progress);
        var current = Math.round(eased * target);
        element.textContent = current + suffix;
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = target + suffix;
        }
    }
    requestAnimationFrame(step);
};


// ========================
// 4. NEURAL NETWORK VISUALIZATION  
// ========================
(function initNeuralNetVis() {
    var howSection = document.getElementById('howItWorks');
    if (!howSection) return;

    // Create canvas
    var wrapper = document.createElement('div');
    wrapper.className = 'neural-net-wrapper';
    wrapper.innerHTML = '<h3 class="neural-net-title">Live Neural Pathway Visualization</h3>';

    var canvas = document.createElement('canvas');
    canvas.id = 'neuralNetCanvas';
    canvas.width = 800;
    canvas.height = 300;
    wrapper.appendChild(canvas);

    // Insert before the steps grid
    var stepsGrid = howSection.querySelector('.steps-grid');
    if (stepsGrid) {
        howSection.insertBefore(wrapper, stepsGrid);
    } else {
        howSection.appendChild(wrapper);
    }

    var ctx = canvas.getContext('2d');
    var W, H;
    var nodes = [];
    var connections = [];
    var activeSignals = [];
    var layers = [4, 6, 8, 6, 3];
    var mouseX = -1, mouseY = -1;

    function resizeCanvas() {
        var rect = wrapper.getBoundingClientRect();
        W = Math.min(rect.width - 40, 900);
        H = 280;
        canvas.width = W * (window.devicePixelRatio || 1);
        canvas.height = H * (window.devicePixelRatio || 1);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        buildNetwork();
    }

    function buildNetwork() {
        nodes = [];
        connections = [];
        var padding = 50;
        var layerSpacing = (W - padding * 2) / (layers.length - 1);

        for (var l = 0; l < layers.length; l++) {
            var count = layers[l];
            var nodeSpacing = (H - padding * 2) / (count - 1 || 1);
            for (var n = 0; n < count; n++) {
                var x = padding + l * layerSpacing;
                var y = count === 1 ? H / 2 : padding + n * nodeSpacing;
                nodes.push({
                    x: x, y: y, layer: l,
                    radius: 6,
                    glow: 0,
                    baseGlow: 0.3 + Math.random() * 0.2,
                    pulseSpeed: 1 + Math.random() * 2
                });
            }
        }

        // Build connections between adjacent layers
        var idx = 0;
        for (var l = 0; l < layers.length - 1; l++) {
            var startIdx = 0;
            for (var k = 0; k < l; k++) startIdx += layers[k];
            var endIdx = startIdx + layers[l];
            var nextStart = endIdx;
            var nextEnd = nextStart + layers[l + 1];

            for (var i = startIdx; i < endIdx; i++) {
                for (var j = nextStart; j < nextEnd; j++) {
                    connections.push({
                        from: i, to: j,
                        weight: 0.1 + Math.random() * 0.4
                    });
                }
            }
        }
    }

    // Signal animation
    function fireSignal() {
        if (connections.length === 0) return;
        var conn = connections[Math.floor(Math.random() * connections.length)];
        activeSignals.push({
            from: conn.from,
            to: conn.to,
            progress: 0,
            speed: 0.01 + Math.random() * 0.02,
            color: ['#818cf8', '#c084fc', '#34d399', '#22d3ee', '#f472b6'][Math.floor(Math.random() * 5)]
        });
    }

    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', function () {
        mouseX = -1;
        mouseY = -1;
    });

    // Click fires a burst of signals
    canvas.addEventListener('click', function () {
        for (var i = 0; i < 8; i++) {
            setTimeout(function () { fireSignal(); }, i * 60);
        }
    });

    var time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;
        ctx.clearRect(0, 0, W, H);

        // Fire signals periodically
        if (Math.random() < 0.06) fireSignal();

        // Draw connections
        for (var c = 0; c < connections.length; c++) {
            var conn = connections[c];
            var fromNode = nodes[conn.from];
            var toNode = nodes[conn.to];
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = 'rgba(129, 140, 248, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw active signals
        for (var s = activeSignals.length - 1; s >= 0; s--) {
            var sig = activeSignals[s];
            sig.progress += sig.speed;
            if (sig.progress >= 1) {
                // Light up destination node
                nodes[sig.to].glow = 1;
                activeSignals.splice(s, 1);
                continue;
            }
            var fromN = nodes[sig.from];
            var toN = nodes[sig.to];
            var sx = fromN.x + (toN.x - fromN.x) * sig.progress;
            var sy = fromN.y + (toN.y - fromN.y) * sig.progress;

            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fillStyle = sig.color;
            ctx.fill();

            // Trail glow
            ctx.beginPath();
            ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            var grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
            grd.addColorStop(0, sig.color);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fill();

            // Line to signal
            ctx.beginPath();
            ctx.moveTo(fromN.x, fromN.y);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = sig.color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw nodes
        for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            node.glow *= 0.95; // decay

            var pulse = node.baseGlow + Math.sin(time * node.pulseSpeed) * 0.15;
            var brightness = Math.max(pulse, node.glow);

            // Mouse hover effect
            if (mouseX >= 0) {
                var dx = mouseX - node.x;
                var dy = mouseY - node.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 60) {
                    brightness = Math.max(brightness, 1 - dist / 60);
                }
            }

            // Glow halo
            if (brightness > 0.4) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
                var grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 14);
                grd.addColorStop(0, 'rgba(129, 140, 248, ' + (brightness * 0.5) + ')');
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            var alpha = 0.4 + brightness * 0.6;
            ctx.fillStyle = 'rgba(129, 140, 248, ' + alpha + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(129, 140, 248, ' + (alpha * 0.8) + ')';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // Start when visible
    var started = false;
    var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !started) {
            started = true;
            resizeCanvas();
            animate();
        }
    }, { threshold: 0.1 });
    observer.observe(wrapper);

    window.addEventListener('resize', function () {
        if (started) resizeCanvas();
    });
})();


// ========================
// 5. TYPING EFFECT ON HERO SUBTITLE
// ========================
(function initTypingEffect() {
    var subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;

    var fullText = subtitle.textContent.trim();
    subtitle.textContent = '';
    subtitle.style.minHeight = '3.4em'; // prevent layout shift
    var charIndex = 0;
    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    subtitle.appendChild(cursor);

    function typeChar() {
        if (charIndex < fullText.length) {
            subtitle.insertBefore(
                document.createTextNode(fullText.charAt(charIndex)),
                cursor
            );
            charIndex++;
            setTimeout(typeChar, 18 + Math.random() * 22);
        } else {
            // Blink cursor then remove
            setTimeout(function () {
                cursor.classList.add('blink');
                setTimeout(function () {
                    cursor.style.display = 'none';
                }, 3000);
            }, 500);
        }
    }

    // Start typing after a short delay  
    setTimeout(typeChar, 800);
})();


// ========================
// 6. GLASSMORPHISM SPOTLIGHT EFFECT
// ========================
(function initSpotlight() {
    var spotlight = document.createElement('div');
    spotlight.id = 'spotlightOverlay';
    document.body.appendChild(spotlight);

    var visible = false;
    var targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    document.addEventListener('mousemove', function (e) {
        targetX = e.clientX;
        targetY = e.clientY;
        if (!visible) {
            visible = true;
            spotlight.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', function () {
        visible = false;
        spotlight.style.opacity = '0';
    });

    function updateSpotlight() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        spotlight.style.background = 'radial-gradient(300px circle at ' + currentX + 'px ' + currentY + 'px, rgba(129, 140, 248, 0.06), transparent 60%)';
        requestAnimationFrame(updateSpotlight);
    }
    updateSpotlight();
})();


// ========================
// 7. ANIMATED STAT COUNTERS ON SCROLL
// ========================
(function initStatCounters() {
    var featureItems = [];

    // Watch for feature items appearing
    var observer = new MutationObserver(function () {
        var items = document.querySelectorAll('.feature-value:not([data-counted])');
        items.forEach(function (el) {
            el.setAttribute('data-counted', 'true');
            var val = parseFloat(el.textContent);
            if (!isNaN(val) && val === Math.floor(val) && val > 0 && val < 10000) {
                window.animateCounter(el, val, 1000, '');
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();


// ========================
// 8. INTERACTIVE CARD GLOW BORDERS
// ========================
(function initGlowBorders() {
    var cards = document.querySelectorAll('.metric-card, .step-card, .features-card');

    cards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;

            card.style.borderImage = 'none';
            card.style.borderColor = 'transparent';
            card.style.boxShadow =
                '0 0 0 1px rgba(129, 140, 248, 0.15), ' +
                (x - rect.width / 2) * 0.02 + 'px ' +
                (y - rect.height / 2) * 0.02 + 'px ' +
                '40px rgba(129, 140, 248, 0.08)';
        });

        card.addEventListener('mouseleave', function () {
            card.style.boxShadow = '';
            card.style.borderColor = '';
        });
    });
})();


// ========================  
// 9. SMOOTH PAGE LOAD ANIMATION
// ========================
(function initPageLoadAnimation() {
    var overlay = document.createElement('div');
    overlay.id = 'pageLoadOverlay';
    overlay.innerHTML = '<div class="load-logo-anim"><svg width="48" height="48" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="loadGrad" x1="0" y1="0" x2="32" y2="32"><stop offset="0%" stop-color="#818cf8"/><stop offset="100%" stop-color="#c084fc"/></linearGradient></defs><path d="M16 2L4 8v8c0 7.7 5.1 14.9 12 16 6.9-1.1 12-8.3 12-16V8L16 2z" fill="url(#loadGrad)" opacity="0.3" stroke="url(#loadGrad)" stroke-width="1.5"/><path d="M13 16l2 2 4-4" stroke="url(#loadGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg></div>';
    document.body.appendChild(overlay);

    window.addEventListener('load', function () {
        setTimeout(function () {
            overlay.classList.add('fade-out');
            setTimeout(function () {
                overlay.remove();
            }, 600);
        }, 400);
    });
})();


// ========================
// 10. HEADER PARALLAX ON SCROLL
// ========================
(function initHeaderParallax() {
    var header = document.querySelector('.header');
    if (!header) return;

    var lastScroll = 0;
    window.addEventListener('scroll', function () {
        var currentScroll = window.scrollY || document.documentElement.scrollTop;
        if (currentScroll > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });
})();
