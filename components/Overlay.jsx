const { React, getModule, getModuleByDisplayName, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const { getImages } = require('../utils');

const OverlayUI = require('./OverlayUI.jsx');
const OverlayLensEvents = require('./OverlayLensEvents.jsx');

module.exports = class ImageToolsOverlay extends OverlayLensEvents {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.$image = null;
    this.state = {
      currentImgIndex: null
    };

    this._onClose = this._onClose.bind(this);
    this._injectToImageModal();
  }

  render () {
    return (
      <div
        onMouseMove={this.onMouseMove}
        onMouseDown={this.onMouse}
        onMouseUp={this.onMouse}
        onMouseLeave={this.onMouse}
        onWheel={this.onWheel}
        onKeyDown={(e) => {
          if (e.keyCode === 27) { // ESC
            this._onClose();
          }
        }}
      >
        {this.props.children}
      </div>
    );
  }

  updateLensConfig (data) {
    super.updateLensConfig(data);
    this.state.onSetLensConfig(data);

    if ([ 'radius', 'zooming', 'wheelStep' ].some((k) => k in data)) {
      this.updateUI({
        lensConfig: this.lensConfig
      });
    }
  }

  getButtons () {
    const Retry = getModuleByDisplayName('Retry', false);
    const Dropper = getModuleByDisplayName('Dropper', false);

    return [
      // {
      //   tooltip: 'rotate',
      //   Icon: Retry,
      //   callback: () => console.log('nope')
      // },
      // {
      //   tooltip: 'grab a color',
      //   Icon: Dropper,
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
        sendData: this.setData.bind(this)
      };

      Wrapper.children[footerIndex] = React.createElement(OverlayUI, {
        headerButtons: this.getButtons(),
        originalFooter: Wrapper.children[footerIndex],
        sendDataToUI: (callback) => this.setEventListener('sendDataToUI', callback)
      });

      return res;
    });
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this._onClose, true);
    ImageModal.default.displayName = 'ImageModal';
  }

  setEventListener (type, callback) {
    const onStated = () => {
      if (type === 'onSetLensConfig') {
        this.state.onSetLensConfig(this.lensConfig);
      }
    };

    this.setState({
      [type]: callback
    }, onStated);
  }

  setData (obj) {
    if (obj.$image) {
      this.updateCurrentImg(obj.$image);
    }
  }

  updateCurrentImg (img) {
    const result = this.images.findIndex(({ proxy_url }) => proxy_url === img.src);

    this.$image = img;
    this.setState(
      { currentImgIndex: (result === -1) ? null : result },
      () => this.updateUI({
        $image: img,
        attachment: (this.state.currentImgIndex !== null) ? this.images[this.state.currentImgIndex] : {}
      })
    );
  }

  updateUI (data) {
    this.state.sendDataToUI(data);
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
