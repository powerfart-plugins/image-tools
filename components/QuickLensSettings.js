const { i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');

module.exports.getQuickLensSettings = function ({ get, set }) {
  return [
    ...ContextMenu.renderRawItems([
      // {
      //   type: 'checkbox',
      //   name: Messages.DISABLE_LENS,
      //   checked: false,
      //   onToggle: (v) => set('disableLens', !v)
      // },
      {
        type: 'slider',
        name: Messages.ZOOM_RATIO,
        value: get('zoomRatio', 2),
        minValue: 1,
        maxValue: 15,
        onChange: (v) => set('zoomRatio', v.toFixed(1))
      },
      {
        type: 'slider',
        name: Messages.LENS_RADIUS,
        value: get('lensRadius', 50),
        minValue: 50,
        maxValue: 700,
        onChange: (v) => set('lensRadius', v.toFixed(1))
      }
    ])
  ];
};
