export const hexToRGBA = (hex, opacity) => {
    if (!hex) return null;
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    // Construct the RGBA color string
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  
    return rgbaColor;
}