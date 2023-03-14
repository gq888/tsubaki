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

export function wait(time){
  return new Promise(r => setTimeout(r, time))
}