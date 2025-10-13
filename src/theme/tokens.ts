export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };
export const spacing = (n = 1) => n * 8;
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
};
export const typography = {
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '700' as const },
  p:  { fontSize: 14, color: '#2B2218' },
  muted: { fontSize: 13, color: '#6B5B4D' },
};
