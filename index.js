const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule, i18n: { Messages } } = require('powercord/webpack');

const Settings = require('./components/Settings');
const patches = require('./patches');
const i18n = require('./i18n');

module.exports = class ImageTools extends Plugin {
  constructor () {
    super();
    this.uninjectIDs = [];
  }

  async startPlugin () {
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('style.scss');
    this.registerSettings();
    this.detectAndWarningBIV();

    await this.inject('TransitionGroup.default.prototype.render', patches.overlay);
    await this.inject('ImageModal.default.prototype.render', patches.imageModal);
    await this.inject('MessageContextMenu.default', patches.message);
    await this.inject('GuildChannelUserContextMenu.default', patches.user);
    await this.inject('DMUserContextMenu.default', patches.user);
    await this.inject('UserGenericContextMenu.default', patches.user);
    await this.inject('GuildContextMenu.default', patches.guild);
    await this.inject('NativeImageContextMenu.default', patches.image);
  }

  pluginWillUnload () {
    this.uninjectIDs.forEach((id) => uninject(id));
    uninject('image-tools-overlay-image-modal');
    uninject('image-tools-overlay-backdrop');
    uninject('image-tools-wrapper-lazy-image');
    uninject('image-tools-disable-media-proxy-sizes');
    powercord.api.settings.unregisterSettings('image-tools-settings');
  }

  registerSettings () {
    powercord.api.settings.registerSettings('image-tools-settings', {
      category: this.entityID,
      label: 'Image Tools',
      render: Settings
    });
  }

  async inject (funcPath, patch) {
    const path = funcPath.split('.');
    const moduleName = path.shift();
    const injectFunc = path.pop();
    const injectId = `image-tools${moduleName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;

    const module = await getModule((m) => m.default && m.default.displayName === moduleName, false);
    const injectTo = getModulePath(); // eslint-disable-line no-use-before-define

    inject(injectId, injectTo, injectFunc, (...args) => patch(...args, this.settings));
    this.uninjectIDs.push(injectId);
    module.default.displayName = moduleName;

    function getModulePath () {
      let obj = module;
      if (path.length) {
        for (let i = 0, n = path.length; i < n; ++i) {
          const k = path[i];
          if (k in obj) {
            obj = obj[k];
          } else {
            throw new Error(`Not found ${path.join('.')}.${injectFunc} in ${moduleName}`);
          }
        }
      }
      return obj;
    }
  }

  detectAndWarningBIV () {
    // const { colorRed, colorBrand } = getModule([ 'colorRed' ], false);
    //
    // if (powercord.pluginManager.plugins.has('bdCompat')) {
    //   // document.addEventListener('DOMContentLoaded', () => {
    //   //   console.log('123', BdApi.Plugins.list);
    //   //   if (window?.BdApi?.Plugins?.list?.BetterImageViewer) {
    //   //     powercord.api.notices.sendToast('ImageToolsMsg-WarningBIV', {
    //   //       header: 'Image Tools',
    //   //       type: 'warning',
    //   //       content: `${Messages.IMAGE_TOOLS_WARNING_BIV}`,
    //   //       buttons: [
    //   //         {
    //   //           text: Messages.IMAGE_TOOLS_DISABLE.format({ name: 'BIV' }),
    //   //           color: colorBrand
    //   //         },
    //   //         {
    //   //           text: Messages.IMAGE_TOOLS_DISABLE.format({ name: 'IT' }),
    //   //           color: colorRed
    //   //         }
    //   //       ]
    //   //     });
    //   //   }
    //   // });
    // }
  }
};
