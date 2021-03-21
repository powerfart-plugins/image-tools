module.exports = function (oldUrl) {
  const url = new URL(oldUrl);
  const maxName = 20;
  const maxLettersOneSide = 8;

  url.pathname = url.pathname
    .split('/')
    .slice(-1)
    .map((e) => {
      const ex = e.substr(e.lastIndexOf('.') + 1, e.length);
      let name = e.substr(0, e.lastIndexOf('.'));
      const nl = name.length;

      if (nl > maxName) {
        name = `${name.substr(0, maxLettersOneSide)}...${name.substr(nl - maxLettersOneSide, nl)}`;
      }
      return `.../${name}.${ex}`;
    })
    .join('/');

  return url.href;
};
