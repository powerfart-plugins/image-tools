const { existsSync } = require('fs');
const { join } = require('path');
const { writeFile } = require('fs').promises;
const { clipboard, shell } = require('electron');

const { getModule, i18n: { Messages } } = require('powercord/webpack');

const openImageModal = require('../utils/openImageModal');

// noinspection JSUnusedGlobalSymbols
module.exports = class Actions {
  /**
   * @param {Object} args
   * @param {String} args.src
   * @param {String} args.original
   * @param {Number} args.height
   * @param {Number} args.width
   */
  static openImage (args) {
    const defaultArgs = {
      height: 780,
      width: 780
    };
    openImageModal({
      ...defaultArgs,
      ...args
    });
  }

  /**
   * @param {String} url
   * @param {Class} output
   * @param {Object} params params for copyLink
   */
  static copyImage (url, output, params) {
    const { copyImage } = getModule([ 'copyImage' ], false);
    const parseUrl = new URL(url);

    if (parseUrl.hostname === 'media.discordapp.net') {
      parseUrl.hostname = 'cdn.discordapp.com';
    }

    copyImage(parseUrl.href)
      .then(() => {
        output.success(Messages.IMAGE_TOOLS_IMAGE_COPIED);
      })
      .catch((e) => {
        output.error(`${Messages.IMAGE_TOOLS_CANT_COPY} \n ${Messages.IMAGE_TOOLS_NOT_HOSTING_DISCORD}`, {
          text: Messages.COPY_LINK,
          size: 'small',
          look: 'outlined',
          onClick: () => Actions.copyLink(url, output, params)
        });
        console.error(e);
      });
  }

  /**
   * @param {String} url
   * @param {Class} output
   * @param {String} original - for gifs from discord GIF picker
   */
  static openLink (url, output, { original }) {
    shell.openExternal(original || url);
  }

  /**
   * @param {String} url
   * @param {Class} output
   * @param {String} original - for gifs from discord GIF picker
   */
  static copyLink (url, output, { original }) {
    clipboard.write({
      text: original || url
    });
    output.success(Messages.IMAGE_TOOLS_IMAGE_LINK_COPIED);
  }

  /**
   * @param {String} url
   * @param {Class} output
   * @param {String} downloadPath path to save dir
   * @return {Promise<void>}
   */
  static async save (url, output, { downloadPath }) {
    const fileName = new URL(url).pathname.split('/').pop();
    const arrayBuffer = await fetch(url)
      .then((e) => e.arrayBuffer())
      .catch((e) => {
        output.error(`${Messages.IMAGE_TOOLS_FAILED_TO_SAVE} \n ${Messages.IMAGE_TOOLS_NOT_HOSTING_DISCORD}`);
        console.error(e);
      });

    let num = 1;
    let pathSave = join(downloadPath, fileName);
    while (existsSync(pathSave)) {
      pathSave = join(
        downloadPath,
        fileName.replace(/(.+?)\./, `$1 (${num}).`)
      );
      num++;
    }

    if (arrayBuffer) {
      return writeFile(pathSave, Buffer.from(arrayBuffer))
        .then(() => {
          output.success(`${Messages.IMAGE_TOOLS_IMAGE_SAVED_SUCCESSFULLY}: "${pathSave}"`);
        })
        .catch(console.error);
    }
  }

  /**
   * @param {String} url
   * @param {Class} output
   * @return {Promise<void>}
   */
  static saveAs (url, output) {
    const { saveImage } = getModule([ 'saveImage' ], false);
    const parseUrl = new URL(url);

    if (parseUrl.hostname === 'media.discordapp.net') {
      parseUrl.hostname = 'cdn.discordapp.com';
    }
    return saveImage(url)
      .catch((e) => {
        output.error(`${Messages.IMAGE_TOOLS_FAILED_TO_SAVE} \n ${Messages.IMAGE_TOOLS_NOT_HOSTING_DISCORD}`);
        console.error(e);
      });
  }
};
