const { React } = require('powercord/webpack');
const { fixConfines } = require('../utils');

/* eslint-disable object-property-newline */
module.exports = class ImageWrapperLens extends React.PureComponent {
  constructor ({ image, onSetConfig }) {
    super();

    this.state = {
      config: {},
      src: image
    };

    onSetConfig(this.updateConfig.bind(this));
  }

  render () {
    let style = {};
    const { config } = this.state;

    if (config.show) {
      const { backgroundPosition, left, top } = this.getPos(config);
      const { backgroundSize, width, height } = this.getSize(config);

      style = {
        display: 'block',
        backgroundPosition,
        backgroundSize,
        width,
        height,
        left,
        top,
        ...config.style
      };
    }

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
    }));
  }

  getPos ({ radius, zooming, positionX, positionY }) {
    const rect = this.props.imageRef.current.firstChild.firstChild.getBoundingClientRect();
    const X = fixConfines(positionX, [ rect.left, rect.right ]) - rect.left;
    const Y = fixConfines(positionY, [ rect.top, rect.bottom ]) - rect.top;

    return {
      backgroundPosition: `${radius - (X * zooming)}px ${radius - (Y * zooming)}px`,
      left: `${X - radius}px`,
      top: `${Y - radius}px`
    };
  }

  getSize ({ radius, zooming }) {
    const { offsetWidth, offsetHeight } = this.props.imageRef.current.firstChild.firstChild;

    return {
      backgroundSize: `${offsetWidth * zooming}px ${offsetHeight * zooming}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`
    };
  }
};
