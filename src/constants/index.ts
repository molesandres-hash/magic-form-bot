/**
 * Constants Barrel Export
 *
 * Purpose: Centralizes all constant exports for cleaner imports
 * Why: Enables importing multiple constants from single path
 *
 * Usage:
 * ```typescript
 * import { IT, WIZARD_EXAMPLES } from '@/constants';
 * ```
 */

// i18n Translations
export {
  IT,
  COMMON_IT,
  WIZARD_IT,
  VALIDATION_IT,
  API_IT,
  DOCUMENTS_IT,
  UI_IT,
  DATETIME_IT,
  COURSE_IT,
} from './i18n';

// Example Data
export {
  WIZARD_EXAMPLES,
  EXAMPLE_COURSE_DATA,
  EXAMPLE_MODULES_DATA,
  EXAMPLE_PARTICIPANTS_DATA,
} from './examples';
