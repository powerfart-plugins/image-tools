// noinspection JSUnusedGlobalSymbols

const { React, getModule, getModuleByDisplayName, getAllModules, i18n: { Messages } } = require('powercord/webpack');
const { openModal } = getModule([ 'openModal' ], false);

const ImageModal = getModuleByDisplayName('ImageModal', false);
const MaskedLink = getModuleByDisplayName('MaskedLink', false);
const { ModalRoot, ModalSize } = getModule([ 'ModalRoot' ], false);
const classes = getAllModules([ 'modal', 'image' ], false).find((e) => Object.keys(e).length === 2);

/**
 * @param {String} [original]
 * @param {String} src
 * @param {Number} [width]
 * @param {Number} [height]
 * @return Void
 */
module.exports = ({ original, src, width, height }) => {
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
      original: original || src
    }),
    ...props
  }));
};
