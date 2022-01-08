/* eslint-disable no-use-before-define, object-property-newline,no-undefined */
// noinspection JSUnusedGlobalSymbols

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');

const Button = require('../components/Button.jsx');
const LensSettings = require('../tools/Lens/Settings.jsx');
const OverlayUI = require('../components/OverlayUI.jsx');
const ImageModalWrapper = require('../components/ImageModalWrapper.jsx');

const imageModalClasses = getModule([ 'wrapper', 'downloadLink' ], false);
const { default: ImageResolve } = getModule([ 'getUserAvatarURL' ], false);

const UNINJECT_IDS = [];

/**
 * @param {String|Object} funcPath (ex ModuleName.default)
 * @param {function} patch
 */
function inject2 (funcPath, patch) {
  const path = funcPath.split('.');
  const moduleName = path.shift();
  const method = path.pop();
  const injectId = `image-tools${moduleName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
  const module = getModule((m) => m?.default?.displayName === moduleName, false);
  const injectTo = getModulePath(); // eslint-disable-line no-use-before-define

  if (module === null) {
    console.error(`Module "${moduleName}" not found`);
    return;
  }
  inject(injectId, injectTo, method, patch);
  module.default.displayName = moduleName;
  return injectId;

  function getModulePath () {
    let obj = module;
    if (path.length) {
      for (let i = 0, n = path.length; i < n; ++i) {
        const k = path[i];
        if (k in obj) {
          obj = obj[k];
        } else {
          throw new Error(`Not found ${[ ...path, method ].join('.')} in ${moduleName}`);
        }
      }
    }
    return obj;
  }
}


/**
 * @typeof General
 */
class General {
  constructor (settings) {
    this.settings = settings;
    this.uninjectIDs = [];
    this.modalIsOpen = false;
  }

  inject () {
    this.customInject('TransitionGroup.default.prototype.render', (...args) => {
      this.isModalOpen = false;
      return this.overlayCallback(...args, () => this.isModalOpen = true);
    });
    this.customInject('MessageContextMenu.default', this.contextMenuPatch.message);
    this.customInject('GuildChannelUserContextMenu.default', this.contextMenuPatch.user);
    this.customInject('DMUserContextMenu.default', this.contextMenuPatch.user);
    this.customInject('UserGenericContextMenu.default', this.contextMenuPatch.user);
    this.customInject('GroupDMUserContextMenu.default', this.contextMenuPatch.user);
    this.customInject('GroupDMContextMenu.default', this.contextMenuPatch.groupDM);
    this.customInject('GuildContextMenu.default', this.contextMenuPatch.guild);
    this.customInject('GuildChannelListContextMenu.default', this.contextMenuPatch.guildChannelList);
    this.customInject('NativeImageContextMenu.default', this.contextMenuPatch.image);
    this.customInject('UserBanner.default', this.initNewContextMenu.UserBanner);
    this.customInject('CustomStatus.default', this.initNewContextMenu.CustomStatus);
    this.injectToGetImageSrc('image-tools-media-proxy-sizes');
  }

  uninject () {
    [
      ...this.uninjectIDs,
      ...UNINJECT_IDS
    ].forEach(uninject);
  }

  overlayCallback (args, res, settings, switchModal) {
    const Overlay = require('../components/Overlay');
    const nativeModalChildren = findInReactTree(res, ({ props }) => props?.render);
    let tree;

    try { // [Powercord:Injector] Failed to run injection "image-tools-transition-group" TypeError: Cannot read property 'onClose' of undefined
      tree = nativeModalChildren?.props?.render();
    } catch {}

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

  get contextMenuPatch () {
    function initButton (menu, args) {
      menu.splice(menu.length - 1, 0, Button.render(args));
      return menu;
    }

    return {
      message ([ { target, message: { content, stickerItems } } ], res, settings) {
        if ((target.tagName === 'IMG') || (target.tagName === 'VIDEO' && target.loop) || (target.tagName === 'CANVAS' && stickerItems.length)) {
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

          if (target.tagName === 'CANVAS') {
            menu.splice(menu.length - 1, 0, Button.renderSticker(stickerItems[0].id, settings));
          } else {
            const [ e, src ] = this.getImage(target);
            initButton(menu, {
              images: {
                [e]: {
                  src,
                  original: this.isUrl(content) ? content : null,
                  width: width * 2,
                  height: height * 2
                }
              },
              settings
            });
          }
        }
        return res;
      },

      user ([ { user, guildId } ], res, settings) {
        const { getGuild } = getModule([ 'getGuild' ], false);
        const guildMemberAvatarURLParams = { userId: user.id, guildId };
        const guildMemberAvatars =  Object.entries(user.guildMemberAvatars);
        const currentGuildId = guildMemberAvatars.findIndex(([ id ]) => id === guildId);
        const isCurrentGuild =  currentGuildId !== -1;
        if (isCurrentGuild) {
          guildMemberAvatars.splice(0, 0, guildMemberAvatars.splice(currentGuildId, 1)[0]);
        }

        const images = {
          isCurrentGuild,
          guildAvatars: guildMemberAvatars.map(([ guildId, avatar ]) => ({
            guildName: getGuild(guildId).name,
            png: { src: this.fixUrlSize(ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams, avatar }, false).replace('.webp', '.png')) },
            webp: { src: this.fixUrlSize(ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams, avatar }, false)) },
            gif:  ImageResolve.isAnimatedIconHash(avatar) ? { src: ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams, guildMemberAvatar: avatar }, true) } : null
          })),
          default: { // @todo FIX IT!!! найти в ближайшее время нативный способ перевода webp -> png (обновление в Canary 02.06.2021)
            png: { src: this.addDiscordHost(ImageResolve.getUserAvatarURL(user, false, 2048).replace('.webp', '.png')) },
            webp: { src: this.addDiscordHost(ImageResolve.getUserAvatarURL(user, false, 2048)) },
            gif:  ImageResolve.isAnimatedIconHash(user.avatar) ? { src: ImageResolve.getUserAvatarURL(user, true, 2048) } : null
          }
        };

        if (user.discriminator !== '0000') {
          initButton(res.props.children.props.children, { images, settings });
        }

        return res;
      },
      guild ([ { guild } ], res, settings) {
        const params = {
          id: guild.id,
          icon: guild.icon,
          size: 4096,
          canAnimate: false
        };
        const images = {
          png: { src: ImageResolve.getGuildIconURL(params)?.replace('.webp?', '.png?') },
          webp: { src: ImageResolve.getGuildIconURL(params) },
          gif: ImageResolve.isAnimatedIconHash(guild.icon) ? { src:  ImageResolve.getGuildIconURL({ ...params, canAnimate: true }) } : null
        };

        if (images.webp.src) {
          initButton(res.props.children, { images, settings });
        }
        return res;
      },

      image ([ { target } ], res, settings) {
        const [ e, src ] = this.getImage(target);
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
      },

      groupDM ([ { channel } ], res, settings) {
        const [ src ] = ImageResolve.getChannelIconURL(channel).split('?');
        const images = {
          webp: { src },
          png: { src: src.replace('.webp', '.png') }
        };

        initButton(res.props.children, { images, settings });
        return res;
      },

      guildChannelList ([ { guild } ], res, settings) {
        if (guild.banner) {
          const url = new URL(ImageResolve.getGuildBannerURL(guild));
          const e = url.pathname.split('.').pop();

          const images = {
            [e]: {
              src: this.fixUrlSize(url.href),
              width: 2048,
              height: 918
            }
          };

          initButton(res.props.children, { images, settings });
        }
        return res;
      }
    };
  }

  get initNewContextMenu () {
    function genContextMenu (e, id, btnRenderParams) {
      const { default: Menu, MenuGroup } = getModule([ 'MenuGroup' ], false);
      const { contextMenu: { openContextMenu, closeContextMenu } } = require('powercord/webpack');

      return openContextMenu(e, () =>
        React.createElement(Menu, {
          navId: id,
          onClose: closeContextMenu,
          children: React.createElement(MenuGroup, null, Button.render(btnRenderParams))
        })
      );
    }

    return {
      UserBanner ([ { user } ], res, settings) {
        if (!res.props.onContextMenu) { // @todo else ?
          if (user.banner) {
            const size = { width: 2048, height: 918 };
            const images = {
              png: { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, false)).replace('.webp', '.png'), ...size },
              webp: { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, false)), ...size },
              gif:  ImageResolve.hasAnimatedUserBanner(user) ? { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, true)), ...size } : null
            };

            res.props.onContextMenu = (e) => genContextMenu(e, 'user-banner', { images, settings });
          }
        }
        return res;
      },

      CustomStatus (args, res, settings) {
        if (!res.props.onContextMenu) { // @todo else ?
          res.props.onContextMenu = (event) => {
            const { target } = event;
            if (target.tagName === 'IMG') {
              const [ e, src ] = this.getImage(target);
              const { width, height } = target;
              const images = {
                [e]: {
                  src,
                  width: width * 2,
                  height: height * 2
                }
              };

              return genContextMenu(event, 'custom-status', { images, settings });
            }
          };
        }

        return res;
      }
    };
  }

  injectToGetImageSrc (id) {
    const imageDiscordUtils = getModule([ 'getImageSrc' ], false);
    inject(id, imageDiscordUtils, 'getImageSrc', (args) => {
      if (this.isModalOpen) {
        args[3] = this.settings.get('compression', 1); // отменить коэффициент размеров
      }
      return args;
    }, true);
    this.uninjectIDs.push(id);
  }

  customInject (funcPath, patch) {
    const id = inject2(funcPath, (...args) => patch.call(this, ...args, this.settings));
    this.uninjectIDs.push(id);
  }

  getImage (target) {
    const src = target.src.split('?').shift();
    let e = src.substr(src.lastIndexOf('.') + 1, src.length);
    if (e.length > 3) {
      if (src.endsWith('/mp4')) {
        e = 'mp4';
      } else {
        e = 'png';
      }
    }
    return [ e, src ];
  }

  isUrl (string) {
    try {
      new URL(string);
    } catch {
      return false;
    }
    return true;
  }

  fixUrlSize (url) {
    url = new URL(url);
    url.searchParams.set('size', '2048');
    return url.href;
  }

  addDiscordHost (url) {
    return new URL(url, (url.startsWith('/assets/')) ? window.GLOBAL_ENV.ASSET_ENDPOINT : undefined).href;
  }
}


/**
 * @typeof Overlay
 */
class Overlay {
  constructor (settings, children, { patchModalLayerOpts, imageModalRenderOpts }) {
    this.settings = settings;
    this.uninjectIDs = [];
    this.patchImageSize = settings.get('patchImageSize', true);
    this.children = children;
    this.patchModalLayerOpts = patchModalLayerOpts;
    this.imageModalRenderOpts = imageModalRenderOpts;
  }

  inject () {
    this.customInject('Image.default.prototype.render', this.imageRender);
    this.customInject('ImageModal.default.prototype.render', this.imageModalRender);
    this.patchBackdrop('image-tools-overlay-backdrop'); // @todo найти способ пропатчить closeModal
    this.patchModalLayer('image-tools-overlay-modal-layer');
    this.uninjectIDs.forEach((e) => {
      if (!UNINJECT_IDS.includes(e)) {
        UNINJECT_IDS.push(e);
      }
    });
  }

  uninject () {
    this.uninjectIDs.forEach(uninject);
  }

  imageRender (_, res) {
    const Video = findInReactTree(res, ({ type }) => type?.displayName === 'Video');
    if (Video) {
      Video.props.play = true;
    }
    return res;
  }

  imageModalRender (_, res) {
    const { wrapper, downloadLink } = imageModalClasses;
    const Sticker = getModuleByDisplayName('Sticker', false);
    const Wrapper = findInReactTree(res, ({ className }) => className === wrapper).children;
    const LazyImageIndex = Wrapper.findIndex(({ type }) => type?.displayName === 'LazyImage');
    const footerIndex = Wrapper.findIndex(({ props }) => props?.className === downloadLink);
    const LazyImage = Wrapper[LazyImageIndex];

    if (LazyImage) {
      if (LazyImage.props.stickerAssets) {
        Wrapper[LazyImageIndex] = React.createElement(Sticker, LazyImage.props.stickerAssets);
      } else {
        if (this.patchImageSize) {
          const imgComp = LazyImage.props;
          const { height, width } = imgComp;

          imgComp.height = height * 2;
          imgComp.width = width * 2;
          imgComp.maxHeight = document.body.clientHeight * 70 / 100;
          imgComp.maxWidth = document.body.clientWidth * 80 / 100;
        }

        if (LazyImage.type.isAnimated({ original: LazyImage.props.src })) {
          LazyImage.props.animated = true;
        }
      }

      this.imageModalRenderOpts.lensConfig.children = Wrapper[LazyImageIndex];
    }

    Wrapper[footerIndex] = React.createElement(OverlayUI, {
      originalFooter: Wrapper[footerIndex],
      ...this.imageModalRenderOpts.overlayUI
    });

    return res;
  }

  patchBackdrop (id) {
    const backdrop = findInReactTree(this.children, ({ props }) => props?.onClose);
    inject(id, backdrop.props, 'onClose', () => {
      this.uninject();
      return [ true ];
    }, true);
    this.uninjectIDs.push(id);
  }

  patchModalLayer (id) {
    const ModalLayer = findInReactTree(this.children, ({ props }) => props?.render);

    inject(id, ModalLayer.props, 'render', (args, res) => {
      res.props.children = (
        React.createElement(ImageModalWrapper, {
          children: res.props.children,
          ...this.patchModalLayerOpts
        })
      );
      return res;
    });
    this.uninjectIDs.push(id);
  }


  customInject (funcPath, patch) {
    const id = inject2(funcPath, (...args) => patch.call(this, ...args, this.settings));
    this.uninjectIDs.push(id);
  }
}

module.exports = {
  General,
  Overlay
};
