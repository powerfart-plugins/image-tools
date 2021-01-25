const { React, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      injected: false,

      onMouseMove: null,
      onMouseUp: null,
      onWheel: null
    };
  }

  injectToImageModal () {
    if (this.state.injected) {
      return;
    }

    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      res.props.children[0].props.overlay = { // inject to ImageWrapper
        setEventListener: this.setEventListener.bind(this)
      };
      return res;
    });
    inject('image-tools-overlay-backdrop', this.props.children.props.children[0].props, 'onClose', () => {
      uninject('image-tools-overlay-image-modal');
      uninject('image-tools-overlay-backdrop');
      return true;
    });

    this.setState({
      injected: true
    });
  }

  setEventListener (type, callback) {
    this.setState({
      [type]: callback
    });
  }

  render () {
    this.injectToImageModal();

    return <>
      <div
        onMouseMove={this.state.onMouseMove}
        onMouseUp={this.state.onMouseUp}
        onWheel={this.state.onWheel}
      >
        {this.props.children}
      </div>

    </>;
  }
};
