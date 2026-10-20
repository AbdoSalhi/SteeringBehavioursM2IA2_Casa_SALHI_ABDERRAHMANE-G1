// Aurora Perlin calculée dans un tampon huit fois plus petit que le canvas.
const BACKGROUND_PALETTES = {
  aurora: [210, 260, 315, 25, 175, 210],
  ocean: [184, 205, 228, 255, 184],
  sunset: [8, 28, 350, 320, 8],
  neon: [180, 285, 325, 55, 180]
};

class AuroraBackground {
  constructor() {
    this.time = 0;
    this.buffer = null;
    this.context = null;
    this.imageData = null;
    this.bufferWidth = 0;
    this.bufferHeight = 0;
    this.lastImageKey = "";
    this.resize();
  }

  resize() {
    this.bufferWidth = Math.max(2, Math.ceil(width / 8));
    this.bufferHeight = Math.max(2, Math.ceil(height / 8));
    this.buffer = createGraphics(this.bufferWidth, this.bufferHeight);
    this.buffer.pixelDensity(1);
    this.context = this.buffer.drawingContext;
    this.imageData = this.context.createImageData(
      this.bufferWidth,
      this.bufferHeight
    );
  }

  _hueAt(value) {
    const stops =
      BACKGROUND_PALETTES[CONFIG.background.palette] ||
      BACKGROUND_PALETTES.aurora;
    const position = value * (stops.length - 1);
    const index = Math.min(stops.length - 2, Math.floor(position));
    const fraction = position - index;
    let startHue = stops[index];
    let endHue = stops[index + 1];
    if (endHue - startHue > 180) endHue -= 360;
    if (startHue - endHue > 180) endHue += 360;
    return (startHue + (endHue - startHue) * fraction + 360) % 360;
  }

  _writeRgb(hueValue, saturationValue, brightnessValue, pixels, index) {
    const saturationRatio = saturationValue / 100;
    const value = brightnessValue / 100;
    const chroma = value * saturationRatio;
    const section = hueValue / 60;
    const second = chroma * (1 - Math.abs((section % 2) - 1));
    let red = 0;
    let green = 0;
    let blue = 0;

    if (section < 1) {
      red = chroma;
      green = second;
    } else if (section < 2) {
      red = second;
      green = chroma;
    } else if (section < 3) {
      green = chroma;
      blue = second;
    } else if (section < 4) {
      green = second;
      blue = chroma;
    } else if (section < 5) {
      red = second;
      blue = chroma;
    } else {
      red = chroma;
      blue = second;
    }

    const offset = value - chroma;
    pixels[index] = Math.round((red + offset) * 255);
    pixels[index + 1] = Math.round((green + offset) * 255);
    pixels[index + 2] = Math.round((blue + offset) * 255);
  }

  draw(advance = true) {
    if (!CONFIG.background.visible) {
      background(35);
      return;
    }
    if (
      this.bufferWidth !== Math.ceil(width / 8) ||
      this.bufferHeight !== Math.ceil(height / 8)
    ) {
      this.resize();
    }

    if (advance) this.time += CONFIG.background.speed;
    const imageKey = [
      this.time,
      CONFIG.background.noiseScale,
      CONFIG.background.saturation,
      CONFIG.background.brightness,
      CONFIG.background.palette,
      this.bufferWidth,
      this.bufferHeight
    ].join("|");
    if (!advance && imageKey === this.lastImageKey) {
      image(this.buffer, 0, 0, width, height);
      return;
    }

    const pixels = this.imageData.data;
    for (let y = 0; y < this.bufferHeight; y++) {
      for (let x = 0; x < this.bufferWidth; x++) {
        const noiseX = x * CONFIG.background.noiseScale + this.time * 0.7;
        const noiseY = y * CONFIG.background.noiseScale - this.time * 0.45;
        const field = noise(noiseX, noiseY, this.time);
        const light = noise(noiseX + 21.3, noiseY - 13.8, this.time);
        const hueValue = this._hueAt(field);
        const saturationValue = CONFIG.background.saturation;
        const brightnessValue =
          CONFIG.background.brightness * (0.78 + light * 0.22);
        const index = (y * this.bufferWidth + x) * 4;
        this._writeRgb(
          hueValue,
          saturationValue,
          brightnessValue,
          pixels,
          index
        );
        pixels[index + 3] = 255;
      }
    }
    this.context.putImageData(this.imageData, 0, 0);
    this.lastImageKey = imageKey;
    image(this.buffer, 0, 0, width, height);
  }
}
