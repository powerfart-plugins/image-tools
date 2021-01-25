const { React, getModule } = require('powercord/webpack');
const { open } = require('powercord/modal');

const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false).default;
const MaskedLink = getModule((m) => m.default && m.default.displayName === 'MaskedLink', false).default;
// const Video = getModule((m) => m.default && m.default.displayName === 'Video', false).default;
const defaultSize = { height: 780, width: 780 }; // eslint-disable-line object-property-newline

module.exports.open = (props) => {
  open(() => React.createElement(ImageModal, {
    src: props.src,
    original: props.src,
    height: props.height || defaultSize.height,
    width: props.width || defaultSize.width,

    renderLinkComponent: (props) => <MaskedLink {...props} />,
    children: null
  }));
};
