const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');

const OverlayUI = require('../../components/OverlayUI.jsx');
const ImageModalWrapper = require('../../components/ImageModalWrapper.jsx');

const inject2 = require('../../utils/inject2.js');

const imageModalClasses = getModule([ 'wrapper', 'downloadLink' ], false);

module.exports = class Overlay {
  constructor (settings, children) {
    this.uninjectIDs = [];
    this.patchImageSize = settings.get('patchImageSize', true);
    this.children = children;
  }

  inject ({ modalLayer, imageModalRender }) {
    this.injectHandler('Image.default.prototype.render', this.imageRender);
    this.injectHandler('ImageModal.default.prototype.render', (...a) => this.imageModalRender(...a, imageModalRender));
    this.patchBackdrop('image-tools-overlay-backdrop'); // @todo найти способ пропатчить closeModal
    this.patchModalLayer('image-tools-overlay-modal-layer', modalLayer);
  }

  uninject () {
    this.uninjectIDs.forEach(uninject);
  }

  imageRender (_, res) {
    const Video = findInReactTree(res, ({ type }) => type?.displayName === 'Video');
    if (Video) {
      Video.props.play = true;
    }
    return res;
  }

  imageModalRender (_, res, opts) {
    const { wrapper, downloadLink } = imageModalClasses;
    const Sticker = getModuleByDisplayName('Sticker', false);
    const Wrapper = findInReactTree(res, ({ className }) => className === wrapper).children;
    const LazyImageIndex = Wrapper.findIndex(({ type }) => type?.displayName === 'LazyImage');
    const footerIndex = Wrapper.findIndex(({ props }) => props?.className === downloadLink);
    const LazyImage = Wrapper[LazyImageIndex];

    if (LazyImage) {
      if (LazyImage.props.stickerAssets) {
        Wrapper[LazyImageIndex] = React.createElement(Sticker, LazyImage.props.stickerAssets);
      } else {
        if (this.patchImageSize) {
          const imgComp = LazyImage.props;
          const { height, width } = imgComp;

          imgComp.height = height * 2;
          imgComp.width = width * 2;
          imgComp.maxHeight = document.body.clientHeight * 70 / 100;
          imgComp.maxWidth = document.body.clientWidth * 80 / 100;
        }

        if (LazyImage.type.isAnimated({ original: LazyImage.props.src })) {
          LazyImage.props.animated = true;
        }
      }

      opts.lensConfig.children = Wrapper[LazyImageIndex];
    }

    Wrapper[footerIndex] = React.createElement(OverlayUI, {
      originalFooter: Wrapper[footerIndex],
      ...opts.overlayUI
    });

    return res;
  }

  patchBackdrop (id) {
    const backdrop = findInReactTree(this.children, ({ props }) => props?.onClose);
    inject(id, backdrop.props, 'onClose', () => {
      this.uninject();
      return [ true ];
    }, true);
    this.uninjectIDs.push(id);
  }

  patchModalLayer (id, opts) {
    const ModalLayer = findInReactTree(this.children, ({ props }) => props?.render);

    inject(id, ModalLayer.props, 'render', (args, res) => {
      res.props.children = (
        React.createElement(ImageModalWrapper, {
          children: res.props.children,
          ...opts
        })
      );
      return res;
    });
    this.uninjectIDs.push(id);
  }


  injectHandler (funcPath, patch) {
    const id = inject2(funcPath, (...args) => patch.call(this, ...args));
    this.uninjectIDs.push(id);
  }
};
