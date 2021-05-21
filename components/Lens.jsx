const { React, getModule } = require('powercord/webpack');

const { imageWrapper } = getModule([ 'imageWrapper' ], false);
const { fixConfines } = require('../utils');

/* eslint-disable object-property-newline */
module.exports = class Lens extends React.PureComponent {
  constructor ({ image, onSetConfig }) {
    super();

    this.state = {
      config: {},
      src: image
    };

    onSetConfig(this.updateConfig.bind(this));
  }

  render () {
    const { config } = this.state;
    const style = {
      parent: {},
      child: {}
    };

    if (config.show) {
      const [ parentPos, childPos ] = this.getPos(config);
      const [ parentSize, childSize ] = this.getSize(config);

      style.parent = {
        display: 'block',
        ...parentPos,
        ...parentSize
      };
      style.child = {
        transform: `${childSize.transform} ${childPos.transform}`
      };
    }


    return (
      <div className="image-tools-lens" style={style.parent}>
        <div style={style.child}>
          { config.children }
        </div>
      </div>
    );
  }

  updateConfig (data) {
    this.setState((prevState) => ({
      config: {
        ...prevState.config,
        ...data
      }
    }));
  }

  getPos ({ radius, positionX, positionY }) {
    const rect = this.props.imageRef.current.querySelector(`.${imageWrapper} > *`).getBoundingClientRect();
    const X = fixConfines(positionX, [ rect.left, rect.right ]) - rect.left;
    const Y = fixConfines(positionY, [ rect.top, rect.bottom ]) - rect.top;

    return [
      {
        left: `${X - radius}px`,
        top: `${Y - radius}px`
      },
      {
        transform: `translate(${radius - X}px, ${radius - Y}px)`
      }
    ];
  }

  // новые уведолмения
  getSize ({ radius, zooming }) {
    return [
      {
        width: `${radius * 2}px`,
        height: `${radius * 2}px`
      },
      {
        transform: `scale(${zooming})`
      }
    ];
  }
};
