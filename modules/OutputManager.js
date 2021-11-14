const { getModule } = require('powercord/webpack');

const { showToast } = getModule([ 'showToast' ], false);
const { ToastType } = getModule([ 'createToast' ], false);

module.exports = class OutputManager {
  constructor (startID, settings) {
    this.settings = settings;
    this.startID = startID;
  }

  success (message) {
    showToast({
      type: ToastType.SUCCESS,
      message
    });
  }

  error (msg, addButton = {}) {
    const buttons = [
      {
        text: 'okay',
        color: 'red',
        size: (addButton) ? 'small' : 'medium',
        look: 'outlined'
      }
    ];
    if (Object.keys(addButton).length) {
      buttons.push(addButton);
    }
    this._main(msg, 'danger', buttons);
  }

  _main (content, type, buttons) {
    const id = Math.random().toString(10).substr(2);
    powercord.api.notices.sendToast(`${this.startID}-${id}`, {
      header: 'Image Tools',
      timeout: 4e3,
      content,
      type,
      buttons
    });
  }
};
