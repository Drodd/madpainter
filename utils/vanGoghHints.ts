import { PaletteColor } from '../constants';

// Van Gogh's hints - poetic and suggestive
export const VAN_GOGH_HINTS: Record<PaletteColor, string[]> = {
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
};

// Van Gogh's satisfied responses
export const VAN_GOGH_SATISFIED: string[] = [
  "Yes... yes, that is right...",
  "The vision becomes clearer...",
  "You understand, you truly see...",
  "Perfect... the color finds its place...",
  "My heart feels lighter...",
  "The madness recedes...",
];

// Get a random hint for a color
export const getRandomHint = (color: PaletteColor): string => {
  const hints = VAN_GOGH_HINTS[color];
  return hints[Math.floor(Math.random() * hints.length)];
};

// Get a random satisfied response
export const getRandomSatisfied = (): string => {
  return VAN_GOGH_SATISFIED[Math.floor(Math.random() * VAN_GOGH_SATISFIED.length)];
};
