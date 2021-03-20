const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');

const Copy = require('./Copyable.jsx');
const { zipUrl } = require('../utils');

const { downloadLink } = getModule([ 'downloadLink' ], false);
const { footer } = getModule([ 'avatarHint', 'footer' ], false);
const Retry = getModuleByDisplayName('Retry', false);
const Dropper = getModuleByDisplayName('Dropper', false);
// const { CarouselPrevious, CarouselNext } = getModule([ 'CarouselPrevious', 'CarouselNext' ], false);

module.exports = class ImageFooter extends React.PureComponent {
  constructor ({ setForceUpdate }) {
    super();
    setForceUpdate(this.forceUpdate.bind(this));
  }

  render () {
    const { getData, children } = this.props;
    const { resolution, size, name, url } = getData();

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
