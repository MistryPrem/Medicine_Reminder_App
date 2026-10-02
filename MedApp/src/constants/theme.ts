export const THEME = {
  colors: {
    primary: '#0284c7', // Sky-600 (Accessible, professional blue)
    primaryHover: '#0369a1',
    primaryLight: '#e0f2fe',
    secondary: '#475569',
    accent: '#6366f1', // Indigo
    success: '#16a34a', // Emerald/Green
    successLight: '#dcfce7',
    warning: '#d97706', // Amber
    warningLight: '#fef3c7',
    danger: '#dc2626', // Red
    dangerLight: '#fee2e2',
    background: '#f8fafc', // Soft Slate
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    surfaceBorder: '#e2e8f0',
    borderFocus: '#0284c7',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textLight: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.65)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  typography: {
    fontFamily: undefined, // Uses native system font (San Francisco / Roboto)
    headerLarge: {
      fontSize: 28,
      fontWeight: '800' as const,
      lineHeight: 34,
      color: '#0f172a',
    },
    headerMedium: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      color: '#0f172a',
    },
    headerSmall: {
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 24,
      color: '#0f172a',
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 22,
      color: '#0f172a',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      color: '#334155',
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      color: '#64748b',
    },
  },
  shadows: {
    card: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    modal: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
