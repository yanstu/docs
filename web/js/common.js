let isCamOn = true;
let isMicOn = true;
let rtc = null;
let cameraId = "";
let micId = "";
var cameraData = new Array();
var micData = new Array();
let oneself_ = null;
let roomDetail_ = null;
let userList_ = new Array();

/**
 * 解密获取房间信息
 * @param { string } JMStr 密钥
 */
function login(JMStr) {
  ajaxMethod("checkJRHYInfo", { JMStr }, (res) => {
    if (!res.Data) {
      alert("解密失败！");
      layer.confirm(
        "请检查链接是否正确",
        {
          btn: ["确定"],
        },
        () => {
          leave();
        }
      );
      throw SyntaxError();
    }
    oneself_ = res.Data;
    $("title").html(res.Data.Title);
    rtc = new RtcClient({
      nickName: res.Data.XM,
      userId: res.Data.CHID,
      sdkAppId: parseInt(res.Data.SDKAppID),
      userSig: res.Data.UserSig,
      roomId: res.Data.RoomId,
    });
    ajaxMethod("FindVideoConferenceById", { ID: res.Data.ID }, (result) => {
      if (!result) return;
      roomDetail_ = result.Data.VideoConference;
      userList_ = result.Data.VideoConferenceCHRY;
      if (userList_.length > 11) {
        // 删除超出的
        userList_ = userList_.slice(0, 12);
      }
      initViews();
      trtcPreliminaryDetection();
      rtc.join();
    });
  });
}

/**
 * 初始化用户列表
 */
function initViews() {
  for (const user of userList_) {
    if (user.ID == oneself_.CHID) {
      continue;
    }
    addVideoView(user.ID, user.UserName);
    addMaskView(user.ID);
  }
}

/**
 * 添加“摄像头未打开”遮罩
 */
function addMaskView(ID) {
  let mask = $("#mask_main").clone();
  mask.attr("id", "mask_" + ID);
  mask.appendTo($("#box_" + ID));
  mask.show();
}

/**
 * 添加视频占位
 * Add a video box to the video grid
 * @param uid - The user ID of the user you want to add.
 * @param nickname - the nickname of the user
 */
function addVideoView(uid, nickname) {
  let div = $("<div/>", {
    id: "box_" + uid,
    class: "video-box relative",
    style: "justify-content: center",
  });
  div.append(
    `<div class="absolute bottom-0 left-0 pl-1 pr-1 w-auto h-7 z-10 flex justify-items-center items-center text-center">
      <!--背景遮罩-->
      <div class="absolute top-0 left-0 w-full rounded-tr-lg h-full bg-[#000000] opacity-10"></div>
      <!--声音显示-->
      <div id="${uid + "_mic"}">
        <div class="flex items-center justify-content-center relative h-4">
        <img class="member-audio-btn h-full" src="./img/mic-on.png">
        <div class="volume-level absolute bottom-0 left-0 w-full" style="height: 0%; overflow: hidden; transition: height .1s ease;">
            <img class="absolute bottom-0" src="./img/mic-green.png">
        </div>
      </div>
      </div>
      <!--昵称显示-->
      <span class="ml-1 mr-1 nicknamespan" style="color: #000000">
      ${nickname}
      </span>
    </div>`
  );
  div.appendTo("#video-grid");
  sortView();
}

/**
 * 其他用户在线或者离线后页面的改变，不包括自己
 * @param {boolean} online 在线还是离线
 * @param {string} uid 用户id
 */
function onlineOrOfline(online, uid) {
  $("#member_" + uid)
    .find(".member-id")
    .attr("style", `color: ${online ? "#008000" : "#747373"};`);

  if (!online) {
    $(`#box_${uid} .nicknamespan`).css("color", "#000000");
    $(`#${uid}_mic img.member-audio-btn`).attr("style", `filter:invert(100%);`);
    $("#mask_" + uid).show();
    $("#member_" + uid)
      .find(".member-video-btn")
      .attr("src", "img/camera-off.png");
    $(`#${uid + "_mic"} .member-audio-btn`).attr("src", "img/mic-on.png");
    $("#member_" + uid)
      .find(".member-video-btn")
      .attr("src", "img/camera-on.png");
    $("#mask_" + uid).show();
    $(`#mask_${uid} img`).attr("src", "./img/camera-gray.png");
  }
}

/**
 * 查询用户信息
 * @param {string} ID 需要查询的用户id
 * @returns 用户对象
 */
function getUserInfo(ID) {
  return userList_.find((item) => item.ID == ID);
}

/**
 * 离开房间并关闭网页
 */
function leave() {
  rtc && rtc.leave();
  let hasPre = false;
  if (window.history.length > 1) hasPre = true;
  function closeWindow() {
    if (window.WeixinJSBridge) {
      window.WeixinJSBridge.call("closeWindow");
    } else {
      if (
        navigator.userAgent.indexOf("Firefox") != -1 ||
        navigator.userAgent.indexOf("Chrome") != -1
      ) {
        window.location.href = "about:blank";
        window.close();
      } else {
        try {
          window.opener = null;
          window.open("", "_self");
          window.close();
        } catch (error) {
          window.open(location, "_self").close();
        }
      }
    }
  }
  hasPre ? window.history.go(-1) : closeWindow();
}

/**
 * Mute the local audio stream
 */
function muteAudio() {
  rtc && rtc.muteLocalAudio();
}

/**
 * Unmute the local audio
 */
function unmuteAudio() {
  rtc && rtc.unmuteLocalAudio();
}

/**
 * Mute the local video
 */
function muteVideo() {
  rtc && rtc.muteLocalVideo();
}

/**
 * Unmute the local video
 */
function unmuteVideo() {
  rtc && rtc.unmuteLocalVideo();
}

/**
 * 移动端、PC端动态布局排序
 */
function sortView() {
  if (getOsType() === "desktop") {
    $("#camera-fz").hide();
    $(".nicknamespan").removeClass("text-[13px]");
    $(".device-testing-card").removeClass("w-[98%] pl-3 pr-3");
  } else {
    $("#camera-fz").show();
    $(".nicknamespan").addClass("text-[13px]");
    $(".device-testing-card").addClass("w-[98%] pl-3 pr-3");
  }

  let length = $(".video-box").length;
  if (length > 3) {
    if (length > 6) {
      if (length > 9) {
        $("#video-grid").attr(
          "class",
          ` w-full h-full grid grid-cols-${
            getOsType() === "desktop" ? (length > 10 ? "6" : "5") : "3"
          } grid-rows-${getOsType() !== "desktop" ? "4" : "2"}`
        );
      } else {
        $("#video-grid").attr(
          "class",
          ` w-full h-full grid grid-cols-${
            getOsType() === "desktop" ? (length > 8 ? "5" : "4") : "3"
          } grid-rows-${getOsType() !== "desktop" ? "3" : "2"}`
        );
      }
    } else {
      $("#video-grid").attr(
        "class",
        ` w-full h-full grid grid-cols-${
          getOsType() === "desktop" ? (length > 4 ? "3" : "2") : "3"
        } grid-rows-${getOsType() !== "desktop" ? "3" : "2"}`
      );
    }
  } else {
    $("#video-grid").attr(
      "class",
      ` w-full h-full grid grid-cols-${
        getOsType() === "desktop" ? length : 1
      } grid-rows-${getOsType() === "desktop" ? 1 : length > 1 ? 2 : 1} `
    );
  }
}

/**
 * * Set the cameraId variable to the value of the id attribute of the div element that was clicked
 * @param thisDiv - the div that was clicked on
 */
function setCameraId(thisDiv) {
  cameraId = $(thisDiv).attr("id");
  console.log("setCameraId: " + cameraId);
}

/**
 * * Set the micId variable to the id of the div that was clicked
 * @param thisDiv - The div that was clicked.
 */
function setMicId(thisDiv) {
  micId = $(thisDiv).attr("id");
  console.log("setMicId: " + micId);
}

/**
 * It returns the cameraId.
 * @returns The camera ID.
 */
function getCameraId() {
  console.log("选择摄像头: " + cameraId);
  return cameraId;
}

/**
 * It returns the id of the microphone that is currently selected.
 * @returns the value of the variable micId.
 */
function getMicrophoneId() {
  console.log("选择麦克风: " + micId);
  return micId;
}
