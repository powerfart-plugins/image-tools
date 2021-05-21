const { React, getModule } = require('powercord/webpack');
const { fixConfines } = require('../utils');

const { int2hex } = getModule([ 'int2hex' ], false);
const { imageWrapper } = getModule([ 'imageWrapper' ], false);

module.exports = class OverlayLensEvents extends React.PureComponent {
  constructor (props) {
    super(props);
    const { get } = props.settings;

    this._borederColor = int2hex(this.props.settings.get('lensColor', 0));

    this.lensConfig = {
      show: false,
      radius: get('lensRadius', 100),
      zooming: get('zoomRatio', 2),
      wheelStep: get('wheelStep', 1),
      positionX: 0,
      positionY: 0,
      style: {
        borderColor: get('lensColor', 0),
        imageRendering: null
      }
    };
    this.onMouse = this.onMouse.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  updateLensConfig (data) {
    this.lensConfig = {
      ...this.lensConfig,
      ...data
    };
  }

  onMouse (e) {
    const isMouseDown = (e.type === 'mousedown');

    if (e.button === 2) {
      return;
    }
    if (!this.props.settings.get('disableLens', false)) {
      this.updateLensConfig({
        show: isMouseDown && e.target.parentElement.classList.contains(imageWrapper),
        style: {
          borderColor: this._borederColor,
          imageRendering: this.props.settings.get('disableAntiAliasing', null) ? 'pixelated' : null
        }
      });
    }
  }

  onMouseMove (e) {
    this.updateLensConfig({
      positionX: e.clientX,
      positionY: e.clientY
    });
  }

  onWheel (e) {
    const { get, set } = this.props.settings;
    const current = {
      radius: get('lensRadius', 100),
      zooming: get('zoomRatio', 2),
      wheelStep: get('wheelStep', 1)
    };
    const borders = {
      radius: [ 50, get('maxLensRadius', 700) ],
      zooming: [ 1, get('maxZoomRatio', 15) ],
      wheelStep: [ 0.1, 5 ]
    };
    const settingKeys = {
      radius: 'lensRadius',
      zooming: 'zoomRatio',
      wheelStep: 'wheelStep'
    };
    const change = (target) => {
      const [ min ] = borders[target];
      const step = (target === 'wheelStep') ? min : (current.wheelStep * min);
      const plus = (e.deltaY < 0) ? step : (step * -1);

      current[target] = fixConfines((current[target] + plus), borders[target]);
      set(settingKeys[target], Number(current[target]));

      this.updateLensConfig({
        [target]: current[target]
      });
    };

    if (e.ctrlKey) {
      change('radius');
    } else if (e.shiftKey) {
      change('wheelStep');
    } else {
      change('zooming');
    }
  }
};
