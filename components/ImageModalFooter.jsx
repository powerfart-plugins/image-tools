const { React } = require('powercord/webpack');

module.exports = class ImageFooter extends React.PureComponent {
  render () {
    return (
      <>
        {this.props.children}
      </>
    );
  }
};
