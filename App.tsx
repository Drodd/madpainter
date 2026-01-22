import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { generateSunflowersData } from './utils/strokeGenerator';
import { Stroke, RealisticShape, GameState, GAME_CONSTANTS } from './types';
import { PALETTE_COLORS, PaletteColor, PALETTE_LABELS } from './constants';
import { Language, getTranslation, getRandomHint, getRandomSatisfied } from './utils/i18n';

// Palette icon SVG
const PaletteIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3B6B9A" strokeWidth="1.5">
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/>
    <circle cx="7.5" cy="11.5" r="1.5" fill="#3B6B9A"/>
    <circle cx="10.5" cy="7.5" r="1.5" fill="#3B6B9A"/>
    <circle cx="14.5" cy="7.5" r="1.5" fill="#3B6B9A"/>
    <circle cx="17.5" cy="11.5" r="1.5" fill="#3B6B9A"/>
  </svg>
);

// Play icon SVG
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
  </svg>
);

// Refresh icon SVG  
const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

// Brush icon for palette center
const BrushIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3D2B1F" strokeWidth="1.5">
    <path d="M20.71 4.04c-.35-.35-.79-.53-1.24-.53s-.89.18-1.24.53l-7.4 7.4c-.38.38-.59.88-.59 1.41v2.15c0 .55.45 1 1 1h2.15c.53 0 1.03-.21 1.41-.59l7.4-7.4c.69-.69.69-1.8 0-2.48z"/>
    <path d="M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81"/>
  </svg>
);

const App: React.FC = () => {
  // Game State
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<RealisticShape[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    madness: 0,
    startTime: 0,
    endTime: null,
  });
  const [selectedColor, setSelectedColor] = useState<PaletteColor>(PALETTE_COLORS[0]);
  const [paintingsCompleted, setPaintingsCompleted] = useState(0);

  // Language state (default to Chinese)
  const [language, setLanguage] = useState<Language>('zh');
  const t = getTranslation(language);

  // Van Gogh's Voice state
  const [hintColor, setHintColor] = useState<PaletteColor | null>(null);
  const [hintMessage, setHintMessage] = useState<string>('');
  const [hintRewarded, setHintRewarded] = useState<boolean>(false);
  const [hintVisible, setHintVisible] = useState<boolean>(false);
  const [isSatisfiedMessage, setIsSatisfiedMessage] = useState<boolean>(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const satisfiedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStateRef = useRef(gameState);
  
  // Keep gameStateRef in sync with gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Drag state for background
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const bgRef = useRef<HTMLDivElement>(null);
  const [bgSize, setBgSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Dimensions
  const width = GAME_CONSTANTS.CANVAS_WIDTH;
  const height = GAME_CONSTANTS.CANVAS_HEIGHT;

  // --- Logic: Get available colors for hints ---
  const getAvailableHintColors = useCallback((): PaletteColor[] => {
    // Get all unfilled strokes
    const unfilledStrokes = strokes.filter(s => s.currentColor !== s.targetColor);
    
    // Extract unique target colors from unfilled strokes
    const unfilledColors = new Set<PaletteColor>();
    unfilledStrokes.forEach(s => {
      unfilledColors.add(s.targetColor as PaletteColor);
    });
    
    // Exclude currently selected color
    const availableColors = Array.from(unfilledColors).filter(
      color => color !== selectedColor
    );
    
    return availableColors;
  }, [strokes, selectedColor]);

  // --- Logic: Trigger Van Gogh's hint ---
  const triggerHint = useCallback(() => {
    const availableColors = getAvailableHintColors();
    
    // If no available colors, don't show hint
    if (availableColors.length === 0) {
      setHintVisible(false);
      setHintColor(null);
      setHintMessage('');
      setHintRewarded(false);
      return;
    }
    
    // Randomly select a color
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    const hint = getRandomHint(randomColor, language);
    
    console.log('[Van Gogh] Triggering hint for color:', randomColor, 'Message:', hint);
    
    setHintColor(randomColor);
    setHintMessage(hint);
    setHintVisible(true);
    setHintRewarded(false);
    setIsSatisfiedMessage(false);
  }, [getAvailableHintColors, language]);

  // --- Logic: Start Game ---
  const startGame = useCallback(() => {
    const levelData = generateSunflowersData(width, height);
    setStrokes(levelData.strokes);
    setShapes(levelData.shapes);
    setGameState({
      status: 'playing',
      madness: 0,
      startTime: Date.now(),
      endTime: null,
    });
    setSelectedColor(PALETTE_COLORS[0]);
    setDragOffset({ x: 0, y: 0 }); // Reset drag position
    // Reset hint state
    setHintColor(null);
    setHintMessage('');
    setHintRewarded(false);
    setHintVisible(false);
    setIsSatisfiedMessage(false);
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (satisfiedTimerRef.current) {
      clearTimeout(satisfiedTimerRef.current);
      satisfiedTimerRef.current = null;
    }
  }, [width, height]);

  // --- Logic: Game Loop (Madness Increase) ---
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.status !== 'playing') return prev;

        const newMadness = prev.madness + GAME_CONSTANTS.MADNESS_INCREASE_RATE;
        
        if (newMadness >= 100) {
          return { ...prev, status: 'lost', madness: 100, endTime: Date.now() };
        }
        
        return { ...prev, madness: newMadness };
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState.status]);

  // --- Logic: Van Gogh's Voice Trigger ---
  // Separate effect to handle madness threshold crossing
  useEffect(() => {
    if (gameState.status !== 'playing') {
      // Clear timers when not playing
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      setHintVisible(false);
      return;
    }

    // Only trigger when madness > 50%
    if (gameState.madness <= 50) {
      setHintVisible(false);
      setHintColor(null);
      setHintMessage('');
      setHintRewarded(false);
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
      return;
    }

    // When madness crosses 50%, schedule first hint if none is visible and no timer is running
    if (!hintVisible && !hintTimerRef.current) {
      const delay = 1000 + Math.random() * 2000; // 1000-3000ms
      console.log('[Van Gogh] Scheduling hint in', delay, 'ms. Madness:', gameState.madness);
      hintTimerRef.current = setTimeout(() => {
        const currentState = gameStateRef.current;
        console.log('[Van Gogh] Timer fired. Status:', currentState.status, 'Madness:', currentState.madness);
        if (currentState.status === 'playing' && currentState.madness > 50) {
          triggerHint();
        }
        hintTimerRef.current = null; // Clear ref after triggering
      }, delay);
    }
  }, [gameState.status, gameState.madness, hintVisible, triggerHint]);

  // Separate effect to handle hint reward and re-triggering
  useEffect(() => {
    if (gameState.status !== 'playing' || gameState.madness <= 50) {
      return;
    }

    // If hint was rewarded and satisfied message is done, schedule next hint
    if (hintRewarded && !hintVisible && !hintTimerRef.current) {
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      console.log('[Van Gogh] Scheduling next hint after reward in', delay, 'ms');
      hintTimerRef.current = setTimeout(() => {
        const currentState = gameStateRef.current;
        console.log('[Van Gogh] Reward timer fired. Status:', currentState.status, 'Madness:', currentState.madness);
        if (currentState.status === 'playing' && currentState.madness > 50) {
          triggerHint();
        }
        hintTimerRef.current = null;
      }, delay);
    }
  }, [hintRewarded, hintVisible, gameState.status, gameState.madness, triggerHint]);

  // --- Logic: Check Win Condition ---
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    const allFilled = strokes.every(s => s.currentColor === s.targetColor);
    
    if (allFilled && strokes.length > 0) {
      setPaintingsCompleted(prev => prev + 1);
      setGameState(prev => ({
        ...prev,
        status: 'won',
        endTime: Date.now(),
      }));
    }
  }, [strokes, gameState.status]);

  // --- Logic: Handle Painting ---
  const handleStrokeClick = (strokeId: string) => {
    if (gameState.status !== 'playing') return;

    setStrokes(prevStrokes => {
      const index = prevStrokes.findIndex(s => s.id === strokeId);
      if (index === -1) return prevStrokes;

      const stroke = prevStrokes[index];
      
      // If already filled with correct color, do nothing
      if (stroke.currentColor === stroke.targetColor) return prevStrokes;

      const isCorrect = selectedColor === stroke.targetColor;
      
      // Check if this is the hinted color and not yet rewarded
      const isHintedColor = hintColor !== null && selectedColor === hintColor && !hintRewarded;
      
      // Update Madness
      setGameState(gs => {
        let change = 0;
        if (isCorrect) {
          if (isHintedColor) {
            // Reward for following hint: reduce madness by 30% (absolute)
            change = -30;
          } else {
            change = -GAME_CONSTANTS.MADNESS_REWARD;
          }
        } else {
          change = GAME_CONSTANTS.MADNESS_PENALTY;
        }
        
        const newMad = Math.max(0, Math.min(100, gs.madness + change));
        return {
          ...gs,
          madness: newMad,
          status: newMad >= 100 ? 'lost' : gs.status,
          endTime: newMad >= 100 ? Date.now() : null
        };
      });

      // If this is the hinted color and correct, show satisfied message
      if (isHintedColor && isCorrect) {
        setHintRewarded(true);
        setIsSatisfiedMessage(true);
        setHintMessage(getRandomSatisfied(language));
        
        // Clear existing satisfied timer and hint timer
        if (satisfiedTimerRef.current) {
          clearTimeout(satisfiedTimerRef.current);
        }
        if (hintTimerRef.current) {
          clearTimeout(hintTimerRef.current);
          hintTimerRef.current = null;
        }
        
        // Show satisfied message for 1.5 seconds, then clear and let useEffect handle next hint
        satisfiedTimerRef.current = setTimeout(() => {
          setIsSatisfiedMessage(false);
          setHintVisible(false);
          setHintColor(null);
          setHintMessage('');
          // Note: Keep hintRewarded as true so useEffect can detect it and schedule next hint
        }, 1500);
      }

      // Update Stroke
      const newStroke = { ...stroke, currentColor: selectedColor };
      const newStrokes = [...prevStrokes];
      newStrokes[index] = newStroke;
      return newStrokes;
    });
  };

  // --- Drag Handlers ---
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState.status !== 'playing') return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
    setIsDragging(true);
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Calculate boundaries based on image overflow
    // The image is scaled to cover the viewport, so it may extend beyond
    const maxX = Math.max(0, (bgSize.width - viewportSize.width) / 2);
    const maxY = Math.max(0, (bgSize.height - viewportSize.height) / 2);
    
    const newX = Math.max(-maxX, Math.min(maxX, dragStartRef.current.offsetX + deltaX));
    const newY = Math.max(-maxY, Math.min(maxY, dragStartRef.current.offsetY + deltaY));
    
    setDragOffset({ x: newX, y: newY });
  }, [isDragging, bgSize, viewportSize]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse/touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Track viewport size
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // --- UI Helpers ---
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const timeElapsed = gameState.endTime && gameState.startTime 
    ? gameState.endTime - gameState.startTime 
    : Date.now() - gameState.startTime;

  // Circular palette positions (6 colors around center)
  const paletteRadius = 52;
  const getColorPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: Math.cos(angle) * paletteRadius,
      y: Math.sin(angle) * paletteRadius,
    };
  };

  return (
    <div className="h-screen w-full select-none overflow-hidden relative">
      
      {/* START SCREEN OVERLAY */}
      {gameState.status === 'idle' && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'linear-gradient(135deg, #9A8B7A 0%, #7A6B5A 100%)' }}
        >
          {/* Language Switcher */}
          <div className="absolute top-6 right-6 z-10">
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('zh')}
                className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
                  language === 'zh'
                    ? 'bg-#3D2B1F text-#F5F0E1'
                    : 'bg-#F5F0E1 text-#3D2B1F hover:bg-#E5D5C5'
                }`}
                style={{
                  backgroundColor: language === 'zh' ? '#3D2B1F' : '#F5F0E1',
                  color: language === 'zh' ? '#F5F0E1' : '#3D2B1F',
                  border: '2px solid #3D2B1F',
                  boxShadow: language === 'zh' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                中文
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
                  language === 'en'
                    ? 'bg-#3D2B1F text-#F5F0E1'
                    : 'bg-#F5F0E1 text-#3D2B1F hover:bg-#E5D5C5'
                }`}
                style={{
                  backgroundColor: language === 'en' ? '#3D2B1F' : '#F5F0E1',
                  color: language === 'en' ? '#F5F0E1' : '#3D2B1F',
                  border: '2px solid #3D2B1F',
                  boxShadow: language === 'en' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                English
              </button>
            </div>
          </div>

          <div className="card p-10 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <PaletteIcon />
            </div>
            <h1 className="font-caps text-3xl mb-3" style={{ color: '#3D2B1F' }}>
              {t.title}
            </h1>
            <p className="font-body text-lg italic mb-6" style={{ color: '#5C4033' }}>
              {t.subtitle}
            </p>
            
            <div className="card p-5 mb-6 text-left" style={{ backgroundColor: '#FDFBF5' }}>
              <ol className="space-y-2 font-body text-base" style={{ color: '#3D2B1F' }}>
                <li>{t.instruction1}</li>
                <li>{t.instruction2}</li>
                <li>{t.instruction3}</li>
                <li>{t.instruction4}</li>
                <li>{t.instruction5}</li>
              </ol>
            </div>
            
            <button onClick={startGame} className="btn-primary flex items-center justify-center gap-2 mx-auto">
              <PlayIcon />
              {t.startButton}
            </button>
          </div>
        </div>
      )}

      {/* LOST SCREEN OVERLAY */}
      {gameState.status === 'lost' && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'linear-gradient(135deg, #9A8B7A 0%, #6A5B4A 100%)' }}
        >
          <div className="card p-10 max-w-sm text-center">
            <h1 className="font-caps text-3xl mb-3" style={{ color: '#8B2942' }}>
              {t.consumed}
            </h1>
            <p className="font-body text-lg mb-6" style={{ color: '#5C4033' }}>
              {t.lostMessage}
            </p>

            {/* Unfinished artwork preview */}
            <div
              className="mx-auto mb-6 pointer-events-none"
              style={{
                width: '220px',
                aspectRatio: `${width}/${height}`,
                border: '3px solid #3D2B1F',
                borderRadius: '4px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                background: '#F5F0E1',
              }}
            >
              <GameCanvas
                strokes={strokes}
                madness={0}
                width={width}
                height={height}
                isReality={false}
                onStrokeClick={() => {}}
                selectedColor={selectedColor}
              />
            </div>
            
            <button onClick={startGame} className="btn-secondary flex items-center justify-center gap-2 mx-auto">
              <RefreshIcon />
              {t.tryAgainButton}
            </button>
          </div>
        </div>
      )}

      {/* WON SCREEN OVERLAY */}
      {gameState.status === 'won' && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'linear-gradient(135deg, #B5A890 0%, #8B9B7A 100%)' }}
        >
          <div className="card p-10 max-w-sm text-center">
            <h1 className="font-caps text-3xl mb-3" style={{ color: '#2D5A3D' }}>
              {t.masterpiece}
            </h1>
            <p className="font-body text-lg mb-6" style={{ color: '#5C4033' }}>
              {t.wonMessage}
            </p>
        
            {/* Final artwork preview */}
            <div
              className="mx-auto mb-6 pointer-events-none"
              style={{
                width: '220px',
                aspectRatio: `${width}/${height}`,
                border: '3px solid #3D2B1F',
                borderRadius: '4px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                background: '#F5F0E1',
              }}
            >
              <GameCanvas
                strokes={strokes}
                madness={0}
                width={width}
                height={height}
                isReality={false}
                onStrokeClick={() => {}}
                selectedColor={selectedColor}
              />
            </div>
            
            <div className="mb-6">
              <div className="font-caps text-4xl" style={{ color: '#3D2B1F' }}>
                {formatTime(timeElapsed)}
              </div>
              <div className="font-caps text-sm tracking-widest" style={{ color: '#8B7355' }}>
                {t.timeTaken}
              </div>
            </div>
            
            <button onClick={startGame} className="btn-primary flex items-center justify-center gap-2 mx-auto">
              <PlayIcon />
              {t.paintAnotherButton}
            </button>
          </div>
        </div>
      )}

      {/* MAIN GAME AREA: Immersive Layout */}
      {gameState.status === 'playing' && (
        <>
          {/* BACKGROUND: Full-screen Reality (Draggable) */}
          <div 
            ref={bgRef}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div
              style={{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
                <GameCanvas 
                  shapes={shapes}
                  madness={gameState.madness} 
                  width={width} 
                  height={height} 
                  isReality={true} 
                  onStrokeClick={() => {}} 
                  selectedColor={selectedColor}
                fullscreen={true}
                onImageLoad={(size) => setBgSize(size)}
                />
          </div>
        </div>

          {/* FOREGROUND: Canvas Overlay (Bottom-Right) */}
          <div 
            className="absolute bottom-4 right-4 z-20"
            style={{
              width: '45%',
              maxWidth: '400px',
              minWidth: '280px',
              aspectRatio: `${width}/${height}`,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 3px #3D2B1F',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
                <GameCanvas 
                  strokes={strokes} 
                  madness={0} 
                  width={width} 
                  height={height} 
                  isReality={false} 
                  onStrokeClick={handleStrokeClick} 
                  selectedColor={selectedColor}
                />
        </div>

          {/* CIRCULAR PALETTE (Bottom-Left) */}
          <div 
            className="absolute bottom-6 left-6 z-30"
            style={{
              width: '140px',
              height: '140px',
            }}
          >
            {/* Palette background circle */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: '#F5F0E1',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255,255,255,0.5)',
                border: '3px solid #3D2B1F',
              }}
            />
            
            {/* Center brush icon */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: '#FAF8F0' }}
            >
              <BrushIcon />
            </div>
            
            {/* Color buttons arranged in a circle */}
            {PALETTE_COLORS.map((color, index) => {
              const pos = getColorPosition(index, PALETTE_COLORS.length);
              const isSelected = selectedColor === color;
              return (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
                  className="absolute rounded-full transition-all duration-150"
                  style={{
                    width: isSelected ? '38px' : '34px',
                    height: isSelected ? '38px' : '34px',
                    backgroundColor: color,
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: isSelected 
                      ? '0 0 0 3px #F5F0E1, 0 0 0 5px #3D2B1F, 0 4px 8px rgba(0,0,0,0.3)' 
                      : '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: isSelected ? 10 : 1,
                  }}
                  aria-label={`Select ${PALETTE_LABELS[color]}`}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center text-white/90">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))' }}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                </span>
              )}
            </button>
              );
            })}
          </div>

          {/* Van Gogh's Voice (Top Center) */}
          {hintVisible && hintMessage && (
            <div 
              className="absolute top-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              style={{
                maxWidth: '80%',
                animation: 'fadeIn 0.5s ease-in',
              }}
            >
              <div 
                className="px-6 py-4 rounded-lg"
                style={{
                  background: isSatisfiedMessage 
                    ? 'rgba(45, 90, 61, 0.9)' // Green for satisfied
                    : 'rgba(61, 43, 31, 0.9)', // Brown for hint
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                  border: `2px solid ${isSatisfiedMessage ? '#4A7C59' : '#5C4033'}`,
                }}
              >
                <p 
                  className="font-body text-base italic text-center"
                  style={{ 
                    color: '#F5F0E1',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                    lineHeight: '1.6',
                  }}
                >
                  "{hintMessage}"
                </p>
                {!isSatisfiedMessage && hintColor && (
                  <p 
                    className="font-body text-xs text-center mt-2 opacity-75"
                    style={{ color: '#F5F0E1' }}
                  >
                    {t.vanGoghSignature}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Drag hint (subtle) */}
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full pointer-events-none"
            style={{ 
              background: 'rgba(61, 43, 31, 0.7)', 
              opacity: isDragging || hintVisible ? 0 : 0.8,
              transition: 'opacity 0.3s',
            }}
          >
            <span className="font-body text-sm" style={{ color: '#F5F0E1' }}>
              {t.dragHint}
            </span>
        </div>
        </>
      )}
    </div>
  );
};

export default App;
