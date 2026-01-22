// Palette colors inspired by Van Gogh's Sunflowers
export enum PaletteColor {
  EarthYellow = '#D4A056', // 土黄
  BrightYellow = '#FFD54F', // 亮黄
  OchreSienna = '#8D6E63', // 赭石 (Brownish/Reddish)
  GrassGreen = '#558B2F', // 草绿
  SkyBlue = '#81D4FA', // 天蓝
  ErrorRed = '#EF5350', // For mistakes
}

export const PALETTE_COLORS = [
  PaletteColor.EarthYellow,
  PaletteColor.BrightYellow,
  PaletteColor.OchreSienna,
  PaletteColor.GrassGreen,
  PaletteColor.SkyBlue,
];

export const PALETTE_LABELS: Record<string, string> = {
  [PaletteColor.EarthYellow]: 'Earth',
  [PaletteColor.BrightYellow]: 'Sun',
  [PaletteColor.OchreSienna]: 'Clay',
  [PaletteColor.GrassGreen]: 'Stem',
  [PaletteColor.SkyBlue]: 'Sky',
};