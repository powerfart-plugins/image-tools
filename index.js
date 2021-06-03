const { Plugin } = require('powercord/entities');
const { uninject } = require('powercord/injector');

const Settings = require('./components/SettingsRender.jsx');
const { settings } = require('./structures');
const i18n = require('./i18n');
const { ChangeLog, Patcher } = require('./utils');
const changelog = require('./changelog.json');

module.exports = class ImageTools extends Plugin {
  constructor () {
    super();
    this.Patcher = new Patcher.General(this.settings);
    this.ChangeLog = new ChangeLog({
      config: changelog,
      currentVer: this.manifest.version,
      lastCheckedVer: this.settings.get('lastChangeLogVersion', '0'),
      updateLastCheckedVer: (v) => this.settings.set('lastChangeLogVersion', v)
    });
  }

  async startPlugin () {
    powercord.api.i18n.loadAllStrings(i18n);
    this.loadStylesheet('style.scss');
    Settings.register({
      entityID: this.entityID,
      items: settings()
    });

    this.Patcher.inject();
    this.ChangeLog.init();
  }

  pluginWillUnload () {
    this.Patcher.uninject();
    uninject('image-tools-overlay-ui');
    uninject('image-tools-overlay-backdrop');
    uninject('image-tools-overlay-modal-layer');
    uninject('image-tools-overlay-video');
    powercord.api.settings.unregisterSettings('image-tools-settings');
  }

  get color () {
    return '#1D69E4';
  }
};
