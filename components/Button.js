const { getModule, i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { clipboard, shell } = require('electron');

const imageSearchServices = require('../ReverseImageSearchServices.json');

/* eslint-disable no-use-before-define */
module.exports.getButton = function (urls, size, { get }) {
  const enabled = {
    png: true,
    gif: true,
    webp: get('enableWebp', false)
  };
  const baseExtensions = Object.keys(enabled);
  const disabledISS = get('disabledImageSearchServices', []);
  const items = baseExtensions.filter(e => urls[e] && enabled[e]);

  return [
    ...ContextMenu.renderRawItems([
      {
        type: 'submenu',
        id: 'image-tools-button',
        name: Messages.IMAGE,
        items: getSubItems(),
        getItems () {
          return this.items;
        }
      }
    ])
  ][0];

  function getSubItems () {
    if (items.length > 1) {
      return items.map((e) => ({
        type: 'submenu',
        name: e.toUpperCase(),
        items: getBaseMenu(urls[e]),
        getItems () {
          return this.items;
        }
      }));
    }
    return getBaseMenu(urls[items[0]]);
  }

  function getBaseMenu (url) {
    return [
      {
        type: 'button',
        name: Messages.OPEN_IMAGE,
        onClick: () => openImg(url, size)
      },
      {
        type: 'button',
        name: (items.length > 1) ? `${Messages.COPY_IMAGE} (PNG)` : Messages.COPY_IMAGE,
        onClick: () => copyImg(urls.png)
      },
      {
        type: 'button',
        name: Messages.OPEN_LINK,
        onClick: () => openUrl(url)
      },
      {
        type: 'button',
        name: Messages.COPY_LINK,
        onClick: () => copyUrl(url)
      },
      // {
      //   type: 'button',
      //   name: Messages.SAVE,
      //   onClick: () => save(url)
      // },
      {
        type: 'button',
        name: Messages.SAVE_IMAGE_AS,
        onClick: () => saveAs(url)
      },
      {
        type: 'submenu',
        name: Messages.IMAGE_SEARCH,
        items: imageSearchServices
          .filter((e) => !disabledISS.includes(e.id))
          .map((e) => ({
            type: 'button',
            name: e.name,
            subtext: e.note,
            onClick: () => search(e.url, url)
          })),
        getItems () {
          return this.items;
        }
      }
    ];
  }
};

function output (msg) {
  powercord.api.notices.sendToast('ImageToolsMsg', {
    header: 'Image Tools',
    content: msg,
    type: 'info',
    timeout: 3e3,
    buttons: [ {
      text: 'OK',
      color: 'green',
      size: 'medium',
      look: 'outlined'
    } ]
  });
}

async function openImg (url, size) {
  const { open } = require('../components/ImageModal');
  const defaultSize = { height: 780, width: 780 }; // eslint-disable-line object-property-newline

  open({
    src: url,
    height: size.height || defaultSize.height,
    width: size.width || defaultSize.width
  });
}

async function copyImg (url) {
  const { copyImage } = await getModule([ 'copyImage' ]);
  copyImage(url);
  output(Messages.IMAGE_COPIED);
}

function openUrl (url) {
  shell.openExternal(url);
}

function copyUrl (url) {
  clipboard.writeText(url);
  output(Messages.IMAGE_LINK_COPIED);
}

// async function save (url) {
//
// };

async function saveAs (url) {
  const { saveImage } = await getModule([ 'saveImage' ]);
  saveImage(url);
}
function search (starUrl, endUrl) {
  shell.openExternal(starUrl + encodeURIComponent(endUrl));
}
