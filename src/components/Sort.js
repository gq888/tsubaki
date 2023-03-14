import {
  shuffleCards,
  wait,
} from '../utils/help.js'

export default {
  name: 'Sort',
  data () {
    return {
      title: 'Sort',
      sign: -1,
      cards1: [],
      cards2: [],
      arr: [],
      types: ['♠', '♥', '♦', '♣'],
      point: ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 52,
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
      cards.splice(cards.indexOf(51), 1, -1)
      cards.splice(cards.indexOf(50), 1, -2)
      cards.splice(cards.indexOf(49), 1, -3)
      cards.splice(cards.indexOf(48), 1, -4)
      cards.splice(0, 0, 51)
      cards.splice(14, 0, 50)
      cards.splice(28, 0, 49)
      cards.splice(42, 0, 48)
    },
    async stepFn () {
      if (this.step >= this.number) {
        return;
      }
      this.hitflag = false
      let next, next_i, max = -1
      if (this.sign != -1 && this.sign << 2 != this.next[0] << 2) {
        let card = this.sign >> 2
        for(let i = 0; i < 4; i++) {
          let temp = card * 4 + i;
          if (temp == this.sign) {
            continue
          }
          if (this.done(temp)) {
            continue
          }
          let index = this.cards1.indexOf(temp)
          if (this.check(index) && this.map[index]['z-index'] > max) {
            next = temp
            next_i = index
            max = this.map[index]['z-index']
          }
        }
      } else {
        for (let temp of this.next) {
          if (temp == this.sign) {
            continue
          }
          if (this.done(temp)) {
            continue
          }
          let index = this.cards1.indexOf(temp)
          if (this.check(index) && this.map[index]['z-index'] > max) {
            next = temp
            next_i = index
            max = this.map[index]['z-index']
          }
        }
      }
      this.clickCard(next, next_i)
      this.hitflag = true
    },
    check (i) {
      return this.map[i] && this.map[i].up.findIndex(up => !this.done(this.cards1[up])) < 0
    },
    done (card) {
      return this.cards2.indexOf(card) >= 0
    },
    clickCard (card, i) {
      if (!this.check(i)) {
        return;
      }
      if (this.sign == card) {
        this.sign = -1
      } else if (this.sign >> 2 != card >> 2) {
        this.sign = card
      } else {
        this.cards2.push(this.sign, card)
        this.sign = -1
      }
    },
    undo () {
      this.sign = -1
      this.cards2.pop()
      this.cards2.pop()
      this.loseflag = false
      this.lockflag = true
    },
    async pass () {
      this.lockflag = false
      if (!this.winflag && !this.loseflag) {
        await this.stepFn()
        await wait(1000)
        this.pass()
      }
    },
    goon () {
      this.sign = -1
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