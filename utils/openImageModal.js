const { React, getModuleByDisplayName } = require('powercord/webpack');
const { open } = require('powercord/modal');

const ImageModal = getModuleByDisplayName('ImageModal', false);
const MaskedLink = getModuleByDisplayName('MaskedLink', false);
// const Video = getModule((m) => m.default && m.default.displayName === 'Video', false).default;

const defaultSize = { height: 780, width: 780 }; // eslint-disable-line object-property-newline

module.exports = (props) => {
  open(() => React.createElement(ImageModal, {
    src: props.src,
    original: props.src,
    height: props.height || defaultSize.height,
    width: props.width || defaultSize.width,

    renderLinkComponent: (p) => React.createElement(MaskedLink, p),
    children: null
  }));
};
