import React, { useRef, useEffect, useState } from 'react';
import { Stroke, RealisticShape, GAME_CONSTANTS } from '../types';
import { PaletteColor } from '../constants';
import sunflowerImage from '../img_sunflower.png';

interface GameCanvasProps {
  strokes?: Stroke[];
  shapes?: RealisticShape[];
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
  shapes = [],
  madness,
  onStrokeClick,
  width,
  height,
  isReality,
  fullscreen = false,
  onImageLoad,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [turbulenceBase, setTurbulenceBase] = useState(0);

  // Animate turbulence for Reality canvas - throttled for performance
  useEffect(() => {
    if (!isReality || madness === 0) return;
    
    let animationId: number;
    let time = 0;
    let lastUpdate = 0;
    
    const animate = (timestamp: number) => {
      // Throttle to ~15 FPS for SVG filter updates
      if (timestamp - lastUpdate > 66) {
        time += 0.02;
        setTurbulenceBase(time);
        lastUpdate = timestamp;
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isReality, madness]);

  // Draw image for Reality canvas
  useEffect(() => {
    if (!isReality) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = sunflowerImage;
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      if (fullscreen) {
        // For fullscreen mode: scale image to cover viewport while keeping aspect ratio
        // The canvas will be larger than viewport to allow dragging
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imgAspect = img.width / img.height;
        const viewportAspect = viewportWidth / viewportHeight;
        
        let scaledWidth: number, scaledHeight: number;
        
        // Scale to cover viewport (like object-cover but with extra margin for dragging)
        const extraScale = 1.3; // 30% extra for drag room
        if (imgAspect > viewportAspect) {
          // Image is wider - fit to height
          scaledHeight = viewportHeight * extraScale;
          scaledWidth = scaledHeight * imgAspect;
        } else {
          // Image is taller - fit to width
          scaledWidth = viewportWidth * extraScale;
          scaledHeight = scaledWidth / imgAspect;
        }
        
        // Update canvas size to match scaled image
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        
        // Report size to parent for drag boundaries
        if (onImageLoad) {
          onImageLoad({ width: scaledWidth, height: scaledHeight });
        }
        
        // Draw image to fill canvas
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
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
    };
  }, [width, height, isReality, fullscreen, onImageLoad]);

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

  // Calculate distortion values
  const m = madness / 100;
  const turbulenceFreq = 0.005 + m * 0.015; // 0.005 to 0.02
  const displacementScale = m * 50; // 0 to 50
  const saturation = Math.max(0, 100 - madness);
  const brightness = Math.max(70, 100 - madness * 0.3);
  const rotation = Math.sin(turbulenceBase * 0.5) * m * 10;
  const scale = 1 + Math.sin(turbulenceBase * 0.3) * m * 0.08;

  // Unique filter ID
  const filterId = `starfield-${isReality ? 'reality' : 'canvas'}`;

  // Determine canvas class based on mode
  const canvasClass = fullscreen 
    ? '' // Fullscreen: no extra classes, size controlled by canvas width/height
    : `w-full h-full object-contain ${!isReality ? 'cursor-crosshair bg-white' : 'bg-stone-900'} shadow-lg rounded-sm`;

  return (
    <div className={`relative ${fullscreen ? 'flex items-center justify-center' : 'w-full h-full'}`} 
         style={fullscreen ? { width: '100vw', height: '100vh' } : undefined}>
      {/* SVG Filter Definition */}
      {isReality && (
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              {/* Turbulence - creates noise pattern */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency={turbulenceFreq}
                numOctaves={2}
                seed={Math.floor(turbulenceBase * 2) % 20}
                result="turbulence"
              />
              {/* Displacement - warps image based on turbulence */}
              <feDisplacementMap
                in="SourceGraphic"
                in2="turbulence"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
              {/* Color adjustments */}
              <feColorMatrix
                in="displaced"
                type="saturate"
                values={String(saturation / 100)}
                result="desaturated"
              />
              <feComponentTransfer in="desaturated" result="final">
                <feFuncR type="linear" slope={brightness / 100} />
                <feFuncG type="linear" slope={brightness / 100} />
                <feFuncB type="linear" slope={brightness / 100} />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      )}
      
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        className={canvasClass}
        style={isReality && madness > 0 ? {
          filter: `url(#${filterId})`,
          transform: `rotate(${rotation}deg) scale(${scale})`,
          transition: 'transform 0.1s ease-out',
        } : undefined}
      />
    </div>
  );
};

export default GameCanvas;
