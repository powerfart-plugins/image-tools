const { existsSync } = require('fs');
const { join } = require('path');
const { writeFile } = require('fs').promises;
const { clipboard, shell } = require('electron');

const { getModule, i18n: { Messages } } = require('powercord/webpack');

const { openImageModal } = require('../utils');

module.exports.openImg = function (args) {
  const defaultArgs = {
    height: 780,
    width: 780
  };
  openImageModal({
    ...defaultArgs,
    ...args
  });
};

module.exports.copyImg = function (url, output) {
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
        onClick: () => module.exports.copyUrl(url, output)
      });
      console.error(e);
    });
};

module.exports.openUrl = function (url) {
  shell.openExternal(url);
};

module.exports.copyUrl = function (url, output) {
  clipboard.write({ text: url });
  output.success(Messages.IMAGE_TOOLS_IMAGE_LINK_COPIED);
};

module.exports.save = async function (url, output, downloadPath) {
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
    writeFile(pathSave, Buffer.from(arrayBuffer))
      .then(() => {
        output.success(`${Messages.IMAGE_TOOLS_IMAGE_SAVED_SUCCESSFULLY}: "${pathSave}"`);
      })
      .catch(console.error);
  }
};

module.exports.saveAs = function (url, output) {
  const { saveImage } = getModule([ 'saveImage' ], false);
  const parseUrl = new URL(url);

  if (parseUrl.hostname === 'media.discordapp.net') {
    parseUrl.hostname = 'cdn.discordapp.com';
  }
  saveImage(url)
    .catch((e) => {
      output.error(`${Messages.IMAGE_TOOLS_FAILED_TO_SAVE} \n ${Messages.IMAGE_TOOLS_NOT_HOSTING_DISCORD}`);
      console.error(e);
    });
};
