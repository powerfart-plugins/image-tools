const { React, getModule } = require('powercord/webpack');

const Copy = require('./Copyable.jsx');

const { downloadLink } = getModule([ 'downloadLink' ], false);
// const { CarouselPrevious, CarouselNext } = getModule([ 'CarouselPrevious', 'CarouselNext' ], false);

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
      <div className={`image-tools-modal-footer ${downloadLink}`}>
        <div className='content'>
          { this.props.children }
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
    const [ url ] = this.props.children.props.href.split('?');
    const name = url.split('/').pop();

    if (!size) {
      this._loadSize(url);
    }

    return (
      <div className='image-info'>
        { ($image) && <>
          <p>
            <Copy>{name}</Copy>
          </p>
          <p>
            <Copy>{$image.naturalWidth}x{$image.naturalHeight}</Copy>
            <div className='separator'/>
            <Copy>{this._bytes2Str(size || this.state.size)}</Copy>
          </p>
          <p>
            <Copy text={url}>{this._zipUrl(url)}</Copy>
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

  _loadSize (url) {
    fetch(url)
      .then((resp) => resp.headers.get('content-length'))
      .then((size) => {
        this.setState({ size });
      })
      .catch(console.error);
  }

  _zipUrl (oldUrl) {
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

  _bytes2Str (bytes) {
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
