module.exports = function (num, borders) {
  const [ min, max ] = borders;

  if (num < min) {
    num = min;
  }
  if (num > max) {
    num = max;
  }
  return Number(num);
};
