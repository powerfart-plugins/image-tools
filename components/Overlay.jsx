const { React, getModule, getModuleByDisplayName, i18n: { Messages }, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const { getImages } = require('../utils');

const OverlayUI = require('./OverlayUI.jsx');

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
      this.setState({ showLensInfo: true });
      setTimeout(() => this.setState({ showLensInfo: false }), 2500);
    }
  }

  render () {
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
        {this.renderInfo()}
      </div>
    );
  }

  renderInfo () { // @todo перенести в OverlayUI
    const { zoomRatio, lensRadius, wheelStep } = this.state.infoFromImage.lens;
    return (
      <div className='image-tools-overlay-info'>
        {(zoomRatio && lensRadius && wheelStep) &&
          <div
            className={`lens ${this.state.showLensInfo ? null : 'lens-hide'}`}
          >
            <p>{Messages.IMAGE_TOOLS_ZOOM_RATIO}: {Number(zoomRatio).toFixed(1)}x</p>
            <p>{`${Messages.IMAGE_TOOLS_LENS_RADIUS} [CTRL]`}: {Number(lensRadius).toFixed()}px</p>
            <p>{`${Messages.IMAGE_TOOLS_SCROLL_STEP} [SHIFT]`}: {Number(wheelStep).toFixed(2)}</p>
          </div>
        }
      </div>
    );
  }

  getButtons () {
    const Retry = getModuleByDisplayName('Retry', false);

    return [
      // {
      //   tooltip: 'rotate',
      //   Icon: Retry,
      //   callback: () => console.log('nope')
      // }
    ];
  }

  _injectToImageModal () {
    const ImageModal = getModule((m) => m?.default?.displayName === 'ImageModal', false);
    const backdrop = findInReactTree(this.props.children, ({ props }) => props?.onClose);
    const { wrapper, downloadLink } = getModule([ 'wrapper', 'downloadLink' ], false);

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      const Wrapper = findInReactTree(res, ({ className }) => className === wrapper);
      const ImageWrapper = findInReactTree(Wrapper, ({ type }) => type?.name === 'ImageWrapper');
      const footerIndex = Wrapper.children.findIndex(({ props }) => props?.className === downloadLink);

      ImageWrapper.props.overlay = {
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.setInfo.bind(this)
      };

      Wrapper.children[footerIndex] = React.createElement(OverlayUI, {
        headerButtons: this.getButtons(),
        originalFooter: Wrapper.children[footerIndex],
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

  setInfo (obj) {
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
