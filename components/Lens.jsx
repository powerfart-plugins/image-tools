const { React } = require('powercord/webpack');

const { fixConfines } = require('../utils');

/* eslint-disable object-property-newline */
module.exports = class Lens extends React.PureComponent {
  render () {
    const style = { parent: {}, child: {} };

    if (this.props.show) {
      const [ parentPos, childPos ] = this.getPos(this.props);
      const [ parentSize, childSize ] = this.getSize(this.props);

      style.parent = {
        display: 'block',
        ...parentPos,
        ...parentSize,
        ...this.props.style
      };
      style.child = {
        ...childSize,
        ...childPos
      };
    }

    return (
      <div className="image-tools-lens" style={style.parent}>
        <div style={style.child}>
          { this.props.children }
        </div>
      </div>
    );
  }

  updateConfig (data) {
    const stated = () => {
      const video = document.querySelector('.image-tools-lens > div > div > video'); // @todo мб fix,
      if (video) {
        video.autoplay = true;
      }
    };

    this.setState((prevState) => ({
      config: {
        ...prevState.config,
        ...data
      }
    }), stated);
  }

  getPos ({ radius, zooming, positionX, positionY, getRectImage }) {
    const { left, right, top, bottom } = getRectImage();
    const X = fixConfines(positionX, [ left, right ]) - left;
    const Y = fixConfines(positionY, [ top, bottom ]) - top;

    return [
      {
        left: `${X - radius}px`,
        top: `${Y - radius}px`
      },
      {
        transform: `translate(${radius - (X * zooming)}px, ${radius - (Y * zooming)}px)`
      }
    ];
  }

  // @todo новые уведолмения
  getSize ({ radius, zooming, getRectImage }) {
    const { width, height } = getRectImage();
    return [
      {
        width: `${radius * 2}px`,
        height: `${radius * 2}px`
      },
      {
        width: `${width * zooming}px`,
        height: `${height * zooming}px`
      }
    ];
  }
};
