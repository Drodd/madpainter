import React, { useRef, useEffect, useState } from 'react';
import { Stroke } from '../types';
import { PaletteColor } from '../constants';
import sunflowerImage from '../img_sunflower.png';

interface GameCanvasProps {
  strokes?: Stroke[];
  madness: number;
  selectedColor: PaletteColor;
  onStrokeClick: (strokeId: string) => void;
  width: number;
  height: number;
  isReality: boolean;
  fullscreen?: boolean; // For immersive background mode
  onImageLoad?: (size: { width: number; height: number }) => void; // Report image size
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  strokes = [],
  madness,
  onStrokeClick,
  width,
  height,
  isReality,
  fullscreen = false,
  onImageLoad,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animTime, setAnimTime] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Pre-load image once
  useEffect(() => {
    if (!isReality) return;
    
    const img = new Image();
    img.src = sunflowerImage;
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      console.error('Failed to load sunflower image');
    };
  }, [isReality]);

  // Calculate canvas size for fullscreen mode
  useEffect(() => {
    if (!isReality || !fullscreen || !imageLoaded || !imageRef.current) return;
    
    const img = imageRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const imgAspect = img.width / img.height;
    
    // Fit height to viewport, allow extra width for horizontal dragging only
    const scaledHeight = viewportHeight;
    const scaledWidth = scaledHeight * imgAspect;
    
    // If image is narrower than viewport, scale to fit width instead
    const finalWidth = Math.max(scaledWidth, viewportWidth * 1.3);
    const finalHeight = finalWidth / imgAspect;
    
    setCanvasSize({ width: finalWidth, height: finalHeight });
    
    if (onImageLoad) {
      onImageLoad({ width: finalWidth, height: finalHeight });
    }
  }, [isReality, fullscreen, imageLoaded, onImageLoad]);

  // Animate and draw for Reality canvas with wave distortion
  useEffect(() => {
    if (!isReality || !imageLoaded || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    let animationId: number;
    let time = 0;
    
    // Calculate draw dimensions once
    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;
    const cw = fullscreen ? canvasSize.width : width;
    const ch = fullscreen ? canvasSize.height : height;
    
    if (fullscreen) {
      drawWidth = cw;
      drawHeight = ch;
      drawX = 0;
      drawY = 0;
    } else {
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      drawX = 0;
      drawY = 0;
      
      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
        drawX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
        drawY = (height - drawHeight) / 2;
      }
    }
    
    const draw = () => {
      const m = madness / 100;
      
      // Clear canvas
      ctx.clearRect(0, 0, cw, ch);
      
      if (!fullscreen) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
      }
      
      // Apply color filters via globalCompositeOperation workaround
      // First draw the distorted image
      if (madness === 0) {
        // No distortion - simple draw
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      } else {
        // Wave distortion effect - draw image in horizontal strips with offset
        const stripHeight = 10; // Height of each strip
        const numStrips = Math.ceil(drawHeight / stripHeight);
        const waveAmplitude = m * 20; // Max horizontal displacement (0-20px)
        const waveFrequency = 0.015 + m * 0.02; // Wave frequency
        const verticalWave = m * 10; // Vertical displacement
        
        for (let i = 0; i < numStrips; i++) {
          const y = i * stripHeight;
          const srcY = (y / drawHeight) * img.height;
          const srcHeight = (stripHeight / drawHeight) * img.height;
          
          // Calculate wave offset for this strip
          const waveOffset = Math.sin(y * waveFrequency + time * 2) * waveAmplitude;
          const vertOffset = Math.cos(y * waveFrequency * 0.7 + time * 1.5) * verticalWave * 0.3;
          
          // Draw strip with offset
          ctx.drawImage(
            img,
            0, srcY, img.width, srcHeight, // Source rectangle
            drawX + waveOffset, drawY + y + vertOffset, drawWidth, stripHeight + 1 // Dest rectangle (+1 to avoid gaps)
          );
        }
        // Color effects are now handled via CSS filter for better compatibility
      }
    };
    
    if (madness === 0) {
      // Static draw when no madness
      draw();
    } else {
      // Animate when madness > 0
      let lastUpdate = 0;
      const animate = (timestamp: number) => {
        // Throttle to ~20 FPS for good performance
        if (timestamp - lastUpdate > 50) {
          time += 0.05;
          setAnimTime(time);
          draw();
          lastUpdate = timestamp;
        }
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [width, height, isReality, fullscreen, imageLoaded, canvasSize, madness]);

  // Animated rendering for Painting canvas with breathing effect on filled strokes
  useEffect(() => {
    if (isReality) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pre-calculate background to an offscreen canvas (only once)
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;
    
    // Draw hand-painted style background with texture and soft transition
    const horizonY = height * 0.65;
    const transitionHeight = height * 0.08;
    
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9999) * 10000;
      return x - Math.floor(x);
    };
    
    // Draw sky gradient with texture
    for (let y = 0; y < horizonY + transitionHeight; y += 3) {
      for (let x = 0; x < width; x += 4) {
        const seed = x * 1000 + y;
        const noise = (seededRandom(seed) - 0.5) * 15;
        let skyBlend = 1;
        if (y > horizonY - transitionHeight / 2) {
          skyBlend = Math.max(0, 1 - (y - (horizonY - transitionHeight / 2)) / transitionHeight);
        }
        const skyR = 210 + noise * 0.5;
        const skyG = 235 + noise * 0.3;
        const skyB = 245 + noise * 0.2;
        const earthR = 235 + noise * 0.6;
        const earthG = 220 + noise * 0.5;
        const earthB = 195 + noise * 0.4;
        const r = Math.round(skyR * skyBlend + earthR * (1 - skyBlend));
        const g = Math.round(skyG * skyBlend + earthG * (1 - skyBlend));
        const b = Math.round(skyB * skyBlend + earthB * (1 - skyBlend));
        bgCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        bgCtx.fillRect(x, y, 5, 4);
      }
    }
    
    // Draw table area with texture
    for (let y = horizonY - transitionHeight / 2; y < height; y += 3) {
      for (let x = 0; x < width; x += 4) {
        const seed = x * 1000 + y + 5000;
        const noise = (seededRandom(seed) - 0.5) * 20;
        let earthBlend = 1;
        if (y < horizonY + transitionHeight / 2) {
          earthBlend = Math.max(0, (y - (horizonY - transitionHeight / 2)) / transitionHeight);
        }
        const r = Math.round(235 + noise * 0.7);
        const g = Math.round(218 + noise * 0.5);
        const b = Math.round(190 + noise * 0.3);
        bgCtx.globalAlpha = earthBlend;
        bgCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        bgCtx.fillRect(x, y, 5, 4);
      }
    }
    bgCtx.globalAlpha = 1;
    
    // Add subtle brush stroke texture overlay
    bgCtx.globalAlpha = 0.03;
    for (let i = 0; i < 80; i++) {
      const seed = i * 123;
      const sx = seededRandom(seed) * width;
      const sy = seededRandom(seed + 1) * height;
      const len = 20 + seededRandom(seed + 2) * 40;
      const angle = seededRandom(seed + 3) * Math.PI * 2;
      bgCtx.strokeStyle = seededRandom(seed + 4) > 0.5 ? '#8B7355' : '#6B8E9F';
      bgCtx.lineWidth = 2 + seededRandom(seed + 5) * 3;
      bgCtx.lineCap = 'round';
      bgCtx.beginPath();
      bgCtx.moveTo(sx, sy);
      bgCtx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
      bgCtx.stroke();
    }
    bgCtx.globalAlpha = 1;

    let animationId: number;
    let time = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw pre-rendered background
      ctx.drawImage(bgCanvas, 0, 0);

      // Draw strokes with breathing effect for filled ones
      strokes.forEach((stroke, index) => {
        if (stroke.currentColor) {
          // Breathing effect - each stroke has slightly different phase
          const phase = index * 0.5;
          const breathe = Math.sin(time * 2 + phase) * 0.5 + 0.5; // 0 to 1
          
          // Subtle glow/brightness variation
          const glowIntensity = 0.08 + breathe * 0.12; // 0.08 to 0.2
          
          // Draw the stroke with base color
          ctx.fillStyle = stroke.currentColor;
          ctx.fill(stroke.path);
          
          // Add subtle highlight overlay for "alive" effect
          ctx.globalAlpha = glowIntensity;
          ctx.fillStyle = '#FFFFFF';
          ctx.fill(stroke.path);
          ctx.globalAlpha = 1;
          
          // Add very subtle outer glow
          ctx.shadowColor = stroke.currentColor;
          ctx.shadowBlur = 2 + breathe * 4;
          ctx.fillStyle = stroke.currentColor;
          ctx.fill(stroke.path);
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = '#3a3a3a';
          ctx.lineWidth = 1.5;
          ctx.stroke(stroke.path);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill(stroke.path);
        }
      });
      
      // Check if any strokes are filled to determine if we need animation
      const hasFilledStrokes = strokes.some(s => s.currentColor);
      
      if (hasFilledStrokes) {
        time += 0.02;
        animationId = requestAnimationFrame(draw);
      }
    };
    
    // Initial draw
    draw();
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [strokes, width, height, isReality]);

  // Click handler - accounts for object-contain centering
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReality) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Calculate the actual rendered size accounting for object-contain
    const canvasAspect = width / height;
    const rectAspect = rect.width / rect.height;
    
    let renderedWidth: number, renderedHeight: number;
    let offsetX = 0, offsetY = 0;
    
    if (canvasAspect > rectAspect) {
      // Canvas is wider - fit to width, center vertically
      renderedWidth = rect.width;
      renderedHeight = rect.width / canvasAspect;
      offsetY = (rect.height - renderedHeight) / 2;
    } else {
      // Canvas is taller - fit to height, center horizontally
      renderedHeight = rect.height;
      renderedWidth = rect.height * canvasAspect;
      offsetX = (rect.width - renderedWidth) / 2;
    }
    
    // Get click position relative to the actual rendered canvas area
    const clickX = e.clientX - rect.left - offsetX;
    const clickY = e.clientY - rect.top - offsetY;
    
    // Check if click is within the rendered area
    if (clickX < 0 || clickX > renderedWidth || clickY < 0 || clickY > renderedHeight) {
      return;
    }
    
    // Scale to canvas coordinates
    const finalX = (clickX / renderedWidth) * width;
    const finalY = (clickY / renderedHeight) * height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = strokes.length - 1; i >= 0; i--) {
      if (ctx.isPointInPath(strokes[i].path, finalX, finalY)) {
        onStrokeClick(strokes[i].id);
        break;
      }
    }
  };

  // Calculate shake/rotation values and color effects
  const m = madness / 100;
  const rotation = Math.sin(animTime * 0.5) * m * 5; // Subtle rotation shake
  const scale = 1 + Math.sin(animTime * 0.3) * m * 0.03; // Subtle scale pulse
  const saturation = Math.max(0, 100 - madness * 0.8); // Desaturate as madness increases
  const brightness = Math.max(75, 100 - madness * 0.25); // Darken slightly

  // Determine canvas class based on mode
  const canvasClass = fullscreen 
    ? '' // Fullscreen: no extra classes, size controlled by canvas width/height
    : `w-full h-full object-contain ${!isReality ? 'cursor-crosshair bg-white' : 'bg-stone-900'} shadow-lg rounded-sm`;

  // Canvas dimensions
  const actualWidth = fullscreen ? canvasSize.width : width;
  const actualHeight = fullscreen ? canvasSize.height : height;

  // Canvas style - rotation/scale shake + CSS filter for color effects (better compatibility)
  const canvasStyle: React.CSSProperties = isReality && madness > 0 ? {
    transform: `rotate(${rotation}deg) scale(${scale})`,
    filter: `saturate(${saturation}%) brightness(${brightness}%)`,
    transition: 'transform 0.08s ease-out, filter 0.1s ease-out',
  } : {};

  // Show loading placeholder for fullscreen reality canvas while image loads
  if (isReality && fullscreen && !imageLoaded) {
    return (
      <div 
        className="flex items-center justify-center"
        style={{ 
          width: '100vw', 
          height: '100vh',
          background: 'linear-gradient(135deg, #9A8B7A 0%, #7A6B5A 100%)',
        }}
      >
        <div className="w-8 h-8 border-4 border-stone-400 border-t-stone-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`relative ${fullscreen ? 'flex items-center justify-center' : 'w-full h-full'}`} 
         style={fullscreen ? { width: '100vw', height: '100vh' } : undefined}>
      <canvas
        ref={canvasRef}
        width={actualWidth}
        height={actualHeight}
        onClick={handleClick}
        className={canvasClass}
        style={canvasStyle}
      />
    </div>
  );
};

export default GameCanvas;
