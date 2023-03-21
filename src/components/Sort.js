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
      this.$set(cards, cards.indexOf(51), -1)
      this.$set(cards, cards.indexOf(50), -2)
      this.$set(cards, cards.indexOf(49), -3)
      this.$set(cards, cards.indexOf(48), -4)
      cards.splice(0, 0, 48)
      cards.splice(14, 0, 49)
      cards.splice(28, 0, 50)
      cards.splice(42, 0, 51)
      this.autoCalc()
    },
    async stepFn () {
      this.hitflag = false
      this.clickSign(this.next[1])
      await wait(1000)
      this.clickCard(this.next[0])
      this.hitflag = true
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
      let over = true, temp = {}, prior = []
      for (let id = -4; id < 0; id++) {
        let index = this.cards1.indexOf(id)
        let card = this.cards1[index - 1]
        temp[id] = {
          index,
          card: card,
          priority: 0,
          _in: 0,
          able: true,
        }
      }
      for (let id = -4; id < 0; id++) {
        let index = temp[id].index
        let card = temp[id].card
        let prev_a = []
        let prevFn = (prev_c, deep) => {
          prev_a.push(prev_c)
          if (prev_c < 0) {
            prior.push([id, prev_c, deep])
            temp[prev_c].priority++
            temp[prev_c]._in++
          } else {
            if (prev_c >= 48) {
              return
            }
            if (prev_a.indexOf(prev_c) >= 0) {
              return
            }
            prev_c = this.cards1[this.cards1.indexOf(prev_c + 4) + 1]
            prevFn(prev_c, ++deep)
          }
        }
        let nextFn = (next_i, next_c, deep) => {
          if (deep > 0 && next_c >= 8) {
            let prev_c = this.cards1[next_i + 1]
            prevFn(prev_c, ++deep)
          }
          next_c = this.cards1[next_i - 1]
          if (next_c < 4) {
            let n = next_i - 2
            let num = 1
            while (next_c < 0) {
              next_c = this.cards1[n]
              n--
              num++
            }
            if (next_c >= num * 4) {
              prior.push([id, this.cards1[next_i - 1], deep])
              temp[this.cards1[next_i - 1]].priority++
              temp[this.cards1[next_i - 1]]._in++
              return
            }
            next_c += 4
            while (this.cards1[n] == next_c && n % 14 > 0) {
              n--
              next_c += 4
            }
            if (n % 14 == 0) {
              return
            }
            let prev_c = this.cards1[this.cards1.indexOf(next_c) + 1]
            prevFn(prev_c, ++deep)
            return
          }
          next_i = this.cards1.indexOf(next_c - 4)
          nextFn(next_i, next_c, ++deep)
        }
        if (card >= 4) {
          let i = index - 1, type = card % 4
          let next_i = this.cards1.indexOf(card - 4)
          while (this.cards1[i] == (12 - (i % 14)) * 4 + type) {
            i--
          }
          if (i < 0 || i % 14 == 13) {
            if (card < 8 || next_i % 14 == 13 || this.cards1[next_i + 1] == card - 8) {
              this.next = [card - 4, index]
              return
            }
          }
          over = false
        }
        nextFn(index, id, 0)
      }
      if (over) {
        this.n = 0
        for (let i = 0; i < this.number + 4; i++) {
          if (this.cards1[i] >> 2 == 12 - (i % 14)) {
            this.n ++
          }
        }
        if (this.n >= this.number) {
          this.winflag = true
        } else {
          this.loseflag = true
        }
        return
      }
      let signs = [-1, -2, -3, -4]
      while (signs.length > 0) {
        let ind
        for (ind = 0; ind < signs.length; ind++) {
          if (temp[signs[ind]]._in <= 0) {
            break
          }
        }
        if (ind < signs.length) {
          let s = signs.splice(ind, 1)[0]
          let j = 0
          while (j < prior.length) {
            if (prior[j][0] == s) {
              temp[prior[j][1]]._in--
              temp[prior[j][1]].deep = prior[j][2]
              prior.splice(j, 1)
              temp[s].able = false
            } else {
              j++
            }
          }
        } else {
          let road = [signs[0]]
          while (prior.length > 0) {
            let p = prior.findIndex(t => t[1] == road[0])
            let index = road.indexOf(prior[p][0])
            if (index >= 0) {
              temp[prior[p][1]]._in--
              prior.splice(p, 1)
              for (let i = 0; i < index; i++) {
                for (let j = 0; j < prior.length; j++) {
                  if (prior[j][0] == road[i] && prior[j][1] == road[i + 1]) {
                    temp[prior[j][1]]._in--
                    prior.splice(j, 1)
                    break
                  }
                }
              }
              break
            }
            road.unshift(prior[p][0])
          }
        }
      }
      this.next = [-1, -1]
      let min = 999999, max = -1
      for (let i = -4; i < 0; i++) {
        let t = temp[i]
        if (t.card < 4) {
          continue
        }
        if (!t.able) {
          continue
        }
        let diff = t.deep || Math.abs((t.card - 4 >> 2) - 12 + (t.index % 14))
        if (t.priority > max || t.priority == max && t.deep < min) {
          this.next = [t.card - 4, t.index]
          min = diff
          max = t.priority
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