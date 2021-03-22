const { readdirSync } = require('fs');

readdirSync(__dirname)
  .filter((file) => file !== 'index.js')
  .forEach((filename) => {
    const [ moduleName ] = filename.split('.');
    module.exports[moduleName] = require(`${__dirname}/${filename}`);
  });
