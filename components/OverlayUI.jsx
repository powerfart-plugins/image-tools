const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

const Copy = require('./Copyable.jsx');

const { downloadLink } = getModule([ 'downloadLink' ], false);
const { buttons } = getModule([ 'button', 'buttons' ], false);
const { button, sizeIcon } = getModule([ 'button', 'sizeIcon' ], false);

/* eslint-disable object-property-newline */
module.exports = class ImageToolsOverlayUI extends React.PureComponent {
  constructor ({ sendDataToUI }) {
    super();
    sendDataToUI(this.getData.bind(this));

    this.state = {
      data: {},
      showConfig: false,
      size: 0
    };
    this.hideConfig = global._.debounce(() => this.setState({ showConfig: false }), 1500);
  }

  render () {
    return (
      <div className='image-tools-overlay-ui'>
        { this.renderLensConfig() }
        { this.renderHeader() }
        { this.renderFooter() }
      </div>
    );
  }

  renderLensConfig () {
    const { showConfig, data:{ lensConfig } } = this.state;
    if (!lensConfig) {
      return null;
    }

    return (
      <div className='lens-config'>
        <div className={`lens ${showConfig ? null : 'lens-hide'}`}>
          <p>{Messages.IMAGE_TOOLS_ZOOM_RATIO}: {Number(lensConfig.zooming).toFixed(1)}x</p>
          <p>{`${Messages.IMAGE_TOOLS_LENS_RADIUS} [CTRL]`}: {Number(lensConfig.radius).toFixed()}px</p>
          <p>{`${Messages.IMAGE_TOOLS_SCROLL_STEP} [SHIFT]`}: {Number(lensConfig.wheelStep).toFixed(2)}</p>
        </div>
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
    const { $image, attachment }  = this.state.data;
    const { href } = this.props.originalFooter.props;
    if (!$image && !attachment) {
      return null;
    }

    const url = new URL(href);
    const name = url.pathname.split('/').pop();
    const resolution = `${$image.videoWidth || $image.naturalWidth || 0}x${$image.videoHeight || $image.naturalHeight || 0}`;
    const strSize = this.bytes2Str(attachment.size || this.state.size);

    if (!attachment.size) {
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
    const onStated = () => {
      if (obj.lensConfig) {
        this.setState(() => ({
          showConfig: true
        }),
        this.hideConfig);
      }
      if (obj.$image) {
        obj.$image.addEventListener('loadedmetadata', () => {
          this.forceUpdate(); // @todo убать это потом
        }, false);
      }
    };
    this.setState(({ data }) => ({
      data: { ...data, ...obj }
    }),
    onStated);
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
