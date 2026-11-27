function linearize(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(first, second) {
  const luminance = (color) => {
    const [red, green, blue] = color.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16));
    return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function wheelLabelPresentation(background, ink, light) {
  const choices = [ink, light].map((foreground) => ({
    foreground,
    contrast: contrastRatio(foreground, background),
  })).sort((a, b) => b.contrast - a.contrast);

  if (choices[0].contrast >= 4.5) {
    return { foreground: choices[0].foreground, background: "transparent", contrast: choices[0].contrast };
  }
  return { foreground: light, background: ink, contrast: contrastRatio(light, ink) };
}
