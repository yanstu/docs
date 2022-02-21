let isMobile = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry|BB10/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return (
      isMobile.Android() ||
      isMobile.BlackBerry() ||
      isMobile.iOS() ||
      isMobile.Opera() ||
      isMobile.Windows()
    );
  },
  getOsName: function () {
    var osName = "Unknown OS";
    if (isMobile.Android()) {
      osName = "Android";
    }
    if (isMobile.BlackBerry()) {
      osName = "BlackBerry";
    }
    if (isMobile.iOS()) {
      osName = "iOS";
    }
    if (isMobile.Opera()) {
      osName = "Opera Mini";
    }
    if (isMobile.Windows()) {
      osName = "Windows";
    }
    return {
      osName,
      type: "mobile",
    };
  },
};

function detectDesktopOS() {
  var unknown = "-";
  var nVer = navigator.appVersion;
  var nAgt = navigator.userAgent;
  var os = unknown;
  var clientStrings = [
    {
      s: "Chrome OS",
      r: /CrOS/,
    },
    {
      s: "Windows 10",
      r: /(Windows 10.0|Windows NT 10.0)/,
    },
    {
      s: "Windows 8.1",
      r: /(Windows 8.1|Windows NT 6.3)/,
    },
    {
      s: "Windows 8",
      r: /(Windows 8|Windows NT 6.2)/,
    },
    {
      s: "Windows 7",
      r: /(Windows 7|Windows NT 6.1)/,
    },
    {
      s: "Windows Vista",
      r: /Windows NT 6.0/,
    },
    {
      s: "Windows Server 2003",
      r: /Windows NT 5.2/,
    },
    {
      s: "Windows XP",
      r: /(Windows NT 5.1|Windows XP)/,
    },
    {
      s: "Windows 2000",
      r: /(Windows NT 5.0|Windows 2000)/,
    },
    {
      s: "Windows ME",
      r: /(Win 9x 4.90|Windows ME)/,
    },
    {
      s: "Windows 98",
      r: /(Windows 98|Win98)/,
    },
    {
      s: "Windows 95",
      r: /(Windows 95|Win95|Windows_95)/,
    },
    {
      s: "Windows NT 4.0",
      r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/,
    },
    {
      s: "Windows CE",
      r: /Windows CE/,
    },
    {
      s: "Windows 3.11",
      r: /Win16/,
    },
    {
      s: "Android",
      r: /Android/,
    },
    {
      s: "Open BSD",
      r: /OpenBSD/,
    },
    {
      s: "Sun OS",
      r: /SunOS/,
    },
    {
      s: "Linux",
      r: /(Linux|X11)/,
    },
    {
      s: "iOS",
      r: /(iPhone|iPad|iPod)/,
    },
    {
      s: "Mac OS X",
      r: /Mac OS X/,
    },
    {
      s: "Mac OS",
      r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/,
    },
    {
      s: "QNX",
      r: /QNX/,
    },
    {
      s: "UNIX",
      r: /UNIX/,
    },
    {
      s: "BeOS",
      r: /BeOS/,
    },
    {
      s: "OS/2",
      r: /OS\/2/,
    },
    {
      s: "Search Bot",
      r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
    },
  ];
  for (var i = 0, cs; (cs = clientStrings[i]); i++) {
    if (cs.r.test(nAgt)) {
      os = cs.s;
      break;
    }
  }
  var osVersion = unknown;
  if (/Windows/.test(os)) {
    if (/Windows (.*)/.test(os)) {
      osVersion = /Windows (.*)/.exec(os)[1];
    }
    os = "Windows";
  }
  switch (os) {
    case "Mac OS X":
      if (/Mac OS X (10[/._\d]+)/.test(nAgt)) {
        // eslint-disable-next-line no-useless-escape
        osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
      }
      break;
    case "Android":
      // eslint-disable-next-line no-useless-escape
      if (/Android ([\.\_\d]+)/.test(nAgt)) {
        // eslint-disable-next-line no-useless-escape
        osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
      }
      break;
    case "iOS":
      if (/OS (\d+)_(\d+)_?(\d+)?/.test(nAgt)) {
        osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
        osVersion =
          osVersion[1] + "." + osVersion[2] + "." + (osVersion[3] | 0);
      }
      break;
  }
  return {
    osName: os + osVersion,
    type: "desktop",
  };
}

/**
 * Get the OS name of the current browser
 * @returns The OS name.
 */
function getOS() {
  if (isMobile.any()) {
    return isMobile.getOsName();
  } else {
    return detectDesktopOS();
  }
}

function isPC() {
  var userAgentInfo = navigator.userAgent;
  var Agents = new Array(
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod"
  );
  var flag = true;
  for (var v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = false;
      break;
    }
  }
  return flag;
}

function getBrowser() {
  var sys = {};
  var ua = navigator.userAgent.toLowerCase();
  var s;
  (s = ua.match(/edge\/([\d.]+)/))
    ? (sys.edge = s[1])
    : (s = ua.match(/rv:([\d.]+)\) like gecko/))
    ? (sys.ie = s[1])
    : (s = ua.match(/msie ([\d.]+)/))
    ? (sys.ie = s[1])
    : (s = ua.match(/firefox\/([\d.]+)/))
    ? (sys.firefox = s[1])
    : (s = ua.match(/tbs\/([\d]+)/))
    ? (sys.tbs = s[1])
    : (s = ua.match(/xweb\/([\d]+)/))
    ? (sys.xweb = s[1])
    : (s = ua.match(/chrome\/([\d.]+)/))
    ? (sys.chrome = s[1])
    : (s = ua.match(/opera.([\d.]+)/))
    ? (sys.opera = s[1])
    : (s = ua.match(/version\/([\d.]+).*safari/))
    ? (sys.safari = s[1])
    : 0;

  if (sys.xweb)
    return {
      browser: "webView XWEB",
      version: "",
    };
  if (sys.tbs)
    return {
      browser: "webView TBS",
      version: "",
    };
  if (sys.edge)
    return {
      browser: "Edge",
      version: sys.edge,
    };
  if (sys.ie)
    return {
      browser: "IE",
      version: sys.ie,
    };
  if (sys.firefox)
    return {
      browser: "Firefox",
      version: sys.firefox,
    };
  if (sys.chrome)
    return {
      browser: "Chrome",
      version: sys.chrome,
    };
  if (sys.opera)
    return {
      browser: "Opera",
      version: sys.opera,
    };
  if (sys.safari)
    return {
      browser: "Safari",
      version: sys.safari,
    };

  return {
    browser: "",
    version: "0",
  };
}

function isHidden() {
  var hidden, visibilityChange;
  if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  return document[hidden];
}

/**
 * Given a URL, return the value of the specified query parameter
 * @param name - The name of the parameter.
 * @returns The query parameter value.
 */
function queryParams(name) {
  const match = window.location.search.match(
    new RegExp("(\\?|&)" + name + "=([^&]*)(&|$)")
  );
  return !match ? "" : decodeURIComponent(match[2]);
}

/**
 * 防抖节流
 */
function debounce(callback, delay = 500) {
  let pre = 0; // 默认值不要是Date.now() ==> 第1次事件立即调用
  return function (event) {
    // 节流函数/真正的事件回调函数   this是发生事件的标签
    const current = Date.now();
    if (current - pre > delay) {
      // 只有离上一次调用callback的时间差大于delay
      // 调用真正处理事件的函数, this是事件源, 参数是event
      callback.call(this, event);
      // 记录此次调用的时间
      pre = current;
    } else {
      layer.msg("请勿频繁切换");
    }
  };
}
