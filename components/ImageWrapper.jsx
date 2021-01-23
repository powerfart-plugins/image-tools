const { React } = require('powercord/webpack');

const borders = {
  lensRadius: [ 50, 700 ],
  zoomRatio: [ 1, 15 ]
};

module.exports = class ImageWrapper extends React.Component {
  constructor (props) {
    super(props);

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

  updatePos ({ clientX, clientY, pageX, pageY }) {
    const img = this.imgRef.current.firstChild.firstChild;
    const rect = img.getBoundingClientRect();

    if (pageX < rect.left || pageX > rect.right || pageY < rect.top || pageY > rect.bottom) {
      this.setState({ showLens: false });
      return;
    }
    const X = clientX - rect.left;
    const Y = clientY - rect.top;
    const lensRadius = this.getLensRadius();
    const zooming = this.getZooming();

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
    const img = this.imgRef.current.firstChild.firstChild;
    const lensRadius = this.getLensRadius;
    const zooming = this.getZooming;

    this.setState((prevState) => ({
      lensStyle: {
        ...prevState.lensStyle,
        backgroundSize: `${img.offsetWidth * zooming()}px ${img.offsetHeight * zooming()}px`,
        width: `${lensRadius() * 2}px`,
        height: `${lensRadius() * 2}px`
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
    const plusTo = (to) => {
      const [ step ] = borders[to];
      const plus = (e.deltaY < 0) ? step : (step * -1);
      this.props.setSetting(to, fixConfines(current[to], plus, borders[to])); // eslint-disable-line no-use-before-define
    };

    if (e.ctrlKey) {
      plusTo('lensRadius', e.deltaY);
    } else {
      plusTo('zoomRatio', e.deltaY);
    }
    this.updateStatus(e);

    function fixConfines (number, plus, borders) {
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
  }

  render () {
    return <>
      { this.state.showLens &&
          <div
            className="image-tools-lens"
            style={{
              ...this.baseLensStyle,
              ...this.state.lensStyle
            }}
            onMouseUp={this.onMouseDownUp}
            onMouseMove={this.updatePos}
            onWheel={this.onWheel}
          />
      }
      <div
        onMouseDown={this.onMouseDownUp}
        onWheel={this.onWheel}
        ref={this.imgRef}
      >
        {this.props.children}
      </div>
    </>;
  }
};

