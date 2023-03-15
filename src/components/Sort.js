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
      cards.splice(0, 0, 49)
      cards.splice(14, 0, 48)
      cards.splice(28, 0, 51)
      cards.splice(42, 0, 50)
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
          id,
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
        if (card >= 4) {
          over = false
          if (this.cards1[index + 1] < 0 && card >= 8) {
            prior.push([this.cards1[index + 1], id])
            temp[id].priority++
            temp[id]._in++
          }
          let next_i = this.cards1.indexOf(card - 4)
          if (this.cards1[next_i - 1] < 4 || this.cards1[next_i + 1] < 0) {
            if (this.cards1[next_i - 1] < 0 && this.cards1[next_i - 2] >= 8) {
              prior.push([id, this.cards1[next_i - 1]])
              temp[this.cards1[next_i - 1]].proirity++
              temp[this.cards1[next_i - 1]]._in++
            }
            if (this.cards1[next_i + 1] < 0) {
              prior.push([id, this.cards1[next_i + 1]])
              temp[this.cards1[next_i + 1]].priority++
              temp[this.cards1[next_i + 1]]._in++
            }
            if (this.cards1[next_i - 1] >> 2 == 0) {
              let c = this.cards1[next_i - 1] + 4
              c += 4
              next_i -= 2
              while (this.cards1[next_i] == c && next_i % 14 > 0) {
                next_i--
                c += 4
              }
              if (next_i % 14 == 0) {
                continue
              }
              let prev_i = this.cards1.indexOf(c)
              if (this.cards1[prev_i + 1] < 0) {
                prior.push([id, this.cards1[prev_i + 1]])
                temp[this.cards1[prev_i + 1]].priority++
                temp[this.cards1[prev_i + 1]]._in++
              }
            }
            continue
          }
        } else if (card >= 0) {
          card += 4
          index -= 2
          while (this.cards1[index] == card && index % 14 > 0) {
            index--
            card += 4
          }
          if (index % 14 == 0) {
            continue
          }
          let prev_i = this.cards1.indexOf(card)
          if (this.cards1[prev_i + 1] < 0) {
            prior.push([id, this.cards1[prev_i + 1]])
            temp[this.cards1[prev_i + 1]].priority++
            temp[this.cards1[prev_i + 1]]._in++
          }
        }
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
        let s = 0
        for (let i = 0; i < signs.length; i++) {
          if (temp[signs[i]]._in <= 0) {
            s = signs[i]
            signs.splice(i, 1)
            break
          }
        }
        if (s < 0) {
          let j = 0
          while (j < prior.length) {
            if (prior[j][0] == s) {
              temp[prior[j][1]]._in--
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
            console.log(p, prior, road, signs)
            let index = road.indexOf(prior[p][0])
            if (index >= 0) {
              temp[prior[p][1]]._in--
              temp[prior[p][1]].priority--
              prior.splice(p, 1)
              for (let i = 0; i < index; i++) {
                for (let j = 0; j < prior.length; j++) {
                  if (prior[j][0] == road[i] && prior[j][1] == road[i + 1]) {
                    temp[prior[j][1]]._in--
                    temp[prior[j][1]].priority--
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
      let min = 99, max = -1
      for (let i = -4; i < 0; i++) {
        let t = temp[i]
        if (!t.able) {
          continue
        }
        if (t.card < 4) {
          continue
        }
        let diff = Math.abs((t.card - 4 >> 2) - 12 + (t.index % 14))
        if (t.priority > max || t.priority == max && diff < min) {
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