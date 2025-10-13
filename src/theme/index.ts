import { DefaultTheme, Theme } from '@react-navigation/native';
import { colors } from './colors';

export const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.surface,
    card: colors.surface,
    text: colors.text,
    border: colors.line,
    notification: colors.primaryDark,
  },
};
