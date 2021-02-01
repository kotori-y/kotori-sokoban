/*
 * @Description:
 * @Author: Kotori Y
 * @Date: 2021-02-01 16:03:15
 * @LastEditors: Kotori Y
 * @LastEditTime: 2021-02-01 22:59:13
 * @FilePath: \kotori-sokoban\source\js\script.js
 * @AuthorMail: kotori@cbdd.me
 */

class Sokoban {
  constructor(gameArea, borderArea, boxArea, goalArea, humanArea) {
    this.gameArea = gameArea;
    this.borderArea = borderArea;
    this.boxArea = boxArea;
    this.goalArea = goalArea;
    this.humanArea = humanArea;

    this.start();
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

  #keyEvent(e) {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.direction = 2;
        break;
      case "ArrowDown":
      case "KeyS":
        this.direction = 8;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.direction = 4;
        break;
      case "ArrowRight":
      case "KeyD":
        this.direction = 6;
        break;
      default:
        this.direction = this.direction;
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
    var human = document.querySelector(".human");
    var borders = this.borderArea.children;
    var goals = this.goalArea.children;
    var boxes = this.boxArea.children;

    var [hLeft, hTop] = this.#move(human);

    var aimBox = this.#isPushBox(hLeft, hTop, boxes);

    if (aimBox) {
      var [bLeft, bTop] = this.#move(aimBox);
      if (
        !this.#isTouchObstacle(bLeft, bTop, borders) &&
        !this.#isTouchObstacle(bLeft, bTop, boxes)
      ) {
        aimBox.style.left = `${bLeft}px`;
        aimBox.style.top = `${bTop}px`;
        aimBox.classList.remove("active")
        if (this.#isTouchObstacle(bLeft, bTop, goals)) {
          aimBox.classList.add("active")
        }
        human.style.left = `${hLeft}px`;
        human.style.top = `${hTop}px`;
      }
    } else {
      if (!this.#isTouchObstacle(hLeft, hTop, borders)) {
        human.style.left = `${hLeft}px`;
        human.style.top = `${hTop}px`;
      }
    }
  }

  async start() {
    await this.#generateStage(1);
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
var gameArea = document.querySelector(".game-area");

var app = new Sokoban(gameArea, borderArea, boxArea, goalArea, humanArea);
