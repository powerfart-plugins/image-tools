const { React, getModule, getModuleByDisplayName, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree } = require('powercord/util');

const { LensHandlers, getImages } = require('../utils');
const { ImageColorPicker } = require('../tools');

const OverlayUI = require('./OverlayUI.jsx');
const ImageModalWrapper = require('./ImageModalWrapper.jsx');

const { int2hex } = getModule([ 'int2hex' ], false);
const { imageWrapper } = getModule([ 'imageWrapper' ], false);
const { _ } = global;

/* eslint-disable object-property-newline */
module.exports = class ImageToolsOverlay extends React.PureComponent {
  constructor (props) {
    super(props);
    const { get, set } = props.settings;

    this.images = getImages(getChannelId());
    this.state = {
      $image: null,
      currentImgIndex: null
    };

    this.settings = {
      get radius () {
        return get('lensRadius', 100);
      },
      get zooming () {
        return get('zoomRatio', 2);
      },
      get wheelStep () {
        return get('wheelStep', 1);
      },
      set radius (v) {
        return set('lensRadius', v);
      },
      set zooming (v) {
        return set('zoomRatio', v);
      },
      set wheelStep (v) {
        return set('wheelStep', v);
      }
    };
    this.lensConfig = {
      show: false,
      radius: this.settings.radius,
      zooming: this.settings.zooming,
      wheelStep: this.settings.wheelStep,
      positionX: 0,
      positionY: 0,
      getRectImage: () => ({}),
      renderPreview: () => null,
      style: {
        borderColor: int2hex(this.props.settings.get('lensColor', 0)),
        get imageRendering () {
          return get('disableAntiAliasing', null) ? 'pixelated' : null;
        }
      }
    };
    this.additionalHandler = {};

    this.injectToBackdrop();
    this.injectToModalLayer();
    this.injectToImageModal();
    this.injectToVideo();

    // @todo найти способ пропатчить closeModal
    _.bindAll(this, [ 'onMouseMove', 'onWheel', 'onMouseButton', 'onMouseDown', 'onClose' ]);
  }

  render () {
    return (
      <div
        onMouseMove={this.onMouseMove}
        onMouseDown={this.onMouseDown}
        onMouseLeave={this.onMouseDown}
        onMouseUp={this.onMouseButton}
        onClick={this.onMouseButton}
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

  onMouseMove (e) {
    const suppress = this.getAdditionalHandler(e, 'onMouseMove');
    if (suppress) {
      return;
    }
    this.updateLensConfig(LensHandlers.onMouseMove(e));
  }

  onMouseDown (e) {
    if (e.target.parentElement.classList.contains(imageWrapper)) {
      this.onMouseButton(e);
    }
  }

  onMouseButton (e) {
    if (e.target.closest('div.button')) {
      return;
    }

    const suppress = this.getAdditionalHandler(e, 'onMouseButton');
    if (suppress) {
      return;
    }
    this.updateLensConfig(LensHandlers.onMouseButton(e));
  }

  onWheel (e) {
    const suppress = this.getAdditionalHandler(e, 'onWheel');
    if (suppress) {
      return;
    }
    const val = LensHandlers.onWheel(e,
      {
        radius: this.lensConfig.radius,
        zooming: this.lensConfig.zooming,
        wheelStep: this.lensConfig.wheelStep
      },
      {
        radius: [ 50, this.props.settings.get('maxLensRadius', 700) ],
        zooming: [ 1, this.props.settings.get('maxZoomRatio', 15) ],
        wheelStep: [ 0.1, 5 ]
      }
    );
    const [ key ] = Object.keys(val);

    this.settings[key] = val[key];
    this.updateLensConfig(val);
  }

  /**
   * @param {Event} event
   * @param {String} handlerName
   * @returns {boolean} whether it is necessary to suppress the following handlers
   */
  getAdditionalHandler (event, handlerName) {
    const resource = this.additionalHandler[handlerName];
    if (resource) {
      const res = resource.func(event);
      if (resource.capture && !res) {
        return true;
      }
    }
    return false;
  }

  updateLensConfig (data) {
    this.lensConfig = {
      ...this.lensConfig,
      ...data
    };

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
      {
        tooltip: 'grab a color',
        Icon: Dropper,
        callback: () => {
          if (!this.ColorPicker) {
            this.ColorPicker = new ImageColorPicker(this.state.$image);
          }
          const backupConfig = {
            ...this.lensConfig
          };
          this.additionalHandler.onWheel = { func: () => null, capture: true };
          this.additionalHandler.onMouseButton = {
            func: (e) => {
              if (e.type === 'click') {
                this.additionalHandler.onWheel = null;
                this.additionalHandler.onMouseButton = null;
                this.ColorPicker.copyColor();
                this.updateLensConfig({
                  show: false,
                  ...backupConfig
                });
              }
            },
            capture: true
          };
          this.updateLensConfig({
            show: true,
            ...this.ColorPicker.lensConfig
          });
        }
      }
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
    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this.onClose, true);
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

  onClose () {
    uninject('image-tools-overlay-ui');
    uninject('image-tools-overlay-backdrop');
    uninject('image-tools-overlay-modal-layer');
    uninject('image-tools-overlay-video');
    return [ true ];
  }
};
