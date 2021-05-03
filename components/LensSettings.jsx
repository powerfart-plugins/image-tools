const { React } = require('powercord/webpack');
const { ContextMenu } = require('powercord/components');
const { lensSettings } = require('../structures');

module.exports = class LensSettings extends React.PureComponent {
  static render (props) {
    return ContextMenu.renderRawItems(
      lensSettings(props)
    );
  }
};
