import {
  shuffleCards,
  wait,
} from '../utils/help.js'

export default {
  name: 'Pairs',
  data () {
    return {
      title: 'Pairs',
      cards1: [],
      cards2: [],
      arr: [],
      sign: -1,
      sign2: -2,
      step: 0,
      time: 0,
      timer: 0,
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 54,
      n: 0,
    }
  },
  created: function () {
    this.init()
  },
  // 初始化
  methods: {
    init () {
      let cards = this.cards1
      this.cards2.splice(0)
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number)
    },
    async stepFn () {
      if (this.sign >= 0) {
        for (let i = 0; i < 4; i++) {
          let sign = this.sign - (this.sign % 4) + i
          if (sign != this.sign && this.arr[sign] && !this.cards2[sign]) {
            return await this.clickCard(sign)
          }
        }
      } else {
        let num
        for (let i = 0; i < this.number; i ++) {
          if (i % 4 == 0) {
            num = 0
          }
          if (this.arr[i] && !this.cards2[i]) {
            num ++
          }
          if (num > 1) {
            return await this.clickCard(i)
          }
        }
      }
      for (let i = 0; i < this.number; i++) {
        let c = this.cards1[i]
        if (!this.arr[c] && !this.cards2[c]) {
          return await this.clickCard(c)
        }
      }
    },
    async clickCard (card) {
      if (!this.timer) {
        this.timer = setInterval(() => {
          this.time++
        }, 1000)
      }
      if (this.sign == card || this.cards2[card]) {
        return
      }
      this.arr[card] = true
      this.step++
      if (this.sign < 0) {
        this.sign = card
        return
      }
      if (this.sign >> 2 == card >> 2) {
        this.$set(this.cards2, card, true)
        this.$set(this.cards2, this.sign, true)
        this.sign = -1
      }
      this.hitflag = false
      this.sign2 = card
      await wait(500)
      this.sign = -1
      this.sign2 = -1
      this.hitflag = true
      for (let i = 0; i < this.number; i++) {
        if (!this.cards2[i]) return
      }
      this.winflag = true
      clearInterval(this.timer)
      this.timer = 0
    },
    async pass () {
      this.lockflag = false
      if (!this.winflag && !this.loseflag) {
        await this.stepFn()
        await wait(500)
        this.pass()
      }
    },
    goon () {
      this.step = 0
      this.time = 0
      clearInterval(this.timer)
      this.timer = 0
      this.sign = -1
      this.sign2 = -1
      this.hitflag = true
      this.lockflag = true
      this.cards1.splice(0)
      this.arr.splice(0)
      this.loseflag = false
      this.winflag = false
      this.init()
    },
  },
}