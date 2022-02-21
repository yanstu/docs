(() => {
  // 移动端禁止拖拽
  $("html,body").css("overflow", "hidden").css("height", "100%");
  document.body.addEventListener(
    "touchmove",
    self.welcomeShowedListener,
    false
  );
  // 禁止页面拖拽
  document.ondrop = function () {
    return false;
  };
  document.ondragstart = function () {
    return false;
  };
  document.ondragenter = function () {
    return false;
  };
  document.ondragover = function () {
    return false;
  };
  const keyCodeMap = {
    // 91: true, // command
    61: true,
    107: true, // 数字键盘 +
    109: true, // 数字键盘 -
    173: true, // 火狐 - 号
    187: true, // +
    189: true, // -
  };
  // 覆盖ctrl||command + ‘+’/‘-’
  document.onkeydown = function (event) {
    const e = event || window.event;
    const ctrlKey = e.ctrlKey || e.metaKey;
    if (ctrlKey && keyCodeMap[e.keyCode]) {
      e.preventDefault();
    } else if (e.detail) {
      // Firefox
      event.returnValue = false;
    }
  };
  // 覆盖鼠标滑动
  document.body.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) {
        if (e.deltaY < 0) {
          e.preventDefault();
          return false;
        }
        if (e.deltaY > 0) {
          e.preventDefault();
          return false;
        }
      }
    },
    { passive: false }
  );
  // 阻止默认的处理方式 即 下拉滑动效果
  document.body.addEventListener(
    "touchmove",
    function (e) {
      e.preventDefault();
    },
    {
      passive: false,
    }
  );
  // 允许其他节点触发长按事件
  document.documentElement.addEventListener(
    "touchmove",
    function (e) {
      e.returnValue = true;
    },
    false
  );
})();
