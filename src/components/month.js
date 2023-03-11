export default {
  name: 'Month',
  data () {
    return {
      title: 'Month',
      step: 0,
      cards1: [],
      cards2: [],
      arr: [],
      loseflag: false,
      hitflag: true,
      lockflag: true,
      timer: '',
      number: 48
    }
  },
  created: function () {
    this.init(this.cards1)
  },
  // 初始化
  methods: {
    init () {
      let cards = this.cards1
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      this.shuffleCards(cards)
      for (let i = 0; i < 12; i++) {
        this.cards2.push(0);
        this.arr.push(cards.splice(0, 4))
      }
    },
    // 洗牌
    shuffleCards (cards) {
      let rand, tmp
      let last = this.number - 1
      for (let i = 0; i < 1000; i++) {
        rand = Math.floor(Math.random() * last)
        tmp = cards[last]
        cards[last] = cards[rand]
        cards[rand] = tmp
      }
      return cards
    },
    async stepFn () {
      this.hitflag = false
      await this.hit().then(() => {
        console.log(1)
        this.hitflag = true
      })
    },
    time (handle, time) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve()
          handle()
        }, time)
      })
    },
    async push (arr, item) {
      arr.push(item)
    },
    // 摸牌
    async hit () {
      let step = this.step
      if (this.cards2[0] >= 4) {
        this.loseflag = true
        return
      }
      let currentCard = this.arr[step].pop()
      var value = currentCard >> 2
      this.arr[value].unshift(currentCard)
      this.step = value;
      this.cards2[value] ++;
    },
    pass () {
      this.lockflag = false
      if (!this.loseflag) {
        this.stepFn().then(() => {
          setTimeout(this.pass, 1000)
        })
      }
    },
    goon () {
      this.step = 0
      this.hitflag = true
      this.lockflag = true
      this.cards1.splice(0)
      this.cards2.splice(0)
      this.arr.splice(0)
      this.loseflag = false
      this.init()
    }
  }
}