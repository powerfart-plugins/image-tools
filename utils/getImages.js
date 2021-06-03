/* eslint-disable no-use-before-define */

const { getModule } = require('powercord/webpack');
const { getMessages } = getModule([ 'getMessages' ], false);

const IMG_EXPANSIONS = [ 'png', 'gif', 'jpg' ];

/**
 * @param {String} channelId
 * @returns {Array<Object>}
 */
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

  return result;
};
