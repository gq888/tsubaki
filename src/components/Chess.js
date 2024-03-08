import {
  shuffleCards,
  wait,
} from '../utils/help.js'

let _modes = [
  [1, 0],
  [1, 1],
  [2, 1],
  [2, 2],
  [3, 1],
  [3, 2],
  [3, 3],
]

export default {
  name: 'Chess',
  data () {
    return {
      title: 'Chess',
      cards1: [],
      cards2: [],
      arr: [],
      sign: -1,
      sign2: -2,
      step: 0,
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 36,
      n: 0,
      grade: -1,
      modes: [
        0, 1, 3, 6, 10, 15,
        2, 5, 7, 13, 18, 21,
        4, 8, 14, 17, 24, 27,
        9, 12, 20, 25, 26, 31,
        11, 19, 23, 29, 30, 35,
        16, 22, 28, 32, 34, 33,
      ],
      grades: [
        1, 0, 0, 1, 1, 0,
        0, 0, 0, 0, 0, 0,
        1, 1, 0, 0, 0, 1,
        1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 1, 1,
      ],
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
      // return cards.splice(0, 0, ...this.modes)
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number)
    },
    getValidBoxes (index) {
      let item = this.cards1[index];
      let mode = this.modes.indexOf(item);
      let h = _modes[Math.floor(mode / 6)], v = _modes[mode % 6];
      let arr = []
      if (index + v[0] * 6 < 36 && (index % 6) + v[1] < 6) arr.push[index + v[0] * 6 + v[1]]
      if (index - v[0] * 6 >= 0 && (index % 6) + v[1] < 6) arr.push[index - v[0] * 6 + v[1]]
      if (index + v[0] * 6 < 36 && (index % 6) - v[1] >= 0) arr.push[index + v[0] * 6 - v[1]]
      if (index - v[0] * 6 >= 0 && (index % 6) - v[1] >= 0) arr.push[index - v[0] * 6 - v[1]]
      if (index + h[1] * 6 < 36 && (index % 6) + h[0] < 6) arr.push[index + h[1] * 6 + h[0]]
      if (index - h[1] * 6 >= 0 && (index % 6) + h[0] < 6) arr.push[index - h[1] * 6 + h[0]]
      if (index + h[1] * 6 < 36 && (index % 6) - h[0] >= 0) arr.push[index + h[1] * 6 - h[0]]
      if (index - h[1] * 6 >= 0 && (index % 6) - h[0] >= 0) arr.push[index - h[1] * 6 - h[0]]
      return arr
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
      console.log(1)
      if (this.grade < 0) {
        this.grade = this.grades[card]
      }
      if (this.sign < 0 && !this.cards2[card]) {//} this.cards2.indexOf(card) < 0) {
        // this.cards2.push(card)
        this.$set(this.cards2, card, true)
      console.log(2)
        return
      }
      if (this.sign >= 0 && this.grades[this.sign] != this.grade) {
        
          console.log(3)
        this.sign = -1
        return
      }
      if (this.sign == card) {
        this.sign = -1
      } else if (this.sign >> 2 != card >> 2) {
        this.sign = card
      } else {
        this.cards2.push(this.sign, card)
        this.sign = -1
      }
      if (this.sign == card || this.cards2[card]) {
        return
      }
      this.arr[card] = true
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
    },
    undo() {},
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
      this.sign = -1
      this.sign2 = -1
      this.grade = -1
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