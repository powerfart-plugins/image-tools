const { React } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const settings = require('../../structures/lensSettings');

module.exports = class LensSettings extends React.PureComponent {
  static render (props) {
    return ContextMenu.renderRawItems(
      settings(props)
    );
  }
};
