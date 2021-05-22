/* eslint-disable no-use-before-define, object-property-newline */

const { React, getModule } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');

const Button = require('./components/Button');
const LensSettings = require('./components/LensSettings');
const { default: ImageResolve } = getModule([ 'getUserAvatarURL' ], false);

function overlay (args, res, settings, switchModal) {
  const Overlay = require('./components/Overlay');
  const nativeModalChildren = findInReactTree(res, ({ props }) => props?.render);
  const tree = nativeModalChildren?.props?.render();

  if (tree) {
    if (findInReactTree(tree, ({ type }) => type?.displayName === 'ImageModal')) {
      res = React.createElement(Overlay, {
        settings,
        children: res
      });
      switchModal();
    }
  }

  return res;
}
function messageCM ([ { target, message: { content } } ], res, settings) {
  if ((target.tagName === 'IMG') || (target.tagName === 'VIDEO' && target.loop)) {
    const { width, height } = target;
    const menu = res.props.children;
    const hideNativeButtons = settings.get('hideNativeButtons', true);
    const [ e, src ] = getImage(target);

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

    initButton(menu, {
      images: {
        [e]: {
          src,
          original: isUrl(content) ? content : null,
          width: width * 2,
          height: height * 2
        }
      },
      settings
    });
  }
  return res;
}

function userCM ([ { user } ], res, settings) {
  const images = {
    png: { src: addDiscordHost(ImageResolve.getUserAvatarURL(user, 'png', 2048)) },
    gif:  ImageResolve.hasAnimatedAvatar(user) ? { src: ImageResolve.getUserAvatarURL(user, 'gif', 2048) } : null,
    webp: { src: addDiscordHost(ImageResolve.getUserAvatarURL(user, 'webp', 2048)) }
  };

  if (user.discriminator !== '0000') {
    initButton(res.props.children.props.children, { images, settings });
  }
  return res;
}

function guildCM ([ { guild } ], res, settings) {
  guild.size = 4096;
  const images = {
    png: { src: ImageResolve.getGuildIconURL(guild)?.replace('.webp?', '.png?') },
    gif: ImageResolve.hasAnimatedGuildIcon(guild) ? { src:  ImageResolve.getGuildIconURL(guild).replace('.webp?', '.gif?') } : null,
    webp: { src: ImageResolve.getGuildIconURL(guild) }
  };

  if (images.png.src) {
    initButton(res.props.children, { images, settings });
  }
  return res;
}

function imageCM ([ { target } ], res, settings) {
  const [ e, src ] = getImage(target);
  const button = Button.render({
    images: { [e]: { src } },
    settings
  });

  const openImage = findInReactTree(button, ({ props }) => props?.id === 'open-image');

  openImage.props.disabled = true;
  res.props.children = [
    ...button.props.children,
    ...LensSettings.render(settings)
  ];
  return res;
}

function groupDMCM ([ { channel } ], res, settings) {
  const [ src ] = ImageResolve.getChannelIconURL(channel).split('?');
  const images = {
    webp: { src },
    png: { src: src.replace('.webp', '.png') }
  };

  initButton(res.props.children, { images, settings });
  return res;
}

function guildChannelListCM ([ { guild } ], res, settings) {
  if (guild.banner) {
    const images = {
      png: {
        src: ImageResolve.getGuildBannerURL(guild),
        width: 512,
        height: 329
      }
    };

    initButton(res.props.children, { images, settings });
  }
  return res;
}

function getImage (target) {
  const src = target.src.split('?').shift();
  let e = src.substr(src.lastIndexOf('.') + 1, src.length);
  if (e.length > 3) {
    e = 'png';
  }
  return [ e, src ];
}

function isUrl (string) {
  try {
    new URL(string);
  } catch {
    return false;
  }
  return true;
}

function initButton (menu, args) {
  menu.splice(menu.length - 1, 0, Button.render(args));
  return menu;
}

function addDiscordHost (url) {
  return new URL(url, (url.startsWith('/assets/')) ? window.GLOBAL_ENV.ASSET_ENDPOINT : undefined).href;
}

module.exports = {
  overlay,
  messageCM,
  userCM,
  groupDMCM,
  guildCM,
  imageCM,
  guildChannelListCM
};
