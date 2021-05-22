const { React, getModule } = require('powercord/webpack');

const Lens = require('./Lens.jsx');

const { imagePlaceholder } = getModule([ 'imagePlaceholder' ], false);
const { imageWrapper } = getModule([ 'imageWrapper' ], false);

module.exports = class ImageModalWrapper extends React.PureComponent {
  constructor (props) {
    super(props);
    this.imgRef = React.createRef();
    this.$image = null;

    this.state = {
      src: props.children.props.src
    };
  }

  componentDidUpdate () {
    if (this.props.overlay) {
      if (!this.$image) {
        const $image = this.imgRef.current.querySelector(`.${imageWrapper} > img, .${imageWrapper} > video`);

        if ($image && !$image.classList.contains(imagePlaceholder)) {
          this.$image = $image;
          this.props.overlay.sendData({ $image });

          $image.onload = () => {
            this.$image = $image;
            this.props.overlay.sendData({ $image });
          };
        }
      }
    }
  }

  render () {
    return <>
      { (this.state.src) &&
        <Lens
          onSetConfig={(callback) => this.props.overlay.setEventListener('onSetLensConfig', callback) }
          imageRef={this.imgRef}
        />
      }
      <div
        ref={this.imgRef}
        onMouseDown={() => {
          this.imgRef.current.click(); // чтобы скрыть меню перед линзой
        }}
      >{ this.props.children }</div>
    </>;
  }
};
