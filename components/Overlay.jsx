const { React, getModule, getModuleByDisplayName, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const { getImages } = require('../utils');

const OverlayUI = require('./OverlayUI.jsx');
const OverlayLensEvents = require('./OverlayLensEvents.jsx');
const ImageModalWrapper = require('./ImageModalWrapper.jsx');

module.exports = class ImageToolsOverlay extends OverlayLensEvents {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.state = {
      $image: null,
      currentImgIndex: null
    };

    this._onClose = this._onClose.bind(this); // @todo найти способ пропатчить closeModal
    this.injectToBackdrop();
    this.injectToModalLayer();
    this.injectToImageModal();
    this.injectToVideo();
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

    if (('show' in data) || this.lensConfig.show) {
      this.state.updateLensConfig(this.lensConfig);
    }

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

  injectToImageModal () {
    const ImageModal = getModule((m) => m?.default?.displayName === 'ImageModal', false);
    const { wrapper, downloadLink } = getModule([ 'wrapper', 'downloadLink' ], false);
    const patchImageSize = this.props.settings.get('patchImageSize', true);

    inject('image-tools-overlay-ui', ImageModal.default.prototype, 'render', (args, res) => {
      const Wrapper = findInReactTree(res, ({ className }) => className === wrapper);
      const LazyImage = findInReactTree(res, ({ type }) => type?.displayName === 'LazyImage');
      const footerIndex = Wrapper.children.findIndex(({ props }) => props?.className === downloadLink);

      if (LazyImage) {
        if (patchImageSize) {
          const imgComp = LazyImage.props;
          const { height, width } = imgComp;

          imgComp.height = height * 2;
          imgComp.width = width * 2;
          imgComp.maxHeight = document.body.clientHeight * 70 / 100;
          imgComp.maxWidth = document.body.clientWidth * 80 / 100;
        }

        if (LazyImage.type.isAnimated({ original: LazyImage.props.src })) { // @todo найти для mp4
          LazyImage.props.animated = true;
        }
        this.lensConfig.children = LazyImage;
      }

      Wrapper.children[footerIndex] = React.createElement(OverlayUI, {
        headerButtons: this.getButtons(),
        originalFooter: Wrapper.children[footerIndex],
        sendDataToUI: (callback) => this.sendDataToUI = callback
      });

      return res;
    });
    ImageModal.default.displayName = 'ImageModal';
  }

  injectToBackdrop () {
    const backdrop = findInReactTree(this.props.children, ({ props }) => props?.onClose);
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this._onClose, true);
  }

  injectToModalLayer () {
    const ModalLayer = findInReactTree(this.props.children, ({ props }) => props?.render);

    inject('image-tools-overlay-modal-layer', ModalLayer.props, 'render', (args, res) => {
      res.props.children = (
        React.createElement(ImageModalWrapper, {
          children: res.props.children,
          set$image: this.updateCurrentImg.bind(this),
          setUpdateLensConfig: (callback) => {
            this.setState({ updateLensConfig: callback });
          }
        })
      );

      return res;
    });
  }

  injectToVideo () {
    const Image = getModule((m) => m?.default?.displayName === 'Image', false);
    inject('image-tools-overlay-video', Image.default.prototype, 'render', (args, res) => {
      const Video = findInReactTree(res, ({ type }) => type?.displayName === 'Video');
      if (Video) {
        Video.props.play = true;
      }
      return res;
    });
    Image.default.displayName = 'Image';
  }

  updateCurrentImg ($image) {
    const updateIU = () => {
      const result = this.images.findIndex(({ proxy_url }) => proxy_url === this.state.$image.src);
      const currentImgIndex = (result === -1) ? null : result;

      this.setState({ currentImgIndex });
      this.updateUI({
        $image,
        attachment: (currentImgIndex !== null) ? this.images[currentImgIndex] : {}
      });
    };
    const updateLens = () => {
      this.updateLensConfig({
        getRectImage: () => $image.getBoundingClientRect()
      });
    };

    this.setState({ $image }, () => {
      updateIU();
      updateLens();
    });
  }

  updateUI (data) {
    this.sendDataToUI(data);
  }

  _onClose () {
    uninject('image-tools-overlay-ui');
    uninject('image-tools-overlay-backdrop');
    uninject('image-tools-overlay-modal-layer');
    uninject('image-tools-overlay-video');
    return [ true ];
  }
};
