const { getModule } = require('powercord/webpack');
const { inject } = require('powercord/injector');

/**
 * @param {String|Object} funcPath (ex ModuleName.default)
 * @param {function} patch
 */
module.exports = function inject2 (funcPath, patch) {
  const path = funcPath.split('.');
  const moduleName = path.shift();
  const method = path.pop();
  const injectId = `image-tools${moduleName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
  const module = getModule((m) => m?.default?.displayName === moduleName, false);
  const injectTo = getModulePath(); // eslint-disable-line no-use-before-define

  if (module === null) {
    const id = 'image-tools';
    const { plugins } = powercord.pluginManager;
    const out = (plugins.has(id)) ? plugins.get(id) : global.console;

    out.error(`Module ${moduleName} not found`);
    return;
  }

  inject(injectId, injectTo, method, patch);
  module.default.displayName = moduleName;
  return injectId;

  function getModulePath () {
    let obj = module;
    if (path.length) {
      for (let i = 0, n = path.length; i < n; ++i) {
        const k = path[i];
        if (k in obj) {
          obj = obj[k];
        } else {
          throw new Error(`Not found ${[ ...path, method ].join('.')} in ${moduleName}`);
        }
      }
    }
    return obj;
  }
};
