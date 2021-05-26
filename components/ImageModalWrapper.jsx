const { React, getModule } = require('powercord/webpack');

const Lens = require('./Lens.jsx');
const { imageWrapper, imagePlaceholder } = getModule([ 'imageWrapper', 'imagePlaceholder' ], false);

module.exports = class ImageModalWrapper extends React.PureComponent {
  constructor (props) {
    super(props);
    this.imgRef = React.createRef();
    this.$image = null;
    this.state = {
      lensConfig: {}
    };

    props.setUpdateLensConfig((lensConfig) => {
      this.setState({ lensConfig });
    });
  }

  componentWillUpdate () { // @todo нужен более надёжный хук
    this.updateCurrentImg();
  }

  render () {
    return (
      <>
        <Lens {...this.state.lensConfig} />
        <div
          ref={this.imgRef}
          onMouseDown={() => {
            this.imgRef.current.click(); // чтобы скрыть меню перед линзой
          }}
        > {this.props.children} </div>
      </>
    );
  }

  updateCurrentImg () {
    if (this.$image) {
      return;
    }
    const $image = this.imgRef.current.querySelector(`.${imageWrapper} > img, video`);

    if ($image && !$image.classList.contains(imagePlaceholder)) {
      this.props.set$image($image);
      this.$image = true;
    }
  }
};
