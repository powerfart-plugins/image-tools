const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { getModule } = require('powercord/webpack');

const Settings = require('./components/Settings.jsx');
const { baseSettingStructure } = require('./utils');
const patches = require('./patches');
const i18n = require('./i18n');

module.exports = class ImageTools extends Plugin {
  constructor () {
    super();
    this.uninjectIDs = [];
    this.modalIsOpen = false;
  }

  async startPlugin () {
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('style.scss');
    Settings.register({
      entityID: this.entityID,
      items: baseSettingStructure()
    });

    this.inject('TransitionGroup.default.prototype.render', (...args) => {
      this.isModalOpen = false;
      return patches.overlay(...args, () => this.isModalOpen = true);
    });
    this.inject('ImageModal.default.prototype.render', patches.imageModal);
    this.inject('MessageContextMenu.default', patches.messageCM);
    this.inject('GuildChannelUserContextMenu.default', patches.userCM);
    this.inject('DMUserContextMenu.default', patches.userCM);
    this.inject('UserGenericContextMenu.default', patches.userCM);
    this.inject('GroupDMUserContextMenu.default', patches.userCM);
    this.inject('GroupDMContextMenu.default', patches.groupDMCM);
    this.inject('GuildContextMenu.default', patches.guildCM);
    this.inject('NativeImageContextMenu.default', patches.imageCM);
    this.injectToGetImageSrc('image-tools-media-proxy-sizes');
  }

  pluginWillUnload () {
    this.uninjectIDs.forEach((id) => uninject(id));
    uninject('image-tools-overlay-image-modal');
    uninject('image-tools-overlay-backdrop');
    uninject('image-tools-wrapper-lazy-image');
    powercord.api.settings.unregisterSettings('image-tools-settings');
  }

  get color () {
    return '#1D69E4';
  }

  injectToGetImageSrc (id) {
    const imageDiscordUtils = getModule([ 'getImageSrc' ], false);
    inject(id, imageDiscordUtils, 'getImageSrc', (args) => {
      if (this.isModalOpen) {
        args[3] = 1; // отменить коэффициент размеров
      }
      return args;
    }, true);
    this.uninjectIDs.push(id);
  }

  inject (funcPath, patch) {
    const path = funcPath.split('.');
    const moduleName = path.shift();
    const injectFunc = path.pop();
    const injectId = `image-tools${moduleName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
    const module = getModule((m) => m.default && m.default.displayName === moduleName, false);
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
};
