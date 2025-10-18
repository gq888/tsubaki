import move from "./move.js";
import doublelong from "./doublelong.js";
var drag = {};
var emit = move.emit;
var dragHandle = ({ detail: { el, vnode } }) => {
  el._moveData.offsetLeft = el.offsetLeft;
  el._moveData.offsetWidth = el.offsetWidth || 0;
  el._moveData.offsetTop = el.offsetTop;
  el._moveData.offsetHeight = el.offsetHeight || 0;
};
var dragMoveXHandle = ({ detail: { el, binding, vnode } }) => {
  var {
    left,
    right,
    width = el._moveData.offsetWidth,
  } = binding.value || {};
  let l = el._moveData.offsetLeft + el._moveData.offsetX;
  if (l <= left) {
    l = left;
    emit(el, "dragtoleft", undefined, true);
  } else if (l >= right - width) {
    l = right - width;
    emit(el, "dragtoright", undefined, true);
  }
  el.style.left = l / 16 + "rem";
};
var dragMoveYHandle = ({ detail: { el, binding, vnode } }) => {
  var {
    top,
    bottom,
    height = el._moveData.offsetHeight,
  } = binding.value || {};
  let t = el._moveData.offsetTop + el._moveData.offsetY;
  if (t <= top) {
    t = top;
    emit(el, "dragtotop", undefined, true);
  } else if (t >= bottom - height) {
    t = bottom - height;
    emit(el, "dragtobottom", undefined, true);
  }
  el.style.top = t / 16 + "rem";
};
drag.mounted = function (el, binding, vnode) {
  move.mounted(el, binding, vnode);
  var { dragX, dragY, dragL, dragD } = binding.modifiers;
  if (!dragX && !dragY) {
    dragX = true;
    dragY = true;
  }
  if (dragL) {
    doublelong.mounted(el, binding, vnode);
  }
  const dragMode = dragL ? (dragD ? "doublelong" : "long") : "start";
  var cancel = function () {
    if (dragX) {
      el.removeEventListener("move", dragMoveXHandle);
    }
    if (dragY) {
      el.removeEventListener("move", dragMoveYHandle);
    }
    el.removeEventListener("cancel", cancel);
  };
  var _dragHandle = function () {
    if (dragX) {
      el.addEventListener("move", dragMoveXHandle);
    }
    if (dragY) {
      el.addEventListener("move", dragMoveYHandle);
    }
    el.addEventListener("cancel", cancel);
  };
  el.addEventListener(dragMode, dragHandle);
  el.addEventListener(dragMode, _dragHandle);
};
drag.bind = drag.mounted;
drag.install = function (Vue) {
  Vue.directive("drag", drag);
};
export default drag;
