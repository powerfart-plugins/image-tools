const { i18n: { Messages } } = require('powercord/webpack');

/* eslint-disable brace-style */
module.exports = function ({ get, set }) {
  return [
    {
      type: 'checkbox',
      get name () { return Messages.IMAGE_TOOLS_DISABLE_LENS; },
      defaultState: get('disableLens', false),
      onToggle: (v) => set('disableLens', v)
    },
    {
      type: 'checkbox',
      get name () { return Messages.IMAGE_TOOLS_DISABLE_ANTI_ALIASING; },
      defaultState: get('disableAntiAliasing', false),
      onToggle: (v) => set('disableAntiAliasing', v)
    },
    {
      type: 'slider',
      get name () { return Messages.IMAGE_TOOLS_ZOOM_RATIO; },
      value: Number(get('zoomRatio', 2)).toFixed(),
      minValue: 1,
      maxValue: get('maxZoomRatio', 15),
      onChange: (v) => set('zoomRatio', v),
      renderValue: (v) => `${v.toFixed(1)}x`
    },
    {
      type: 'slider',
      get name () { return Messages.IMAGE_TOOLS_LENS_RADIUS; },
      value: Number(get('lensRadius', 50)).toFixed(),
      minValue: 50,
      maxValue: get('maxLensRadius', 700),
      onChange: (v) => set('lensRadius', v),
      renderValue: (v) => `${v.toFixed(1)}px`
    },
    {
      type: 'slider',
      get name () { return Messages.IMAGE_TOOLS_LENS_BORDER_RADIUS; },
      value: Number(get('borderRadius', 50)).toFixed(),
      minValue: 0,
      maxValue: 50,
      onChange: (v) => set('borderRadius', v),
      renderValue: (v) => `${(v * 2).toFixed()}%`
    },
    {
      type: 'slider',
      get name () { return Messages.IMAGE_TOOLS_SCROLL_STEP; },
      value: Number(get('wheelStep', 1)).toFixed(2),
      minValue: 0.1,
      maxValue: 5,
      onChange: (v) => set('wheelStep', v),
      renderValue: (v) => `${v.toFixed(2)}`
    }
  ];
};
