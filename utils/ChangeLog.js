const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { findInReactTree } = require('powercord/util');
const { open: openModal } = require('powercord/modal');

const ChangelogStandardTemplate = getModuleByDisplayName('ChangelogStandardTemplate', false);
const { parse: toMarkdown } = getModule([ 'parse', 'parseTopic' ], false);

/**
 * @typedef ChangelogConfig
 * @type {Object} args.
 * @property {String} args.date - format: YYYY-MM-DD.
 * @property {String} [args.image] - link to image (1920x1080, (16:9)).
 * @property {String} [args.locale = 'en-us'] - text's locale.
 * @property {Number} [args.revision = 1] - idk what this.
 * @property {ChangelogConfigBodyItem} args.body - body.
 * @property {String} [args.footer] - modal footer.
 */

/**
 * @typedef ChangelogConfigBodyItem
 * @type {Object} args
 * @property {String} args.type - types: added, fixed, improved, and progress.
 * @property {String} args.header - category name.
 * @property {Array<String|Array>} args.content - If the String is text if an Array is a list, support sub lists
 */

/* eslint-disable no-use-before-define, no-undefined */
module.exports = class ChangelogManager { // @todo support i18n for Changelog
  constructor (args) {
    this.args = args;
  }

  get needChangeLog () {
    const { currentVer, lastCheckedVer } = this.args;
    const res = currentVer.localeCompare(lastCheckedVer, undefined, {
      numeric: true,
      sensitivity: 'base'
    });
    return (res === 1);
  }

  async init () {
    if (this.needChangeLog) {
      openModal(() => React.createElement(Changelog, {
        changeLog: this.parseChangeLog(this.args.config),
        onClose: () => this.args.updateLastCheckedVer(this.args.currentVer),
        onScroll: () => null
      }));
    }
  }

  /**
   * @param {ChangelogConfig} json
   * @return {Object} acceptable data for ChangelogStandardTemplate
   */
  parseChangeLog (json) {
    const defaultParams = {
      locale: 'en-us',
      revision: 1
    };
    const parseContent = (content, depp = 0) => {
      if (Array.isArray(content)) {
        const prefix = `${('  ').repeat(depp)} * `;
        return content
          .map((e) => `${(Array.isArray(e)) ? '' : prefix}${parseContent(e, depp + 1)}`)
          .join('');
      }
      return `${content}\n\n`;
    };

    return {
      ...defaultParams,
      ...json,

      body: json.body.reduce((acc, item) => {
        acc += `${item.header.toUpperCase()} {${item.type}}\n======================\n\n`;
        item.content.forEach((e) => {
          acc += parseContent(e);
        });
        return acc;
      }, '')
    };
  }
};

class Changelog extends ChangelogStandardTemplate {
  constructor (props) {
    super(props);
    this.superRenderHeader = this.renderHeader;
    this.renderHeader = this.customRenderHeader.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
  }

  customRenderHeader () {
    const res = this.superRenderHeader();
    const header = findInReactTree(res, ({ type }) => type?.displayName === 'Header');
    header.props.children = `Image Tools - ${header.props.children}`;
    return res;
  }

  renderFooter () {
    const footer = super.renderFooter();
    footer.props.children = React.createElement('span', {
      style: { color: 'var(--text-normal)' },
      children: toMarkdown(this.props.changeLog.footer)
    });
    return footer;
  }

  componentWillUnmount () {
    this.props.onClose();
  }
}
