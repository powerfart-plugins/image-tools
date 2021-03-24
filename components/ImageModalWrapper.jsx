const { React, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

const Lens = require('./ImageModalWrapperLens.jsx');

const { imagePlaceholder } = getModule([ 'imagePlaceholder' ], false);

module.exports = class ImageWrapper extends React.Component {
  constructor () {
    super();
    this.imgRef = React.createRef();
    this.$image = null;

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

  componentDidUpdate () {
    if (this.props?.overlay) {
      if (!this.$image) {
        const $image = this.imgRef.current.querySelector('img');

        if ($image && !$image.classList.contains(imagePlaceholder)) {
          $image.onload = () => {
            this.$image = $image;
            this.props.overlay.sendInfo({ $image });
          };
        }
      }
    } else {
      // console.error('overlay offline');
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
  }
};
