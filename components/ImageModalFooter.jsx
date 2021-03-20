const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const Copy = require('./Copyable.jsx');
const { zipUrl } = require('../utils');

const { downloadLink } = getModule([ 'downloadLink' ], false);
const { footer } = getModule([ 'avatarHint', 'footer' ], false);
// const { CarouselPrevious, CarouselNext } = getModule([ 'CarouselPrevious', 'CarouselNext' ], false);

module.exports = class ImageFooter extends React.PureComponent {
  constructor ({ setForceUpdate }) {
    super();
    setForceUpdate(this.forceUpdate.bind(this));
  }

  render () {
    const { getData, children } = this.props;
    const { resolution, size, name, url } = getData();
    const Retry = getModuleByDisplayName('Retry', false); // в render, тк высока вероятность получить null
    const Dropper = getModuleByDisplayName('Dropper', false);

    return (
      <div className={`image-tools-modal-footer ${footer} ${downloadLink}`}>
        <div className='content'>

          { children }

          <div className='buttons'>
            <div>
              <div/>
              <div/>
              <div/>
            </div>
            <div>
              <div><Retry width="20" height="20"/></div>
              <div><Dropper width="20" height="20" /></div>
              <div/>
            </div>
          </div>

          <div className='image-info'>
            { (resolution && size && name && url) && <>
              <p><Copy>{name}</Copy></p>
              <p><Copy>{resolution}</Copy> | <Copy>{size}</Copy></p>
              <p><Copy text={url}>{zipUrl(url)}</Copy></p>
            </>}
          </div>
        </div>
      </div>
    );
  }
};
