const { React, getModule } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');

const Button = require('../../components/Button.jsx');
const LensSettings = require('../../tools/Lens/Settings.jsx');

const inject2 = require('./inject2.js');

const { default: ImageResolve } = getModule([ 'getUserAvatarURL' ], false);

/* eslint-disable no-use-before-define, object-property-newline,no-undefined */
// noinspection JSUnusedGlobalSymbols
module.exports = class General {
  constructor (settings) {
    this.settings = settings;
    this.uninjectIDs = [];
    this.modalIsOpen = false;
  }

  inject () {
    this.injectWithSettings('TransitionGroup.default.prototype.render', (...args) => {
      this.isModalOpen = false;
      return this.overlayCallback(...args, () => this.isModalOpen = true);
    });
    this.injectWithSettings('MessageContextMenu.default', this.contextMenuPatch.message);
    this.injectWithSettings('GuildChannelUserContextMenu.default', this.contextMenuPatch.user);
    this.injectWithSettings('DMUserContextMenu.default', this.contextMenuPatch.user);
    this.injectWithSettings('UserGenericContextMenu.default', this.contextMenuPatch.user);
    this.injectWithSettings('GroupDMUserContextMenu.default', this.contextMenuPatch.user);
    this.injectWithSettings('GroupDMContextMenu.default', this.contextMenuPatch.groupDM);
    this.injectWithSettings('GuildContextMenu.default', this.contextMenuPatch.guild);
    this.injectWithSettings('GuildChannelListContextMenu.default', this.contextMenuPatch.guildChannelList);
    this.injectWithSettings('NativeImageContextMenu.default', this.contextMenuPatch.image);
    this.injectWithSettings('UserBanner.default', this.initNewContextMenu.UserBanner);
    this.injectWithSettings('CustomStatus.default', this.initNewContextMenu.CustomStatus);
    this.injectToGetImageSrc('image-tools-media-proxy-sizes');
  }

  uninject () {
    this.uninjectIDs.forEach(uninject);
  }

  overlayCallback (args, res, settings, switchModal) {
    const Overlay = require('../../components/Overlay');
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
        const guildMemberAvatarURLParams = { userId: user.id,
          guildId };
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
            png: { src: this.fixUrlSize(ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams,
              avatar }, false).replace('.webp', '.png')) },
            webp: { src: this.fixUrlSize(ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams,
              avatar }, false)) },
            gif:  ImageResolve.isAnimatedIconHash(avatar)
              ? { src: ImageResolve.getGuildMemberAvatarURL({ ...guildMemberAvatarURLParams,
                guildMemberAvatar: avatar }, true) }
              : null
          })),
          default: { // @todo FIX IT!!! найти в ближайшее время нативный способ перевода webp -> png (обновление в Canary 02.06.2021)
            png: { src: this.addDiscordHost(ImageResolve.getUserAvatarURL(user, false, 2048).replace('.webp', '.png')) },
            webp: { src: this.addDiscordHost(ImageResolve.getUserAvatarURL(user, false, 2048)) },
            gif:  ImageResolve.isAnimatedIconHash(user.avatar) ? { src: ImageResolve.getUserAvatarURL(user, true, 2048) } : null
          }
        };

        if (user.discriminator !== '0000') {
          initButton(res.props.children.props.children, { images,
            settings });
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
          gif: ImageResolve.isAnimatedIconHash(guild.icon)
            ? { src:  ImageResolve.getGuildIconURL({ ...params,
              canAnimate: true }) }
            : null
        };

        if (images.webp.src) {
          initButton(res.props.children, { images,
            settings });
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

        initButton(res.props.children, { images,
          settings });
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

          initButton(res.props.children, { images,
            settings });
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
            const size = { width: 2048,
              height: 918 };
            const images = {
              png: { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, false)).replace('.webp', '.png'),
                ...size },
              webp: { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, false)),
                ...size },
              gif:  ImageResolve.hasAnimatedUserBanner(user)
                ? { src: this.fixUrlSize(ImageResolve.getUserBannerURL(user, true)),
                  ...size }
                : null
            };

            res.props.onContextMenu = (e) => genContextMenu(e, 'user-banner', { images,
              settings });
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

              return genContextMenu(event, 'custom-status', { images,
                settings });
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

  injectWithSettings (funcPath, patch) {
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
};
