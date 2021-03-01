const { React, ReactDOM, getModule, getModuleByDisplayName, i18n: { Messages }, channels: { getChannelId } } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { getOwnerInstance, forceUpdateElement } = require('powercord/util');
const { open } = require('powercord/modal');

const { getImages } = require('../utils');
const { CarouselPrevious, CarouselNext } = getModule([ 'CarouselPrevious', 'CarouselNext' ], false);

module.exports = class ImageToolsOverlay extends React.Component {
  constructor (props) {
    super(props);

    this.images = getImages(getChannelId());
    this.state = {
      showLensInfo: false,
      infoFromImage: {},
      currentImageIndex: null
    };

    this._onClose = this._onClose.bind(this);
    this._injectToImageModal();

    // console.log(this.images);
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.infoFromImage.lens !== this.state.infoFromImage.lens) {
      this.setState({
        showLensInfo: true
      });
      setTimeout(() => {
        this.setState({
          showLensInfo: false
        });
      }, 2500);
    }
  }

  render () {
    return (
      <div
        onMouseMove={this.state.onMouseMove}
        onWheel={this.state.onWheel}
        onMouseUp={this.state.onMouseUp}
        onMouseLeave={this.state.onMouseLeave}
        onKeyDown={(e) => {
          if (e.keyCode === 27) { // ESC
            this._onClose();
          }
        }}
      >

        {this.props.children}

        { this.state.infoFromImage.lens &&
          <div
            className={`image-tools-lens-info ${this.state.showLensInfo ? null : 'image-tools-lens-info-hide'}`}
          >
            <p>{Messages.IMAGE_TOOLS_ZOOM_RATIO}: {this.state.infoFromImage.lens.zoomRatio}x</p>
            <p>{`${Messages.IMAGE_TOOLS_LENS_RADIUS} [CTRL]`}: {this.state.infoFromImage.lens.lensRadius}px</p>
            <p>{`${Messages.IMAGE_TOOLS_SCROLL_STEP} [SHIFT]`}: {this.state.infoFromImage.lens.wheelStep}</p>
          </div>}

        { this.images.length &&
          <div className='image-tools-arrows'>
            <CarouselPrevious onClick={() => {
              this.setState((prevState) => ({
                currentImageIndex: prevState.currentImageIndex - 1 || 0
              }), () => this.reRender());
            }}/>
            <CarouselNext onClick={() => {
              this.setState((prevState) => ({
                currentImageIndex: prevState.currentImageIndex + 1 || 0
              }), () => this.reRender());
            }}/>
          </div>}
      </div>
    );
  }

  setEventListener (type, callback) {
    this.setState({
      [type]: callback
    });
  }

  getInfo (obj) {
    this.setState((prevState) => ({
      infoFromImage: {
        ...prevState.infoFromImage,
        ...obj
      }
    }));
  }


  _injectToImageModal () {
    const ImageModal = getModule((m) => m.default && m.default.displayName === 'ImageModal', false);
    const FocusRingScope = getModule([ 'FocusRingScope' ], false);
    const ModalRoot = getModule([ 'ModalRoot' ], false);
    const LazyImage = getModuleByDisplayName('LazyImage', false);
    const backdrop = this.props.children.props.children[0];


    // const ref = React.createRef();
    //
    // this.props.children.props.children[1] = (
    //   <div ref={ref}>
    //     {this.props.children.props.children[1]}
    //   </div>
    // );
    let ref;
    const child = this.props.children;

    // console.log(ImageModal.default);
    this.reRender = () => {
      // getOwnerInstance(ref).forceUpdate();

      console.log(ReactDOM.findDOMNode(this));

      // this.forceUpdate();
      // getOwnerInstance(ref.current).forceUpdate();
      // console.log(this.props.children.props.children[1].props.render());
      // this.props.children.props.children[1].props.render = () => this.props.children.props.children[1].props.render();
      // this.setState({
      //   children: this.props.children
      // });

      //  this.forceUpdate();

      forceUpdateElement('.wrapper-2K4Z3k');
      // console.log(getOwnerInstance(document.querySelector('.wrapper-2K4Z3k')));
      // console.log(this.props.children);
    };

    // console.log(getOwnerInstance('.focusLock-Ns3yie'));
    // this.reRender = () => forceUpdateElement('.focusLock-Ns3yie');
    // console.log(getOwnerInstance(document.querySelector('.wrapper-2K4Z3k')));


    // this.props.children.props.children[1] = (
    //   <div ref={ref} id='dfgdfgdfgdfgdf'>
    //     {this.props.children.props.children[1]}
    //   </div>
    // );

    // this.props.children.props.children[1] = React.createElement('div', {
    //
    // }, this.props.children.props.children[1]);

    // console.log(child);

    inject('image-tools-overlay-image-modal-3', ModalRoot, 'ModalRoot', (args, res) => {
      // if (res.props.children.ref.current) {
      //   ref = res.props.children.ref.current;
      // }
      // console.log(ReactDOM.findDOMNode(res));
      // console.log(getOwnerInstance(ReactDOM.findDOMNode(res)));
      console.log('ModalRoot', res);
      return res;
    });


    // inject('image-tools-overlay-image-modal-3', ImageModal, 'default', (args, res) => {
    //   console.log(args, res);
    //   return args
    //   // .filter((e) => e.src)
    //     .map((props) => {
    //       if (!props.src) {
    //         return <></>;
    //       }
    //       if (!this.state.currentImageIndex) {
    //         this.setState({ currentImageIndex: 0 });
    //       }
    //       const { width, height, url, proxy_url } = this.images[this.state.currentImageIndex || 0];
    //       const e = {
    //         ...props,
    //         width,
    //         height,
    //         src: proxy_url,
    //         placeholder: `${proxy_url}?width=${Math.round(width / 1.5)}&height=${Math.round(height / 1.5)}`
    //       };
    //       return <>
    //         <LazyImage {...e}/>
    //         {props.renderLinkComponent({
    //           href: props.original,
    //           target: '_blank',
    //           rel: 'noreferrer noopener',
    //           className: 'downloadLink-1ywL9o',
    //           children: 'Открыть оригинал'
    //         })}
    //       </>;
    //     });
    // });

    inject('image-tools-overlay-image-modal', ImageModal.default.prototype, 'render', (args, res) => {
      const ImageWrapper = res.props.children[0];
      const ImageModal = ImageWrapper.props.children;
      // console.log(res);

      ImageWrapper.props.overlay = {
        setEventListener: this.setEventListener.bind(this),
        sendInfo: this.getInfo.bind(this)
      };

      // if (!this.state.currentImageIndex) {
      //   this.setState({
      //     currentImageIndex: this.images
      //       .findIndex(({ proxy_url }) => (proxy_url === ImageModal.props.src))
      //   });
      // } else {
      //   const { width, height, url, proxy_url } = this.images[this.state.currentImageIndex];
      //   ImageModal.props = {
      //     ...ImageModal.props,
      //     width,
      //     height,
      //     src: proxy_url,
      //     placeholder: `${proxy_url}?width=${Math.round(width / 1.5)}&height=${Math.round(height / 1.5)}`
      //   };
      // }

      return res;
    });


    // inject('image-tools-overlay-image-modal-2', LazyImage.default.prototype, 'render', (args, res) => {
    //   if (!this.state.currentImageIndex) {
    //     this.setState({
    //       currentImageIndex: this.images
    //         .findIndex(({ url }) => (url === res.props.children.props.original))
    //     });
    //   } else {
    //     const { width, height, url, proxy_url } = this.images[this.state.currentImageIndex];
    //     res.props.children.props = {
    //       ...res.props.children.props,
    //       width,
    //       height,
    //       original: url,
    //       src: proxy_url,
    //       placeholder: `${proxy_url}?width=${Math.round(width / 1.5)}&height=${Math.round(height / 1.5)}`
    //     };
    //     // res.props.children.props.width = width;
    //     // res.props.children.props.height = height;
    //     // res.props.children.props.original = url;
    //     // res.props.children.props.src = `${proxy_url}?width=${width}&height=${height}`;
    //     // res.props.children.props.placeholder = `${proxy_url}?width=${Math.round(width / 1.5)}&height=${Math.round(height / 1.5)}`;
    //   }
    //
    //   return res;
    // });

    // inject('image-tools-overlay-image', LazyImage.default.prototype, 'render', (args, res) => {
    //   // if (!this.state.currentImageIndex) {
    //   //   const currentImageIndex = this.images.indexOf(res.props.children[1].props.href);
    //   //   this.setState({ currentImageIndex });
    //   // } else {
    //   //   res.props.children[0].props.children.props.src = this.images[this.state.currentImageIndex];
    //   // }
    //   console.log(res);
    //   return res;
    // });

    inject('image-tools-overlay-backdrop', backdrop.props, 'onClose', this._onClose);
    ImageModal.default.displayName = 'ImageModal';
  }

  _onClose () {
    if (typeof this.state.onClose === 'function') {
      this.state.onClose();
    }
    uninject('image-tools-overlay-image-modal');
    uninject('image-tools-overlay-image-modal-2');
    uninject('image-tools-overlay-image-modal-3');
    uninject('image-tools-overlay-backdrop');
    return true;
  }
};
