export function shuffleCards(cards, num) {
  let rand, tmp;
  let last = num - 1;
  for (let i = 0; i < 1000; i++) {
    rand = Math.floor(Math.random() * last);
    tmp = cards[last];
    cards[last] = cards[rand];
    cards[rand] = tmp;
  }
  return cards;
}

export function timeout(handle, time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
      handle();
    }, time);
  });
}

export function wait(time) {
  return new Promise(r => setTimeout(r, time));
}

export function preload(cb) {
  let arr = [];
  for (let i = 0; i < 54; i++) {
    arr.push(
      new Promise(resolve => {
        let img = new Image();
        img.src = "./static/" + i + ".jpg";
        img.onload = () => {
          cb && cb(img, i);
          resolve(img);
        };
      })
    );
  }
  return Promise.all(arr);
}

function equalArray(arr1, arr2) {
  if (!arr2) return false;
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] != arr2[i]) return false;
  }
  return true;
}

export function checkDeadForeach(array, newest) {
  for (let i = 0; i < array.length >> 1; i++) {
    if (!equalArray(array[i], newest)) {
      continue;
    }
    let j;
    let count = {};
    for (j = 0; j < i; j++) {
      count[array[i].join(".")] = count[array[i].join(".")]
        ? count[array[i].join(".")] + 1
        : 1;
      if (!equalArray(array[j], array[j + i + 1])) break;
    }
    if (j >= i) {
      if (i > 40) {
        console.log("dead foreach", array, newest, i);
      }
      return false;
    }
    let index = Object.values(count).indexOf(1);
    if (index < 0) {
      return false;
    }
  }
  return true;
}

let s = 1;

export function setSeed(seed) {
  s = seed;
}

export function seededRandom() {
  s = (s * 9301 + 49297) % 233280;
  return s / 233280.0;
}
