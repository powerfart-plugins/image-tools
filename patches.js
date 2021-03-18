const { React, getModule } = require('powercord/webpack');

const { getButton } = require('./components/Button');
const { getQuickLensSettings } = require('./components/QuickLensSettings');
const ImageResolve = getModule([ 'getUserAvatarURL' ], false).default;

module.exports.overlay = function (args, res, settings) {
  const Overlay = require('./components/Overlay');
  const patch = () => {
    res = React.createElement(Overlay, {
      children: res
    });
  };

  try { // NativeModal
    if (res.props.children[1].props.render().props.children.type.displayName === 'ImageModal') {
      patch();
    }
  } catch {}

  try { // PowercordModal
    if (res.props.children[1].props.renderModal().type.prototype.render().type().type.displayName === 'ImageModal') {
      patch();
    }
  } catch {}

  return res;
};

module.exports.imageModal = function (args, res, settings) {
  const ImageWrapper = require('./components/ImageWrapper');
  const patchImageSize = settings.get('patchImageSize', true);

  if (patchImageSize) {
    const imgComp = res.props.children[0].props;
    const { height, width } = imgComp;
    imgComp.height = height * 2;
    imgComp.width = width * 2;
    imgComp.maxHeight = document.body.clientHeight * 80 / 100;
    imgComp.maxWidth = document.body.clientWidth * 90 / 100;
  }

  res.props.children.unshift(
    React.createElement(ImageWrapper, {
      children: res.props.children.shift(),
      getSetting: settings.get,
      setSetting: settings.set
    })
  );
  return res;
};

module.exports.messageCM = function ([ { target, message: { content } } ], res, settings) {
  if ((target.tagName === 'IMG') || (target.tagName === 'VIDEO' && target.loop)) {
    const { width, height } = target;
    const menu = res.props.children;
    const hideNativeButtons = settings.get('hideNativeButtons', true);

    if (hideNativeButtons) {
      for (let i = menu.length - 1; i >= 0; i -= 1) {
        const e = menu[i];
        if (Array.isArray(e.props.children) && e.props.children[0]) {
          if (e.props.children[0].key === 'copy-image' || e.props.children[0].key === 'copy-native-link') {
            menu.splice(i, 1);
          }
        }
      }
    }

    const args = {
      content: isUrl(content) ? content : null, // eslint-disable-line no-use-before-define
      width: width * 2,
      height: height * 2
    };
    menu.splice(
      3, 0, getButton(
        getImagesObj(target, args), // eslint-disable-line no-use-before-define
        settings
      )
    );
  }
  return res;
};

module.exports.userCM = function ([ { user } ], res, settings) {
  const images = {
    png: { src: ImageResolve.getUserAvatarURL(user, 'png', 2048) },
    gif:  ImageResolve.hasAnimatedAvatar(user) ? { src: ImageResolve.getUserAvatarURL(user, 'gif', 2048) } : null,
    webp: { src: ImageResolve.getUserAvatarURL(user, 'webp', 2048) }
  };
  const start = res.props.children.props.children.length - 1;
  res.props.children.props.children.splice(start, 0, getButton(images, settings));
  return res;
};

module.exports.guildCM = function ([ { guild } ], res, settings) {
  const opts = {
    id: guild.id,
    icon: guild.icon,
    size: 4096
  };
  const images = {
    png: { src: ImageResolve.getGuildIconURL(opts).replace('.webp?', '.png?') },
    gif: ImageResolve.hasAnimatedGuildIcon(guild) ? { src:  ImageResolve.getGuildIconURL(opts).replace('.webp?', '.gif?') } : null,
    webp: { src: ImageResolve.getGuildIconURL(opts) }
  };
  res.props.children.splice(6, 0, getButton(images, settings));
  return res;
};

module.exports.imageCM = function ([ { target } ], res, settings) {
  const images = getImagesObj(target); // eslint-disable-line no-use-before-define
  const button = getButton(images, settings);

  button.props.children[0].props.disabled = true; // "open image"
  res.props.children = button.props.children;
  res.props.children.push(getQuickLensSettings(settings));
  return res;
};

module.exports.groupDMCM = function ([ { channel } ], res, settings) {
  const [ src ] = ImageResolve.getChannelIconURL(channel).split('?');
  const images = {
    webp: { src },
    png: { src: src.replace('.webp?', '.png?') }
  };
  res.props.children.splice(4, 0, getButton(images, settings));
  return res;
};

function getImagesObj (target, obj) {
  const img = {};
  const src = target.src.split('?').shift();
  let e = src.split('.').pop();
  if (e.length > 3) {
    e = src.split('/').pop();
  }
  img[e] = { src, ...obj }; // eslint-disable-line object-property-newline
  return img;
}

function isUrl (string) {
  try {
    new URL(string);
  } catch {
    return false;
  }
  return true;
}
