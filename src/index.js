import * as GAME from "./game";
let gameStatus = {
  // 游戏状态，未开始 0，进行中 1，胜利 2
  status: 0,
  // 游戏分数，默认随时间增加，吃到道具会额外增加
  score: 0,
  // 关卡
  stage: 1,
};

const stageEle = document.querySelector(".stage");
stageEle.innerHTML = " " + gameStatus.stage;

const scoreEle = document.querySelector(".score");
let scoreInterval = null;

const handler = {
  set(trapTarget, key, value, receiver) {
    console.log("value: ", value);
    if (key === "status") {
      // 修改游戏状态
      // 游戏开始
      if (value === 1) {
        scoreInterval = setInterval(() => {
          gameStatus.score++;
          scoreEle.innerHTML = gameStatus.score;
        }, 1000);
      } else if (value === 2) {
        console.log("### 游戏胜利 ###");
      }
    }
    return Reflect.set(trapTarget, key, value, receiver);
  },
};
const proxy = new Proxy(gameStatus, handler);

GAME.gameStart(proxy);
