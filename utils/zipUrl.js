module.exports = function (oldUrl) {
  const url = new URL(oldUrl);
  const maxDubs = 2;
  const maxName = 20;
  let dubsNum = 0;

  url.pathname = url.pathname
    .split('/')
    .map((e, i, arr) => {
      if (i === (arr.length - 1)) {
        const ex = e.substr(e.lastIndexOf('.') + 1, e.length);
        let name = e.substr(0, e.lastIndexOf('.'));

        if (name.length > maxName) {
          name = `${name.substr(0, 8)}...${name.substr(name.length - 8, name.length)}`;
        }
        return `${name}.${ex}`;
      }
      return '...';
    })
    .filter((e) => {
      if (e === '...') {
        if (dubsNum === maxDubs) {
          return;
        }
        dubsNum++;
      }
      return true;
    })
    .join('/');

  return url.href;
};
