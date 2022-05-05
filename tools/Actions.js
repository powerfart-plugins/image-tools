const { existsSync } = require('fs');
const { join } = require('path');
const { writeFile } = require('fs').promises;
const { clipboard, shell, nativeImage } = require('electron');

const output = require('../modules/OutputManager');
const { getModule, i18n: { Messages } } = require('powercord/webpack');
const { saveWithDialog } = getModule([ 'fileManager' ], false).fileManager;
const { get } = require('powercord/http');

const openImageModal = require('../utils/openImageModal');

/* eslint-disable no-use-before-define */
// noinspection JSUnusedGlobalSymbols
module.exports = class Actions {
  /**
   * @param {Object} args
   * @param {String} args.src
   * @param {String} [args.original]
   * @param {Number} [args.height]
   * @param {Number} [args.width]
   */
  static openImage (args) {
    const defaultArgs = {
      height: 1024,
      width: 1024
    };
    openImageModal({
      ...defaultArgs,
      ...args
    });
  }

  /**
   * @param {String} url
   * @param {Object} params params for copyLink
   */
  static copyImage (url, params) {
    const { copyImage } = getModule([ 'copyImage' ], false);

    copyImage(url)
      .then(() => {
        output.successToast(Messages.IMAGE_TOOLS_IMAGE_COPIED);
      })
      .catch(() => Actions._fetchImage(url)
        .then((res) => {
          clipboard.write({
            image: nativeImage.createFromBuffer(res)
          });
          output.successToast(Messages.IMAGE_TOOLS_IMAGE_COPIED);
        })
        .catch((e) => {
          output.error(`${Messages.IMAGE_TOOLS_CANT_COPY} \n ${Messages.IMAGE_TOOLS_FAILED_LOAD}`, {
            text: Messages.COPY_LINK,
            size: 'small',
            look: 'outlined',
            onClick: () => Actions.copyLink(url, params)
          });
          console.error(e);
        })
      );
  }

  /**
   * @param {String} url
   * @param {String} original - for gifs from discord GIF picker
   */
  static openLink (url, { original }) {
    shell.openExternal(original || url);
  }

  /**
   * @param {String} url
   * @param {String} original - for gifs from discord GIF picker
   */
  static copyLink (url, { original }) {
    clipboard.write({
      text: original || url
    });
    output.successToast(Messages.IMAGE_TOOLS_IMAGE_LINK_COPIED);
  }

  /**
   * @param {String} url
   * @param {String} downloadPath path to save dir
   * @return {Promise<void>}
   */
  static async save (url, { downloadPath }) {
    const fileName = new URL(url).pathname.split('/').pop();

    const arrayBuffer = await Actions._fetchImage(url)
      .catch((e) => {
        output.error(`${Messages.IMAGE_TOOLS_FAILED_TO_SAVE} \n ${Messages.IMAGE_TOOLS_FAILED_LOAD}`);
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
      return writeFile(pathSave, arrayBuffer)
        .then(() => {
          output.successToast(`${Messages.IMAGE_TOOLS_IMAGE_SAVED_SUCCESSFULLY}: "${pathSave}"`);
        })
        .catch(console.error);
    }
  }

  /**
   * @param {String} url
   * @return {Promise<void>}
   */
  static saveAs (url) {
    const { saveImage } = getModule([ 'saveImage' ], false);

    return saveImage(url)
      .catch(() => Actions._fetchImage(url)
        .then((res) => {
          const fileName = new URL(url).pathname.split('/').pop();
          saveWithDialog(res, fileName);
        })
        .catch((e) => {
          output.error(`${Messages.IMAGE_TOOLS_FAILED_TO_SAVE} \n ${Messages.IMAGE_TOOLS_FAILED_LOAD}`);
          console.error(e);
        })
      );
  }

  /** method to bypass if blocked by CORS policy
   * @param {String} initUrl
   * @returns {Promise<Buffer>}
   * @private
   */
  static _fetchImage (initUrl) {
    const url = new URL(initUrl);

    return run(url)
      .catch(() => {
        url.hostname = 'cdn.discordapp.com';
        return run(url);
      });

    function run (U) {
      return get(U.href)
        .then(({ raw }) => raw);
    }
  }
};
