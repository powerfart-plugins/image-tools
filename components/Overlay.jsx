const { React, getModule, i18n: { Messages }, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const { getImages } = require('../utils');

const ImageFooter = require('./ImageModalFooter.jsx');

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.$image = null;
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
        </div>
      </div>
    );
  }

  _injectToImageModal () {
    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    const backdrop = findInReactTree(this.props.children, ({ props }) => props?.onClose);

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      const ImageWrapper = findInReactTree(res, ({ type }) => type?.name === 'ImageWrapper');

      ImageWrapper.props.overlay = {
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.getInfo.bind(this)
      };

      res.props.children[1] = React.createElement(ImageFooter, {
        children: res.props.children[1],
        sendDataToFooter: (callback) => this.setEventListener('sendDataToFooter', callback)
      });

      return res;
    });
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this._onClose, true);
    ImageModal.default.displayName = 'ImageModal';
  }

  setEventListener (type, callback) {
    this.setState({
      [type]: callback
    });
  }

  getInfo (obj) {
    if (obj.$image) {
      this._updateCurrentImg(obj.$image);
      return;
    }
    this.setState(({ infoFromImage }) => ({
      infoFromImage: {
        ...infoFromImage,
        ...obj
      }
    }));
  }

  _updateCurrentImg (img) {
    const result = this.images.findIndex(({ proxy_url }) => proxy_url === img.src);

    this.$image = img;
    this.setState(
      { currentImgIndex: (result === -1) ? null : result },
      () => this._updateFooter()
    );
  }

  _updateFooter () {
    const { currentImgIndex } = this.state;
    this.state.sendDataToFooter({
      $image: this.$image,
      attachment: (currentImgIndex !== null) ? this.images[currentImgIndex] : {}
    });
  }

  _onClose () {
    if (this.state.onClose) {
      this.state.onClose();
    }
    uninject('image-tools-overlay-image-modal');
    uninject('image-tools-overlay-backdrop');
    return [ true ];
  }
};
