/**
 * Backward compatibility re-export bridge for StudyHub Enterprise Theme Engine.
 * Directs legacy context calls to the new authoritative src/theme architecture.
 */
import { ThemeContext } from '../theme/ThemeContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useTheme } from '../theme/useTheme';

export { ThemeContext, ThemeProvider, useTheme };
export default ThemeContext;
