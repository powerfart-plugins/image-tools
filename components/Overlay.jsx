const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.injected = false;
    this.state = {
      showLensInfo: false,
      infoFromImage: {}
    };

    this.uninjectImageModal = this.uninjectImageModal.bind(this);
  }

  injectToImageModal () {
    if (this.injected) {
      return;
    }

    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    const backdrop = this.props.children.props.children[0];

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      res.props.children[0].props.overlay = { // inject to ImageWrapper
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.getInfo.bind(this)
      };
      return res;
    });
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this.uninjectImageModal);

    this.injected = true;
  }

  uninjectImageModal () {
    uninject('image-tools-overlay-image-modal');
    uninject('image-tools-overlay-backdrop');
    return true;
  }

  setEventListener (type, callback) {
    this.setState({
      [type]: callback
    });
  }

  getInfo (obj) {
    this.setState((prevState) => ({
      infoFromImage: {
        ...prevState.infoFromImage,
        ...obj
      }
    }));
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.infoFromImage.lens !== this.state.infoFromImage.lens) {
      this.setState({
        showLensInfo: true
      });
      setTimeout(() => {
        this.setState({
          showLensInfo: false
        });
      }, 2500);
    }
  }

  render () {
    this.injectToImageModal();

    return (
      <div
        onMouseMove={this.state.onMouseMove}
        onWheel={this.state.onWheel}
        onMouseUp={this.state.onMouseUp}
        onMouseLeave={this.state.onMouseLeave}
        onKeyDown={(e) => {
          if (e.keyCode === 27) { // ESC
            this.uninjectImageModal();
          }
        }}
      >
        {this.props.children}

        {this.state.infoFromImage.lens &&
          <div
            className={`image-tools-lens-info ${this.state.showLensInfo ? null : 'image-tools-lens-info-hide'}`}
          >
            <p>{Messages.ZOOM_RATIO}: {this.state.infoFromImage.lens.lensRadius}px</p>
            <p>{Messages.LENS_RADIUS}: {this.state.infoFromImage.lens.zoomRatio}x</p>
          </div>
        }
      </div>
    );
  }
};
