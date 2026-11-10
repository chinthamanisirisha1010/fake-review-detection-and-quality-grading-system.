/* ============================================
   ReviewGuard AI — 3D Interactive UI Engine
   Powered by Three.js
   ============================================ */

// ========================
// 1. 3D PARTICLE BACKGROUND
// ========================
(function initThreeBackground() {
    const canvas = document.getElementById('threeBg');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // --- Floating Orbs / Particles ---
    const PARTICLE_COUNT = 220;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const velocities = [];

    const palette = [
        new THREE.Color(0x818cf8), // indigo
        new THREE.Color(0xc084fc), // violet
        new THREE.Color(0xf472b6), // pink
        new THREE.Color(0x22d3ee), // cyan
        new THREE.Color(0x34d399), // emerald
        new THREE.Color(0xa78bfa), // purple
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 2.5 + 0.5;

        velocities.push({
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.01,
            phase: Math.random() * Math.PI * 2
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader for glowing particles
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vAlpha;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec3 pos = position;

                // Gentle floating animation
                pos.x += sin(uTime * 0.3 + position.y * 0.1) * 0.8;
                pos.y += cos(uTime * 0.2 + position.x * 0.1) * 0.6;
                pos.z += sin(uTime * 0.15 + position.z * 0.05) * 0.4;

                // Mouse interaction — particles drift toward cursor
                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                float dist = length(vec2(mvPos.x, mvPos.y) - uMouse * 20.0);
                float influence = smoothstep(30.0, 0.0, dist);
                mvPos.xy += normalize(vec2(mvPos.x, mvPos.y) - uMouse * 20.0) * influence * 3.0;

                gl_Position = projectionMatrix * mvPos;
                gl_PointSize = size * uPixelRatio * (80.0 / -mvPos.z);

                // Fade based on depth
                vAlpha = smoothstep(-60.0, 0.0, mvPos.z) * 0.7;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;

                float glow = 1.0 - smoothstep(0.0, 0.5, d);
                glow = pow(glow, 1.5);

                gl_FragColor = vec4(vColor, glow * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Connecting Lines (Constellation) ---
    const lineGeometry = new THREE.BufferGeometry();
    const MAX_LINES = 300;
    const linePositions = new Float32Array(MAX_LINES * 6);
    const lineColors = new Float32Array(MAX_LINES * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    lineGeometry.setDrawRange(0, 0);

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // --- Floating Ring Structures ---
    const ringGroup = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(12 + i * 8, 0.08, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
            color: palette[i],
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 + (i * 0.3);
        ring.rotation.y = i * 0.5;
        ring.userData = { speed: 0.1 + i * 0.05, offset: i * 1.2 };
        ringGroup.add(ring);
    }
    ringGroup.position.set(0, 0, -20);
    scene.add(ringGroup);

    // --- Mouse Tracking ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    document.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Animation Loop ---
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.016;

        // Smooth mouse
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Update particles
        particleMaterial.uniforms.uTime.value = time;
        particleMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

        const posArr = particleGeometry.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            posArr[i * 3] += velocities[i].x;
            posArr[i * 3 + 1] += velocities[i].y;
            posArr[i * 3 + 2] += velocities[i].z;

            // Wrap around
            if (posArr[i * 3] > 60) posArr[i * 3] = -60;
            if (posArr[i * 3] < -60) posArr[i * 3] = 60;
            if (posArr[i * 3 + 1] > 40) posArr[i * 3 + 1] = -40;
            if (posArr[i * 3 + 1] < -40) posArr[i * 3 + 1] = 40;
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Update constellation lines
        let lineIndex = 0;
        const threshold = 18;
        for (let i = 0; i < PARTICLE_COUNT && lineIndex < MAX_LINES; i++) {
            for (let j = i + 1; j < PARTICLE_COUNT && lineIndex < MAX_LINES; j++) {
                const dx = posArr[i * 3] - posArr[j * 3];
                const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
                const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < threshold) {
                    const alpha = 1 - dist / threshold;
                    linePositions[lineIndex * 6] = posArr[i * 3];
                    linePositions[lineIndex * 6 + 1] = posArr[i * 3 + 1];
                    linePositions[lineIndex * 6 + 2] = posArr[i * 3 + 2];
                    linePositions[lineIndex * 6 + 3] = posArr[j * 3];
                    linePositions[lineIndex * 6 + 4] = posArr[j * 3 + 1];
                    linePositions[lineIndex * 6 + 5] = posArr[j * 3 + 2];

                    const c = palette[0];
                    lineColors[lineIndex * 6] = c.r * alpha;
                    lineColors[lineIndex * 6 + 1] = c.g * alpha;
                    lineColors[lineIndex * 6 + 2] = c.b * alpha;
                    lineColors[lineIndex * 6 + 3] = c.r * alpha;
                    lineColors[lineIndex * 6 + 4] = c.g * alpha;
                    lineColors[lineIndex * 6 + 5] = c.b * alpha;

                    lineIndex++;
                }
            }
        }
        lineGeometry.setDrawRange(0, lineIndex * 2);
        lineGeometry.attributes.position.needsUpdate = true;
        lineGeometry.attributes.color.needsUpdate = true;

        // Rotate rings
        ringGroup.children.forEach((ring) => {
            ring.rotation.z += ring.userData.speed * 0.005;
            ring.rotation.x += Math.sin(time * 0.3 + ring.userData.offset) * 0.001;
        });

        // Camera sway
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();

    // --- Resize ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    });
})();


// ========================
// 2. 3D HERO SHIELD
// ========================
(function initHeroShield() {
    const container = document.getElementById('hero3dContainer');
    if (!container) return;

    const width = 280;
    const height = 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Shield group
    const shieldGroup = new THREE.Group();

    // Outer shield ring
    const torusGeo = new THREE.TorusGeometry(1.5, 0.06, 16, 64);
    const torusMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.6
    });
    const outerRing = new THREE.Mesh(torusGeo, torusMat);
    shieldGroup.add(outerRing);

    // Inner shield ring
    const innerTorusGeo = new THREE.TorusGeometry(1.15, 0.04, 16, 64);
    const innerTorusMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.4
    });
    const innerRing = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    shieldGroup.add(innerRing);

    // Shield face (translucent hex pattern)
    const shieldGeo = new THREE.CircleGeometry(1.1, 6);
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
    });
    const shieldFace = new THREE.Mesh(shieldGeo, shieldMat);
    shieldGroup.add(shieldFace);

    // Checkmark (3D line)
    const checkPoints = [
        new THREE.Vector3(-0.4, 0.0, 0.05),
        new THREE.Vector3(-0.1, -0.35, 0.05),
        new THREE.Vector3(0.5, 0.4, 0.05)
    ];
    const checkCurve = new THREE.CatmullRomCurve3(checkPoints);
    const checkGeo = new THREE.TubeGeometry(checkCurve, 32, 0.06, 8, false);
    const checkMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.9
    });
    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    shieldGroup.add(checkMesh);

    // Orbiting particles around shield
    const orbitParticleCount = 40;
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPositions = new Float32Array(orbitParticleCount * 3);
    const orbitSizes = new Float32Array(orbitParticleCount);
    const orbitData = [];

    for (let i = 0; i < orbitParticleCount; i++) {
        const angle = (i / orbitParticleCount) * Math.PI * 2;
        const radius = 1.8 + Math.random() * 0.5;
        orbitPositions[i * 3] = Math.cos(angle) * radius;
        orbitPositions[i * 3 + 1] = Math.sin(angle) * radius;
        orbitPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        orbitSizes[i] = Math.random() * 3 + 1;
        orbitData.push({ angle, radius, speed: 0.3 + Math.random() * 0.5, zOffset: (Math.random() - 0.5) * 0.5 });
    }

    orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
    orbitGeometry.setAttribute('size', new THREE.BufferAttribute(orbitSizes, 1));

    const orbitMaterial = new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
        vertexShader: `
            attribute float size;
            uniform float uPixelRatio;
            varying float vAlpha;
            void main() {
                vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPos;
                gl_PointSize = size * uPixelRatio * (50.0 / -mvPos.z);
                vAlpha = 0.6;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float glow = pow(1.0 - d * 2.0, 2.0);
                gl_FragColor = vec4(0.506, 0.549, 0.973, glow * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const orbitPoints = new THREE.Points(orbitGeometry, orbitMaterial);
    shieldGroup.add(orbitPoints);

    scene.add(shieldGroup);

    // Mouse tracking for tilt
    const shieldMouse = { x: 0, y: 0 };
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        shieldMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        shieldMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    container.addEventListener('mouseleave', () => {
        shieldMouse.x = 0;
        shieldMouse.y = 0;
    });

    let time = 0;
    function animateShield() {
        requestAnimationFrame(animateShield);
        time += 0.016;

        // Gentle float
        shieldGroup.position.y = Math.sin(time * 0.8) * 0.15;

        // Mouse tilt
        shieldGroup.rotation.y += (shieldMouse.x * 0.5 - shieldGroup.rotation.y) * 0.05;
        shieldGroup.rotation.x += (-shieldMouse.y * 0.3 - shieldGroup.rotation.x) * 0.05;

        // Rotate rings
        outerRing.rotation.z += 0.005;
        innerRing.rotation.z -= 0.008;

        // Pulse shield face
        shieldFace.material.opacity = 0.06 + Math.sin(time * 2) * 0.03;

        // Update orbiting particles
        const pos = orbitGeometry.attributes.position.array;
        for (let i = 0; i < orbitParticleCount; i++) {
            const d = orbitData[i];
            d.angle += d.speed * 0.016;
            pos[i * 3] = Math.cos(d.angle) * d.radius;
            pos[i * 3 + 1] = Math.sin(d.angle) * d.radius;
            pos[i * 3 + 2] = Math.sin(d.angle * 2) * d.zOffset;
        }
        orbitGeometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animateShield();
})();


// ========================
// 3. INTERACTIVE TILT CARDS (3D Parallax)
// ========================
(function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
        let bounds;
        let animFrame;

        card.addEventListener('mouseenter', () => {
            bounds = card.getBoundingClientRect();
            card.style.transition = 'transform 0.1s ease';
        });

        card.addEventListener('mousemove', (e) => {
            if (!bounds) bounds = card.getBoundingClientRect();
            const x = e.clientX - bounds.left;
            const y = e.clientY - bounds.top;
            const centerX = bounds.width / 2;
            const centerY = bounds.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(() => {
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            // Dynamic light reflection
            const glowX = (x / bounds.width) * 100;
            const glowY = (y / bounds.height) * 100;
            card.style.background = `
                radial-gradient(
                    ellipse at ${glowX}% ${glowY}%,
                    rgba(129, 140, 248, 0.08) 0%,
                    rgba(24, 26, 42, 1) 60%
                )
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s ease, background 0.5s ease';
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.background = '';
        });
    });
})();


// ========================
// 4. SCROLL-TRIGGERED 3D REVEAL ANIMATIONS
// ========================
(function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.metric-card, .step-card, .features-card, .verdict-banner, .analyzer-card'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 0.1}s`;
                entry.target.classList.add('reveal-3d');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => {
        el.classList.add('pre-reveal');
        observer.observe(el);
    });
})();


// ========================
// 5. INTERACTIVE FLOATING PARTICLES ON CURSOR
// ========================
(function initCursorParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.className = 'cursor-particles';
    document.body.appendChild(particleContainer);

    let throttle = false;

    document.addEventListener('mousemove', (e) => {
        if (throttle) return;
        throttle = true;
        setTimeout(() => throttle = false, 50);

        const particle = document.createElement('div');
        particle.className = 'cursor-particle';
        const size = Math.random() * 6 + 2;
        const colors = ['#818cf8', '#c084fc', '#f472b6', '#22d3ee', '#34d399'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        particle.style.cssText = `
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            box-shadow: 0 0 ${size * 2}px ${color};
        `;
        particleContainer.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    });
})();


// ========================
// 6. MAGNETIC BUTTON EFFECT
// ========================
(function initMagneticButtons() {
    const buttons = document.querySelectorAll('.analyze-btn, .example-chip, .nav-pill');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 0.4s ease';
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.transition = 'transform 0.1s ease';
        });
    });
})();
