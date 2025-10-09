var move = {};
var getPosition = function (e, isTouch) {
  if (isTouch) {
    e = e.touches[0];
  }
  return [e.clientX, e.clientY];
};
var updateMoveData = function (vnode, e, isTouch) {
  const data = vnode._moveData;
  data.position = getPosition(e, isTouch);
  data.offsetX = data.position[0] - data.startPosition[0];
  data.offsetY = data.position[1] - data.startPosition[1];
};
var prevent = function (e, bubbles) {
  e.cancelable && e.preventDefault();
  !bubbles && e.stopPropagation();
  return false;
};
var emit = (vnode, name, detail, bubbles, cancelable) => {
  let el = vnode.el || vnode.elm;
  el.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles,
      cancelable,
    }),
  );
};
move.emit = emit;
var listenEvents = (el, events, handles = {}) => {
  for (const name of events) {
    typeof handles[name] === "function" &&
      el.addEventListener(name, handles[name]);
  }
};
move.listenEvents = listenEvents;
move.mounted = function (el, binding, vnode) {
  if (vnode._isInitMove) {
    return;
  }
  vnode._isInitMove = true;
  var { page = window } = binding.value || {};
  var { bubbles } = binding.modifiers;
  listenEvents(el, ["start", "move", "end"], binding.value);
  var isMove = false;
  var isTouch;

  function cancel() {
    isMove = false;
    el.removeEventListener("cancel", cancel);
    if (isTouch) {
      page.removeEventListener("touchend", _end);
      page.removeEventListener("touchmove", _move);
      page.removeEventListener("touchcancel", _end);
    } else {
      page.removeEventListener("mouseup", _end);
      page.removeEventListener("mousemove", _move);
    }
  }

  function _start(e) {
    isTouch = e.type === "touchstart";
    el.addEventListener("cancel", cancel);
    if (isTouch) {
      page.addEventListener("touchend", _end, { passive: false });
      page.addEventListener("touchmove", _move, { passive: false });
      page.addEventListener("touchcancel", _end, { passive: false });
    } else {
      page.addEventListener("mouseup", _end, { passive: false });
      page.addEventListener("mousemove", _move, { passive: false });
    }
    if (!vnode._moveData) {
      vnode._moveData = { isTouch };
    }
    vnode._moveData.startPosition = getPosition(e, isTouch);
    // updateMoveData(vnode, e, isTouch)
    emit(vnode, "start", {
      el,
      binding,
      vnode,
    });
    return prevent(e, bubbles);
  }

  function _move(e) {
    updateMoveData(vnode, e, isTouch);
    emit(vnode, "move", {
      el,
      binding,
      vnode,
    });
    isMove = true;
    return prevent(e, bubbles);
  }

  function _end(e) {
    if (!isMove) {
      const data = vnode._moveData;
      data.offsetX = 0;
      data.offsetY = 0;
      emit(vnode, "notmove");
    }
    emit(vnode, "end", {
      el,
      binding,
      vnode,
    });
    emit(vnode, "cancel");
    return prevent(e, bubbles);
  }
  el.addEventListener("touchstart", _start);
  el.addEventListener("mousedown", _start);
};
move.bind = move.mounted;
move.install = function (Vue) {
  Vue.directive("move", move);
};
export default move;
