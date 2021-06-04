const { React, getModule } = require('powercord/webpack');
const { sleep } = require('powercord/util');

const Lens = require('../tools/Lens/Index');
const { imageWrapper, imagePlaceholder } = getModule([ 'imageWrapper', 'imagePlaceholder' ], false);

// noinspection JSIgnoredPromiseFromCall
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

  componentDidMount () {
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

  async updateCurrentImg () {
    this.props.set$image(await this.waitFor()); // лучше бы хук конечно
  }

  async waitFor () {
    const elem = this.imgRef.current?.querySelector(`.${imageWrapper} > img, video`);

    if (!elem || elem?.classList?.contains(imagePlaceholder)) {
      await sleep(5);
      return this.waitFor();
    }

    return elem;
  }
};
