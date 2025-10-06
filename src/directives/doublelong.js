import move from "./move.js";
var doublelong = {};
var emit = move.emit;
doublelong.mounted = function(el, binding, vnode) {
  if (vnode._isInitDoubleLong) {
    return;
  }
  vnode._isInitDoubleLong = true;
  move.mounted(el, binding, vnode);
  move.listenEvents(
    el,
    ["single", "double", "long", "doublelong"],
    binding.value
  );
  var { cancel = false } = binding.modifiers;
  var handle = false;
  var isLong, isDouble;

  function _cancel() {
    el.removeEventListener("cancel", _cancel);
    el.removeEventListener("move", clear);
    el.removeEventListener("end", end);
    isLong = false;
  }

  function timeout() {
    return setTimeout(() => {
      handle = false;
      emit(vnode, isLong ? (isDouble ? "doublelong" : "long") : "single", {
        el,
        binding,
        vnode
      });
      isDouble = false;
      cancel && emit(vnode, "cancel");
    }, 500);
  }

  function start() {
    el.addEventListener("cancel", _cancel);
    el.addEventListener("move", clear);
    el.addEventListener("end", end);
    if (handle && isLong) {
      // fingers
      return clear();
    }
    isDouble = !!handle;
    isLong = true;
    handle = handle || timeout();
  }

  function clear() {
    if (handle) {
      clearTimeout(handle);
      handle = false;
    }
  }

  function end() {
    if (handle && isDouble) {
      clearTimeout(handle);
      handle = false;
      emit(vnode, "double", {
        el,
        binding,
        vnode
      });
    }
  }
  el.addEventListener("start", start);
};
doublelong.bind = doublelong.mounted;
doublelong.install = function(Vue) {
  Vue.directive("doublelong", doublelong);
};
export default doublelong;
