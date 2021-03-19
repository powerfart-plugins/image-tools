const { React, getModule, i18n: { Messages }, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { getImages } = require('../utils');

const Copy = require('./Copyable.jsx');
// const BasePopout = getModuleByDisplayName('BasePopout', false);

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.state = {
      showLensInfo: false,
      infoFromImage: {
        lens: {}
      },
      currentImgIndex: null
    };

    this._onClose = this._onClose.bind(this);
    this._injectToImageModal();
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
    const { currentImgIndex } = this.state;
    const { name, size, resolution, url } = (currentImgIndex !== null) ? this.images[currentImgIndex].formatted : {};

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

        <div className='image-tools-overlay-info'>
          {(zoomRatio && lensRadius && wheelStep) &&
            <div
              className={`lens ${this.state.showLensInfo ? null : 'lens-hide'}`}
            >
              <p>{Messages.IMAGE_TOOLS_ZOOM_RATIO}: {zoomRatio.toFixed(1)}x</p>
              <p>{`${Messages.IMAGE_TOOLS_LENS_RADIUS} [CTRL]`}: {lensRadius.toFixed()}px</p>
              <p>{`${Messages.IMAGE_TOOLS_SCROLL_STEP} [SHIFT]`}: {wheelStep.toFixed(2)}</p>
            </div>
          }
          {(name && size && resolution && url) &&
            <div
              className={'image-info'}
            >
              <p><Copy>{name}</Copy></p>
              <p><Copy>{size}</Copy></p>
              <p><Copy>{resolution}</Copy></p>
              <p><Copy>{url}</Copy></p>
            </div>
          }
        </div>
      </div>
    );
  }

  _injectToImageModal () {
    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    const backdrop = this.props.children.props.children[0];

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      res.props.children[0].props.overlay = { // inject to ImageWrapper
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.getInfo.bind(this)
      };
      return res;
    });
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this._onClose);
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
    if (obj.currentImageSrc) {
      this._updateCurrentImg(obj.currentImageSrc);
      return;
    }
    this.setState((prevState) => ({
      infoFromImage: {
        ...prevState.infoFromImage,
        ...obj
      }
    }));
  }

  _updateCurrentImg (img) {
    const result = this.images.findIndex(({ proxy_url }) => proxy_url === img);
    this.setState({
      currentImgIndex: (result === -1) ? null : result
    });
  }
};
