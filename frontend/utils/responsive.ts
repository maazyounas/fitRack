export type AuthResponsiveMetrics = {
  isCompact: boolean;
  isTablet: boolean;
  heroPaddingTop: number;
  heroPaddingBottom: number;
  heroHorizontalPadding: number;
  heroTitleSize: number;
  heroSubSize: number;
  heroSubMaxWidth: number;
  cardMarginHorizontal: number;
  cardPadding: number;
  cardRadius: number;
  fieldGroupMarginBottom: number;
  labelSize: number;
  inputMinHeight: number;
  inputHorizontalPadding: number;
  bareFontSize: number;
  bareLetterSpacing: number;
  iconSize: number;
  iconSpacing: number;
  eyePadding: number;
  helperTextSize: number;
  helperLineHeight: number;
  otpFontSize: number;
  otpLetterSpacing: number;
  otpHintSize: number;
  footerTextSize: number;
  footerTopMargin: number;
  strengthLabelWidth: number;
};

export function getAuthResponsiveMetrics(width: number): AuthResponsiveMetrics {
  const isCompact = width < 380;
  const isTablet = width >= 768;

  return {
    isCompact,
    isTablet,
    heroPaddingTop: isCompact ? 48 : isTablet ? 72 : 64,
    heroPaddingBottom: isCompact ? 36 : isTablet ? 52 : 48,
    heroHorizontalPadding: isCompact ? 20 : 24,
    heroTitleSize: isCompact ? 26 : isTablet ? 34 : 30,
    heroSubSize: isCompact ? 12 : 13,
    heroSubMaxWidth: isTablet ? 440 : 280,
    cardMarginHorizontal: isCompact ? 14 : isTablet ? 56 : 20,
    cardPadding: isCompact ? 18 : isTablet ? 28 : 24,
    cardRadius: isTablet ? 28 : 24,
    fieldGroupMarginBottom: isCompact ? 10 : 12,
    labelSize: isCompact ? 12 : 13,
    inputMinHeight: isCompact ? 46 : 50,
    inputHorizontalPadding: isCompact ? 10 : 12,
    bareFontSize: isCompact ? 13 : 15,
    bareLetterSpacing: isCompact ? 0 : 0,
    iconSize: isCompact ? 16 : 18,
    iconSpacing: isCompact ? 6 : 8,
    eyePadding: isCompact ? 2 : 4,
    helperTextSize: isCompact ? 10 : 11,
    helperLineHeight: isCompact ? 14 : 16,
    otpFontSize: isCompact ? 16 : 18,
    otpLetterSpacing: isCompact ? 2 : 3,
    otpHintSize: isCompact ? 12 : 13,
    footerTextSize: isCompact ? 13 : 14,
    footerTopMargin: isCompact ? 20 : 24,
    strengthLabelWidth: isCompact ? 38 : 44,
  };
}