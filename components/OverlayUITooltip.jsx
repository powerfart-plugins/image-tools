const { clipboard } = require('electron');
const { React, i18n: { Messages } } = require('powercord/webpack');
const { Clickable, Tooltip } = require('powercord/components');

module.exports = class OverlayUITooltip extends React.PureComponent {
  constructor (props) {
    super(props);
    this.state = {
      text: null
    };
    this.openTooltip = this.openTooltip.bind(this);
  }

  render () {
    const isError = this.props.error;

    return (
      <Tooltip
        text={(isError) ? this.props.error.toString() : this.state.text}
        color={(isError) ? 'red' : 'green'}
        forceOpen={!isError}
      >
        <Clickable onClick={this.openTooltip}>
          { this.props.children }
        </Clickable>
      </Tooltip>
    );
  }

  openTooltip () {
    if (this.props.error) {
      return;
    }

    this.setState({ text: Messages.COPIED });
    clipboard.write({ text: this.props.copyText });
    setTimeout(() => this.setState({ text: null }), 1500);
  }
};
