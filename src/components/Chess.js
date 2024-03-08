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
  computed: {
    validBoxes () {
      return this.getValidBoxes(this.sign)
    },
    lowCount () {
      console.log(1)
      return this.cards1.filter(item => this.grades[item] === 0).length
    },
    highCount () {
      return this.cards1.filter(item => this.grades[item] === 1).length
    },
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
    getValidBoxes (item) {
      let arr = []
      // let item = this.cards1[index];
      let index = this.cards1.indexOf(item)
      if (item < 0 || index < 0) {
        return arr
      }
      let mode = this.modes.indexOf(item);
      let h = _modes[Math.floor(mode / 6)], v = _modes[mode % 6];
      if (index + v[0] * 6 < 36 && (index % 6) + v[1] < 6) arr.push(index + v[0] * 6 + v[1])
      if (index - v[0] * 6 >= 0 && (index % 6) + v[1] < 6) arr.push(index - v[0] * 6 + v[1])
      if (index + v[0] * 6 < 36 && (index % 6) - v[1] >= 0) arr.push(index + v[0] * 6 - v[1])
      if (index - v[0] * 6 >= 0 && (index % 6) - v[1] >= 0) arr.push(index - v[0] * 6 - v[1])
      if (index + h[1] * 6 < 36 && (index % 6) + h[0] < 6) arr.push(index + h[1] * 6 + h[0])
      if (index - h[1] * 6 >= 0 && (index % 6) + h[0] < 6) arr.push(index - h[1] * 6 + h[0])
      if (index + h[1] * 6 < 36 && (index % 6) - h[0] >= 0) arr.push(index + h[1] * 6 - h[0])
      if (index - h[1] * 6 >= 0 && (index % 6) - h[0] >= 0) arr.push(index - h[1] * 6 - h[0])
      // console.log(index, mode, h, v, arr)
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
    async clickCard (card, i) {
      if (this.grade < 0) {
        this.grade = this.grades[card]
      }
      if (card >= 0 && !this.cards2[card]) {
        this.$set(this.cards2, card, true)
        this.sign = -1
        return
      }
      if (this.sign >= 0 && this.grades[this.sign] != this.grade) {
        this.sign = card != this.sign && card >= 0 && this.grades[card] != this.grade ? card : -1
        return
      }
      if (this.sign >= 0 && this.grades[this.sign] == this.grade) {
        if (card >= 0 && this.grades[card] == this.grade) {
          this.sign = this.sign == card ? -1 : card
          return
        }
        if (this.validBoxes.indexOf(i) >= 0) {
          this.$set(this.cards1, this.cards1.indexOf(this.sign), -1)
          this.$set(this.cards1, i, this.sign)
          if (card >= 0) {
            this.$set(this.arr, card, true)
            if (this.lowCount <= 0) if (this.grade == 1) this.winflag = true; else this.loseflag = true;
            if (this.highCount <= 0) if (this.grade == 0) this.winflag = true; else this.loseflag = true;
          }
          this.sign = -1
          return
        }
      }
      this.sign = card
      // this.hitflag = false
      // this.sign2 = card
      // await wait(500)
      // this.sign = -1
      // this.sign2 = -1
      // this.hitflag = true
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
      this.sign = -1
      this.grade = -1
      this.hitflag = true
      this.lockflag = true
      this.cards1.splice(0)
      this.cards2.splice(0)
      this.arr.splice(0)
      this.loseflag = false
      this.winflag = false
      this.init()
    },
  },
}