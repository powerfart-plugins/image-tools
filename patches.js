/* eslint-disable no-use-before-define, object-property-newline */

const { React, getModule } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');

const Button = require('./components/Button');
const LensSettings = require('./components/LensSettings');
const ImageResolve = getModule([ 'getUserAvatarURL' ], false).default;

function overlay (args, res, settings, switchModal) {
  const Overlay = require('./components/Overlay');
  const patch = () => {
    res = React.createElement(Overlay, {
      children: res
    });
    switchModal();
  };

  const nativeModalChildren = findInReactTree(res, ({ props }) => props?.render);
  const nativeModalTree = nativeModalChildren?.props?.render();

  const powercordModalChildren =  findInReactTree(res, ({ props }) => props?.renderModal);
  const powercordModalTree =  powercordModalChildren?.props?.renderModal();

  if (nativeModalTree) {
    if (findInReactTree(nativeModalTree, ({ type }) => type?.displayName === 'ImageModal')) {
      patch();
    }
  }

  if (powercordModalTree) {
    if (powercordModalTree?.type.prototype?.render()?.type()?.type?.displayName === 'ImageModal') {
      patch();
    }
  }

  return res;
}

function imageModal (args, res, settings) {
  const ImageModalWrapper = require('./components/ImageModalWrapper');
  const patchImageSize = settings.get('patchImageSize', true);

  if (patchImageSize) {
    const imgComp = res.props.children[0].props;
    const { height, width } = imgComp;
    imgComp.height = height * 2;
    imgComp.width = width * 2;
    imgComp.maxHeight = document.body.clientHeight * 70 / 100;
    imgComp.maxWidth = document.body.clientWidth * 80 / 100;
  }

  res.props.children.unshift(
    React.createElement(ImageModalWrapper, {
      children: res.props.children.shift(),
      getSetting: settings.get,
      setSetting: settings.set
    })
  );
  return res;
}

function messageCM ([ { target, message: { content } } ], res, settings) {
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
      content: isUrl(content) ? content : null,
      width: width * 2,
      height: height * 2
    };

    initButton(menu, {
      images: getImagesObj(target, args),
      settings
    });
  }
  return res;
}

function userCM ([ { user } ], res, settings) {
  const images = {
    png: { src: ImageResolve.getUserAvatarURL(user, 'png', 2048) },
    gif:  ImageResolve.hasAnimatedAvatar(user) ? { src: ImageResolve.getUserAvatarURL(user, 'gif', 2048) } : null,
    webp: { src: ImageResolve.getUserAvatarURL(user, 'webp', 2048) }
  };

  initButton(res.props.children.props.children, { images, settings });
  return res;
}

function guildCM ([ { guild } ], res, settings) {
  guild.size = 4096;
  const images = {
    png: { src: ImageResolve.getGuildIconURL(guild).replace('.webp?', '.png?') },
    gif: ImageResolve.hasAnimatedGuildIcon(guild) ? { src:  ImageResolve.getGuildIconURL(guild).replace('.webp?', '.gif?') } : null,
    webp: { src: ImageResolve.getGuildIconURL(guild) }
  };

  initButton(res.props.children, { images, settings });
  return res;
}

function imageCM ([ { target } ], res, settings) {
  const images = getImagesObj(target);
  const button = Button.render({ images, settings });

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

function getImagesObj (target, obj) {
  const img = {};
  const src = target.src.split('?').shift();
  let e = src.substr(src.lastIndexOf('.') + 1, src.length);
  if (e.length > 3) {
    e = 'png';
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

function initButton (menu, args) {
  menu.splice(menu.length - 1, 0, Button.render(args));
  return menu;
}

module.exports = {
  overlay,
  imageModal,
  messageCM,
  userCM,
  groupDMCM,
  guildCM,
  imageCM
};
