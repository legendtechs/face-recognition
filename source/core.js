class FaceRecognition extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({
      mode: "open" // "closed" 会让该 ShadowRoot 的内部实现无法被 JavaScript 访问及修改
    });
    const videoDOM = document.createElement("video");
    const canvaDOM = document.createElement("canvas");
    canvaDOM.style.display = 'none';
    navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    shadow.appendChild(videoDOM);
    shadow.appendChild(canvaDOM);
  }
  static get observedAttributes() {
    // 是否展示canvas
    // 是否手动触发识别
    // h 高度
    // w 宽度
    return ["h", "w", "showCanvas", "isManual"];
  }
  getAttrValue(key) {
    if (!key || typeof key !== "string") {
      throw new Error("属性的key值格式有误！");
    }
    // return Reflect.get()
    console.log("当前所有的属性 ", this.getAttributeNames());
    return this.getAttribute(key);
  }
  connectedCallback() {
    console.log("connectedCallback 元素首次被插入DOM树");
    this.init();
  }
  disconnectedCallback() {
    console.log("disconnectedCallback 元素被删除");
  }
  adoptedCallback() {
    console.log("adoptedCallback 移动到新的文档时，被调用");
  }
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      "attributeChangedCallback 增加、删除、修改自身属性时 ",
      name,
      oldValue,
      newValue
    );
  }
  init() {
    const width = this.getAttrValue("w");
    const height = this.getAttrValue("h");
    const isManual = this.getAttrValue("isManual");
    const showCanvas = this.getAttribute("showCanvas");
    const constraintsJSON = this.getAttrValue("constraints");

    console.log('showCanvas ', showCanvas)
    if (showCanvas) {
      this.shadowRoot.querySelector('canvas').style.display = 'block';
    }
    this.autoFace(constraintsJSON);
  }
  autoFace(constraintsJSON = "") {
    const shadow = this.shadowRoot;
    const constraints = constraintsJSON
      ? JSON.parse(constraintsJSON)
      : {
          video: {
            facingMode: "user" // 优先调用前置摄像头
          },
          audio: false
        };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(stream => {
          // alert(stream)
          const videoTarget = shadow.querySelector('video');
          videoTarget.srcObject = stream;
          videoTarget.onloadedmetadata = e => {
            videoTarget.play();
            this.updateCanvas();
          };
        })
        .catch(function(err) {
          alert(err);
          console.log("The following getUserMedia error occured: " + err);
        });
    } else {
      alert("getUserMedia not supported on your browser!");
      console.log("getUserMedia not supported on your browser!");
    }
  }
  updateCanvas() {
    console.log('update this ', this);
    let count = 0;
    const self = this;
    const canvas = self.shadowRoot.querySelector('canvas');
    const video = self.shadowRoot.querySelector('video');
    const h = self.getAttrValue('height') || 180;
    const w = self.getAttrValue('width') || 180;
    canvas.height = h;
    canvas.width = w;
    const canvasCTX = canvas.getContext('2d');
    function drawImg() {
      canvasCTX.drawImage(video, 0, 0, w, h);
      const data = {
        image: canvas.toDataURL()
      }
      const evt = new CustomEvent('photoMetaChange', {
        detail: {
          data,
          onStop: r => {
            console.log('发送失败 ', r);
          },
          onRetry: () => {
            drawImg();
          }
        }
      });
      console.log('this.shadowRoot ', self.shadowRoot)
      self.dispatchEvent(evt)
    }
    drawImg();
  }
}
// define 方法的介绍
// 一个 DOMString，用于表示所创建的元素的名称。注意，custom element 的名称中必须要有短横线。
// 一个类对象，用于定义元素的行为。
// 一个包含 extends属性的配置对象，是可选参数。它指定了所创建的元素继承自哪个内置元素，可以继承任何内置元素。
window.customElements.define("facial-recognition", FaceRecognition);
