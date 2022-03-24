class RtcClient {
  constructor(options) {
    this.sdkAppId_ = options.sdkAppId;
    this.userId_ = options.userId;
    this.userSig_ = options.userSig;
    this.roomId_ = options.roomId;
    this.nickName_ = options.nickName;

    this.isJoined_ = false;
    this.isPublished_ = false;
    this.localStream_ = null;
    this.remoteStreams_ = [];
    this.members_ = new Map();

    // 为RTC创建客户端
    this.client_ = TRTC.createClient({
      mode: "rtc",
      sdkAppId: this.sdkAppId_,
      userId: this.userId_,
      userSig: this.userSig_,
    });

    // 客户端监听服务
    this.handleEvents();
  }

  /**
   * 加入房间
   */
  async join() {
    if (this.isJoined_) {
      console.warn("已经有人登录这个账号进入房间了");
      return;
    }
    try {
      // 加入房间
      await this.client_.join({
        roomId: parseInt(this.roomId_),
      });
      this.isJoined_ = true;

      // 创建本地流 audio/video 到 microphone/camera
      if (getCameraId() && getMicrophoneId()) {
        this.localStream_ = TRTC.createStream({
          audio: true,
          video: true,
          userId: this.userId_,
          cameraId: getCameraId(),
          microphoneId: getMicrophoneId(),
          mirror: false, // 是否开启镜像
        });
      } else {
        // 不指定 麦克风Id/摄像头Id，以避免过限制错误
        this.localStream_ = TRTC.createStream({
          audio: true,
          video: true,
          userId: this.userId_,
          mirror: false, // 是否开启镜像
        });
      }
      try {
        await this.localStream_.initialize();

        // 关闭加载中
        layer.close(loadIndex);

        this.localStream_.on("player-state-changed", (event) => {
          console.log(`本地流 ${event.type} 用户状态为 ${event.state}`);
        });
      } catch (error) {
        console.error("无法初始化共享流 - " + error);
        let msg = "";
        switch (error.name) {
          case "NotReadableError":
            msg =
              "暂时无法访问摄像头/麦克风，请确保系统允许当前浏览器访问摄像头/麦克风，并且没有其他应用占用摄像头/麦克风。";
            break;
          case "NotAllowedError":
            if (error.message === "Permission denied by system") {
              msg = "请确保系统允许当前浏览器访问摄像头/麦克风。";
            } else {
              msg = "请允许当前网页访问摄像头/麦克风，否则将无法正常使用。";
            }
            break;
          case "NotFoundError":
            msg =
              "浏览器获取不到摄像头/麦克风设备，请检查设备连接并且确保系统允许当前浏览器访问摄像头/麦克风。";
            break;
          default:
            return;
        }
        msg &&
          layer.confirm(
            msg + "\n【请退出重新进入并允许授权】",
            {
              btn: ["确定"],
            },
            () => {
              leave();
            }
          );
      }

      try {
        // 推送本地流
        await this.publish();
        this.localStream_.play("main-video");
      } catch (error) {
        console.error("推送本地流失败 - ", error);
      }

      let uid = this.localStream_.getUserId();
      $("#main-video").append(
        `<div class="absolute bottom-0 left-0 pl-1 pr-1 w-auto h-7 z-10 flex justify-items-center items-center text-center">
          <!--背景遮罩-->
          <div class="absolute top-0 left-0 w-full rounded-tr-lg h-full bg-[#000000] opacity-10"></div>
          <!--声音显示-->
          <div id="${uid + "_mic"}">
              <div class="flex items-center justify-content-center relative h-4">
                <img class="member-audio-btn h-full" src="./img/mic-on.png" style="filter:invert(0%)">
                <div class="volume-level absolute bottom-0 left-0 w-full" style="height: 0%; overflow: hidden; transition: height .1s ease;">
                    <img class="absolute bottom-0" src="./img/mic-green.png">
                </div>
              </div>
          </div>
          <!--网络质量显示-->
          <div class="flex items-center justify-content-center relative h-4">
            <img id="mynetwork" class="h-5" style="margin-left: 2px;" src="./img/network/network_3.png">
          </div>
          <!--昵称显示-->
          <span class="ml-1 mr-1 nicknamespan" style="color: #ffffff">
          ${this.nickName_}
          </span>
        </div>`
      );

      $("#mask_main").appendTo($("#player_" + this.localStream_.getId()));

      $("#member-me .member-id").attr("style", "color: #008000;");

      sortView();

      // 开始获取音量
      this.startGetAudioLevel();
      // 开始获取网络质量
      this.startGetNetworkevel();
    } catch (error) {
      console.error("加入房间失败! " + error);
    }
    //更新成员状态
    let states = this.client_.getRemoteMutedState();
    for (let state of states) {
      if (state.audioMuted) {
        $("#" + state.userId)
          .find(".member-audio-btn")
          .attr("src", "./img/mic-off.png");
      }
      if (state.videoMuted) {
        $("#" + state.userId)
          .find(".member-video-btn")
          .attr("src", "./img/camera-off.png");
        $("#mask_" + this.members_.get(state.userId).getId()).show();
      }
    }
  }

  /**
   * 离开房间
   */
  async leave() {
    if (!this.isJoined_) {
      return;
    }
    // 确保本地流在离开之前未发布。
    await this.unpublish();
    // 离开房间
    await this.client_.leave();
    this.localStream_.stop();
    this.localStream_.close();
    this.localStream_ = null;
    this.isJoined_ = false;
    // 停止获取音量
    this.stopGetAudioLevel();
  }

  /**
   * 推送
   */
  async publish() {
    if (!this.isJoined_) {
      console.warn("推送publish()请先加入房间join()");
      return;
    }
    if (this.isPublished_) {
      console.warn("duplicate RtcClient.publish() 观察到");
      return;
    }
    try {
      await this.client_.publish(this.localStream_);
    } catch (error) {
      console.error("推送本地流失败" + error);
      this.isPublished_ = false;
    }

    this.isPublished_ = true;
  }

  /**
   * 取消推送
   */
  async unpublish() {
    if (!this.isJoined_) {
      console.warn("取消推送unpublish()请先加入房间join()");
      return;
    }
    if (!this.isPublished_) {
      console.warn("RtcClient.unpublish() 已经调用但未推送");
      return;
    }

    await this.client_.unpublish(this.localStream_);
    this.isPublished_ = false;
  }

  /**
   * Mute the local audio
   */
  muteLocalAudio() {
    this.localStream_.muteAudio();
  }

  /**
   * Unmute the local audio
   */
  unmuteLocalAudio() {
    this.localStream_.unmuteAudio();
  }

  /**
   * Mute the local video
   */
  muteLocalVideo() {
    this.localStream_.muteVideo();
  }

  /**
   * *Unmutes the local video.*
   */
  unmuteLocalVideo() {
    this.localStream_.unmuteVideo();
  }

  /**
   * Resumes the local and remote streams
   */
  resumeStreams() {
    this.localStream_.resume();
    for (let stream of this.remoteStreams_) {
      stream.resume();
    }
  }

  /**
   * 切换摄像头
   */
  changeCameraId() {
    this.localStream_.switchDevice("video", cameraId).then(() => {
      console.log("切换摄像头成功");
    });
  }

  /**
   * 切换麦克风
   */
  changeMicId() {
    this.localStream_.switchDevice("audio", micId).then(() => {
      console.log("切换麦克风成功");
    });
  }

  /**
   * 客户端监听服务
   */
  handleEvents() {
    this.client_.on("error", (err) => {
      console.error(err);
      alert(err);
    });
    this.client_.on("client-banned", (err) => {
      console.error("客户端已禁止使用 " + err);
      if (!isHidden()) {
        alert("您已被踢出房间，可能是被挤下线了");
        leave();
      } else {
        document.addEventListener(
          "visibilitychange",
          () => {
            if (!isHidden()) {
              alert("您已被踢出房间，可能是被挤下线了");
              leave();
            }
          },
          false
        );
      }
    });

    // 当用户加入房间时触发
    this.client_.on("peer-join", (evt) => {
      const { userId } = evt;
      console.log(getUserInfo(userId)?.UserName + " 加入了房间");
    });

    // 当远程连接端离开房间时触发
    this.client_.on("peer-leave", (evt) => {
      const { userId } = evt;
      onlineOrOfline(false, userId);
      console.log(getUserInfo(userId)?.UserName + " 离开了房间，或者掉线");
    });

    // 添加远程流时触发
    this.client_.on("stream-added", (evt) => {
      const remoteStream = evt.stream;
      const userId = remoteStream.getUserId();
      this.members_.set(userId, remoteStream);
      console.log(`${getUserInfo(userId)?.UserName} 添加远程流`);
      this.client_.subscribe(remoteStream);
    });

    // 在订阅远程流时触发
    this.client_.on("stream-subscribed", (evt) => {
      const remoteStream = evt.stream;
      const uid = remoteStream.getUserId();

      this.remoteStreams_.push(remoteStream);

      onlineOrOfline(true, uid);

      remoteStream.play("box_" + uid);

      $("#mask_" + uid).hide();
      if (!remoteStream.hasVideo()) $("#mask_" + uid).show();

      remoteStream.on("player-state-changed", (event) => {
        console.log(
          `${getUserInfo(uid).UserName} 的 ${
            event.type == "audio" ? "麦克风" : "摄像头"
          } 状态改变为 ${event.state == "PAUSED" ? "停止" : "播放"}`
        );

        // 如果能监听到有人恢复播放的通知，所以网络连接已恢复
        if (event.state == "PLAYING") isDisconnect = false;

        videoHandle(event.state == "PLAYING", uid);

        try {
          event.state === "PAUSED" && resumeStreams();
        } catch (error) {}
      });
    });

    // 当远程流被删除时触发，例如：远程用户调用 Client.unpublish()
    /* This code is listening for a stream-removed event. When a stream is removed, it stops the stream
    and removes the stream from the list of remote streams. */
    this.client_.on("stream-removed", (evt) => {
      const remoteStream = evt.stream;
      const uid = remoteStream.getUserId();
      const id = remoteStream.getId();
      remoteStream.stop();
      this.members_.delete(uid);

      onlineOrOfline(false, uid);

      this.remoteStreams_ = this.remoteStreams_.filter((stream) => {
        return stream.getId() !== id;
      });
    });

    /* The above code is listening for a stream-updated event. When a stream-updated event is received,
    the code checks to see if the stream has video. If the stream does not have video, the code sets
    the src attribute of the video button to "img/camera-off.png". */
    this.client_.on("stream-updated", (evt) => {
      const remoteStream = evt.stream;
      let uid = this.getUidByStreamId(remoteStream.getId());
      if (!remoteStream.hasVideo()) {
        $("#" + uid)
          .find(".member-video-btn")
          .attr("src", "img/camera-off.png");
      }
    });

    /* This code is listening for a mute-audio event from the client. When it receives the event, it
    calls the audioHandle function with the parameters false and the userId. */
    this.client_.on("mute-audio", ({ userId }) => {
      audioHandle(false, userId);
    });

    /* This code is listening for the "unmute-audio" event and then calling the audioHandle function. */
    this.client_.on("unmute-audio", ({ userId }) => {
      audioHandle(true, userId);
    });

    /**
     * * If the user is not in the room, return.
     * * If the user is in the room, change the audio icon to the appropriate one
     * @param on - Whether the user has turned on or off the microphone.
     * @param userId - The user ID of the user who sent the message.
     */
    function audioHandle(on, userId) {
      console.log(
        `${getUserInfo(userId)?.UserName} ${on ? "打开" : "关闭"}了麦克风`
      );
      $("#member_" + userId)
        .find(".member-audio-btn")
        .attr("src", `img/mic-${on ? "on" : "off"}.png`);
      $(`#${userId + "_mic"} .member-audio-btn`).attr(
        "src",
        `img/mic-${on ? "on" : "off"}.png`
      );
    }

    /* The above code is listening for a mute-video event from the client. When the event is received,
    it calls the videoHandle function with the userId of the user who sent the event. */
    this.client_.on("mute-video", ({ userId }) => {
      videoHandle(false, userId);
    });

    /* Adding an event listener to the client that listens for the "unmute-video" event. When the event
    is triggered, it calls the function videoHandle with the arguments true and userId. */
    this.client_.on("unmute-video", ({ userId }) => {
      videoHandle(true, userId);
    });

    /**
     * * When the user clicks the video button, the function will change the image of the button and
     * hide/show the video mask
     * @param on - Whether the camera is on or off.
     * @param userId - The user ID of the user who sent the message.
     */
    function videoHandle(on, userId) {
      console.log(
        `${getUserInfo(userId)?.UserName} ${on ? "打开" : "关闭"}了摄像头`
      );
      $("#member_" + userId)
        .find(".member-video-btn")
        .attr("src", `img/camera-${on ? "on" : "off"}.png`);
      !on && $(`#mask_${userId} img`).attr("src", `./img/camera-green.png`);
      on ? $("#mask_" + userId).hide() : $("#mask_" + userId).show();
      $(`#box_${userId} .nicknamespan`).css(
        "color",
        `${on ? "#ffffff" : "#000000"}`
      );
      $(`#${userId}_mic img.member-audio-btn`).attr(
        "style",
        `filter:invert(${on ? "0" : "100"}%);`
      );
    }
  }

  getUidByStreamId(streamId) {
    for (let [uid, stream] of this.members_) {
      if (stream.getId() == streamId) {
        return uid;
      }
    }
  }

  /**
   * 监听音量回调事件，更新每个用户的音量图标
   */
  startGetAudioLevel() {
    this.client_.on("audio-volume", ({ result }) => {
      result.forEach(({ userId, audioVolume, stream }) => {
        if (audioVolume >= 10) {
          $(`#${userId + "_mic"}`)
            .find(".volume-level")
            .css("height", `${audioVolume * 4}%`);
        } else {
          $(`#${userId + "_mic"}`)
            .find(".volume-level")
            .css("height", `0%`);
        }
      });
    });
    this.client_.enableAudioVolumeEvaluation(100);
  }

  /**
   * 监听自己的网络质量级别，并改变视频画质
   */
  startGetNetworkevel() {
    this.client_.on("network-quality", (event) => {
      //console.log(`network-quality, uplinkNetworkQuality:${event.uplinkNetworkQuality}, downlinkNetworkQuality: ${event.downlinkNetworkQuality}`);
      //'0': '未知', '1': '极佳', '2': '较好', '3': '一般', '4': '差', '5': '极差', '6': '断开'

      $(`#mynetwork`).attr(
        "src",
        `./img/network/network_${
          event.uplinkNetworkQuality == 6 || isDisconnect
            ? 6
            : event.uplinkNetworkQuality
        }.png`
      );

      // isDisconnect = event.uplinkNetworkQuality == 6;

      var renshu = [8, 5, 2, 0];
      var fenbianlv = ["240p", "360p", "480p", "720p"];
      for (const i in renshu) {
        if (this.members_.size >= renshu[i]) {
          this.localStream_.setVideoProfile(fenbianlv[i]);
          break;
        }
      }

      /*if (event.uplinkNetworkQuality == 6) {
        layer.msg("当前网络已断开", { icon: 5 });
      }
      if (event.uplinkNetworkQuality == 4 || event.uplinkNetworkQuality == 5) {
        layer.msg("当前网络极差差或断开", { icon: 5 });
      }*/
    });

    setInterval(() => {
      // 获取实际采集的分辨率和帧率
      const videoTrack = this.localStream_.getVideoTrack();
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log(
          `分辨率：${settings.width} * ${settings.height}, 帧率：${settings.frameRate}`
        );
      }
      // 获取实际推流的视频码率参考：https://web.sdk.qcloud.com/trtc/webrtc/doc/zh-cn/Client.html#getLocalVideoStats
    }, 30 * 1000);
  }

  // 停止获取流音量
  stopGetAudioLevel() {
    this.client_.enableAudioVolumeEvaluation(-1);
  }
}
