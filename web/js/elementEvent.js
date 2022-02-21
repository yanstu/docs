(() => {
  // 监听浏览器窗口大小，切换布局
  window.onresize = sortView;

  // 用户列表点击事件
  $("#userListHander").on("click", (event) => {
    $("#userList").fadeToggle();
  });

  // 设置按钮事件
  var longClick = 0,
    timeOutEvent;
  $("#setting").on("click", (e) => {
    startDeviceConnect();
  });
  $("#setting").on("touchstart", (e) => {
    longClick = 0;
    timeOutEvent = setTimeout(function () {
      if (vConsole?.isInited) {
        vConsole.destroy();
      } else {
        vConsole = new VConsole();
      }
      longClick = 1;
    }, 1 * 1000);
  });
  $("#setting").on("touchmove", (e) => {
    clearTimeout(timeOutEvent);
    timeOutEvent = 0;
    e.preventDefault();
  });
  $("#setting").on("touchend", (e) => {
    clearTimeout(timeOutEvent);
    timeOutEvent && longClick == 0 && startDeviceConnect();
    return false;
  });

  // 退出按钮事件
  $("#exit-btn").on({
    click: function () {
      layer.confirm(
        "确定退出视频连线？",
        {
          btn: ["确定", "取消"],
        },
        () => {
          leave();
        }
      );
    },
  });

  // 翻转相机点击事件
  $("#camera-fz").on(
    "click",
    debounce(() => {
      if (isDisconnect) {
        layer.msg("当前网络已断开", { icon: 5 });
        return;
      }
      if (!isCamOn) {
        layer.msg("请先打开摄像头再切换");
        return;
      }
      $("#camera-fz i").toggleClass("animate-[spin_1s_linear_1]");
      setTimeout(() => {
        $("#camera-fz i").toggleClass("animate-[spin_1s_linear_1]");
      }, 1000);
      for (let data of cameraData) {
        if (cameraId != data) {
          cameraId = data;
          rtc.changeCameraId();
          return;
        }
      }
      layer.msg("设备没有其他的摄像头");
    }, 1200)
  );

  //打开或关闭摄像机
  $("#video-btn").on(
    "click",
    debounce(() => {
      if (isDisconnect) {
        layer.msg("当前网络已断开", { icon: 5 });
        return;
      }
      if (isCamOn) {
        $("#video-btn svg").toggleClass("text-white");
        $("#video-btn,#video-btn svg").addClass("text-red");
        $("#member-me")
          .find(".member-video-btn")
          .attr("src", "img/camera-off.png");
        isCamOn = false;
        muteVideo();
        $(`#mask_main img`).attr("src", `./img/camera-green.png`);
      } else {
        $("#video-btn svg").toggleClass("text-white");
        $("#video-btn,#video-btn svg").removeClass("text-red");
        $("#member-me")
          .find(".member-video-btn")
          .attr("src", "img/camera-on.png");
        isCamOn = true;
        unmuteVideo();
      }
      $("#main-video .nicknamespan").css(
        "color",
        `${isCamOn ? "#ffffff" : "#000000"}`
      );
      $(`#main-video img.member-audio-btn`).attr(
        "style",
        `filter:invert(${isCamOn ? "0" : "100"}%);`
      );
      $("#mask_main").toggle();
    })
  );

  //打开或关闭麦克风
  $("#mic-btn").on(
    "click",
    debounce(() => {
      if (isDisconnect) {
        layer.msg("当前网络已断开", { icon: 5 });
        return;
      }
      if (isMicOn) {
        $("#mic-btn svg").toggleClass("text-white");
        $("#mic-btn, #mic-btn svg").addClass("text-red");
        $("#member-me")
          .find(".member-audio-btn")
          .attr("src", "img/mic-off.png");
        $(`#${oneself_.CHID + "_mic"} .member-audio-btn`).attr(
          "src",
          "img/mic-off.png"
        );
        isMicOn = false;
        muteAudio();
      } else {
        $("#mic-btn svg").toggleClass("text-white");
        $("#mic-btn, #mic-btn svg").removeClass("text-red");
        $("#member-me").find(".member-audio-btn").attr("src", "img/mic-on.png");
        $(`#${oneself_.CHID + "_mic"} .member-audio-btn`).attr(
          "src",
          "img/mic-on.png"
        );
        isMicOn = true;
        unmuteAudio();
      }
    })
  );
  //logout
  $("#logout-btn").on("click", () => {
    leave();
    $("#room-root").hide();
    $("#login-root").show();
  });
  //chrome60以下不支持popover，防止error
  if (getBrowser().browser == "Chrome" && getBrowser().version < "60") return;
  if (getBrowser().browser === "Firefox" && getBrowser().version < "56") return;
  if (getBrowser().browser === "Edge" && getBrowser().version < "80") return;
  //开启popover
  $(function () {
    $('[data-toggle="popover"]').popover();
  });
  $("#camera").popover({
    html: true,
    content: () => {
      return $("#camera-option").html();
    },
  });
  $("#microphone").popover({
    html: true,
    content: () => {
      return $("#mic-option").html();
    },
  });

  $("#camera").on("click", () => {
    $("#microphone").popover("hide");
    $(".popover-body").find("div").attr("onclick", "setCameraId(this)");
  });

  $("#microphone").on("click", () => {
    $("#camera").popover("hide");
    $(".popover-body").find("div").attr("onclick", "setMicId(this)");
  });

  //点击body关闭popover
  $("body").click(() => {
    $("#camera").popover("hide");
    $("#microphone").popover("hide");
  });

  //popover事件
  $("#camera").on("show.bs.popover", () => {
    $("#camera").attr("src", "./img/camera-popover.png");
  });

  $("#camera").on("hide.bs.popover", () => {
    $("#camera").attr("src", "./img/camera.png");
  });

  $("#microphone").on("show.bs.popover", () => {
    $("#microphone").attr("src", "./img/mic-popover.png");
  });

  $("#microphone").on("hide.bs.popover", () => {
    $("#microphone").attr("src", "./img/mic.png");
  });
})();
