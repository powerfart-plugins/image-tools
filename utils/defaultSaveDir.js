const { existsSync } = require('fs');
const { env } = require('process');
const { join } = require('path');

function getSaveDir () {
  const homePath = env.USERPROFILE || env.HOMEPATH || env.HOME;
  const downloadPath = (homePath) ? join(homePath, 'Downloads') : null;

  if (downloadPath && existsSync(downloadPath)) {
    return downloadPath;
  }
  return powercord.pluginManager.plugins.get('image-tools').entityPath;
}

module.exports = getSaveDir();
