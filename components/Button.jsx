const { React, i18n: { Messages } } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { camelCaseify, findInReactTree } = require('powercord/util');

const getDefaultSaveDir = require('../utils/getDefaultSaveDir');
const OutputManager = require('../modules/OutputManager');
const buttonStructure = require('../structures/button');
const Actions = require('../tools/Actions');

const imageSearchEngines = require('../ReverseImageSearchEngines.json');
const priority = [ 'gif', 'mp4', 'png', 'jpg', 'webp' ];

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
    const lowPriorityExtensions = this.props.settings.get('lowPriorityExtensions', []);
    const baseExtensions = Object.keys(images)
      .filter((e) => images[e])
      .sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

    return baseExtensions
      .reduceRight((acc, e, i) => {
        if (acc.length > 1 && lowPriorityExtensions.includes(e)) {
          acc.splice(i, 1);
        }
        return acc;
      }, baseExtensions);
  }

  get disabled () {
    return {
      mp4:[ 'open-image', 'copy-image', 'save-as', 'search-image' ]
    };
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

    // ContextMenu.renderRawItems  не поддерживаеит по умолчанию этот реквизит
    const saveImageBtn = findInReactTree(res, ({ props }) => props?.id === 'save');
    if (saveImageBtn) {
      saveImageBtn.props.action = this.getAction(prioritySort, 'save');
    }

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
    return buttonStructure
      .filter(({ id }) => !this.disabledActions.includes(id))
      .map((item) => ({
        disabled: disabled.includes(item.id),
        name: item.name,
        ...item,
        ...this.getExtraItemsProperties(image, item.id)
      }));
  }

  getExtraItemsProperties (image, snakeId) {
    const id = camelCaseify(snakeId);
    const { src, original } = image;
    const saveImageDirs = this.props.settings.get('saveImageDirs', []);
    const allowSubText = !this.props.settings.get('hideHints', false); // надо бы как-то рекурсивно удалять, но мне впаду
    const defaultSaveDir = saveImageDirs[0]?.path || getDefaultSaveDir();
    const openLink = (url, withoutEncode) => Actions.openLink(
      (url + ((withoutEncode) ? src : encodeURIComponent(src))), null, { original }
    );

    const data =  {
      openImage: {
        onClick: () => Actions.openImage(image)
      },
      copyImage: {
        disabled: !(/\.(png|jpg|jpeg)$/).test(new URL(src).pathname)
      },
      save: {
        type: (saveImageDirs.length > 1) ? 'submenu' : 'button',
        subtext: (allowSubText) ? defaultSaveDir : null,
        items: saveImageDirs.map(({ name, path }) => ({
          type: 'button',
          name,
          subtext: (allowSubText) ? path : null,
          onClick: () => Actions.save(image.src, this.output, {
            downloadPath: path
          })
        })),
        getItems () {
          return this.items;
        }
      },
      searchImage: {
        items: [
          ...this.imageSearchEngines.map((e) => ({
            type: 'button',
            name: e.name,
            subtext: (allowSubText) ? e.note : null,
            onClick: () => openLink(e.url, e.withoutEncode)
          })),
          {
            type: 'button',
            color: 'colorDanger',
            name: Messages.IMAGE_TOOLS_SEARCH_EVERYWHERE,
            onClick: () => this.imageSearchEngines.forEach(({ url, withoutEncode }) => openLink(url, withoutEncode))
          }
        ],
        getItems () {
          return this.items;
        }
      }
    };

    return {
      onClick: () => Actions[id](image.src, this.output, {
        downloadPath: defaultSaveDir,
        original
      }),
      ...data[id]
    };
  }

  getAction (arr, id) {
    const key = (arr.length) ? arr[0] : this.items[0];
    if (Array.isArray(this.disabled[key]) && this.disabled[key].includes(id)) {
      return () => null;
    }
    const { onClick } = this.getExtraItemsProperties(this.props.images[key], id);

    return onClick;
  }
}

module.exports = ImageToolsButton;
