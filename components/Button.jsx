const { React, i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { findInReactTree } = require('powercord/util');

const { getDownloadPath, OutputManager } = require('../utils');
const actions = require('../tools/actions');

const imageSearchEngines = require('../ReverseImageSearchEngines.json');
const priority = [ 'gif', 'png', 'jpg', 'webp' ];

class ImageToolsButton extends React.PureComponent {
  constructor (props) {
    super(props);

    this.output = new OutputManager('ImageToolsMsg', {
      hideSuccessToasts: props.settings.get('hideSuccessToasts', false)
    });
    this.disabledISE = props.settings.get('disabledImageSearchEngines', []);
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
    const prioritySort = priority.filter((e) => this.items.includes(e)); // избежать лишних проходов
    const parentTree = this._findInTreeByPriority(res, prioritySort);
    const { props } = findInReactTree(parentTree, ({ props }) => props?.id === 'open-image');

    res.props.action = props.action;
    return res;
  }

  getBaseMenu (image, disabled) {
    const url = (image.content) ? image.content : image.src;
    const { images } = this.props;

    return [
      {
        type: 'button',
        id: 'open-image',
        name: Messages.IMAGE_TOOLS_OPEN_IMAGE,
        disabled: disabled.includes('openImage'),
        onClick: () => actions.openImg(image)
      },
      {
        type: 'button',
        id: 'copy-image',
        name: (this.items.length > 1) ? `${Messages.IMAGE_TOOLS_COPY_IMAGE} (PNG)` : Messages.IMAGE_TOOLS_COPY_IMAGE,
        disabled: disabled.includes('copyImage'),
        onClick: () => actions.copyImg(((images.png) ? images.png.src : url), this.output)
      },
      {
        type: 'button',
        id: 'open-link',
        name: Messages.OPEN_LINK,
        disabled: disabled.includes('openLink'),
        onClick: () => actions.openUrl(url)

      },
      {
        type: 'button',
        id: 'copy-link',
        name: Messages.COPY_LINK,
        disabled: disabled.includes('copyLink'),
        onClick: () => actions.copyUrl(url, this.output)
      },
      {
        type: 'button',
        id: 'save',
        name: Messages.SAVE_IMAGE_MENU_ITEM,
        subtext: this.downloadPath,
        onClick: () => actions.save(url, this.output, this.downloadPath)
      },
      {
        type: 'button',
        id: 'save-as',
        name: Messages.IMAGE_TOOLS_SAVE_IMAGE_AS,
        disabled: disabled.includes('saveAs'),
        onClick: () => actions.saveAs(url, this.output)
      },
      {
        type: 'submenu',
        id: 'search-image',
        name: Messages.IMAGE_TOOLS_IMAGE_SEARCH,
        disabled: disabled.includes('searchImage'),
        getItems () {
          return this.items;
        },
        items: imageSearchEngines
          .filter(({ name }) => this._isDisabledISE(name))
          .map((e) => ({
            type: 'button',
            name: e.name,
            subtext: e.note,
            onClick: () => actions.openUrl(e.url + ((e.withoutEncode) ? url : encodeURIComponent(url)))
          }))
      }
    ];
  }

  getSubMenuItems () {
    const { items, props: { images } } = this;

    if (items.length > 1) {
      return items.map((e) => ({
        type: 'submenu',
        id: `sub-${e}`,
        name: e.toUpperCase(),
        items: this.getBaseMenu(images[e], this.getDisabledMethods(e)),
        getItems () {
          return this.items;
        }
      }));
    }
    return this.getBaseMenu(images[items[0]], this.getDisabledMethods(items[0]));
  }

  _findInTreeByPriority (tree, arr) {
    if (arr.length === 1) {
      return tree;
    }
    for (const e of arr) {
      const res = findInReactTree(tree, ({ props }) => props?.id === `sub-${e}`);
      if (res) {
        return res;
      }
    }
  }

  _isDisabledISE (name) {
    const id = name.replace(' ', '-').toLowerCase();
    return !this.disabledISE.includes(id);
  }
}

module.exports = ImageToolsButton;
