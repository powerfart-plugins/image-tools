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
// noinspection JSUnusedGlobalSymbols
module.exports = class ChangelogManager {
  /**
   * @param {Object} args
   * @param {ChangelogConfig} args.config
   * @param {String} args.currentVer type 1.2.3
   * @param {String} args.lastCheckedVer type 1.2.3
   * @param {Function} args.updateLastCheckedVer
   */
  constructor (args) {
    this.args = args;
  }

  /**
   * @return {boolean}
   */
  get needChangeLog () {
    const get = (s) => s.split(/\./g).slice(0, -1);
    const currVers = get(this.args.currentVer);
    const lastVers = get(this.args.lastCheckedVer);

    while (currVers.length || lastVers.length) {
      const a = Number(currVers.shift());
      const b = Number(lastVers.shift());

      if (a === b) {
        continue;
      }
      return (a > b || isNaN(b));
    }
    return false;
  }

  /**
   * @return Void
   */
  init () {
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
      revision: 1,
      version: this.args.currentVer
    };
    const parseContent = (content, depp = 0) => {
      if (Array.isArray(content)) {
        const prefix = `${('  ').repeat(depp)} * `;
        return content
          .map((e) => `${(Array.isArray(e)) ? '' : prefix}${parseContent(e, depp + 1)}`)
          .join('');
      }
      return `${content}\n`;
    };

    return {
      ...defaultParams,
      ...json,

      body: json.body.reduce((acc, item) => {
        acc += `${item.header.toUpperCase()} {${item.type}}\n======================\n\n`;
        item.content.forEach((e) => {
          acc += `${parseContent(e)}\n`;
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
    const Header = findInReactTree(res, ({ type }) => type?.displayName === 'Header');
    const Text = findInReactTree(res, ({ type }) => type?.displayName === 'Text');

    Header.props.children = `Image Tools - ${Header.props.children}`;
    Text.props.children = `${Text.props.children} - v${this.props.changeLog.version}`;
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
