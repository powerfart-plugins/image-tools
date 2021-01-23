const { React, getModule } = require('powercord/webpack');
const { open } = require('powercord/modal');

const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false).default;
const MaskedLink = getModule((m) => m.default && m.default.displayName === 'MaskedLink', false).default;
// const Video = getModule((m) => m.default && m.default.displayName === 'Video', false).default;
const defaultSize = { height: 780, width: 780 }; // eslint-disable-line object-property-newline

module.exports = class ImageModalCaller extends React.Component {
  render () {
    return <ImageModal
      src={this.props.src}
      original={this.props.src}

      height={this.props.height || defaultSize.height}
      width={this.props.width || defaultSize.width}

      renderLinkComponent={(props) => <MaskedLink {...props} />}
      children={null}
    />;
  }
};

module.exports.open = function (props) {
  open(() => React.createElement(module.exports, props));
};
