/*
 * @Description:
 * @Author: Kotori Y
 * @Date: 2021-02-01 16:03:15
 * @LastEditors: Kotori Y
 * @LastEditTime: 2021-02-02 17:01:50
 * @FilePath: \kotori-sokoban\source\js\script.js
 * @AuthorMail: kotori@cbdd.me
 */

class Sokoban {
  constructor(
    gameArea,
    borderArea,
    boxArea,
    goalArea,
    humanArea,
    moveElem,
    timeElem
  ) {
    this.gameArea = gameArea;
    this.borderArea = borderArea;
    this.boxArea = boxArea;
    this.goalArea = goalArea;
    this.humanArea = humanArea;
    this.moveElem = moveElem;
    this.timeElem = timeElem;
    this.moveNum = 0;
    this.timer = null;
    this.timeCost = 0; // unit is second
    this.addNum = false;
    this.traceHistory = {};
    this.undo = false;

    this.start();
  }

  #recordTrace() {
    this.human = this.humanArea.children[0];
    this.boxes = this.boxArea.children;

    var history = [[this.human.offsetLeft, this.human.offsetTop]];
    for (let box of this.boxes) {
      history.push([box.offsetLeft, box.offsetTop]);
    }
    this.traceHistory[this.moveNum] = history;
  }

  async #getStageData(stageNum) {
    var stageData = await fetch(`source/stages/stage${stageNum}.json`);
    var stageData = stageData.json();
    return stageData;
  }

  async #generateElement(elementType, stageData, height) {
    var elems = [];
    for (let locates of stageData[elementType]) {
      var elem = document.createElement("div");
      elem.classList = elementType;
      var [x, y] = locates;

      elem.style.left = `${x * this.gridSize}px`;
      elem.style.top = `${height - (y + 1) * this.gridSize}px`;
      elems.push(elem);
    }
    return elems;
  }

  async #generateStage(stageNum) {
    var stage = await this.#getStageData(stageNum);
    this.moveNum = 0;
    this.gridSize = stage["gridSize"];
    var width = stage["width"] * this.gridSize;
    var height = stage["height"] * this.gridSize;
    this.gameArea.style.width = `${width}px`;
    this.gameArea.style.height = `${height}px`;

    var promise = [];
    for (let elementType of ["border", "box", "goal", "human"]) {
      promise.push(this.#generateElement(elementType, stage, height));
    }
    var values = await Promise.all(promise);
    values[0].forEach((element) => {
      this.borderArea.appendChild(element);
    });
    values[1].forEach((element) => {
      this.boxArea.appendChild(element);
    });
    values[2].forEach((element) => {
      this.goalArea.appendChild(element);
    });
    values[3].forEach((element) => {
      this.humanArea.appendChild(element);
    });

    this.borders = this.borderArea.children;
    this.goals = this.goalArea.children;
    this.#recordTrace();

    document.querySelector("#stageNum").innerHTML = stageNum;
  }

  #updateNum() {
    if (this.addNum) {
      this.moveElem.innerHTML = this.moveNum;
    }
  }

  #updateTime() {
    this.timer = setInterval(() => {
      this.timeCost++;

      var m = parseInt(this.timeCost / 60);
      var s = this.timeCost % 60;
      var m = m < 10 ? `0${m}` : `${m}`;
      var s = s < 10 ? `0${s}` : `${s}`;

      this.timeElem.innerHTML = `${m}:${s}`;
    }, 1000);
  }

  #isColliding(left, top, obstacle) {
    var obstacleOffset = { left: obstacle.offsetLeft, top: obstacle.offsetTop };

    var notColliding =
      Math.abs(left - obstacleOffset.left) >= obstacle.clientWidth ||
      Math.abs(top - obstacleOffset.top) >= obstacle.clientHeight;

    return !notColliding;
  }

  #isTouchObstacle(left, top, obstacles) {
    var touch = Array.from(obstacles).some((obstacle) =>
      this.#isColliding(left, top, obstacle)
    );
    return touch;
  }

  #isPushBox(left, top, boxes) {
    var aimBox = Array.from(boxes).find((box) =>
      this.#isColliding(left, top, box)
    );
    return aimBox;
  }

  #checkBox(aimBox) {
    aimBox.classList.remove("active");
    if (
      this.#isTouchObstacle(aimBox.offsetLeft, aimBox.offsetTop, this.goals)
    ) {
      aimBox.classList.add("active");
    }
  }

  #keyEvent(e) {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.direction = 2;
        this.addNum = true;
        break;
      case "ArrowDown":
      case "KeyS":
        this.direction = 8;
        this.addNum = true;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.direction = 4;
        this.addNum = true;
        break;
      case "ArrowRight":
      case "KeyD":
        this.direction = 6;
        this.addNum = true;
        break;
      case "KeyQ":
        this.direction = -1;
        this.addNum = true;
        break;
      case "KeyE":
        this.direction = 0;
        this.addNum = true;
        break;
      default:
        this.direction = -2
        this.addNum = false;
    }
  }

  #undo() {
    if (this.direction === -1) {
      this.moveNum--;
      this.moveNum = this.moveNum >= 0 ? this.moveNum : 0;
    } else {
      var maxTrace = Object.keys(this.traceHistory).length - 1;
      // console.log(maxTrace);
      this.moveNum++;
      this.moveNum = this.moveNum <= maxTrace ? this.moveNum : maxTrace;
    }

    var temp = this.traceHistory[this.moveNum];

    this.human.style.left = `${temp[0][0]}px`;
    this.human.style.top = `${temp[0][1]}px`;

    for (let idx = 1; idx < temp.length; idx++) {
      var [left, top] = temp[idx];
      var box = this.boxes[idx - 1];

      if (box.offsetLeft !== left || box.offsetTop !== top) {
        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        this.#checkBox(box);
      }
    }
  }

  #move(elem) {
    var left = elem.offsetLeft;
    var top = elem.offsetTop;

    switch (this.direction) {
      case 2:
        top = elem.offsetTop - this.gridSize;
        break;
      case 8:
        top = elem.offsetTop + this.gridSize;
        break;
      case 4:
        left = elem.offsetLeft - this.gridSize;
        break;
      case 6:
        left = elem.offsetLeft + this.gridSize;
        break;
      default:
        break;
    }
    return [left, top];
  }

  #controller() {
    switch (this.direction) {
      case -1:
      case 0:
        this.#undo();
        break;
      case 2:
      case 8:
      case 4:
      case 6:
        var [hLeft, hTop] = this.#move(this.human);

        var aimBox = this.#isPushBox(hLeft, hTop, this.boxes);

        if (aimBox) {
          var [bLeft, bTop] = this.#move(aimBox);
          if (
            !this.#isTouchObstacle(bLeft, bTop, this.borders) &&
            !this.#isTouchObstacle(bLeft, bTop, this.boxes)
          ) {
            aimBox.style.left = `${bLeft}px`;
            aimBox.style.top = `${bTop}px`;
            this.#checkBox(aimBox);
            this.human.style.left = `${hLeft}px`;
            this.human.style.top = `${hTop}px`;
            this.moveNum++;
          }
        } else {
          if (!this.#isTouchObstacle(hLeft, hTop, this.borders)) {
            this.human.style.left = `${hLeft}px`;
            this.human.style.top = `${hTop}px`;
            this.moveNum++;
          }
        }
        break
      default:
        break
    }
    this.#updateNum();
    this.#recordTrace();
  }

  async start() {
    await this.#generateStage(1);
    this.#updateTime();
    document.addEventListener("keydown", (e) => {
      this.#keyEvent(e);
      this.#controller();
    });
  }
}

var borderArea = document.querySelector(".border-container");
var boxArea = document.querySelector(".box-container");
var goalArea = document.querySelector(".goal-container");
var humanArea = document.querySelector(".human-container");
var moveElem = document.querySelector("#moveNum");
var timeElem = document.querySelector("#timeCost");
var gameArea = document.querySelector(".game-area");

var app = new Sokoban(
  gameArea,
  borderArea,
  boxArea,
  goalArea,
  humanArea,
  moveElem,
  timeElem
);
