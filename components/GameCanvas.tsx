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
    const viewportAspect = viewportWidth / viewportHeight;
    
    let scaledWidth: number, scaledHeight: number;
    
    // Scale to cover viewport with extra margin for dragging
    const extraScale = 1.3;
    if (imgAspect > viewportAspect) {
      scaledHeight = viewportHeight * extraScale;
      scaledWidth = scaledHeight * imgAspect;
    } else {
      scaledWidth = viewportWidth * extraScale;
      scaledHeight = scaledWidth / imgAspect;
    }
    
    setCanvasSize({ width: scaledWidth, height: scaledHeight });
    
    if (onImageLoad) {
      onImageLoad({ width: scaledWidth, height: scaledHeight });
    }
  }, [isReality, fullscreen, imageLoaded, onImageLoad]);

  // Animate for Reality canvas - using simple time-based animation
  useEffect(() => {
    if (!isReality || madness === 0) return;
    
    let animationId: number;
    let lastUpdate = 0;
    
    const animate = (timestamp: number) => {
      // Throttle to ~15 FPS for performance
      if (timestamp - lastUpdate > 66) {
        setAnimTime(t => t + 0.02);
        lastUpdate = timestamp;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isReality, madness]);

  // Draw image for Reality canvas
  useEffect(() => {
    if (!isReality || !imageLoaded || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    if (fullscreen) {
      // Draw image to fill canvas
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
    } else {
      // Normal mode: fit image in canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawWidth = width, drawHeight = height, drawX = 0, drawY = 0;
      
      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
        drawX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
        drawY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }
  }, [width, height, isReality, fullscreen, imageLoaded, canvasSize]);

  // Static rendering for Painting canvas
  useEffect(() => {
    if (isReality) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff'; // White background
    ctx.fillRect(0, 0, width, height);

    strokes.forEach(stroke => {
      if (stroke.currentColor) {
        ctx.fillStyle = stroke.currentColor;
        ctx.fill(stroke.path);
      } else {
        ctx.strokeStyle = '#1a1a1a'; // Black outline
        ctx.lineWidth = 1.5;
        ctx.stroke(stroke.path);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; // Slight fill for visibility
        ctx.fill(stroke.path);
      }
    });
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

  // Calculate distortion values using CSS filters (iOS Safari compatible)
  const m = madness / 100;
  const saturation = Math.max(0, 100 - madness);
  const brightness = Math.max(70, 100 - madness * 0.3);
  const blur = m * 2; // 0 to 2px blur
  const hueRotate = Math.sin(animTime * 0.5) * m * 20; // Subtle hue shift
  const rotation = Math.sin(animTime * 0.5) * m * 8;
  const scale = 1 + Math.sin(animTime * 0.3) * m * 0.06;

  // Determine canvas class based on mode
  const canvasClass = fullscreen 
    ? '' // Fullscreen: no extra classes, size controlled by canvas width/height
    : `w-full h-full object-contain ${!isReality ? 'cursor-crosshair bg-white' : 'bg-stone-900'} shadow-lg rounded-sm`;

  // Canvas dimensions
  const actualWidth = fullscreen ? canvasSize.width : width;
  const actualHeight = fullscreen ? canvasSize.height : height;

  // CSS filter string for iOS Safari compatibility (no SVG filters)
  const cssFilter = isReality && madness > 0 
    ? `saturate(${saturation}%) brightness(${brightness}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`
    : undefined;

  // Canvas style with Safari vendor prefixes
  const canvasStyle: React.CSSProperties = isReality && madness > 0 ? {
    filter: cssFilter,
    transform: `rotate(${rotation}deg) scale(${scale})`,
    transition: 'transform 0.1s ease-out, filter 0.1s ease-out',
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
