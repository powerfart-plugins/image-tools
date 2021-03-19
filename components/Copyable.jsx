const { clipboard } = require('electron');
const { React, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

module.exports = class Copy extends React.PureComponent {
  constructor () {
    super();
    this.state = {
      text: null
    };
    this._openTooltip = this._openTooltip.bind(this);
  }

  render () {
    return (
      <Tooltip text={this.state.text} color={'green'} forceOpen={true} position={'left'}>
        <Clickable onClick={this._openTooltip}>
          { this.props.children }
        </Clickable>
      </Tooltip>
    );
  }

  _openTooltip () {
    this.setState({ text: Messages.COPIED });
    clipboard.write({ text: this.props.children });

    setTimeout(() => this.setState({
      text: null
    }), 1500);
  }
};
