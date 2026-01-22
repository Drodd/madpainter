import { Stroke, RealisticShape, LevelData } from '../types';
import { PaletteColor } from '../constants';

// Helper to create a unique ID
const uid = () => Math.random().toString(36).substr(2, 9);

// Helper to get bounding box of a stroke path
const getStrokeBounds = (
  x: number,
  y: number,
  length: number,
  angle: number,
  width: number,
  curvature: number
): { minX: number; minY: number; maxX: number; maxY: number } => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;
  const thicknessX = Math.sin(rad) * width;
  const thicknessY = -Math.cos(rad) * width;
  
  // Calculate control point
  const cx = x + dx / 2 - Math.sin(rad) * curvature;
  const cy = y + dy / 2 + Math.cos(rad) * curvature;
  
  // Get all key points
  const points = [
    { x, y },
    { x: x + dx, y: y + dy },
    { x: x + thicknessX, y: y + thicknessY },
    { x: x + dx + thicknessX, y: y + dy + thicknessY },
    { x: cx, y: cy },
    { x: cx + thicknessX, y: cy + thicknessY },
  ];
  
  // Find bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  
  return { minX, minY, maxX, maxY };
};

// Helper to check if two bounding boxes overlap significantly
const boxesOverlap = (
  box1: { minX: number; minY: number; maxX: number; maxY: number },
  box2: { minX: number; minY: number; maxX: number; maxY: number },
  threshold: number = 0.3 // 30% overlap threshold
): boolean => {
  // Check if boxes intersect
  const intersectX = Math.max(0, Math.min(box1.maxX, box2.maxX) - Math.max(box1.minX, box2.minX));
  const intersectY = Math.max(0, Math.min(box1.maxY, box2.maxY) - Math.max(box1.minY, box2.minY));
  const intersectArea = intersectX * intersectY;
  
  if (intersectArea === 0) return false;
  
  // Calculate areas
  const area1 = (box1.maxX - box1.minX) * (box1.maxY - box1.minY);
  const area2 = (box2.maxX - box2.minX) * (box2.maxY - box2.minY);
  const minArea = Math.min(area1, area2);
  
  // Check if overlap exceeds threshold
  return intersectArea / minArea > threshold;
};

// Helper to get center point of a stroke
const getStrokeCenter = (
  x: number,
  y: number,
  length: number,
  angle: number
): { x: number; y: number } => {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;
  // Center is midpoint of the stroke
  return {
    x: x + dx / 2,
    y: y + dy / 2
  };
};

// Helper to calculate distance between two points
const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Helper to create a stroke path
const createBrushStroke = (
  x: number,
  y: number,
  length: number,
  angle: number,
  width: number,
  curvature: number
): Path2D => {
  const path = new Path2D();
  const rad = (angle * Math.PI) / 180;
  
  const dx = Math.cos(rad) * length;
  const dy = Math.sin(rad) * length;

  const cx = x + dx / 2 - Math.sin(rad) * curvature;
  const cy = y + dy / 2 + Math.cos(rad) * curvature;

  path.moveTo(x, y);
  path.quadraticCurveTo(cx, cy, x + dx, y + dy);
  
  const thicknessX = Math.sin(rad) * width;
  const thicknessY = -Math.cos(rad) * width;
  
  path.lineTo(x + dx + thicknessX, y + dy + thicknessY);
  path.quadraticCurveTo(cx + thicknessX, cy + thicknessY, x + thicknessX, y + thicknessY);
  path.closePath();

  return path;
};

// Helper to create a realistic shape
const createShape = (
  type: RealisticShape['type'],
  color: string,
  zIndex: number,
  props: Partial<RealisticShape>
): RealisticShape => ({
  type,
  color,
  zIndex,
  ...props
});

// Main generator function
export const generateSunflowersData = (width: number, height: number): LevelData => {
  const strokes: Stroke[] = [];
  const shapes: RealisticShape[] = [];
  // Store bounds by color to only check overlaps within same color
  const strokeBoundsByColor: Map<PaletteColor, Array<{ minX: number; minY: number; maxX: number; maxY: number }>> = new Map();
  // Store center points by color for minimum distance checking
  const strokeCentersByColor: Map<PaletteColor, Array<{ x: number; y: number }>> = new Map();
  let zIndexCounter = 0;

  const addStroke = (
    x: number,
    y: number,
    color: PaletteColor,
    options: { length?: number; width?: number; angle?: number; curvature?: number; minDistance?: number } = {}
  ) => {
    const len = options.length || 15 + Math.random() * 15;
    const wid = options.width || 4 + Math.random() * 3;
    const ang = options.angle !== undefined ? options.angle : Math.random() * 360;
    const curv = options.curvature || (Math.random() - 0.5) * 10;
    const minDist = options.minDistance || 15; // Default minimum distance between stroke centers

    // Get bounding box
    const bounds = getStrokeBounds(x, y, len, ang, wid, curv);
    
    // Check if stroke is within canvas bounds (with small margin)
    const margin = 5;
    if (bounds.minX < -margin || bounds.minY < -margin || 
        bounds.maxX > width + margin || bounds.maxY > height + margin) {
      return; // Skip strokes that go outside canvas
    }
    
    // Get center point of this stroke
    const center = getStrokeCenter(x, y, len, ang);
    
    // Check minimum distance from existing strokes of the same color
    const sameColorCenters = strokeCentersByColor.get(color) || [];
    const tooClose = sameColorCenters.some(existingCenter => 
      distance(center, existingCenter) < minDist
    );
    
    if (tooClose) {
      return; // Skip strokes that are too close to existing strokes
    }
    
    // Check for significant overlap with existing strokes of the same color
    const sameColorBounds = strokeBoundsByColor.get(color) || [];
    const hasSignificantOverlap = sameColorBounds.some(existingBounds => 
      boxesOverlap(bounds, existingBounds, 0.3) // 30% overlap threshold for same color
    );
    
    if (hasSignificantOverlap) {
      return; // Skip strokes with too much overlap with same color
    }
    
    // Create path and add stroke
    const path = createBrushStroke(x, y, len, ang, wid, curv);
    
    strokes.push({
      id: uid(),
      path,
      targetColor: color,
      currentColor: null,
      zIndex: zIndexCounter++,
    });
    
    // Store bounds and center for future checks (by color)
    if (!strokeBoundsByColor.has(color)) {
      strokeBoundsByColor.set(color, []);
    }
    strokeBoundsByColor.get(color)!.push(bounds);
    
    if (!strokeCentersByColor.has(color)) {
      strokeCentersByColor.set(color, []);
    }
    strokeCentersByColor.get(color)!.push(center);
  };

  // --- 1. Background (Sky) ---
  const horizonY = height * 0.65;
  
  // Realistic: Solid Sky
  shapes.push(createShape('rect', PaletteColor.SkyBlue, 0, { x: 0, y: 0, w: width, h: horizonY }));

  // Abstract: Fewer, larger strokes for easier filling (with retry for filtered strokes)
  let skyStrokesAdded = 0;
  const maxSkyStrokes = 18; // Reduced for smaller canvas
  const maxRetries = maxSkyStrokes * 4; // Allow more attempts for spacing
  for (let attempt = 0; attempt < maxRetries && skyStrokesAdded < maxSkyStrokes; attempt++) {
    const x = Math.random() * width;
    const y = Math.random() * horizonY;
    const beforeCount = strokes.length;
    addStroke(x, y, PaletteColor.SkyBlue, {
      angle: 0 + (Math.random() - 0.5) * 15,
      length: 45,
      width: 14,
      minDistance: 28 // Larger spacing for sky strokes
    });
    if (strokes.length > beforeCount) {
      skyStrokesAdded++;
    }
  }

  // --- 2. Table (Earth) ---
  // Realistic: Solid Table
  shapes.push(createShape('rect', PaletteColor.EarthYellow, 1, { x: 0, y: horizonY, w: width, h: height - horizonY }));

  // Abstract: Fewer, larger horizontal strokes (with retry)
  let tableStrokesAdded = 0;
  const maxTableStrokes = 12; // Reduced for smaller canvas
  const maxTableRetries = maxTableStrokes * 4;
  for (let attempt = 0; attempt < maxTableRetries && tableStrokesAdded < maxTableStrokes; attempt++) {
    const x = Math.random() * width;
    const y = horizonY + Math.random() * (height - horizonY);
    const beforeCount = strokes.length;
    addStroke(x, y, PaletteColor.EarthYellow, {
      angle: 0 + (Math.random() - 0.5) * 5,
      length: 50,
      width: 16,
      minDistance: 32 // Larger spacing for table strokes
    });
    if (strokes.length > beforeCount) {
      tableStrokesAdded++;
    }
  }

  // --- 3. Vase (Green) ---
  const vaseCenterX = width / 2;
  const vaseBaseY = height * 0.85;
  const vaseTopY = height * 0.55;
  const vaseWidthTop = width * 0.15;
  const vaseWidthBody = width * 0.25;
  const vaseWidthBase = width * 0.18;

  // Realistic: Complex Shape using Path (Green vase - using palette green)
  shapes.push(createShape('path', PaletteColor.GrassGreen, 2, {
    points: [
      { x: vaseCenterX - vaseWidthTop, y: vaseTopY }, // Top Left
      { 
        x: vaseCenterX - vaseWidthBase, y: vaseBaseY, // Bottom Left
        cp1x: vaseCenterX - vaseWidthBody, cp1y: vaseTopY + (vaseBaseY - vaseTopY) * 0.3, // Curve Out
        cp2x: vaseCenterX - vaseWidthBody, cp2y: vaseBaseY - (vaseBaseY - vaseTopY) * 0.2 // Curve In
      }, 
      { x: vaseCenterX + vaseWidthBase, y: vaseBaseY }, // Bottom Right (Line)
      { 
        x: vaseCenterX + vaseWidthTop, y: vaseTopY, // Top Right
        cp1x: vaseCenterX + vaseWidthBody, cp1y: vaseBaseY - (vaseBaseY - vaseTopY) * 0.2,
        cp2x: vaseCenterX + vaseWidthBody, cp2y: vaseTopY + (vaseBaseY - vaseTopY) * 0.3
      } 
    ]
  }));

  // Abstract: Fewer, larger vertical strokes for vase (with retry)
  let vaseStrokesAdded = 0;
  const maxVaseStrokes = 10; // Reduced for smaller canvas
  const maxVaseRetries = maxVaseStrokes * 4;
  for (let attempt = 0; attempt < maxVaseRetries && vaseStrokesAdded < maxVaseStrokes; attempt++) {
    const t = Math.random();
    const y = vaseBaseY - t * (vaseBaseY - vaseTopY);
    // Approximate width at height y
    const curveT = Math.sin(t * Math.PI);
    const currentW = vaseWidthBody * curveT + vaseWidthTop * (1-curveT); 
    
    const x = vaseCenterX + (Math.random() - 0.5) * 2 * currentW * 0.8;
    
    const beforeCount = strokes.length;
    addStroke(x, y, PaletteColor.GrassGreen, {
      angle: 90 + (Math.random() - 0.5) * 20,
      length: 32,
      width: 12,
      minDistance: 22 // Medium spacing for vase strokes
    });
    if (strokes.length > beforeCount) {
      vaseStrokesAdded++;
    }
  }

  // --- 4. Flowers (Three sunflowers) ---
  // Based on the image: left (large), top-right (medium), center-right (smaller, fading)
  const flowers = [
    { x: width * 0.35, y: height * 0.5, r: 42 }, // Left - largest
    { x: width * 0.72, y: height * 0.35, r: 32 }, // Top-right - medium
    { x: width * 0.58, y: height * 0.52, r: 28 }, // Center-right - smaller, fading
  ];

  flowers.forEach((flower, idx) => {
    // --- Stems ---
    // Realistic: Bezier curve - stems connect to vase center
    const stemOffsetX = (flower.x - vaseCenterX) * 0.3; // Stems curve toward center
    shapes.push(createShape('path', PaletteColor.GrassGreen, 3, {
      points: [
        { x: flower.x, y: flower.y + flower.r * 0.5 },
        { 
          x: vaseCenterX + stemOffsetX, y: vaseTopY + 10,
          cp1x: flower.x + stemOffsetX * 0.3, cp1y: flower.y + flower.r + 40,
          cp2x: vaseCenterX + stemOffsetX * 0.7, cp2y: vaseTopY - 20
        }
      ]
    }));

    // Abstract: Fewer strokes along stem path (with retry)
    const stemPoints = 3; // Reduced for smaller canvas
    let stemStrokesAdded = 0;
    for (let k = 0; k < stemPoints; k++) {
      const t = k / stemPoints;
      const sx = flower.x;
      const sy = flower.y + flower.r;
      const ex = vaseCenterX + stemOffsetX;
      const ey = vaseTopY;
      
      const curveOffset = Math.sin(t * Math.PI) * (idx % 2 === 0 ? -15 : 15);
      const cx = sx + (ex - sx) * t + curveOffset;
      const cy = sy + (ey - sy) * t;

      let strokeAdded = false;
      for (let retry = 0; retry < 3 && !strokeAdded; retry++) {
        const beforeCount = strokes.length;
      addStroke(cx, cy, PaletteColor.GrassGreen, {
          angle: 75 + Math.random() * 25,
          length: 26,
          width: 10,
          minDistance: 20 // Medium spacing for stem strokes
        });
        if (strokes.length > beforeCount) {
          strokeAdded = true;
          stemStrokesAdded++;
        } else if (retry < 2) {
          // Slight offset on retry
          const offset = (retry + 1) * 1.5;
          addStroke(cx + (Math.random() - 0.5) * offset, cy + (Math.random() - 0.5) * offset, PaletteColor.GrassGreen, {
            angle: 75 + Math.random() * 25,
            length: 26,
            width: 10,
            minDistance: 20
      });
          if (strokes.length > beforeCount) {
            strokeAdded = true;
            stemStrokesAdded++;
          }
        }
      }
    }

    // --- Petals ---
    const petalCount = 6; // Reduced for smaller canvas
    for (let j = 0; j < petalCount; j++) {
      const angleDeg = (j / petalCount) * 360;
      const angleRad = (angleDeg * Math.PI) / 180;
      const dist = flower.r * 0.75;
      
      // Realistic: Ellipses
      const px = flower.x + Math.cos(angleRad) * dist;
      const py = flower.y + Math.sin(angleRad) * dist;
      
      shapes.push(createShape('ellipse', PaletteColor.BrightYellow, 4, {
        x: px, y: py,
        rx: flower.r * 0.55, ry: flower.r * 0.22,
        rotation: angleRad
      }));

      // Abstract: Larger strokes for easier filling (with retry)
      let petalAdded = false;
      for (let retry = 0; retry < 3 && !petalAdded; retry++) {
        const beforeCount = strokes.length;
      addStroke(px, py, PaletteColor.BrightYellow, {
        angle: angleDeg,
          length: flower.r * 1.1,
          width: 14,
          curvature: 5,
          minDistance: 14 // Smaller spacing for petals (they can be closer)
        });
        if (strokes.length > beforeCount) {
          petalAdded = true;
        } else if (retry < 2) {
          // Slight position adjustment on retry
          const offset = (retry + 1) * 2;
          addStroke(px + (Math.random() - 0.5) * offset, py + (Math.random() - 0.5) * offset, PaletteColor.BrightYellow, {
            angle: angleDeg,
            length: flower.r * 1.1,
            width: 14,
            curvature: 5,
            minDistance: 14
      });
          if (strokes.length > beforeCount) {
            petalAdded = true;
          }
        }
      }
    }

    // --- Center ---
    // Realistic: Circle
    const centerColor = idx === 2 ? '#A0522D' : '#8B4513';
    shapes.push(createShape('circle', centerColor, 5, {
      x: flower.x,
      y: flower.y,
      r: flower.r * 0.45
    }));

    // Abstract: Fewer, larger dots for center (with retry)
    const centerDots = idx === 0 ? 4 : 3; // Reduced for smaller canvas
    let centerDotsAdded = 0;
    const maxCenterRetries = centerDots * 6;
    for (let attempt = 0; attempt < maxCenterRetries && centerDotsAdded < centerDots; attempt++) {
      const r = Math.random() * (flower.r * 0.35);
      const theta = Math.random() * Math.PI * 2;
      const cx = flower.x + r * Math.cos(theta);
      const cy = flower.y + r * Math.sin(theta);
      
      const beforeCount = strokes.length;
      addStroke(cx, cy, PaletteColor.OchreSienna, {
        angle: Math.random() * 360,
        length: 14,
        width: 12,
        curvature: 0,
        minDistance: 12 // Small spacing for center dots
      });
      if (strokes.length > beforeCount) {
        centerDotsAdded++;
      }
    }
  });

  return { strokes, shapes };
};