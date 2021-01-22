const { React, getModule } = require('powercord/webpack');

const { getButton } = require('./components/Button');
const { getQuickLensSettings } = require('./components/QuickLensSettings');
const ImageResolve = getModule([ 'getUserAvatarURL' ], false).default;

module.exports.imageModal = function (args, res, settings) {
  const ImageWrapper = require('./components/ImageWrapper');
  const patchImageSize = settings.get('patchImageSize', true);

  if (patchImageSize) {
    const imgComp = res.props.children[0].props;
    const { height, width } = imgComp;
    imgComp.height = height * 2;
    imgComp.width = width * 2;
    imgComp.maxHeight = 600;
    imgComp.maxWidth = 1200;
  }

  res.props.children.unshift(
    React.createElement(ImageWrapper, {
      children: res.props.children.shift(),
      getSetting: settings.get
    })
  );
  return res;
};

module.exports.message = function ([ { target } ], res, settings) {
  if (target.tagName.toLowerCase() === 'img') {
    const { width, height } = target;
    const menu = res.props.children;
    const urls = {
      png: target.src.split('?')[0]
    };
    const hideNativeButtons = settings.get('hideNativeButtons', true);

    if (hideNativeButtons) {
      for (let i = menu.length - 1; i >= 0; i -= 1) {
        const e = menu[i];
        if (Array.isArray(e.props.children)) {
          if (e.props.children[0].key === 'copy-image' || e.props.children[0].key === 'copy-native-link') {
            menu.splice(i, 1);
          }
        }
      }
    }

    menu.splice(
      3, 0, getButton(
        urls,
        {
          width: width * 2,
          height: height * 2
        },
        settings
      )
    );
  }
  return res;
};

module.exports.user = function (args, res, settings) {
  const [ { user } ] = args;
  const urls = {
    png: ImageResolve.getUserAvatarURL(user, 'png', 2048),
    gif: ImageResolve.hasAnimatedAvatar(user) ? ImageResolve.getUserAvatarURL(user, 'gif', 2048) : null,
    webp: ImageResolve.getUserAvatarURL(user, 'webp', 2048)
  };
  res.props.children.props.children.splice(6, 0, getButton(urls, {}, settings));
  return res;
};

module.exports.guild = function (args, res, settings) {
  const [ { guild } ] = args;
  const opts = {
    id: guild.id,
    icon: guild.icon,
    size: 4096
  };
  const urls = {
    png: ImageResolve.getGuildIconURL(opts).replace('.webp?', '.png?'),
    gif: ImageResolve.hasAnimatedGuildIcon(guild) ? ImageResolve.getGuildIconURL(opts).replace('.webp?', '.gif?') : null,
    webp: ImageResolve.getGuildIconURL(opts)
  };
  res.props.children.splice(6, 0, getButton(urls, {}, settings));
  return res;
};

module.exports.image = function ([ { target } ], res, settings) {
  const urls = {};
  const src = target.src.split('?')[0];
  const extension = src.split('.').pop();

  urls[extension] = src;
  const button = getButton(urls, {}, settings);
  button.props.children[0].props.disabled = true; // "open image"

  res.props.children = button.props.children;
  res.props.children.push(getQuickLensSettings(settings));
  return res;
};
