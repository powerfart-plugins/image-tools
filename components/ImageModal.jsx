const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { open } = require('powercord/modal');

const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false).default;
const { renderMaskedLinkComponent } = getModule([ 'renderMaskedLinkComponent' ], false);
const { downloadLink } = getModule([ 'downloadLink' ], false);

module.exports = class ImageModalCaller extends React.Component {
  render () {
    return <>
      <ImageModal
        src={this.props.src}
        children={null}
        height={this.props.height}
        width={this.props.width}
      />
      <renderMaskedLinkComponent
        href={this.props.src}
        target={'_blank'}
        className={downloadLink}
        children={Messages.OPEN_ORIGINAL_IMAGE}
      />
    </>;
  }
};

module.exports.open = function (props) {
  open(() => React.createElement(module.exports, props));
};
