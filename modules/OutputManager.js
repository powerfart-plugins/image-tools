const { getModule } = require('powercord/webpack');

const { showToast } = getModule([ 'showToast' ], false);
const { ToastType } = getModule([ 'createToast' ], false);

class OutputManager {
  constructor (startID = '') {
    this._startID = startID;
  }

  setStartId (id) {
    this._startID = id;
  }

  successToast (message) {
    showToast({
      type: ToastType.SUCCESS,
      message
    });
  }

  errorToast (message) {
    showToast({
      type: ToastType.FAILURE,
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
    powercord.api.notices.sendToast(`${this._startID}-${id}`, {
      header: 'Image Tools',
      timeout: 4e3,
      content,
      type,
      buttons
    });
  }
}

module.exports = new OutputManager();
module.exports.OutputManager = OutputManager;

