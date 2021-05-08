const { React } = require('powercord/webpack');
const { fixConfines } = require('../utils');

/* eslint-disable object-property-newline */
module.exports = class ImageWrapperLens extends React.PureComponent {
  constructor ({ image, onSetConfig }) {
    super();

    this.state = {
      config: {},
      style: {
        display: 'block',
        backgroundPosition: null,
        backgroundSize: null,
        width: null,
        height: null,
        left: null,
        top: null
      },
      src: image
    };

    onSetConfig(this.updateConfig.bind(this));
  }

  render () {
    const style = (this.state.config.show) ? ({ ...this.state.config.style, ...this.state.style }) : {};

    return <div
      className="image-tools-lens"
      style={{
        backgroundImage: `url(${this.state.src})`, // долже быть всегда в DOM для сихронизации гифок
        ...style
      }}
    />;
  }

  updateConfig (data) {
    this.setState((prevState) => ({
      config: {
        ...prevState.config,
        ...data
      }
    }), () => {
      this.updatePos();
      this.updateSize();
    });
  }

  updatePos () {
    const { radius, zooming, positionX, positionY } = this.state.config;
    const rect = this.props.imageRef.current.firstChild.firstChild.getBoundingClientRect();
    const X = fixConfines(positionX, [ rect.left, rect.right ]) - rect.left;
    const Y = fixConfines(positionY, [ rect.top, rect.bottom ]) - rect.top;

    this.setState((prevState) => ({
      style: {
        ...prevState.style,
        radius,
        backgroundPosition: `${radius - (X * zooming)}px ${radius - (Y * zooming)}px`,
        left: `${X - radius}px`,
        top: `${Y - radius}px`
      }
    }));
  }

  updateSize () {
    const { offsetWidth, offsetHeight } = this.props.imageRef.current.firstChild.firstChild;
    const { radius, zooming } = this.state.config;

    this.setState((prevState) => ({
      style: {
        ...prevState.style,
        backgroundSize: `${offsetWidth * zooming}px ${offsetHeight * zooming}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`
      }
    }));
  }
};
