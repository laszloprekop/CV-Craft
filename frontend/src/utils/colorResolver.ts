/**
 * Frontend re-export of shared color resolution utilities
 * This maintains backward compatibility while using the shared implementation
 */

export { resolveSemanticColor, hexToRgba, resolveColorPair } from '../../../shared/utils/colorResolver';
export type { SemanticColorKey } from '../../../shared/utils/colorResolver';
