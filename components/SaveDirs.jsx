const { basename } = require('path');

const { React, getModule, getModuleByDisplayName, i18n: { Messages } } = require('powercord/webpack');
const { ButtonItem } = require('powercord/components/settings');

const SettingsRender = require('./SettingsRender.jsx');
const getDefaultSaveDir = require('../utils/getDefaultSaveDir');

const RemoveButton = getModuleByDisplayName('RemoveButton', false);
const { showOpenDialog } = getModule([ 'showOpenDialog' ], false);

const openDirectory = () => showOpenDialog([ 'openDirectory' ]);

/* eslint-disable object-property-newline */
module.exports = class SaveDirs extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {
      dirs: props.getSetting('saveImageDirs', [])
    };
    this.sync = this.sync.bind(this);
  }

  render () {
    const { marginBottom } = getModule([ 'marginBottom' ], false);

    if (!this.state.dirs.length) {
      this.addPath(getDefaultSaveDir());
    }

    return (
      <SettingsRender.Category
        opened={false}
        name={Messages.IMAGE_TOOLS_SAVE_DIR}
        description={Messages.IMAGE_TOOLS_SAVE_DIR_NOTE}
      >
        <div className={`${marginBottom} image-tools-save-dirs`}>
          { this.state.dirs.map((e, i) => this.renderItems(e, i)) }
        </div>
        <ButtonItem
          button={ Messages.IMAGE_TOOLS_SAVE_DIR_ADD}
          onClick={() => {
            openDirectory()
              .then(([ path ]) => {
                this.addPath(path);
              })
              .catch(console.error);
          }
          }
        />
      </SettingsRender.Category>
    );
  }

  renderItems (item, index) {
    const { flexCenter, flex, justifyCenter, alignCenter, vertical, directionColumn } = getModule([ 'flexCenter', 'flex', 'justifyCenter', 'alignCenter' ], false);
    const { game, gameNameLastPlayed, lastPlayed, removeGame, gameName, gameNameInput } = getModule([ 'game', 'gameNameLastPlayed' ], false);
    const { card } = getModule([ 'card', 'active' ], false);
    const j = (...args) => args.join(' ');

    return (
      <div className={j(flexCenter, flex, justifyCenter, alignCenter, game, card)}>
        <div className={j(gameNameLastPlayed, vertical, flex, directionColumn)}>
          <SettingsRender items={[ {
            type: 'text',
            default: item.name,
            onChange: (settings, value) => this.updateName(index, value),
            className: j(gameName, gameNameInput)
          } ]}/>
          <div className={j(lastPlayed)}>{item.path}</div>
        </div>
        {(this.state.dirs.length > 1) &&
          <RemoveButton
            className={j(removeGame)}
            onClick={() => this.deletePath(index)}
          />
        }
      </div>
    );
  }

  addPath (path) {
    if (!path || this.state.dirs.some((e) => e.path === path)) {
      return;
    }

    const elem = {
      name: basename(path),
      path
    };
    this.setState(((prevState) => ({ dirs: [ ...prevState.dirs, elem ] })), this.sync);
  }

  deletePath (index) {
    this.setState(({ dirs }) => {
      dirs.splice(index, 1);
      return { dirs };
    }, this.sync);
  }

  updateName (index, newName) {
    this.setState(({ dirs }) => {
      dirs[index].name = newName;
      return { dirs };
    }, this.sync);
  }

  sync () {
    this.props.updateSetting('saveImageDirs', this.state.dirs);
  }
};
