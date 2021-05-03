const { React } = require('powercord/webpack');

const { fixConfines } = require('../utils');

module.exports = class ImageWrapperLens extends React.PureComponent {
  constructor ({ getSetting, image, setOnMouseDown }) {
    super();

    setOnMouseDown(this.onMouseDownUp.bind(this));

    this._getLensRadius = () => getSetting('lensRadius', 100);
    this._getZooming = () => getSetting('zoomRatio', 2);
    this._getImageRendering = () => getSetting('disableAntiAliasing', null) ? 'pixelated' : null;
    this._getIsLensDisable = () => getSetting('disableLens', false);

    this.baseLensStyle = {
      borderColor: getSetting('lensColor', null)
    };
    this.state = {
      lensStyle: {
        backgroundPosition: null,
        backgroundSize: null,
        width: null,
        height: null,
        left: null,
        top: null
      },
      src: image,
      showLens: false
    };

    this.updatePos = this.updatePos.bind(this);
    this.onMouseDownUp = this.onMouseDownUp.bind(this);
  }

  componentDidMount () {
    if (this.props.overlay) {
      const { setEventListener } = this.props.overlay;

      setEventListener('onWheel', this.onWheel.bind(this));
      setEventListener('onMouseMove', this.updatePos);
      setEventListener('onMouseUp', this.onMouseDownUp);
      setEventListener('onMouseLeave', this.onMouseDownUp);

      this.updateSize();
    } else {
      // console.error('overlay offline');
    }
  }

  render () {
    const style = (this.state.showLens)
      ? {
        display: 'block',
        ...this.state.lensStyle,
        ...this.baseLensStyle
      }
      : {};

    return <div
      className="image-tools-lens"
      style={{
        backgroundImage: `url(${this.state.src})`,
        ...style
      }}
    />;
  }

  updatePos (e) {
    const rect = this.props.imageRef.current.firstChild.firstChild.getBoundingClientRect();
    const lensRadius = this._getLensRadius();
    const zooming = this._getZooming();
    const X = fixConfines(e.clientX, [ rect.left, rect.right ]) - rect.left;
    const Y = fixConfines(e.clientY, [ rect.top, rect.bottom ]) - rect.top;

    this.setState((prevState) => ({
      lensStyle: {
        ...prevState.lensStyle,
        backgroundPosition: `${lensRadius - (X * zooming)}px ${lensRadius - (Y * zooming)}px`,
        left: `${X - lensRadius}px`,
        top: `${Y - lensRadius}px`
      }
    }));
  }

  updateSize () {
    const { offsetWidth, offsetHeight } = this.props.imageRef.current.firstChild.firstChild;
    const lensRadius = this._getLensRadius();
    const zooming = this._getZooming();

    this.setState((prevState) => ({
      lensStyle: {
        ...prevState.lensStyle,
        backgroundSize: `${offsetWidth * zooming}px ${offsetHeight * zooming}px`,
        width: `${lensRadius * 2}px`,
        height: `${lensRadius * 2}px`
      }
    }));
  }

  updateStatus (e) {
    this.updatePos(e);
    this.updateSize();
  }

  onMouseDownUp (e) {
    const isMouseDown = (e.type === 'mousedown');

    if (e.button === 2) {
      return;
    }
    this.setState((prevState) => ({
      showLens: isMouseDown && !this._getIsLensDisable(),
      lensStyle: {
        ...prevState.lensStyle,
        imageRendering: this._getImageRendering()
      }
    }));

    if (isMouseDown) {
      this.updateStatus(e);
      this.props.imageRef.current.click(); // do not interfere with other handlers
    }
  }

  onWheel (e) {
    const { getSetting, setSetting, overlay } = this.props;
    const current = {
      lensRadius: this._getLensRadius(),
      zoomRatio: this._getZooming(),
      wheelStep: getSetting('wheelStep', 1)
    };
    const borders = {
      lensRadius: [ 50, getSetting('maxLensRadius', 700) ],
      zoomRatio: [ 1, getSetting('maxZoomRatio', 15) ],
      wheelStep: [ 0.1, 5 ]
    };
    const change = (target) => {
      const [ min ] = borders[target];
      const step = (target === 'wheelStep') ? min : (current.wheelStep * min);
      const plus = (e.deltaY < 0) ? step : (step * -1);

      current[target] = fixConfines((current[target] + plus), borders[target]);
      setSetting(target, Number(current[target]));
      overlay.sendInfo({ lens: current });
    };

    if (e.ctrlKey) {
      change('lensRadius');
    } else if (e.shiftKey) {
      change('wheelStep');
    } else {
      change('zoomRatio');
    }

    this.updateStatus(e);
  }
};
