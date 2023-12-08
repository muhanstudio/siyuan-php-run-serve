import {
  Plugin,
  openTab,
  showMessage,
  Menu,
  Setting
} from "siyuan";

import "./index.scss";

const dataDir = window.siyuan.config.system.dataDir;
const envpath = `${dataDir}/plugins/siyuan-php-run-serve/`;
const TAB_TYPE = "custom_tab";

export default class phpserve extends Plugin {
  async runphp() {
    const { exec } = require("child_process");
    const batFilePath = envpath + "/env/start.bat";

    // 执行 cmd 命令，并传入 bat 文件路径
    exec(`start cmd /K "${batFilePath}"`);
    showMessage("启动服务");
  }

  async stopphp() {
    const { exec } = require("child_process");
    const batFilePath = envpath + "/env/stop.bat";

    // 执行 cmd 命令，并传入 bat 文件路径
    exec(`start cmd /K "${batFilePath}"`);
    showMessage("停止服务");
  }

  async openphptab() {
    const tab = openTab({
      app: this.app,
      custom: {
        icon: "iconLanguage",
        title: "PHP服务首页",
        data: {
          text: "This is my custom tab",
        },
        id: this.name + TAB_TYPE
      },
    });
    console.log(tab);
  }

  async envbuild() {
    const envFolderPath = envpath;
    const zipFilePath = envFolderPath + "env.zip";
    const extractToPath = envFolderPath + "env/";
    const fs = require("fs");

    // 判断是否存在env文件夹
    if (!fs.existsSync(extractToPath)) {
      fs.mkdirSync(extractToPath);
      // 下载zip文件
      const response = await fetch("http://tool.muhan.studio/Extensions.zip");
      if (!response.ok) {
        throw new Error("Failed to download the zip file");
      }

      const contentLength = +response.headers.get("content-length");
      let receivedBytes = 0;

      const fileStream = fs.createWriteStream(zipFilePath);
      const reader = response.body.getReader();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 下载完成
          break;
        }

        receivedBytes += value.length;
        const progress = (receivedBytes / contentLength) * 100;
        showProgress(receivedBytes, contentLength);
        fileStream.write(value);
      }

      fileStream.end();
      showMessage("正在解压，请稍等");
      setTimeout(async () => {
        const unzipApiUrl = "/api/archive/unzip"; // 替换为实际的解压 API 地址
        const unzipResponse = await fetch(unzipApiUrl, {
          method: "POST",
          body: JSON.stringify({
            "path": "data/plugins/siyuan-php-run-serve/env",
            "zipPath": "data/plugins/siyuan-php-run-serve/env.zip"
          }),
          headers: { "Content-Type": "application/json" },
        });
        if (!unzipResponse.ok) {
          throw new Error("Failed to unzip the file");
        }

        const result = await unzipResponse.json();
        if (result.code === 0) {
          alert("PHP环境包已解压完成，可以开始启动");
        } else {
          throw new Error("Failed to unzip the file");
        }
      }, 2000);

    } else {
      showMessage("env文件夹已存在，请先删除插件目录下的env文件夹再重新部署");
      showMessage(envFolderPath);
      return;
    }

    function showProgress(current: number, total: number) {
      const progress = (current / total) * 100;
      showMessage("下载进度：" + progress);
    }
  }

  async onLayoutReady() {
    // this.runphp();
  }

  async onload() {

    this.addTab({
      type: TAB_TYPE,
      init() {
        this.element.innerHTML = `
            <div class="link" data-url="http://127.0.0.1:8866">可道资源管理器 <span class="copy-button" data-clipboard-text="http://127.0.0.1:8866">复制URL</span><br><br></div>
            <div class="link" data-url="http://127.0.0.1:8867">PHP函数执行器 <span class="copy-button" data-clipboard-text="http://127.0.0.1:8867">复制URL</span><br><br></div>
            <div class="link" data-url="http://127.0.0.1:8868">槽位1 <span class="copy-button" data-clipboard-text="http://127.0.0.1:8868">复制URL</span><br><br></div>
            <div class="link" data-url="http://127.0.0.1:8869">槽位2 <span class="copy-button" data-clipboard-text="http://127.0.0.1:8869">复制URL</span><br><br></div>
            <div class="link" data-url="http://127.0.0.1:8870">槽位3 <span class="copy-button" data-clipboard-text="http://127.0.0.1:8870">复制URL</span><br><br></div>
            <div class="link"><h1>可以直接点击上方列表的服务名称跳转，也可以点击复制服务URL，添加到webapp插件的dock中，打开更方便</h1></div>
            `;

        const containerDiv = document.createElement("div");
        containerDiv.classList.add("iframe-container");
        this.element.appendChild(containerDiv);

        const links = this.element.querySelectorAll(".link");
        const iframes = [];

        links.forEach(link => {
          link.addEventListener("click", (event) => {
            event.preventDefault();
            const url = link.getAttribute("data-url");
            const iframe = document.createElement("iframe");
            iframe.setAttribute("src", url);
            iframe.style.width = "100%";
            iframe.style.height = "100vh";
            containerDiv.innerHTML = ""; // 清空容器
            containerDiv.appendChild(iframe);
            iframes.push(iframe);

            // 隐藏所有链接
            links.forEach(link => {
              link.style.margin = "10px 0"; // 添加上下边距
              link.style.display = "none";
            });
          });
        });

        const copyButtons = this.element.querySelectorAll(".copy-button");
        copyButtons.forEach(button => {
          button.addEventListener("click", (event) => {
            event.stopPropagation(); // 阻止事件冒泡，以防止触发链接的点击事件
            const textToCopy = button.getAttribute("data-clipboard-text");
            copyTextToClipboard(textToCopy);
            alert("已成功复制：" + textToCopy); // 弹窗提示复制成功
          });
          button.style.borderRadius = "5px"; // 圆角化按钮
          button.style.border = "1px solid #000"; // 添加边框样式
          button.style.padding = "5px"; // 可选：添加一些内边距以增加可点击区域
          button.style.cursor = "pointer"; // 让鼠标指针变成手型以表明可点击
        });

        function copyTextToClipboard(text: string) {
          navigator.clipboard.writeText(text).then(() => {
            console.log("Text copied to clipboard");
          }).catch(err => {
            console.error("Error in copying text: ", err);
          });
        }

        this.beforeDestroy = () => {
          console.log("before destroy tab:", TAB_TYPE);
        };

        this.destroy = () => {
          console.log("destroy tab:", TAB_TYPE);
        };
      }
    });

    this.setting = new Setting({
      confirmCallback: () => {
        console.log("设置准备就绪");
      }
    });

    const btnElement = document.createElement("button");
    btnElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    btnElement.textContent = "启动";
    btnElement.addEventListener("click", () => {
      this.runphp();
    });

    this.setting.addItem({
      title: "启动服务",
      description: "点击启动nginx+php服务",
      actionElement: btnElement,
    });

    const btn2Element = document.createElement("button");
    btn2Element.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    btn2Element.textContent = "停止";
    btn2Element.addEventListener("click", () => {
      this.stopphp();
    });

    this.setting.addItem({
      title: "停止服务",
      description: "点击将杀死所有的nginx进程，但PHP需要通过关闭弹出的命令行窗口停止",
      actionElement: btn2Element,
    });

    const btn3Element = document.createElement("button");
    btn3Element.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    btn3Element.textContent = "服务状态：未获取";

    const handleClick = () => {
      // 设置超时时间为3秒
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("访问超时"));
        }, 3000);
      });
    
      // 发起网络请求来刷新服务状态
      Promise.race([
        fetch("http://127.0.0.1:8866/"),
        timeoutPromise
      ])
        .then(response => {
          if (response.ok) {
            btn3Element.innerText = "服务状态: 200 OK";
          } else {
            btn3Element.innerText = `服务状态: ${response.status} ${response.statusText}`;
          }
        })
        .catch(error => {
          if (error.message !== "访问超时") {
            console.error("发生错误:", error);
          }
          btn3Element.innerText = error.message;
        });
    };    

    btn3Element.addEventListener("click", handleClick);

    this.setting.addItem({
      title: "服务状态",
      description: "点击按钮获取当前服务状态",
      actionElement: btn3Element,
    });

    const btn4Element = document.createElement("button");
    btn4Element.className = "b3-button b3-button--outline fn__flex-center fn__size200";
    btn4Element.textContent = "开始部署";

    btn4Element.addEventListener("click", () => {
      this.envbuild();
    });

    this.setting.addItem({
      title: "部署环境",
      description: "点击下载部署环境，若要重新部署，请删除插件下env文件夹",
      actionElement: btn4Element,
    });

    this.addCommand({
      langKey: "打开PHP管理器首页",
      hotkey: "⇧⌘P",
      callback: () => {
        console.log("PHP是世界上最好的语言");
        this.openphptab();
      },
    });

    this.addTopBar({
      icon: "iconLanguage",
      title: this.i18n.addTopBarIcon,
      position: "left",
      callback: () => {
        this.openphptab();
      }
    });

    const menu = new Menu("phpserve", () => {
      this.openphptab();
    });
    menu.addItem({
      icon: "iconInfo",
      label: "打开设置",
      click: () => {
        this.openSetting();
      }
    });
  }
}
