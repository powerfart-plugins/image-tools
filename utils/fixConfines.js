module.exports = function (num, borders, plus = 0) {
  const [ min, max ] = borders;
  let val = num + plus;

  if (val < min) {
    val = min;
  }
  if (val > max) {
    val = max;
  }
  return val;
};
