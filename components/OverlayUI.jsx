const { React, getModule, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

const OverlayUITooltip = require('./OverlayUITooltip.jsx');

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
      size: 0,
      resolution: { Width: null, Height: null }
    };
    this.failedLoadSize = false;
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
            <Clickable onClick={callback}>
              <div className={`${button} ${sizeIcon} button`}>
                <Tooltip text={tooltip}>
                  <Icon/>
                </Tooltip>
              </div>
            </Clickable>
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
    const url = new URL(href);

    const renderTooltip = (child, text, error) => (
      <p style={{ color: (error) ? 'var(--text-danger)' : null }}>
        <OverlayUITooltip copyText={text || child} error={error}>{child}</OverlayUITooltip>
      </p>
    );
    const renderLoading = () => (
      <span className='string'>
        <p>loading...</p>
      </span>
    );
    const renderSeparator = () => (
      <p style={{ pointerEvents: 'none' }}>|</p>
    );

    const renderResolution = () => {
      const get = (t) => this.state.resolution[t] || $image[`video${t}`] || $image[`natural${t}`] || ' ? ';
      if ($image) {
        return renderTooltip(`${get('Width')}x${get('Height')}`);
      }
      return null;
    };
    const renderSize = () => {
      if (attachment) {
        const strSize = this.bytes2str(attachment.size || this.state.size);
        if (!attachment.size && !this.state.size) {
          this.loadSize($image.src);
        }
        return renderTooltip(strSize, null, (this.failedLoadSize) ? this.failedLoadSize : null);
      }
      return null;
    };

    return (
      <div className='image-info'>
        <span className='string curtail'>
          {renderTooltip(url.pathname.split('/').pop())}
        </span>
        <span className='string'>
          {renderResolution() || renderLoading()} {renderSeparator()} {renderSize() || renderLoading()}
        </span>
        <span className='string curtail'>
          {renderTooltip(url.href)}
        </span>
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
          this.setState({
            resolution: { Width: obj.$image.videoWidth, Height: obj.$image.videoHeight }
          });
        }, false);
        obj.$image.addEventListener('load', () => {
          this.setState({
            resolution: { Width: obj.$image.naturalWidth, Height: obj.$image.naturalHeight }
          });
        });
      }
    };

    this.setState(({ data }) => ({
      data: { ...data, ...obj }
    }),
    onStated);
  }

  loadSize (url) {
    if (!this.failedLoadSize) {
      fetch(url)
        .then((resp) => resp.headers.get('content-length'))
        .then((size) => {
          this.setState({ size });
        })
        .catch((err) => {
          console.error(err);
          this.failedLoadSize = err;
        });
    }
  }

  bytes2str (bytes) {
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
