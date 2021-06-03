const { i18n: { Messages } } = require('powercord/webpack');

/* eslint-disable brace-style */
module.exports = [
  {
    type: 'button',
    id: 'open-image',
    get name () { return Messages.IMAGE_TOOLS_OPEN_IMAGE; }
  },
  {
    type: 'button',
    id: 'copy-image',
    get name () { return Messages.IMAGE_TOOLS_COPY_IMAGE; }
  },
  {
    type: 'button',
    id: 'open-link',
    get name () { return Messages.OPEN_LINK; }
  },
  {
    type: 'button',
    id: 'copy-link',
    get name () { return Messages.COPY_LINK; }
  },
  {
    type: 'button',
    id: 'save',
    get name () { return Messages.SAVE_IMAGE_MENU_ITEM; }
  },
  {
    type: 'button',
    id: 'save-as',
    get name () { return Messages.IMAGE_TOOLS_SAVE_IMAGE_AS; }
  },
  {
    type: 'submenu',
    id: 'search-image',
    get name () { return Messages.IMAGE_TOOLS_IMAGE_SEARCH; }
  }
];
