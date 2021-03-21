const { React, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, ContextMenu } = require('powercord/components');

const { getDownloadPath, OutputManager } = require('../utils');
const actions = require('../tools/actions');

const imageSearchServices = require('../ReverseImageSearchServices.json');

class ImageToolsButton extends React.PureComponent {
  constructor (props) {
    super(props);

    this.output = new OutputManager('ImageToolsMsg', {
      hideSuccessToasts: props.settings.get('hideSuccessToasts', false)
    });
  }

  static render (props) {
    const itb = new ImageToolsButton(props);
    return itb.renderContextMenu();
  }

  get items () {
    const { images } = this.props;
    const baseExtensions = Object.keys(images);

    return baseExtensions.filter((e) => {
      if (!images[e]) {
        return false;
      }
      if (e in this.disabled) {
        return (Array.isArray(this.disabled[e])) ? true : !this.disabled[e];
      }
      return true;
    });
  }

  get disabled () {
    return {
      webp: this.props.settings.get('disableWebp', true),
      mp4:[ 'openImage', 'copyImage', 'saveAs', 'searchImage' ]
    };
  }

  get downloadPath () {
    return getDownloadPath(this.props.settings.get('pathSave', null));
  }

  getDisabledMethods (e) {
    return Array.isArray(this.disabled[e]) ? this.disabled[e] : [];
  }

  renderContextMenu () {
    const [ res ] = ContextMenu.renderRawItems([ {
      type: 'submenu',
      id: 'image-tools-button',
      name: Messages.IMAGE,
      items: this.getSubMenuItems(),
      getItems () {
        return this.items;
      }
    } ]);
    return res;
  }

  getBaseMenu (image, disabled) {
    const url = (image.content) ? image.content : image.src;
    const { images, settings: { get } } = this.props;
    const disabledISS = get('disabledImageSearchServices', []);

    return [
      {
        type: 'button',
        name: Messages.IMAGE_TOOLS_OPEN_IMAGE,
        disabled: disabled.includes('openImage'),
        onClick: () => actions.openImg(image)
      },
      {
        type: 'button',
        name: (this.items.length > 1) ? `${Messages.IMAGE_TOOLS_COPY_IMAGE} (PNG)` : Messages.IMAGE_TOOLS_COPY_IMAGE,
        disabled: disabled.includes('copyImage'),
        onClick: () => actions.copyImg(((images.png) ? images.png.src : url), this.output)
      },
      {
        type: 'button',
        name: Messages.OPEN_LINK,
        disabled: disabled.includes('openLink'),
        onClick: () => actions.openUrl(url)

      },
      {
        type: 'button',
        name: Messages.COPY_LINK,
        disabled: disabled.includes('copyLink'),
        onClick: () => actions.copyUrl(url, this.output)
      },
      {
        type: 'button',
        name: Messages.SAVE_IMAGE_MENU_ITEM,
        subtext: this.downloadPath,
        onClick: () => actions.save(url, this.output, this.downloadPath)
      },
      {
        type: 'button',
        name: Messages.IMAGE_TOOLS_SAVE_IMAGE_AS,
        disabled: disabled.includes('saveAs'),
        onClick: () => actions.saveAs(url, this.output)
      },
      {
        type: 'submenu',
        name: Messages.IMAGE_TOOLS_IMAGE_SEARCH,
        disabled: disabled.includes('searchImage'),
        getItems () {
          return this.items;
        },
        items: imageSearchServices
          .filter((e) => !disabledISS.includes(e.id))
          .map((e) => ({
            type: 'button',
            name: e.name,
            subtext: e.note,
            onClick: () => actions.openUrl((e.withoutEncode) ? e.url + url : e.url + encodeURIComponent(url))
          }))
      }
    ];
  }

  getSubMenuItems () {
    const { items, props: { images } } = this;

    if (items.length > 1) {
      return items.map((e) => ({
        type: 'submenu',
        name: e.toUpperCase(),
        items: this.getBaseMenu(images[e], this.getDisabledMethods(e)),
        getItems () {
          return this.items;
        }
      }));
    }
    return this.getBaseMenu(images[items[0]], this.getDisabledMethods(items[0]));
  }
}

module.exports = ImageToolsButton;
