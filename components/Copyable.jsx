const { clipboard } = require('electron');
const { React, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

module.exports = class Copyable extends React.PureComponent {
  constructor () {
    super();
    this.state = {
      text: null
    };
    this._openTooltip = this._openTooltip.bind(this);
  }

  render () {
    return (
      <Tooltip text={this.state.text} color={'green'} forceOpen={true}>
        <Clickable onClick={this._openTooltip}>
          { this.props.children }
        </Clickable>
      </Tooltip>
    );
  }

  _openTooltip () {
    const { text, children } = this.props;

    this.setState({ text: Messages.COPIED });
    clipboard.write({
      text: (text) ? text : children
    });

    setTimeout(() => this.setState({
      text: null
    }), 1500);
  }
};
