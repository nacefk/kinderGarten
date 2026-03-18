/**
 * 5-Color Minimal System
 * ONLY 5 Colors - Everything in the app uses ONLY these
 */

// 5 CORE COLORS
const PRIMARY = "#C6A57B";           // Buttons, icons, main accents
const SECONDARY = "#F5DEB3";         // Headers, top bars
const ERROR = "#DC2626";             // Errors, delete
const SUCCESS = "#16A34A";           // Success, positive
const TEXT = "#374151";              // All text

// Map to simple color names - no variations, no derived colors
const COLORS = {
  primary: PRIMARY,
  secondary: SECONDARY,
  error: ERROR,
  success: SUCCESS,
  text: TEXT,
  white: "#FFFFFF",
  black: "#000000",

  // All backgrounds are WHITE
  background: "#FFFFFF",
  cardBackground: "#FFFFFF",

  // Borders are light gray
  border: "#E5E7EB",

  // Overlays (semi-transparent black for modals)
  overlay: "rgba(0,0,0,0.25)",
  overlayDark: "rgba(0,0,0,0.4)",

  // Aliases - all point to the 5 core colors, NO NEW COLORS
  accent: PRIMARY,
  textDark: TEXT,
  textLight: TEXT,
  accentLight: "#F5F5F5",
  lightGray: "#F5F5F5",
  lightGrayBg: "#F3F4F6",
  lightTan: "#F8F6F2",
  lightBlue: "#F0F9FF",
  pureWhiteGray: "#F9FAFB",
  warning: ERROR,
  errorDark: ERROR,
  errorLight: "#FFFFFF",
  successDark: SUCCESS,
  successLight: "#FFFFFF",

  // Additional colors for specific features
  maleBlue: "#3B82F6",
  femalePink: "#EC4899",
  mediumGray: "#6B7280",
  disabled: "#D1D5DB",
  shadow: "#000",
  warningLight: "#FEF3C7",
  warningAmber: "#F59E0B",
  warningAmberDark: "#92400E",
  warningDarkText: "#E65100",
  warningLighter: "#FFF3E0",
  successGreen: "#16A34A",
  indigoLight: "#E0E7FF",
  indigoDark: "#6366F1",
  greenLight: "#DCFCE7",
  overlayMedium: "rgba(0,0,0,0.3)",
  successDarkText: "#166534",
  errorDarkText: "#B91C1C",
};

/**
 * Get colors with tenant's primary and secondary colors
 * @param tenantPrimaryColor - Tenant primary color
 * @param tenantSecondaryColor - Tenant secondary color
 */
export function getColors(tenantPrimaryColor?: string | null, tenantSecondaryColor?: string | null) {
  // Validate color format (must be 6+ chars like #XXXXXX or #XXXXXXXX)
  const isValidColor = (color: string | null | undefined): boolean => {
    if (!color) return false;
    return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color);
  };

  const validPrimary = isValidColor(tenantPrimaryColor) ? tenantPrimaryColor : PRIMARY;
  const validSecondary = isValidColor(tenantSecondaryColor) ? tenantSecondaryColor : SECONDARY;

 // console.log("🎨 [Colors] Using - Primary:", validPrimary, "| Secondary:", validSecondary);

  return {
    ...COLORS,
    primary: validPrimary,
    secondary: validSecondary,
    accent: validPrimary,  // Update accent alias to use tenant primary
  };
}

// Default export
export default getColors();
