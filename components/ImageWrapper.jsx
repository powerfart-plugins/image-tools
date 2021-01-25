const { React } = require('powercord/webpack');

const borders = {
  lensRadius: [ 50, 700 ],
  zoomRatio: [ 1, 15 ]
};

module.exports = class ImageWrapper extends React.Component {
  constructor (props) {
    super(props);
    // console.log(this);

    this.getLensRadius = () => this.props.getSetting('lensRadius', 100);
    this.getZooming = () => this.props.getSetting('zoomRatio', 2);
    this.imgRef = React.createRef();

    this.baseLensStyle = {
      backgroundImage: `url(${this.props.children.props.src})`,
      borderColor: this.props.getSetting('lensColor', null)
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
      showLens: false
    };

    this.onWheel = this.onWheel.bind(this);
    this.updatePos = this.updatePos.bind(this);
    this.updateSize = this.updateSize.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.onMouseDownUp = this.onMouseDownUp.bind(this);
  }

  updatePos (e) {
    /* eslint-disable no-use-before-define */
    const rect = this.imgRef.current.firstChild.firstChild.getBoundingClientRect();
    const lensRadius = this.getLensRadius();
    const zooming = this.getZooming();
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
    const lensRadius = this.getLensRadius();
    const zooming = this.getZooming();

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
    if (e.button === 2) {
      return;
    }
    this.setState({
      showLens: (e.type === 'mousedown')
    });
    this.updateStatus(e);
    this.imgRef.current.click(); // do not interfere with other handlers
  }

  onWheel (e) {
    const current = {
      lensRadius: this.getLensRadius(),
      zoomRatio: this.getZooming()
    };
    const change = (target) => {
      const [ step ] = borders[target];
      const plus = (e.deltaY < 0) ? step : (step * -1);

      this.props.setSetting(target, fixConfines(current[target], borders[target], plus));
    };

    if (e.ctrlKey) {
      change('lensRadius');
    } else {
      change('zoomRatio');
    }
    this.updateStatus(e);
  }

  render () {
    // console.log(this.props.children.props.overlayEventListener);
    return <>
      { this.state.showLens &&
      <div
        className="image-tools-lens"
        style={{
          ...this.baseLensStyle,
          ...this.state.lensStyle
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

  componentDidMount () {
    if (this.props.overlay) {
      this.props.overlay.setEventListener('onWheel', this.onWheel);
      this.props.overlay.setEventListener('onMouseMove', this.updatePos);
      this.props.overlay.setEventListener('onMouseUp', this.onMouseDownUp);
      this.props.overlay.setEventListener('onMouseLeave', this.onMouseDownUp);
    } else {
      console.error('overlay offline');
    }
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
