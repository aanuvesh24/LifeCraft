import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

const PANORAMA_THEMES = {
  classic: {
    id: 'classic',
    name: 'Classic Beta',
    subtitle: 'Beta 1.7.3 Nostalgia',
    path: '/panoramas/classic',
    particleColor: 'rgba(255, 230, 150, 0.7)',
    particleType: 'dust',
    vignetteOpacity: 'bg-black/35'
  },
  cherry: {
    id: 'cherry',
    name: 'Cherry Grove',
    subtitle: 'Trails & Tales 1.20',
    path: '/panoramas/cherry',
    particleColor: 'rgba(255, 182, 193, 0.85)',
    particleType: 'petals',
    vignetteOpacity: 'bg-black/30'
  },
  dark: {
    id: 'dark',
    name: 'Midnight Shaders',
    subtitle: 'Nighttime Campfire & Stars',
    path: '/panoramas/dark',
    particleColor: 'rgba(180, 220, 255, 0.8)',
    particleType: 'stars',
    vignetteOpacity: 'bg-black/20'
  }
};

export default function MinecraftPanorama({
  theme = 'classic',
  speed = 1.0,
  isPaused = false,
  showParticles = true,
  onThemeChange
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particleCanvasRef = useRef(null);

  const [internalTheme, setInternalTheme] = useState(theme);
  const activeThemeKey = theme || internalTheme || 'classic';

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

  // Setup Three.js Scene and Cube Texture
  useEffect(() => {
    if (!hasWebGL) return;
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

    const themeConfig = PANORAMA_THEMES[activeThemeKey] || PANORAMA_THEMES.classic;
    const count = themeConfig.particleType === 'petals' ? 36 : 28;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      speedX: themeConfig.particleType === 'petals' ? (Math.random() * 1.5 - 0.2) : (Math.random() * 0.6 - 0.3),
      speedY: themeConfig.particleType === 'petals' ? (Math.random() * 1.2 + 0.6) : (Math.random() * -0.6 - 0.2),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity: Math.random() * 0.6 + 0.3,
      pulse: Math.random() * Math.PI
    }));

    const renderParticles = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        p.pulse += 0.03;

        // Wrap around bounds
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        else if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (themeConfig.particleType === 'petals') {
          // Minecraft Cherry Blossom Petal (pixelated square/petal)
          ctx.fillStyle = themeConfig.particleColor;
          ctx.globalAlpha = p.opacity;
          ctx.fillRect(-p.size, -p.size * 0.7, p.size * 2, p.size * 1.4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
        } else if (themeConfig.particleType === 'stars') {
          // Glowing starry firefly
          const glow = Math.sin(p.pulse) * 0.3 + 0.7;
          ctx.fillStyle = themeConfig.particleColor;
          ctx.globalAlpha = p.opacity * glow;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#55ffff';
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        } else {
          // Classic golden sunshine pixel dust
          const shimmer = Math.sin(p.pulse) * 0.25 + 0.75;
          ctx.fillStyle = themeConfig.particleColor;
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
  }, [activeThemeKey, showParticles]);

  const activeTheme = PANORAMA_THEMES[activeThemeKey] || PANORAMA_THEMES.classic;

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      title="Click and drag to look around the Minecraft world"
    >
      {/* 1. WebGL 3D Panorama Canvas */}
      {hasWebGL ? (
        <canvas 
          ref={canvasRef} 
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : null}

      {/* 2. Seamless CSS Moving Panorama Fallback (also visible while textures load) */}
      {(!hasWebGL || !isLoaded) && (
        <div 
          className="absolute inset-0 w-full h-full bg-panorama-moving transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${activeTheme.path}/panorama_seamless.jpg)`
          }}
        />
      )}

      {/* 3. Floating Ambient Particles Overlay */}
      {showParticles && (
        <canvas 
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-1"
        />
      )}

      {/* 4. Authentic Minecraft Vignette & Readability Gradient */}
      <div 
        className={`absolute inset-0 pointer-events-none ${activeTheme.vignetteOpacity} transition-colors duration-700`} 
      />
      <div 
        className="absolute inset-0 pointer-events-none shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" 
      />
      <div 
        className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/50" 
      />

      {/* 5. Quick Theme Selector Pill (Floating bottom-right or accessible anytime) */}
      <div 
        className="absolute bottom-12 right-4 z-20 hidden md:flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 border-2 border-neutral-700 shadow-xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-pixel text-[10px] text-[#ffff55] mr-1">REALM:</span>
        {Object.values(PANORAMA_THEMES).map((thm) => (
          <button
            key={thm.id}
            onClick={() => handleSelectTheme(thm.id)}
            className={`px-2 py-0.5 font-pixel text-[9px] border transition-all cursor-pointer ${
              activeThemeKey === thm.id
                ? 'bg-[#55ff55]/20 text-[#55ff55] border-[#55ff55]'
                : 'text-gray-400 border-neutral-800 hover:text-white hover:border-neutral-600'
            }`}
          >
            {thm.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export { PANORAMA_THEMES };
