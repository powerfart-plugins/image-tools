const { React, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

module.exports = class ImageWrapper extends React.Component {
  constructor ({ getSetting }) {
    super();

    this._getLensRadius = () => getSetting('lensRadius', 100);
    this._getZooming = () => getSetting('zoomRatio', 2);
    this._getImageRendering = () => getSetting('disableAntiAliasing', null) ? 'pixelated' : null;
    this._getIsLensDisable = () => getSetting('disableLens', false);
    this.imgRef = React.createRef();

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
      src: null,
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
      setEventListener('onClose', this.uninjectLazyImage); // надёжнее componentWillUnmount()
      this._injectToLazyImage();
      this.updateSize();
    } else {
      // console.error('overlay offline');
    }
  }

  render () {
    // eslint-disable-next-line object-property-newline
    const style = (this.state.showLens) ? { display: 'block', ...this.state.lensStyle, ...this.baseLensStyle } : {};

    return <>
      { this.state.src &&
      <div
        className="image-tools-lens"
        style={{
          backgroundImage: `url(${this.state.src})`,
          ...style
        }}
      />
      }
      <div
        onMouseDown={this.onMouseDownUp}
        ref={this.imgRef}
      >
        {this.props.children}
      </div>
    </>;
  }

  _injectToLazyImage () {
    const LazyImage = getModule((m) => m.default && m.default.displayName === 'LazyImage', false);
    const { offsetWidth, offsetHeight } = this.imgRef.current;
    let { src } = this.props.children.props;
    src = `${src}${src.includes('?') ? '&' : '?'}width=${offsetWidth}&height=${offsetHeight}`;
    this.setState({ src });

    inject('image-tools-wrapper-lazy-image', LazyImage.default.prototype, 'render', (args, res) => {
      const { props } = res;

      if (props.readyState === 'READY' &&
          props.src.includes(this.props.children.props.src) &&
          !props.src.includes('?format=')
      ) {
        // if (props.src.includes('.gif')) {
        //   this.setState({
        //     src: props.src
        //   });
        // }
        this.setState({
          src: props.src
        });
      }
      return res;
    });
    LazyImage.default.displayName = 'LazyImage';
  }

  uninjectLazyImage () {
    uninject('image-tools-wrapper-lazy-image');
  }

  updatePos (e) {
    /* eslint-disable no-use-before-define */
    const rect = this.imgRef.current.firstChild.firstChild.getBoundingClientRect();
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
    const { offsetWidth, offsetHeight } = this.imgRef.current.firstChild.firstChild;
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
      this.imgRef.current.click(); // do not interfere with other handlers
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
      wheelStep: [ 1, 5 ]
    };
    const change = (target) => {
      const [ min ] = borders[target];
      const step = (target === 'wheelStep') ? min : (current.wheelStep * min);
      const plus = (e.deltaY < 0) ? step : (step * -1);

      current[target] = fixConfines(current[target], borders[target], plus);
      setSetting(target, current[target]);
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


function fixConfines (number, borders, plus = 0) {
  const [ min, max ] = borders;
  let val = Math.round(number) + plus;

  if (val < min) {
    val = min;
  }
  if (val > max) {
    val = max;
  }
  return val;
}
