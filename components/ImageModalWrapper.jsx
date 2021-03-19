const { React, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const Lens = require('./ImageModalWrapperLens.jsx');

const imageDiscordUtils = getModule([ 'getImageSrc' ], false);

module.exports = class ImageWrapper extends React.PureComponent {
  constructor () {
    super();
    this.imgRef = React.createRef();

    this.state = {
      src: null,
      onMouseDownUp: null
    };
  }

  componentDidMount () {
    if (this.props?.overlay) {
      this.props.overlay.setEventListener('onClose', this.uninjectAll); // надёжнее componentWillUnmount()
    } else {
      // console.error('overlay offline');
    }
    this._injectToLazyImage();
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.src !== this.state.src) {
      if (this.props?.overlay) {
        this.props.overlay.sendInfo({
          currentImageSrc: this.state.src
        });
      }
    }
  }

  render () {
    const { setSetting, getSetting, overlay } = this.props;

    return <>

      { (this.state.src) &&
        <Lens
          setSetting={setSetting}
          getSetting={getSetting}
          overlay={overlay}
          image={this.state.src}
          imageRef={this.imgRef}
          setOnMouseDown={(callback) => this.setState({ onMouseDownUp: callback })}
        />
      }
      <div
        onMouseDown={this.state.onMouseDownUp}
        ref={this.imgRef}
      >{ this.props.children }</div>

    </>;
  }

  _injectToLazyImage () {
    const LazyImage = getModule((m) => m.default && m.default.displayName === 'LazyImage', false);
    this.setState({
      src: this.props.children.props.src
    });

    inject('image-tools-disable-media-proxy-sizes', imageDiscordUtils, 'getImageSrc', (args, res) => {
      const url = new URL(res); // это бутет надёжнее, чем просто "return args[0]"
      url.searchParams.delete('width');
      url.searchParams.delete('height');
      return url.href;
    });

    inject('image-tools-wrapper-lazy-image', LazyImage.default.prototype, 'render', (args, res) => {
      const { props } = res;

      if (props.readyState === 'READY' &&
          props.src.includes(this.props.children.props.src) &&
          !props.src.includes('?format=')
      ) {
        this.setState({
          src: props.src
        });
      }
      return res;
    });
    LazyImage.default.displayName = 'LazyImage';
  }

  uninjectAll () {
    uninject('image-tools-wrapper-lazy-image');
    uninject('image-tools-disable-media-proxy-sizes');
  }
};
