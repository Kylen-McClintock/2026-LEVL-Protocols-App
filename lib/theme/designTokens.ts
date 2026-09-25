/**
 * LEVL Protocols - Centralized Design Tokens & Color Architecture
 * 
 * DESIGN GOAL:
 * Single source of truth for both CSS variable synchronization and React/TSX styling.
 * If a designer wishes to modify colors, shades, contrast, or borders for Light Mode
 * (Daylight Quartz) or Dark Mode (Obsidian Frosted Glass), they can modify the values here
 * (and matching variables in `app/globals.css`), and the entire application updates consistently.
 */

export interface ColorPalette {
  // Backgrounds & Surfaces
  background: string
  card: string
  cardSubtle: string
  cardElevated: string
  
  // Borders
  border: string
  borderSubtle: string
  
  // Typography
  textPrimary: string
  textSecondary: string
  textMuted: string
  
  // Category & Functional Accents
  accentEmerald: string
  accentEmeraldSubtle: string
  accentEmeraldBorder: string

  accentPurple: string
  accentPurpleSubtle: string
  accentPurpleBorder: string

  accentCyan: string
  accentCyanSubtle: string
  accentCyanBorder: string

  accentAmber: string
  accentAmberSubtle: string
  accentAmberBorder: string

  accentRose: string
  accentRoseSubtle: string
  accentRoseBorder: string
}

export const LEVL_TOKENS: {
  light: ColorPalette
  dark: ColorPalette
} = {
  light: {
    // Daylight Quartz Surfaces
    background: '#F8F9F7',
    card: '#FFFFFF',
    cardSubtle: '#EFF3F0',
    cardElevated: '#FFFFFF',

    // Precision Borders
    border: '#E1E8E3',
    borderSubtle: '#EAEFEA',

    // Soft Botanical Ink Typography (Lighter & easier on the eyes)
    textPrimary: '#475569',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    // Accents & Category Tints (Daylight Spec - Pastel & Lighter)
    accentEmerald: '#10B981',
    accentEmeraldSubtle: '#D1FAE5',
    accentEmeraldBorder: 'rgba(16, 185, 129, 0.25)',

    accentPurple: '#8B5CF6',
    accentPurpleSubtle: '#EDE9FE',
    accentPurpleBorder: 'rgba(139, 92, 246, 0.25)',

    accentCyan: '#0EA5E9',
    accentCyanSubtle: '#E0F2FE',
    accentCyanBorder: 'rgba(14, 165, 233, 0.25)',

    accentAmber: '#F59E0B',
    accentAmberSubtle: '#FEF3C7',
    accentAmberBorder: 'rgba(245, 158, 11, 0.25)',

    accentRose: '#F43F5E',
    accentRoseSubtle: '#FFE4E6',
    accentRoseBorder: 'rgba(244, 63, 94, 0.25)'
  },
  dark: {
    // Obsidian & Frosted Glass Surfaces
    background: '#030712',
    card: 'rgba(20, 20, 28, 0.75)',
    cardSubtle: 'rgba(0, 0, 0, 0.40)',
    cardElevated: 'rgba(30, 32, 45, 0.95)',

    // Subtle Glass Borders
    border: 'rgba(255, 255, 255, 0.10)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',

    // Luminous Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Neon / Glowing Accents
    accentEmerald: '#10B981',
    accentEmeraldSubtle: 'rgba(16, 185, 129, 0.15)',
    accentEmeraldBorder: 'rgba(16, 185, 129, 0.35)',

    accentPurple: '#8B5CF6',
    accentPurpleSubtle: 'rgba(139, 92, 246, 0.15)',
    accentPurpleBorder: 'rgba(139, 92, 246, 0.35)',

    accentCyan: '#06B6D4',
    accentCyanSubtle: 'rgba(6, 182, 212, 0.15)',
    accentCyanBorder: 'rgba(6, 182, 212, 0.35)',

    accentAmber: '#F59E0B',
    accentAmberSubtle: 'rgba(245, 158, 11, 0.15)',
    accentAmberBorder: 'rgba(245, 158, 11, 0.35)',

    accentRose: '#F43F5E',
    accentRoseSubtle: 'rgba(244, 63, 94, 0.15)',
    accentRoseBorder: 'rgba(244, 63, 94, 0.35)'
  }
}

/**
 * Standard Tailwind / CSS class bundles for dynamic theme styling.
 * Use these helper getters in components so designers only change colors once.
 */
export function getThemeClasses(isLight: boolean) {
  return {
    // Primary card surface
    card: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-white/10 text-white shadow-lg',

    // Subtle / nested card surface
    cardSubtle: isLight
      ? 'bg-[#EFF3F0] border-[#E1E8E3] text-[#475569]'
      : 'bg-black/40 border-white/10 text-slate-300',

    // Accent-bordered cards
    cardEmerald: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-emerald-500/30 text-white shadow-lg',

    cardPurple: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-purple-500/30 text-white shadow-lg',

    cardCyan: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-cyan-500/30 text-white shadow-lg',

    cardAmber: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-amber-500/30 text-white shadow-lg',

    cardIndigo: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] shadow-sm'
      : 'bg-slate-900/90 border-indigo-500/30 text-white shadow-lg',

    // Text hierarchy
    textPrimary: isLight ? 'text-[#475569]' : 'text-white',
    textSecondary: isLight ? 'text-[#64748B]' : 'text-slate-400',
    textMuted: isLight ? 'text-[#94A3B8]' : 'text-slate-500',

    // Badges & Pills
    pillEmerald: isLight
      ? 'bg-[#D1FAE5] text-[#10B981] border border-[#10B981]/30'
      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',

    pillPurple: isLight
      ? 'bg-[#EDE9FE] text-[#8B5CF6] border border-[#8B5CF6]/30'
      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30',

    pillCyan: isLight
      ? 'bg-[#E0F2FE] text-[#0EA5E9] border border-[#0EA5E9]/30'
      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',

    pillAmber: isLight
      ? 'bg-[#FEF3C7] text-[#F59E0B] border border-[#F59E0B]/30'
      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',

    pillIndigo: isLight
      ? 'bg-[#EEF2FF] text-[#6366F1] border border-[#6366F1]/30'
      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',

    pillNeutral: isLight
      ? 'bg-[#EFF3F0] text-[#64748B] border border-[#E1E8E3]'
      : 'bg-white/5 text-slate-400 border border-white/10',

    // Buttons & Controls
    buttonSecondary: isLight
      ? 'bg-[#EFF3F0] hover:bg-[#E1E8E3] border-[#E1E8E3] text-[#475569]'
      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white',

    // Inputs & Forms
    input: isLight
      ? 'bg-white border-[#E1E8E3] text-[#475569] placeholder-[#9CA3AF] focus:border-[#8B5CF6]'
      : 'bg-black/40 border-white/10 text-slate-200 placeholder-slate-500 focus:border-purple-400',

    // Headers & Dividers
    cardHeader: isLight ? 'border-b border-[#E1E8E3]' : 'border-b border-white/10',
    divider: isLight ? 'border-[#E1E8E3]' : 'border-white/10'
  }
}

