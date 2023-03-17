export function shuffleCards (cards, num) {
  let rand, tmp
  let last = num - 1
  for (let i = 0; i < 1000; i++) {
    rand = Math.floor(Math.random() * last)
    tmp = cards[last]
    cards[last] = cards[rand]
    cards[rand] = tmp
  }
  return cards
}

export function timeout (handle, time) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
      handle()
    }, time)
  })
}

export function wait(time) {
  return new Promise(r => setTimeout(r, time))
}

export function preload(cb) {
  let arr = []
  for (let i = 0; i < 54; i++) {
    arr.push(new Promise(resolve => {
      let img = new Image()
      img.src = './static/' + i + '.png'
      img.onload = () => {
        cb && cb(img, i)
        resolve(img)
      }
    }))
  }
  return Promise.all(arr)
}