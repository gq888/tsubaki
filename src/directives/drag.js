import move from "./move.js";
import doublelong from "./doublelong.js";
var drag = {};
var emit = move.emit;
var dragHandle = ({ detail: { el, vnode } }) => {
  vnode._moveData.offsetLeft = el.offsetLeft;
  vnode._moveData.offsetWidth = el.offsetWidth || 0;
  vnode._moveData.offsetTop = el.offsetTop;
  vnode._moveData.offsetHeight = el.offsetHeight || 0;
};
var dragMoveXHandle = ({ detail: { el, binding, vnode } }) => {
  var {
    left,
    right,
    width = vnode._moveData.offsetWidth,
  } = binding.value || {};
  let l = vnode._moveData.offsetLeft + vnode._moveData.offsetX;
  if (l <= left) {
    l = left;
    emit(vnode, "dragtoleft", undefined, true);
  } else if (l >= right - width) {
    l = right - width;
    emit(vnode, "dragtoright", undefined, true);
  }
  el.style.left = l + "px";
};
var dragMoveYHandle = ({ detail: { el, binding, vnode } }) => {
  var {
    top,
    bottom,
    height = vnode._moveData.offsetHeight,
  } = binding.value || {};
  let t = vnode._moveData.offsetTop + vnode._moveData.offsetY;
  if (t <= top) {
    t = top;
    emit(vnode, "dragtotop", undefined, true);
  } else if (t >= bottom - height) {
    t = bottom - height;
    emit(vnode, "dragtobottom", undefined, true);
  }
  el.style.top = t + "px";
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
