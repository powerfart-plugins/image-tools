module.exports = class OutputManager {
  constructor (startID, settings) {
    this.settings = settings;
    this.startID = startID;
  }

  success (msg) {
    const button = {
      text: 'OK',
      color: 'green',
      size: 'medium',
      look: 'outlined'
    };

    if (this.settings.hideSuccessToasts) {
      return;
    }
    this._main(msg, 'success', [ button ]);
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
