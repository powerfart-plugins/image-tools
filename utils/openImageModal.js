const { React, getModuleByDisplayName } = require('powercord/webpack');
const { open } = require('powercord/modal');

const ImageModal = getModuleByDisplayName('ImageModal', false);
const MaskedLink = getModuleByDisplayName('MaskedLink', false);
// const Video = getModule((m) => m.default && m.default.displayName === 'Video', false).default;

module.exports = ({ src, width, height }) => {
  open(() => React.createElement(ImageModal, {
    src,
    height,
    width,
    renderLinkComponent: (p) => React.createElement(MaskedLink, p),
    original: src,
    children: null
  }));
};
