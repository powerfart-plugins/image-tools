// noinspection JSUnusedGlobalSymbols

const { React, getModule, getModuleByDisplayName, getAllModules, i18n: { Messages } } = require('powercord/webpack');
const { openModal } = getModule([ 'openModal', 'openModalLazy' ], false);

const ImageModal = getModuleByDisplayName('ImageModal', false);
const MaskedLink = getModuleByDisplayName('MaskedLink', false);
const { ModalRoot, ModalSize } = getModule([ 'ModalRoot' ], false);
const classes = getAllModules([ 'modal', 'image' ], false).find((e) => Object.keys(e).length === 2);

/**
 * @param {Object} opts
 * @param {String} [opts.original]
 * @param {String} opts.src
 * @param {Number} [opts.width]
 * @param {Number} [opts.height]
 * @return {String} modalId
 */
module.exports = ({ original, src, width, height, stickerAssets }) =>
  openModal((props) => React.createElement(ModalRoot, {
    className: classes.modal,
    size: ModalSize.DYNAMIC,
    'aria-label': Messages.IMAGE,
    children: React.createElement(ImageModal, {
      className: classes.image,
      src,
      height,
      width,
      renderLinkComponent: (p) => React.createElement(MaskedLink, p),
      original: original || src,
      stickerAssets
    }),
    ...props
  }));
