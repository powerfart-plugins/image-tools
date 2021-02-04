const { existsSync } = require('fs');
const { env } = require('process');
const { join } = require('path');

module.exports = function getDownloadPath (reqPath) {
  const homePath = env.USERPROFILE || env.HOMEPATH || env.HOME;
  const downloadPath = (homePath) ? join(homePath, 'Downloads') : null;

  if (reqPath && existsSync(reqPath)) {
    return reqPath;
  }
  if (downloadPath && existsSync(downloadPath)) {
    return downloadPath;
  }
  return powercord.pluginManager.plugins.get('image-tools').entityPath;
};
