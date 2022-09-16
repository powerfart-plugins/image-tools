const { React } = require('powercord/webpack');
const ContextMenu = require('../../modules/PowerCord-libs/components/ContextMenu');
const settings = require('../../structures/lensSettings');

module.exports = class LensSettings extends React.PureComponent {
  static render (props) {
    return ContextMenu.renderRawItems(
      settings(props)
    );
  }
};
