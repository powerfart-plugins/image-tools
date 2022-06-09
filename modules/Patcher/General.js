const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { inject, uninject } = require('powercord/injector');

const Button = require('../../components/Button.jsx');
const LensSettings = require('../../tools/Lens/Settings.jsx');

const inject2 = require('../../utils/inject2.js');

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
    this.injectWithSettings('UserBanner.default', this.initNewContextMenu.userBanner);
    this.injectWithSettings('CustomStatus.default', this.initNewContextMenu.customStatus);
    this.injectToGetImageSrc('image-tools-media-proxy-sizes');
    this.patchOpenContextMenuLazy('image-tools-open-context-menu-lazy', {
      MessageContextMenu: this.contextMenuPatch.message,
      GuildChannelUserContextMenu: this.contextMenuPatch.user,
      DMUserContextMenu: this.contextMenuPatch.user,
      UserGenericContextMenu: (...args) => this.contextMenuPatch.user.call(this, ...args, (r) => r[0].props.children),
      GroupDMUserContextMenu: this.contextMenuPatch.user,
      GroupDMContextMenu: this.contextMenuPatch.groupDM,
      GuildContextMenu: this.contextMenuPatch.guild,
      GuildChannelListContextMenu: this.contextMenuPatch.guildChannelList,
      DeveloperContextMenu: this.contextMenuPatch.developer,
      NativeImageContextMenu: this.contextMenuPatch.image
    });
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

  patchOpenContextMenuLazy (id, menus) {
    inject(id, getModule([ 'openContextMenuLazy' ], false), 'openContextMenuLazy', ([ event, lazyRender, params ]) => {
      const wrapLazyRender = async () => {
        const render = await lazyRender(event);

        return (config) => {
          const menu = render(config);
          const CMName = (menu?.type?.displayName)
            ? menu.type.displayName
            : menu.type(config).props.children.type.displayName;

          if (CMName) {
            const moduleByDisplayName = getModuleByDisplayName(CMName, false);
            const module = getModule((m) => m.default === menu.type || m.__powercordOriginal_default === menu.type, false);

            if (CMName in menus) {
              if (moduleByDisplayName !== null) {
                this.injectWithSettings(`${CMName}.default`, menus[CMName]);
              } else if (module !== null) {
                wrapAndInjectWithSettings.call(this, CMName, menus[CMName], module);
              }

              delete menus[CMName];
            }

            if (moduleByDisplayName !== null) {
              menu.type = moduleByDisplayName;
            } else if (module !== null) {
              menu.type = module.default;
            }
          }
          if (!Object.keys(menus).length) {
            uninject(id);
          }

          return menu;
        };
      };

      return [ event, wrapLazyRender, params ];
    }, true);

    this.uninjectIDs.push(id);


    function wrapAndInjectWithSettings (CMName, patch, module) {
      const injectId = `image-tools${CMName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
      const memorizeRender = window._.memoize((render) => (...renderArgs) => (
        patch.call(this, renderArgs, render(...renderArgs), this.settings)
      ));

      inject(injectId, module, 'default', (args, res) => {
        res.props.children.type = memorizeRender(res.props.children.type);
        return res;
      });

      this.uninjectIDs.push(injectId);
    }
  }

  get contextMenuPatch () {
    function initButton (menu, args) {
      menu.splice(menu.length - 1, 0, Button.render(args));
      return menu;
    }

    return {
      message ([ { target, message: { content, stickerItems } } ], res, settings) {
        if ((target.tagName === 'IMG') || (target.getAttribute("data-role") === 'img') || (target.getAttribute("data-type") === 'sticker' && stickerItems.length)) {
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

      user ([ { user, guildId } ], res, settings, getUserContext = (e) => e) {
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
          const menu = findInReactTree(res, ({ props }) => props?.navId === 'user-context').props.children;
          initButton(getUserContext(menu), { images, settings });
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
      },

      developer ([ { target } ], res, settings) {
        if (target.tagName === 'IMG') {
          const { width, height } = target;
          let menu = res.props.children;

          if (!Array.isArray(menu)) {
            res.props.children = [ menu ];
            menu = res.props.children;
          }

          const [ e, src ] = this.getImage(target);
          initButton(menu, {
            images: {
              [e]: {
                src,
                width: width * 5,
                height: height * 5
              }
            },
            settings
          });
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
      userBanner ([ { user } ], res, settings) {
        if (!res.props.onContextMenu) { // @todo else ?
          if (user.banner) {
            const size = { width: 2048,
              height: 918 };
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

      customStatus (args, res, settings) {
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
      const compression = this.settings.get('compression', 0);
      if (this.isModalOpen && compression > 0) {
        args[3] = compression;
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
    const src = ((target.tagName === 'IMG') ? target.src : target.href).split('?').shift();
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
    return new URL(url, (url.startsWith('/assets/')) ? `https:${window.GLOBAL_ENV.ASSET_ENDPOINT}` : undefined).href;
  }
};
