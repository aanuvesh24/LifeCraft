import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const PANORAMA_THEMES = {
  sakura: {
    id: 'sakura',
    name: '🌸 SAKURA GROVE',
    shortName: 'Sakura Night',
    subtitle: 'Lanterns, Pond & Shaders',
    videoUrl: '/videos/sakura_night.mp4',
    posterUrl: '/videos/sakura_night_poster.jpg',
    path: '/panoramas/sakura',
    particleType: 'petals',
    vignetteOpacity: 'bg-black/25'
  },
  sakura_day: {
    id: 'sakura_day',
    name: '☀️ SAKURA SUNSET',
    shortName: 'Sakura Sunset',
    subtitle: 'Golden Hour & Shaders',
    videoUrl: '/videos/sakura_day.mp4',
    posterUrl: '/videos/sakura_day_poster.jpg',
    path: '/panoramas/sakura',
    particleType: 'petals',
    vignetteOpacity: 'bg-black/20'
  },
  classic: {
    id: 'classic',
    name: '🌲 CLASSIC BETA',
    shortName: 'Classic Beta',
    subtitle: 'Beta 1.7.3 Nostalgia',
    path: '/panoramas/classic',
    particleType: 'dust',
    vignetteOpacity: 'bg-black/35'
  },
  dark: {
    id: 'dark',
    name: '🌙 MIDNIGHT SHADERS',
    shortName: 'Midnight',
    subtitle: 'Campfire & Stars',
    path: '/panoramas/dark',
    particleType: 'stars',
    vignetteOpacity: 'bg-black/20'
  }
};

// Backward-compatibility alias
PANORAMA_THEMES.cherry = PANORAMA_THEMES.sakura;

export default function MinecraftPanorama({
  theme = 'sakura',
  speed = 1.0,
  isPaused = false,
  showParticles = true,
  shadersEnabled = true,
  onThemeChange,
  onToggleShaders
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particleCanvasRef = useRef(null);
  const videoRef = useRef(null);

  const [internalTheme, setInternalTheme] = useState(theme);
  const activeThemeKey = theme || internalTheme || 'sakura';
  const activeTheme = PANORAMA_THEMES[activeThemeKey] || PANORAMA_THEMES.sakura;
  const isVideoTheme = Boolean(activeTheme.videoUrl);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  const [hasWebGL, setHasWebGL] = useState(() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      return false;
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleSelectTheme = (newTheme) => {
    setInternalTheme(newTheme);
    if (onThemeChange) onThemeChange(newTheme);
  };

  // Sync video play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, activeThemeKey]);

  // Sync video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = Math.max(0.25, Math.min(2.0, speed));
    }
  }, [speed]);

  // Reset video loaded flag when theme changes
  useEffect(() => {
    setVideoLoaded(false);
  }, [activeThemeKey]);

  // Three.js refs to preserve across renders
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraPivotRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());

  // Mouse interaction refs
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const mouseOffsetRef = useRef({ x: 0, y: 0 });
  const pitchRef = useRef(-0.16); // Minecraft standard downward horizon tilt (~9 degrees)
  const isPausedRef = useRef(isPaused);
  const speedRef = useRef(speed);

  useEffect(() => {
    isPausedRef.current = isPaused;
    speedRef.current = speed;
  }, [isPaused, speed]);

  // Setup Three.js Scene and Cube Texture (only active when not using video background)
  useEffect(() => {
    if (isVideoTheme || !hasWebGL) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(82, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const cameraPivot = new THREE.Object3D();
    cameraPivotRef.current = cameraPivot;
    scene.add(cameraPivot);
    cameraPivot.add(camera);
    camera.position.set(0, 0, 0.05);
    camera.rotation.x = pitchRef.current;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Load Minecraft Cubemap Faces in Three.js standard order:
    // [+X (west/right), -X (east/left), +Y (up/sky), -Y (down/ground), +Z (south/back), -Z (north/front)]
    const themeConfig = PANORAMA_THEMES[activeThemeKey] || PANORAMA_THEMES.classic;
    const textureUrls = [
      `${themeConfig.path}/panorama_1.png`,
      `${themeConfig.path}/panorama_3.png`,
      `${themeConfig.path}/panorama_4.png`,
      `${themeConfig.path}/panorama_5.png`,
      `${themeConfig.path}/panorama_0.png`,
      `${themeConfig.path}/panorama_2.png`
    ];

    const loader = new THREE.CubeTextureLoader();
    loader.load(
      textureUrls,
      (cubeTexture) => {
        cubeTexture.colorSpace = THREE.SRGBColorSpace;
        scene.background = cubeTexture;
        setIsLoaded(true);
      },
      undefined,
      (err) => {
        console.warn('Failed to load cubemap texture, falling back to seamless CSS panorama', err);
        setHasWebGL(false);
      }
    );

    // Animation Loop
    clockRef.current.start();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Continuous auto-rotation when not manually dragging
      if (!isDraggingRef.current && !isPausedRef.current) {
        // Authentic Minecraft panorama slow rotation: ~0.04 rad/s
        cameraPivot.rotation.y += 0.04 * speedRef.current * delta;
      }

      // Smooth camera sway (Minecraft breathing effect + subtle mouse parallax)
      const swayPitch = Math.sin(elapsed * 0.35) * 0.02;
      const swayRoll = Math.cos(elapsed * 0.25) * 0.008;

      const targetPitch = pitchRef.current + swayPitch + (mouseOffsetRef.current.y * 0.08);
      const targetRoll = swayRoll + (mouseOffsetRef.current.x * 0.03);

      camera.rotation.x += (targetPitch - camera.rotation.x) * 0.05;
      camera.rotation.z += (targetRoll - camera.rotation.z) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (scene.background && scene.background.dispose) {
        scene.background.dispose();
      }
    };
  }, [activeThemeKey, hasWebGL]);

  // Handle Mouse / Touch Dragging to look around freely
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      y: e.clientY || (e.touches && e.touches[0].clientY) || 0
    };
  };

  const handlePointerMove = useCallback((e) => {
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

    // Normal normalized mouse offset for subtle parallax [-1 to 1]
    const normX = (clientX / window.innerWidth) * 2 - 1;
    const normY = -(clientY / window.innerHeight) * 2 + 1;
    mouseOffsetRef.current = { x: normX, y: normY };
    setMouseParallax({ x: normX, y: normY });

    if (!isDraggingRef.current || !cameraPivotRef.current) return;

    const deltaX = clientX - prevMousePosRef.current.x;
    const deltaY = clientY - prevMousePosRef.current.y;

    prevMousePosRef.current = { x: clientX, y: clientY };

    // Pan horizontally
    cameraPivotRef.current.rotation.y -= deltaX * 0.003;

    // Tilt vertically (clamped to realistic horizon bounds)
    pitchRef.current = Math.max(-0.85, Math.min(0.85, pitchRef.current - deltaY * 0.002));
  }, []);

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handlePointerMove]);

  // Ambient Particles Effect (Petals for Cherry, Sunlit Dust for Classic, Stars for Dark)
  useEffect(() => {
    if (!showParticles) return;
    const pCanvas = particleCanvasRef.current;
    if (!pCanvas) return;
    const ctx = pCanvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (pCanvas.width = window.innerWidth);
    let height = (pCanvas.height = window.innerHeight);

    const onResize = () => {
      width = pCanvas.width = window.innerWidth;
      height = pCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const themeConfig = PANORAMA_THEMES[activeThemeKey] || PANORAMA_THEMES.sakura;
    const isSakura = themeConfig.particleType === 'petals';
    const count = isSakura ? 48 : 28;

    const sakuraColors = [
      'rgba(255, 183, 197, 0.9)', // Classic Sakura pink
      'rgba(255, 160, 185, 0.85)', // Rose blossom
      'rgba(255, 205, 220, 0.8)', // Pale blossom
      'rgba(255, 140, 170, 0.9)', // Vibrant pink
      'rgba(255, 240, 245, 0.95)' // White/pink tip
    ];

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4.5 + 2.5,
      speedX: isSakura ? (Math.random() * 1.8 + 0.4) : (Math.random() * 0.6 - 0.3),
      speedY: isSakura ? (Math.random() * 1.4 + 0.8) : (Math.random() * -0.6 - 0.2),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      flipAngle: Math.random() * Math.PI * 2,
      flipSpeed: (Math.random() * 0.04 + 0.02),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.015,
      opacity: Math.random() * 0.4 + 0.5,
      color: sakuraColors[Math.floor(Math.random() * sakuraColors.length)],
      pulse: Math.random() * Math.PI
    }));

    const renderParticles = () => {
      ctx.clearRect(0, 0, width, height);

      // Real-Time Minecraft Shaders Layer: Volumetric God Rays & Sunlight Bloom (for cubemap themes)
      if (shadersEnabled && !isVideoTheme && activeThemeKey === 'sakura') {
        const currentYaw = cameraPivotRef.current ? cameraPivotRef.current.rotation.y : 0;
        const sunAngle = -Math.PI * 0.5; // Sun is in +X / Face 1 direction
        const angleDiff = ((currentYaw - sunAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
        const sunFacing = Math.max(0, Math.cos(angleDiff));

        if (sunFacing > 0.04) {
          const sunScreenX = width * 0.5 - Math.sin(angleDiff) * (width * 0.88);
          const sunScreenY = height * 0.22 - (pitchRef.current + 0.16) * (height * 0.55);

          // 1. Radiant Sunlight Bloom
          const sunGlow = ctx.createRadialGradient(sunScreenX, sunScreenY, 8, sunScreenX, sunScreenY, width * 0.75);
          sunGlow.addColorStop(0, `rgba(255, 250, 220, ${0.55 * sunFacing})`);
          sunGlow.addColorStop(0.12, `rgba(255, 215, 160, ${0.34 * sunFacing})`);
          sunGlow.addColorStop(0.42, `rgba(255, 175, 195, ${0.12 * sunFacing})`);
          sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = sunGlow;
          ctx.fillRect(0, 0, width, height);

          // 2. Volumetric God Rays (Light Shafts)
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          const time = performance.now() * 0.001;
          for (let r = 0; r < 7; r++) {
            const baseAngle = 0.38 + (r * 0.16) + Math.sin(time * 0.5 + r * 1.3) * 0.035;
            const spread = 0.05 + Math.cos(time * 0.3 + r) * 0.012;
            const rayLen = Math.max(width, height) * 1.6;

            ctx.beginPath();
            ctx.moveTo(sunScreenX, sunScreenY);
            ctx.lineTo(sunScreenX + Math.cos(baseAngle - spread) * rayLen, sunScreenY + Math.sin(baseAngle - spread) * rayLen);
            ctx.lineTo(sunScreenX + Math.cos(baseAngle + spread) * rayLen, sunScreenY + Math.sin(baseAngle + spread) * rayLen);
            ctx.closePath();

            const rayGrad = ctx.createRadialGradient(sunScreenX, sunScreenY, 15, sunScreenX, sunScreenY, rayLen * 0.85);
            const rayAlpha = (0.075 + Math.sin(time * 0.7 + r * 1.8) * 0.02) * sunFacing;
            rayGrad.addColorStop(0, `rgba(255, 245, 205, ${rayAlpha * 1.7})`);
            rayGrad.addColorStop(0.35, `rgba(255, 215, 170, ${rayAlpha})`);
            rayGrad.addColorStop(0.7, `rgba(255, 180, 200, ${rayAlpha * 0.4})`);
            rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = rayGrad;
            ctx.fill();
          }

          // 3. Anamorphic Lens Flare Streak when looking towards the sun
          if (sunFacing > 0.5) {
            const streakGrad = ctx.createLinearGradient(sunScreenX - width * 0.35, sunScreenY, sunScreenX + width * 0.35, sunScreenY);
            const streakAlpha = (sunFacing - 0.5) * 0.3;
            streakGrad.addColorStop(0, 'rgba(255, 220, 180, 0)');
            streakGrad.addColorStop(0.5, `rgba(255, 245, 220, ${streakAlpha})`);
            streakGrad.addColorStop(1, 'rgba(255, 220, 180, 0)');
            ctx.fillStyle = streakGrad;
            ctx.fillRect(sunScreenX - width * 0.35, sunScreenY - 3, width * 0.7, 6);
          }
          ctx.restore();
        }
      }

      particles.forEach((p) => {
        p.sway += p.swaySpeed;
        p.flipAngle += p.flipSpeed;
        p.rotation += p.rotSpeed;
        p.pulse += 0.03;

        // Sakura drifting motion with gentle wind breeze
        if (isSakura) {
          p.x += p.speedX + Math.sin(p.sway) * 0.8;
          p.y += p.speedY;
        } else {
          p.x += p.speedX;
          p.y += p.speedY;
        }

        // Wrap around screen bounds
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * (width + 100) - 50;
        } else if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * (width + 100) - 50;
        }
        if (p.x > width + 40) {
          p.x = -20;
          p.y = Math.random() * height;
        } else if (p.x < -40) {
          p.x = width + 20;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (isSakura) {
          // 3D tumbling fluttering Sakura Petal
          const flipScale = Math.cos(p.flipAngle);
          ctx.scale(1, Math.abs(flipScale) * 0.8 + 0.2);

          // Subtle bloom aura on petals when shaders are active
          if (shadersEnabled) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 175, 205, 0.65)';
          }

          // Authentic Minecraft pixelated sakura petal
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);

          // Subtle inner petal texture highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(-p.size * 0.5, -p.size * 0.35, p.size, p.size * 0.7);

          // Soft petal shadow
          ctx.fillStyle = 'rgba(215, 100, 140, 0.35)';
          ctx.fillRect(-p.size * 0.8, p.size * 0.2, p.size * 1.5, p.size * 0.4);
        } else if (themeConfig.particleType === 'stars') {
          // Glowing starry firefly
          const glow = Math.sin(p.pulse) * 0.3 + 0.7;
          ctx.fillStyle = 'rgba(180, 220, 255, 0.8)';
          ctx.globalAlpha = p.opacity * glow;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#55ffff';
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        } else {
          // Classic golden sunshine pixel dust
          const shimmer = Math.sin(p.pulse) * 0.25 + 0.75;
          ctx.fillStyle = 'rgba(255, 230, 150, 0.7)';
          ctx.globalAlpha = p.opacity * shimmer;
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(renderParticles);
    };

    renderParticles();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [activeThemeKey, showParticles, shadersEnabled]);

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      title="Click and drag to look around the Minecraft world"
    >
      {/* 1. Live Minecraft Shaders Video (Sakura Grove / Sakura Sunset) */}
      {isVideoTheme ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          {/* Instant crisp poster image to prevent any black flicker on load */}
          <img
            src={activeTheme.posterUrl}
            alt={activeTheme.name}
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            style={{
              transform: `scale(1.04) translate(${mouseParallax.x * -10}px, ${mouseParallax.y * -10}px)`,
              transition: 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1)'
            }}
          />

          {/* Authentic 1080p Minecraft Shaders Video Loop */}
          <video
            ref={videoRef}
            key={activeTheme.videoUrl}
            src={activeTheme.videoUrl}
            poster={activeTheme.posterUrl}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            } ${
              shadersEnabled
                ? 'filter contrast-[1.08] saturate-[1.15] brightness-[1.02]'
                : 'filter contrast-[0.98] saturate-[0.88] brightness-[0.96]'
            }`}
            style={{
              transform: `scale(1.04) translate(${mouseParallax.x * -10}px, ${mouseParallax.y * -10}px)`,
              transition: 'transform 0.25s cubic-bezier(0.2, 0, 0.2, 1), filter 0.4s ease'
            }}
          />
        </div>
      ) : (
        <>
          {/* 1. WebGL 3D Panorama Canvas (Classic Beta / Midnight) */}
          {hasWebGL ? (
            <canvas 
              ref={canvasRef} 
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null}

          {/* 2. Seamless CSS Moving Panorama Fallback */}
          {(!hasWebGL || !isLoaded) && (
            <div 
              className="absolute inset-0 w-full h-full bg-panorama-moving transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${activeTheme.path}/panorama_seamless.jpg)`
              }}
            />
          )}
        </>
      )}

      {/* 2. Floating Ambient Particles (Sakura Petals drift across the screen) */}
      {showParticles && (
        <canvas 
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-1"
        />
      )}

      {/* 3. Real-Time Shader Lighting, Glow & Readability Vignette */}
      {shadersEnabled && isVideoTheme && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-pink-500/10 via-transparent to-amber-400/10 mix-blend-screen transition-opacity duration-700" />
      )}
      {shadersEnabled && !isVideoTheme && activeThemeKey === 'sakura' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-amber-500/10 via-transparent to-pink-400/15 mix-blend-screen transition-opacity duration-700" />
      )}
      <div 
        className={`absolute inset-0 pointer-events-none ${activeTheme.vignetteOpacity} transition-colors duration-700`} 
      />
      <div 
        className="absolute inset-0 pointer-events-none shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" 
      />
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/50" 
      />

      {/* 5. Quick Theme & Shaders Selector Pill */}
      <div 
        className="absolute bottom-12 right-4 z-20 hidden md:flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 border-2 border-neutral-700 shadow-xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-pixel text-[10px] text-[#ffff55]">REALM:</span>
        {Object.values(PANORAMA_THEMES).filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).map((thm) => (
          <button
            key={thm.id}
            onClick={() => handleSelectTheme(thm.id)}
            className={`px-2 py-0.5 font-pixel text-[9px] border transition-all cursor-pointer ${
              activeThemeKey === thm.id
                ? 'bg-[#55ff55]/20 text-[#55ff55] border-[#55ff55]'
                : 'text-gray-400 border-neutral-800 hover:text-white hover:border-neutral-600'
            }`}
          >
            {thm.shortName || thm.name}
          </button>
        ))}

        <span className="text-neutral-600 text-xs font-mono">|</span>

        <button
          onClick={() => {
            if (onToggleShaders) onToggleShaders();
          }}
          className={`px-2 py-0.5 font-pixel text-[9px] border transition-all cursor-pointer ${
            shadersEnabled
              ? 'bg-[#ffff55]/20 text-[#ffff55] border-[#ffff55] shadow-sm shadow-yellow-500/20'
              : 'text-gray-500 border-neutral-800 hover:text-white'
          }`}
          title="Toggle BSL/Complementary Volumetric Shaders"
        >
          {shadersEnabled ? '✨ SHADERS ON' : 'SHADERS OFF'}
        </button>
      </div>
    </div>
  );
}

export { PANORAMA_THEMES };
