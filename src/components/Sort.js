import {
  shuffleCards,
  wait,
} from '../utils/help.js'

export default {
  name: 'Sort',
  data () {
    return {
      title: 'Sort',
      cards1: [],
      cards2: [],
      arr: [],
      types: ['♥', '♠', '♦', '♣'],
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
      this.$set(cards, cards.indexOf(51), -1)
      this.$set(cards, cards.indexOf(50), -2)
      this.$set(cards, cards.indexOf(49), -3)
      this.$set(cards, cards.indexOf(48), -4)
      cards.splice(0, 0, 51)
      cards.splice(14, 0, 50)
      cards.splice(28, 0, 49)
      cards.splice(42, 0, 48)
      this.autoCalc()
    },
    async stepFn () {
      this.hitflag = false
      this.clickSign(this.next[1])
      await wait(1000)
      this.clickCard(this.next[0])
      this.hitflag = true
    },
    check (i) {
      return this.map[i] && this.map[i].up.findIndex(up => !this.done(this.cards1[up])) < 0
    },
    done (card) {
      return this.cards2.indexOf(card) >= 0
    },
    clickCard (card, i) {
      if (!Number.isFinite(i)) {
        i = this.cards1.indexOf(card)
      }
      let index = this.cards1.indexOf(card + 4)
      if (index >= 0) {
        if (this.cards1[index + 1] < 0) {
          this.cards2.push([card, this.cards1[index + 1]])
          this.$set(this.cards1, i, this.cards1[index + 1])
          this.$set(this.cards1, index + 1, card)
        }
      }
      //   this.cards2.push(this.sign, card)
    },
    clickSign (i) {
      let card = this.cards1[i - 1]
      if (card < 4) {
        return
      }
      let temp = ((card >> 2) - 1) * 4 + (card % 4)
      let index = this.cards1.indexOf(temp)
      document.documentElement.scrollTop = window.document.body.scrollTop = (index % 14) * 150
    },
    undo () {
      let undo = this.cards2.pop()
      let i0 = this.cards1.indexOf(undo[0])
      let i1 = this.cards1.indexOf(undo[1])
      this.$set(this.cards1, i1, undo[0])
      this.$set(this.cards1, i0, undo[1])
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
      this.hitflag = true
      this.lockflag = true
      this.cards1.splice(0)
      this.arr.splice(0)
      this.loseflag = false
      this.winflag = false
      this.init()
    },
    autoCalc () {
      let over = true
      this.next = [-1]
      for (let i = -4; i < 0; i++) {
        let index = this.cards1.indexOf(i)
        let card = this.cards1[index - 1]
        if (card >= 4) {
          over = false
          if (card - 4 > this.next[0]) {
            this.next = [card - 4, index]
          }
        }
      }
      if (over) {
        let i
        for (i = 0; i < this.number + 4; i++) {
          if (this.cards1[i] >> 2 != i % 14) {
            break
          }
        }
        if (i >= this.number + 4) {
          this.winflag = true
        } else {
          this.loseflag = true
        }
      }
    }
  },
  watch: {
    step () {
      this.autoCalc()
    },
  },
  computed: {
    step () {
      return this.cards2.length
    },
  },
}