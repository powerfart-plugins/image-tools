const { React, getModule } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

const Copy = require('./Copyable.jsx');

const { downloadLink } = getModule([ 'downloadLink' ], false);
const { buttons } = getModule([ 'button', 'buttons' ], false);
const { button, sizeIcon } = getModule([ 'button', 'sizeIcon' ], false);

module.exports = class ImageFooter extends React.PureComponent {
  constructor ({ sendDataToFooter }) {
    super();
    sendDataToFooter(this.getData.bind(this));

    this.state = {
      data: null,
      size: 0
    };
  }

  render () {
    return (
      <div className='image-tools-overlay-ui'>
        { this.renderHeader() }
        { this.renderFooter() }
      </div>
    );
  }

  renderHeader () {
    return (
      <div className={`header ${buttons}`}>
        {
          this.props.headerButtons.map(({ tooltip, callback, Icon }) => (
            <div className={`${button} ${sizeIcon} button`}>
              <Tooltip text={tooltip}>
                <Clickable onClick={callback}>
                  <Icon/>
                </Clickable>
              </Tooltip>
            </div>
          ))
        }
      </div>
    );
  }

  renderFooter () {
    return (
      <div className={`footer ${downloadLink}`}>
        <div className='content'>
          { this.props.originalFooter }
          { this.renderInfo() }
        </div>
      </div>
    );
  }

  renderInfo () {
    if (this.state.data === null) {
      return;
    }

    const { $image, attachment: { size } } = this.state.data;
    const { href } = this.props.originalFooter.props;

    const url = new URL(href);
    const name = url.pathname.split('/').pop();
    const resolution = `${$image.naturalWidth}x${$image.naturalHeight}`;
    const strSize = this.bytes2Str(size || this.state.size);

    if (!size) {
      this.loadSize($image.src);
    }

    return (
      <div className='image-info'>
        { ($image) && <>
          <p>
            <Copy text={name}>{name}</Copy>
          </p>
          <p>
            <Copy text={resolution}>{resolution}</Copy>
            <div className='separator'/>
            <Copy text={strSize}>{strSize}</Copy>
          </p>
          <p>
            <Copy text={url.href}>{this.zipUrl(url.href)}</Copy>
          </p>
        </>}
      </div>
    );
  }

  getData (obj) {
    this.setState(({ data }) => ({
      data: {
        ...((data === null) ? {} : data),
        ...obj
      }
    }));
  }

  loadSize (url) {
    fetch(url)
      .then((resp) => resp.headers.get('content-length'))
      .then((size) => {
        this.setState({ size });
      })
      .catch(console.error);
  }

  zipUrl (oldUrl) {
    const url = new URL(oldUrl);
    const maxName = 20;
    const maxLettersOneSide = 8;

    url.pathname = url.pathname
      .split('/')
      .slice(-1)
      .map((e) => {
        const ex = e.substr(e.lastIndexOf('.') + 1, e.length);
        let name = e.substr(0, e.lastIndexOf('.'));
        const nl = name.length;

        if (nl > maxName) {
          name = `${name.substr(0, maxLettersOneSide)}...${name.substr(nl - maxLettersOneSide, nl)}`;
        }
        return `.../${name}.${ex}`;
      })
      .join('/');

    return url.href;
  }

  bytes2Str (bytes) {
    const k = 1024;
    const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];

    if (bytes === null) {
      return '-';
    }
    if (bytes === 0) {
      return '0 Bytes';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
};
