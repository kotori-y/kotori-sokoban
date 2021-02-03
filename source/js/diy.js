/*
 * @Description:
 * @Author: Kotori Y
 * @Date: 2021-02-03 15:33:14
 * @LastEditors: Kotori Y
 * @LastEditTime: 2021-02-03 23:34:14
 * @FilePath: \kotori-sokoban\source\js\diy.js
 * @AuthorMail: kotori@cbdd.me
 */

class StageGnerator {
  constructor(
    w,
    h,
    gameElem,
    borderArea,
    boxArea,
    goalArea,
    humanArea,
    out,
    stuffElems,
    tempElems
  ) {
    this.w = w;
    this.h = h;
    this.gameElem = gameElem;
    this.borderArea = borderArea;
    this.boxArea = boxArea;
    this.goalArea = goalArea;
    this.humanArea = humanArea;
    this.out = out;
    this.stuffElems = stuffElems;
    this.tempElems = tempElems;
    this.stuff2Show = null;
    this.crash = false;
    this.#getRefer();

    this.borders = this.borderArea.children;
    this.boxes = this.boxArea.children;
    this.humans = this.humanArea.children;
    this.goals = this.goalArea.children;

    this.data = JSON.parse(out.innerHTML);
    this.gameElem.addEventListener("mousemove", this.showStuff, false);
    this.stuffElems.forEach((stuff) => {
      stuff.addEventListener("click", () => {
        var name = stuff.id;
        this.#activate(name);
      });
    });
    this.tempElems.forEach((temp) =>
      temp.addEventListener("click", (e) => {
        this.placeStuff(temp, e);
      })
    );
    document
      .querySelector("#apply")
      .addEventListener("click", this.generateGrid, false);

    this.generateGrid();
    this.data["border"] = []
    this.data["box"] = []
    this.data["human"] = []
    this.data["goal"] = []
    this.updateJson()
  }

  #getRefer() {
    var refer = gameElem.getBoundingClientRect();
    this.refer = [refer.x, refer.y];
  }

  updateJson() {
    out.innerHTML = JSON.stringify(this.data);
  }

  generateGrid = () => {
    var width = this.w.value * 40;
    var height = this.h.value * 40;

    this.gameElem.style.width = `${width}px`;
    this.gameElem.style.height = `${height}px`;
    this.out.style.height = `${height}px`;
    this.#getRefer();
    this.data["width"] = this.w.value
    this.data["height"] = this.h.value
    this.updateJson();
  };

  #activate(name) {
    this.stuff2Show = name;
    this.tempElems.forEach((elem) => {
      elem.classList.remove("check");
      if (elem.classList.contains(name)) {
        elem.classList.add("check");
      }
    });
  }

  showStuff = (e) => {
    if (this.stuff2Show) {
      var x = e.clientX - this.refer[0]; //x position within the element.
      var y = e.clientY - this.refer[1]; //y position within the element.

      x = parseInt(x / 40);
      y = parseInt(y / 40);

      x = x < this.w.value ? x : this.w.value - 1;
      y = y < this.h.value ? y : this.h.value - 1;

      var elem = document.querySelector(`.temp-container .${this.stuff2Show}`);
      this.locate = [x, this.h.value - 1 - y];
      elem.style.left = `${x * 40}px`;
      elem.style.top = `${y * 40}px`;
    }

    // console.log([x, this.h.value - y - 1]);
  };

  #isColliding(div1, divs) {
    var colliding = Array.from(divs).some((div) => {
      return (
        parseInt(div1.style.left.replace("px", "")) === div.offsetLeft &&
        parseInt(div1.style.top.replace("px", "")) === div.offsetTop
      );
    });

    return colliding;
  }

  #checkCrash(elem) {
    switch (this.stuff2Show) {
      case "border":
      case "eraser":
        this.crash =
          this.#isColliding(elem, this.borders) ||
          this.#isColliding(elem, this.boxes) ||
          this.#isColliding(elem, this.humans) ||
          this.#isColliding(elem, this.goals);
        break;
      case "human":
      case "box":
        this.crash =
          this.#isColliding(elem, this.borders) ||
          this.#isColliding(elem, this.boxes) ||
          this.#isColliding(elem, this.humans);
        break;
      case "goal":
        this.crash =
          this.#isColliding(elem, this.borders) ||
          this.#isColliding(elem, this.goals);
        break;
      default:
        break;
    }
  }

  #removeStuff(e) {
    //   var rect = e.getBoundingClientRect();
    var x = e.clientX;
    var y = e.clientY;
    this.tempElems[this.tempElems.length - 1].style["z-index"] = -1;
    var aim = document.elementFromPoint(x, y);
    console.log(this.refer)
    console.log([x,y])
    aim.remove();
    this.tempElems[this.tempElems.length - 1].style["z-index"] = 0;
  }

  placeStuff(temp, e) {
    if (this.stuff2Show) {
      var elem = document.createElement("div");
      elem.classList = this.stuff2Show;
      elem.style.left = `${temp.offsetLeft}px`;
      elem.style.top = `${temp.offsetTop}px`;

      // console.log(!this.#checkCrash(elem))
      this.#checkCrash(elem);
      if (!this.crash && this.stuff2Show !== "eraser") {
        switch (this.stuff2Show) {
          case "border":
            this.borderArea.appendChild(elem);
            break;
          case "box":
            this.boxArea.appendChild(elem);
            break;
          case "goal":
            this.goalArea.appendChild(elem);
            break;
          case "human":
            humanArea.innerHTML = "";
            this.humanArea.appendChild(elem);
            this.data["human"] = []
            break;
          default:
            break;
        }
        this.data[this.stuff2Show].push(this.locate)
        this.updateJson()
      } else {
        console.log(elem.getBoundingClientRect())
        if (this.crash && this.stuff2Show === "eraser") {
          this.#removeStuff(e);
        }
      }

      this.borders = this.borderArea.children;
      this.boxes = this.boxArea.children;
      this.humans = this.humanArea.children;
      this.goals = this.goalArea.children;

      for (let box of this.boxes) {
        if (this.#isColliding(box, this.goals)) {
          box.classList.add("active");
        }
      }
    }
  }
}

const w = document.querySelector("#width");
const h = document.querySelector("#height");
const gameElem = document.querySelector(".game-area");
const borderArea = document.querySelector(".border-container");
const boxArea = document.querySelector(".box-container");
const goalArea = document.querySelector(".goal-container");
const humanArea = document.querySelector(".human-container");
const stuffElems = document.querySelectorAll(".stuff");
const tempElems = document.querySelectorAll(".temp");
const out = document.querySelector("#stageJson");
// var data = JSON.parse(out.innerHTML);

diy = new StageGnerator(
  w,
  h,
  gameElem,
  borderArea,
  boxArea,
  goalArea,
  humanArea,
  out,
  stuffElems,
  tempElems,
  borderArea
);
