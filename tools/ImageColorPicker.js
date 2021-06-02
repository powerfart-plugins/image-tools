const { clipboard } = require('electron');
const { React } = require('powercord/webpack');

module.exports = class ImageColorPicker {
  constructor (img) {
    const { width, height } = img;

    img.crossOrigin = 'Anonymous';
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    this.ctx = canvas.getContext('2d');
    this.currentColor = [];

    img.addEventListener('load', () => {
      try { // Error: The canvas has been tainted by cross-origin data.
        this.ctx.drawImage(img, 0, 0, width, height);
      } catch (e) {
        console.error(e);
      }
    });
  }

  get lensConfig () {
    return {
      zooming: 12,
      radius: 80,
      renderPreview: this.renderPreview.bind(this),
      style: {
        cursor: 'none',
        imageRendering: 'pixelated'
      }
    };
  }

  getByPos (x, y) {
    const rgba = this.ctx.getImageData(x, y, 1, 1).data;
    this.currentColor = rgba;
    return this.rgbToHex([ ...rgba ]);
  }

  rgbToHex ([ R, G, B ]) {
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  renderPreview ({ x, y }) {
    return React.createElement('div', {
      className: 'image-tools-color-picker-prev',
      style: {
        backgroundColor: this.getByPos(x, y),
        left: x,
        top: y + this.lensConfig.radius + 5
      }
    });
  }

  copyColor () {
    clipboard.write({ text: this.rgbToHex(this.currentColor) });
  }
};
