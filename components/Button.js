const { getModule, i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { clipboard, shell } = require('electron');

const imageSearchServices = require('../ReverseImageSearchServices.json');

/* eslint-disable no-use-before-define */
module.exports.getButton = function (images, { get }) {
  const baseExtensions = Object.keys(images);
  const disabledISS = get('disabledImageSearchServices', []);
  const disabled = {
    webp: get('enableWebp', true),
    mp4: [ 'openImage', 'copyImage', 'saveAs', 'searchImage' ]
  };


  const items = baseExtensions.filter((e) => {
    if (images[e] && !(e in disabled)) {
      return true;
    }
    if (!Array.isArray(disabled[e])) {
      return disabled[e];
    }
    return true;
  });

  const getDisabledMethods = (e) => Array.isArray(disabled[e]) ? disabled[e] : [];

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
        items: getBaseMenu(images[e], getDisabledMethods(e)),
        getItems () {
          return this.items;
        }
      }));
    }
    return getBaseMenu(images[items[0]], getDisabledMethods(items[0]));
  }

  function getBaseMenu (image, disabled) {
    const url = (image.content) ? image.content : image.src;
    return [
      {
        type: 'button',
        name: Messages.OPEN_IMAGE,
        disabled: disabled.includes('openImage'),
        onClick: () => openImg(image)
      },
      {
        type: 'button',
        name: (items.length > 1) ? `${Messages.COPY_IMAGE} (PNG)` : Messages.COPY_IMAGE,
        disabled: disabled.includes('copyImage'),
        onClick: () => copyImg(images.png.src)
      },
      {
        type: 'button',
        name: Messages.OPEN_LINK,
        disabled: disabled.includes('openLink'),
        onClick: () => openUrl(url)

      },
      {
        type: 'button',
        name: Messages.COPY_LINK,
        disabled: disabled.includes('copyLink'),
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
        disabled: disabled.includes('saveAs'),
        onClick: () => saveAs(url)
      },
      {
        type: 'submenu',
        name: Messages.IMAGE_SEARCH,
        disabled: disabled.includes('searchImage'),
        items: imageSearchServices
          .filter((e) => !disabledISS.includes(e.id))
          .map((e) => ({
            type: 'button',
            name: e.name,
            subtext: e.note,
            onClick: () => openUrl((e.withoutEncode) ? e.url + url : e.url + encodeURIComponent(url))
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

async function openImg (image) {
  require('../components/ImageModal').open(image);
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
