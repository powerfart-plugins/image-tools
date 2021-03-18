const { React, getModule, i18n: { Messages }, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { getImages } = require('../utils');

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.state = {
      showLensInfo: false,
      infoFromImage: {
        lens: {}
      }
    };

    this.onClose = this.onClose.bind(this);
    this.injectToImageModal();
  }

  injectToImageModal () {
    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    const backdrop = this.props.children.props.children[0];

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      res.props.children[0].props.overlay = { // inject to ImageWrapper
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.getInfo.bind(this)
      };
      return res;
    });
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this.onClose);
    ImageModal.default.displayName = 'ImageModal';
  }

  _onClose () {
    if (this.state.onClose) {
      this.state.onClose();
    }
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
    const { zoomRatio, lensRadius, wheelStep } = this.state.infoFromImage.lens;

    return (
      <div
        onMouseMove={this.state.onMouseMove}
        onWheel={this.state.onWheel}
        onMouseUp={this.state.onMouseUp}
        onMouseLeave={this.state.onMouseLeave}
        onKeyDown={(e) => {
          if (e.keyCode === 27) { // ESC
            this._onClose();
          }
        }}
      >
        {this.props.children}

        {(zoomRatio && lensRadius && wheelStep) &&
          <div
            className={`image-tools-lens-info ${this.state.showLensInfo ? null : 'image-tools-lens-info-hide'}`}
          >
            <p>{Messages.IMAGE_TOOLS_ZOOM_RATIO}: {zoomRatio.toFixed(1)}x</p>
            <p>{`${Messages.IMAGE_TOOLS_LENS_RADIUS} [CTRL]`}: {lensRadius.toFixed()}px</p>
            <p>{`${Messages.IMAGE_TOOLS_SCROLL_STEP} [SHIFT]`}: {wheelStep.toFixed(2)}</p>
          </div>
        }
      </div>
    );
  }
};
