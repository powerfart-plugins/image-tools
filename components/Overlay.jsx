const { React, i18n: { Messages }, getModule, getModuleByDisplayName, channels: { getChannelId } } = require('powercord/webpack');

const Patcher = require('../modules/Patcher');
const getImages = require('../utils/getImages');
const ImageColorPicker = require('../tools/ImageColorPicker');
const lensHandlers = require('../tools/Lens/Handlers');

const { int2hex } = getModule([ 'int2hex' ], false);
const { wrapper } = getModule([ 'wrapper', 'downloadLink' ], false);
const { _ } = global;

/* eslint-disable object-property-newline */
module.exports = class ImageToolsOverlay extends React.PureComponent {
  constructor (props) {
    super(props);
    const { get, set } = props.settings;

    this.images = getImages(getChannelId());
    this.state = {
      $image: null,
      currentImgIndex: null
    };

    this.settings = {
      get radius () {
        return get('lensRadius', 100);
      },
      get zooming () {
        return get('zoomRatio', 2);
      },
      get wheelStep () {
        return get('wheelStep', 1);
      },
      set radius (v) {
        return set('lensRadius', v);
      },
      set zooming (v) {
        return set('zoomRatio', v);
      },
      set wheelStep (v) {
        return set('wheelStep', v);
      }
    };
    this.lensConfig = {
      show: false,
      radius: this.settings.radius,
      zooming: this.settings.zooming,
      wheelStep: this.settings.wheelStep,
      positionX: 0,
      positionY: 0,
      getRectImage: () => ({}),
      renderPreview: () => null,
      style: {
        borderColor: int2hex(this.props.settings.get('lensColor', 0)),
        get imageRendering () {
          return get('disableAntiAliasing', null) ? 'pixelated' : null;
        },
        get borderRadius () {
          return `${get('borderRadius', 50)}%`;
        },
      }
    };
    this.Patcher = new Patcher.Overlay(props.settings, props.children, {
      patchModalLayerOpts: {
        set$image: this.updateCurrentImg.bind(this),
        setUpdateLensConfig: (callback) => {
          this.setState({ updateLensConfig: callback }, () => {
            this.state.updateLensConfig(this.lensConfig);
          });
        }
      },
      imageModalRenderOpts: {
        lensConfig: this.lensConfig,
        overlayUI: {
          headerButtons: this.getButtons(),
          sendDataToUI: (callback) => this.sendDataToUI = callback
        }
      }
    });
    this.additionalHandler = {};

    this.Patcher.inject();

    _.bindAll(this, [ 'onMouseMove', 'onWheel', 'onMouseButton', 'onMouseDown' ]);
  }

  render () {
    return (
      <div
        onMouseMove={this.onMouseMove}
        onMouseDown={this.onMouseDown}
        onMouseLeave={this.onMouseDown}
        onMouseUp={this.onMouseButton}
        onClick={this.onMouseButton}
        onWheel={this.onWheel}
        onKeyDown={(e) => {
          if (e.keyCode === 27) { // ESC
            this.Patcher.uninject();
            this.additionalHandler = {};
          }
        }}
      >
        {this.props.children}
      </div>
    );
  }

  onMouseMove (e) {
    const suppress = this.getAdditionalHandler(e, 'onMouseMove');
    if (suppress) {
      return;
    }
    this.updateLensConfig(lensHandlers.onMouseMove(e));
  }

  onMouseDown (e) {
    if (e.target.closest(`div.${wrapper}`) && this.state.$image) {
      this.onMouseButton(e);
    }
  }

  onMouseButton (e) {
    if (e.target.closest('div.header, div.footer')) {
      return;
    }

    const suppress = this.getAdditionalHandler(e, 'onMouseButton');
    if (suppress) {
      return;
    }
    this.updateLensConfig(lensHandlers.onMouseButton(e));
  }

  onWheel (e) {
    if (this.props.settings.get('offScrollingOutside', false) && !e.target.closest(`div.${wrapper}`)) {
      return;
    }
    const suppress = this.getAdditionalHandler(e, 'onWheel');
    if (suppress) {
      return;
    }
    const val = lensHandlers.onWheel(e,
      {
        radius: this.lensConfig.radius,
        zooming: this.lensConfig.zooming,
        wheelStep: this.lensConfig.wheelStep
      },
      {
        radius: [ 50, this.props.settings.get('maxLensRadius', 700) ],
        zooming: [ 1, this.props.settings.get('maxZoomRatio', 15) ],
        wheelStep: [ 0.1, 5 ]
      }
    );
    const [ key ] = Object.keys(val);

    this.settings[key] = val[key];
    this.updateLensConfig(val);
  }

  /**
   * @param {Event} event
   * @param {String} handlerName
   * @returns {boolean} whether it is necessary to suppress the following handlers
   */
  getAdditionalHandler (event, handlerName) {
    const resource = this.additionalHandler[handlerName];
    if (resource) {
      const res = resource.func(event);
      if (resource.capture && !res) {
        return true;
      }
    }
    return false;
  }

  updateLensConfig (data) {
    this.lensConfig = {
      ...this.lensConfig,
      ...data
    };

    if (('show' in data) || this.lensConfig.show) {
      this.state.updateLensConfig(this.lensConfig);
    }

    if ([ 'radius', 'zooming', 'wheelStep' ].some((k) => k in data)) {
      this.updateUI({
        lensConfig: this.lensConfig
      });
    }
  }

  getButtons () {
    // const Retry = getModuleByDisplayName('Retry', false);
    const Dropper = getModuleByDisplayName('Dropper', false);

    return [
      // {
      //   tooltip: Messages.IMAGE_TOOLS_ROTATE,
      //   Icon: Retry,
      //   callback: () => console.log('nope')
      // },
      {
        tooltip: Messages.IMAGE_TOOLS_COLOR_PICK,
        Icon: Dropper,
        callback: () => {
          if (!this.ColorPicker) {
            this.ColorPicker = new ImageColorPicker(this.state.$image);
          }
          const backupConfig = {
            ...this.lensConfig
          };
          this.additionalHandler.onWheel = { func: () => null, capture: true };
          this.additionalHandler.onMouseButton = {
            func: (e) => {
              if (e.type === 'click') {
                this.additionalHandler.onWheel = null;
                this.additionalHandler.onMouseButton = null;
                this.ColorPicker.copyColor();
                this.updateLensConfig({
                  show: false,
                  ...backupConfig
                });
              }
            },
            capture: true
          };
          this.updateLensConfig({
            show: true,
            ...this.ColorPicker.lensConfig
          });
        }
      }
    ];
  }

  updateCurrentImg ($image) {
    const updateIU = () => {
      const result = this.images.findIndex(({ proxy_url }) => proxy_url === this.state.$image.src);
      const currentImgIndex = (result === -1) ? null : result;

      this.setState({ currentImgIndex });
      this.updateUI({
        $image,
        attachment: (currentImgIndex !== null) ? this.images[currentImgIndex] : {}
      });
    };
    const updateLens = () => {
      this.updateLensConfig({
        getRectImage: () => $image.getBoundingClientRect()
      });
    };

    this.setState({ $image }, () => {
      updateIU();
      updateLens();
    });
  }

  updateUI (data) {
    this.sendDataToUI(data);
  }
};
