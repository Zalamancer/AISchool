/** MathVision "Luminous Precision" color system & typography tokens */

export const colors = {
  // Background
  bgBase: '#0D0D1A',
  bgEdge: '#141428',

  // Semantic math colors
  variable: '#F4B860',    // warm amber — x, y, z, θ
  constant: '#6BC5E8',    // cool blue — π, e, numbers
  operator: '#8A8AA0',    // neutral gray — +, −, ×, =
  function: '#7ED6A0',    // sage green — sin, cos, log
  highlight: '#FFF5E6',   // warm white — focused term
  error: '#E88B8B',       // soft rose — incorrect, constraints
  result: '#5ECFCF',      // bright cyan — answers, proven results

  // Geometry
  geoPrimary: '#FF6B6B',  // coral — primary shape
  geoSecondary: '#B48EF0', // lavender — secondary shapes
  grid: '#252550',        // deep navy — grid lines
  axis: '#5A5A9A',        // slate — axes
  eigen1: '#FF44FF',      // hot pink — first eigenvector
  eigen2: '#44FFAA',      // mint — second eigenvector

  // Text
  text: '#E8E8F0',
} as const;

export const fonts = {
  equation: 'TeX Gyre Pagella Math, Palatino, serif',
  label: 'Geist Mono, monospace',
  title: 'Instrument Serif, Playfair Display, serif',
  body: 'Geist, sans-serif',
} as const;

export const sizes = {
  labelSmall: 14,
  label: 16,
  labelLarge: 18,
  body: 16,
  equation: 32,
  title: 48,
} as const;
