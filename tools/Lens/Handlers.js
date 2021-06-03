const fixConfines = require('../../utils/fixConfines');

module.exports = class LensHandlers {
  static onMouseButton (e) {
    const res = {};

    if (e.button !== 2) {
      res.show = (e.type === 'mousedown');
    }
    return res;
  }

  static onMouseMove (e) {
    return {
      positionX: e.clientX,
      positionY: e.clientY
    };
  }

  static onWheel (e, current, borders) {
    const change = (target) => {
      const [ min ] = borders[target];
      const step = (target === 'wheelStep') ? min : (current.wheelStep * min);
      const plus = (e.deltaY < 0) ? step : (step * -1);

      return {
        [target]: fixConfines((current[target] + plus), borders[target])
      };
    };

    if (e.ctrlKey) {
      return change('radius');
    } else if (e.shiftKey) {
      return change('wheelStep');
    }
    return change('zooming');
  }
};
