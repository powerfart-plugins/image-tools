const { React } = require('powercord/webpack');

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

    this.updatePos = this.updatePos.bind(this);
    this.onMouseDownUp = this.onMouseDownUp.bind(this);
  }

  updatePos (event) {
    const { clientX, clientY, pageX, pageY } = event;
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

    this.setState({
      lensStyle: {

        backgroundSize: `${img.offsetWidth * zooming}px ${img.offsetHeight * zooming}px`,
        backgroundPosition: `${lensRadius - (X * zooming)}px ${lensRadius - (Y * zooming)}px`,

        width: `${lensRadius * 2}px`,
        height: `${lensRadius * 2}px`,

        left: `${X - lensRadius}px`,
        top: `${Y - lensRadius}px`
      }
    });
  }

  onMouseDownUp (e) {
    if (e.button === 2) {
      return;
    }
    this.setState({
      showLens: (e.type === 'mousedown')
    });
    this.updatePos(e);
    this.imgRef.current.click(); // do not interfere with other handlers
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
};

