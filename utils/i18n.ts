import { PaletteColor } from '../constants';

export type Language = 'zh' | 'en';

export interface Translations {
  // Game UI
  title: string;
  subtitle: string;
  startButton: string;
  tryAgainButton: string;
  paintAnotherButton: string;
  
  // Instructions
  instruction1: string;
  instruction2: string;
  instruction3: string;
  instruction4: string;
  instruction5: string;
  
  // Game states
  masterpiece: string;
  consumed: string;
  wonMessage: string;
  lostMessage: string;
  timeTaken: string;
  masterpiecesCreated: string;
  
  // Game hints
  dragHint: string;
  
  // Van Gogh's hints
  vanGoghHints: Record<PaletteColor, string[]>;
  vanGoghSatisfied: string[];
  vanGoghSignature: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    title: '疯狂画家',
    subtitle: '"我用绘画对抗疯狂"',
    startButton: '开始绘画',
    tryAgainButton: '再试一次',
    paintAnotherButton: '再画一幅',
    
    instruction1: '1. 拖拽背景查看完整场景。',
    instruction2: '2. 在画布上绘画以匹配现实。',
    instruction3: '3. 在疯狂占据之前匹配颜色。',
    instruction4: '4. 错误的颜色会增加疯狂值。',
    instruction5: '5. 满足内心的欲望可以大幅降低疯狂。',
    
    masterpiece: '杰作',
    consumed: '被吞噬',
    wonMessage: '你捕捉到了愿景。世界看到了你的真实。',
    lostMessage: '愿景已失。疯狂获胜。',
    timeTaken: '用时',
    masterpiecesCreated: '完成的杰作',
    
    dragHint: '↔ 拖拽探索场景',
    
    vanGoghHints: {
      [PaletteColor.SkyBlue]: [
        '无尽的天空呼唤着它的呼吸...',
        '上方，云朵自由飘荡...',
        '苍穹渴望着它的真实色彩...',
        '抬头看，梦想在那里飞翔...',
        '广阔的天空等待着...',
      ],
      [PaletteColor.EarthYellow]: [
        '大地需要温暖...',
        '土壤渴望着金色的触摸...',
        '下方，根在那里找到家...',
        '基础渴望着它的颜色...',
        '土壤低语着等待完成...',
      ],
      [PaletteColor.BrightYellow]: [
        '太阳的拥抱缺失了...',
        '光线应该在那里舞蹈和发光...',
        '金色的光芒等待着它的位置...',
        '明亮从画布上呼唤...',
        '白昼的温暖需要被描绘...',
      ],
      [PaletteColor.GrassGreen]: [
        '生命本身寻求它的翠绿色...',
        '生长和自然在那里繁茂...',
        '茎干伸向它们的绿色...',
        '自然的颜色等待绽放...',
        '生命的绿色在呼唤...',
      ],
      [PaletteColor.OchreSienna]: [
        '花朵的心需要它的温暖...',
        '中心在那里守护着秘密...',
        '核心等待着它的大地色调...',
        '花朵的灵魂在呼唤...',
        '深处，颜色在渴望...',
      ],
    },
    vanGoghSatisfied: [
      '是的...是的，就是这样...',
      '愿景变得更清晰了...',
      '你理解了，你真正看到了...',
      '完美...颜色找到了它的位置...',
      '我的心感到轻松了...',
      '疯狂在消退...',
    ],
    vanGoghSignature: '— 梵高',
  },
  en: {
    title: 'Mad Painter',
    subtitle: '"I fight madness with painting"',
    startButton: 'Start Painting',
    tryAgainButton: 'Try Again',
    paintAnotherButton: 'Paint Another',
    
    instruction1: '1. Drag the background to see the full scene.',
    instruction2: '2. Paint the canvas to match the reality.',
    instruction3: '3. Match colors before madness takes over.',
    instruction4: '4. Wrong colors increase Madness.',
    instruction5: '5. Satisfying the inner desire can greatly reduce madness.',
    
    masterpiece: 'Masterpiece',
    consumed: 'Consumed',
    wonMessage: 'You captured the vision. The world sees your truth.',
    lostMessage: 'The vision is lost. The madness has won.',
    timeTaken: 'TIME TAKEN',
    masterpiecesCreated: 'MASTERPIECES CREATED',
    
    dragHint: '↔ Drag to explore the scene',
    
    vanGoghHints: {
      [PaletteColor.SkyBlue]: [
        "The endless sky calls for its breath...",
        "Above, where clouds drift free...",
        "The heavens yearn for their true hue...",
        "Look up, where dreams take flight...",
        "The vast expanse above awaits...",
      ],
      [PaletteColor.EarthYellow]: [
        "The ground beneath needs warmth...",
        "The earth longs for its golden touch...",
        "Below, where roots find home...",
        "The foundation craves its color...",
        "The soil whispers for completion...",
      ],
      [PaletteColor.BrightYellow]: [
        "The sun's embrace is missing...",
        "Where light should dance and glow...",
        "The golden rays await their place...",
        "Brightness calls from the canvas...",
        "The warmth of day needs painting...",
      ],
      [PaletteColor.GrassGreen]: [
        "Life itself seeks its verdant shade...",
        "Where growth and nature thrive...",
        "The stems reach for their green...",
        "Nature's color waits to bloom...",
        "The living green calls out...",
      ],
      [PaletteColor.OchreSienna]: [
        "The heart of the flower needs its warmth...",
        "Where the center holds its secret...",
        "The core awaits its earthy tone...",
        "The soul of the bloom calls...",
        "Deep within, color yearns...",
      ],
    },
    vanGoghSatisfied: [
      "Yes... yes, that is right...",
      "The vision becomes clearer...",
      "You understand, you truly see...",
      "Perfect... the color finds its place...",
      "My heart feels lighter...",
      "The madness recedes...",
    ],
    vanGoghSignature: '— Van Gogh',
  },
};

// Helper functions
export const getTranslation = (lang: Language): Translations => {
  return translations[lang];
};

export const getRandomHint = (color: PaletteColor, lang: Language): string => {
  const t = translations[lang];
  const hints = t.vanGoghHints[color];
  if (!hints || hints.length === 0) return '';
  return hints[Math.floor(Math.random() * hints.length)];
};

export const getRandomSatisfied = (lang: Language): string => {
  const t = translations[lang];
  return t.vanGoghSatisfied[Math.floor(Math.random() * t.vanGoghSatisfied.length)];
};
