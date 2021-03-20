/* eslint-disable no-use-before-define */

const { getModule } = require('powercord/webpack');
const { getMessages } = getModule([ 'getMessages' ], false);

const IMG_EXPANSIONS = [ 'png', 'gif', 'jpg' ];

module.exports = function (channelId) {
  const result = [];

  getMessages(channelId)
    .toArray()
    .forEach(({ attachments, embeds }) => {
      if (attachments.length) {
        result.push(
          ...attachments
            .filter(({ filename }) => IMG_EXPANSIONS.some((e) => filename.endsWith(e)))
        );
      }
      if (embeds.length) {
        result.push(
          ...embeds
            .filter(({ image }) => image)
            .map(({ image }) => ({
              ...image,
              proxy_url: image.proxyURL
            }))
        );
      }
    });

  return result
    .map((e) => ({
      ...e,
      formatted: {
        name: e.filename || e.url.split('/').pop(),
        size: (e.size) ? bytes2Str(e.size) : '-',
        resolution: `${e.width}×${e.height}`,
        url: e.url
      }
    }));
};

function bytes2Str (bytes) {
  const k = 1024;
  const sizes = [ 'Bytes', 'KB', 'MB', 'GB' ];

  if (bytes === 0) {
    return '0 Bytes';
  }

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
