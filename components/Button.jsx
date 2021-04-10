const { React, i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { camelCaseify } = require('powercord/util');

const { getDownloadPath, OutputManager, baseButtonStructure } = require('../utils');
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
    this.disabledActions = props.settings.get('disabledActions', []);
    this.imageSearchEngines = imageSearchEngines.filter(({ name }) => {
      const id = name.replace(' ', '-').toLowerCase();
      return !this.disabledISE.includes(id);
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
      mp4:[ 'open-image', 'copy-image', 'save-as', 'search-image' ]
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
    const prioritySort = priority.filter((e) => this.items.includes(e));
    const actionId = this.props.settings.get('defaultAction', 'open-image');

    res.props.action = this.getAction(prioritySort, actionId);
    return res;
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

  getBaseMenu (image, disabled) {
    return baseButtonStructure
      .filter(({ id }) => !this.disabledActions.includes(id))
      .map((item) => ({
        disabled: disabled.includes(item.id),
        name: Messages[item.keyName],
        ...item,
        ...this.getExtraItemsProperties(image, item.id)
      }));
  }

  getExtraItemsProperties (image, snakeId) {
    const id = camelCaseify(snakeId);
    const url = (image.content) ? image.content : image.src;
    const allowSubText = !this.props.settings.get('hideHints', false); // надо бы как-то рекурсивно удалять, но мне впаду

    const data =  {
      openImage: {
        onClick: () => actions.openImage(image)
      },
      copyImage: {
        name: (this.items.length > 1) ? `${Messages.IMAGE_TOOLS_COPY_IMAGE} (PNG)` : Messages.IMAGE_TOOLS_COPY_IMAGE
      },
      save: {
        subtext: (allowSubText) ? this.downloadPath : null
      },
      searchImage: {
        items: [
          ...this.imageSearchEngines.map((e) => ({
            type: 'button',
            name: e.name,
            subtext: (allowSubText) ? e.note : null,
            onClick: () => actions.openLink(e.url + ((e.withoutEncode) ? url : encodeURIComponent(url)))
          })),
          {
            type: 'button',
            color: 'colorDanger',
            name: Messages.IMAGE_TOOLS_SEARCH_EVERYWHERE,
            onClick: () => this.imageSearchEngines.forEach((e) => {
              actions.openLink(e.url + ((e.withoutEncode) ? url : encodeURIComponent(url)));
            })
          }
        ],
        getItems () {
          return this.items;
        }
      }
    };

    return {
      onClick: () => actions[id](url, this.output, {
        downloadPath: this.downloadPath
      }),
      ...data[id]
    };
  }

  getAction (arr, id) {
    const key = (arr.length) ? arr[0] : this.items[0];
    const { onClick } = this.getExtraItemsProperties(this.props.images[key], id);

    return onClick;
  }
}

module.exports = ImageToolsButton;
