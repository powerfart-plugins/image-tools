const { React, getModule } = require('powercord/webpack');

const Copy = require('./Copyable.jsx');
const { zipUrl } = require('../utils');

const { downloadLink } = getModule([ 'downloadLink' ], false);
// const { CarouselPrevious, CarouselNext } = getModule([ 'CarouselPrevious', 'CarouselNext' ], false);

module.exports = class ImageFooter extends React.PureComponent {
  constructor ({ setForceUpdate }) {
    super();
    setForceUpdate(this.forceUpdate.bind(this));
  }

  render () {
    const { getData, children } = this.props;
    const { resolution, size, name, url } = getData();
    // const Retry = getModuleByDisplayName('Retry', false); // в render, тк высока вероятность получить null
    // const Dropper = getModuleByDisplayName('Dropper', false);

    return (
      <div className={`image-tools-modal-footer ${downloadLink}`}>
        <div className='content'>

          { children }

          <div className='image-info'>
            { (resolution && size && name && url) && <>
              <p>
                <Copy>{name}</Copy>
              </p>
              <p>
                <Copy>{resolution}</Copy>
                <div className='separator'/>
                <Copy>{size}</Copy>
              </p>
              <p>
                <Copy text={url}>{zipUrl(url)}</Copy>
              </p>
            </>}
          </div>
        </div>
      </div>
    );
  }
};
