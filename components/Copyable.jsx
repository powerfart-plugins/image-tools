const { clipboard } = require('electron');
const { React, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

module.exports = class Copyable extends React.PureComponent {
  constructor () {
    super();
    this.state = {
      text: null
    };
    this.openTooltip = this.openTooltip.bind(this);
  }

  render () {
    return (
      <Tooltip text={this.state.text} color={'green'} forceOpen={true}>
        <Clickable onClick={this.openTooltip}>
          { this.props.children }
        </Clickable>
      </Tooltip>
    );
  }

  openTooltip () {
    this.setState({ text: Messages.COPIED });
    clipboard.write({ text: this.props.text });
    setTimeout(() => this.setState({ text: null }), 1500);
  }
};
