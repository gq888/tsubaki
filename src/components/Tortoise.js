import {
  shuffleCards,
  wait,
} from '../utils/help.js'

export default {
  name: 'Tortoise',
  data () {
    return {
      title: 'Tortoise',
      sign: -1,
      cards1: [],
      cards2: [],
      arr: [],
      next: [],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 54,
      map: [
        {'z-index': 0, left: '10%', top: '75px', up: [16, 30]},
        {'z-index': 0, left: '30%', top: '75px', up: [16, 17, 31]},
        {'z-index': 0, left: '50%', top: '75px', up: [17, 18, 31]},
        {'z-index': 0, left: '70%', top: '75px', up: [18, 32]},
        {'z-index': 0, left: '10%', top: '225px', up: [16, 19, 37]},
        {'z-index': 0, left: '30%', top: '225px', up: [16, 17, 19, 20]},
        {'z-index': 0, left: '50%', top: '225px', up: [17, 18, 20, 21]},
        {'z-index': 0, left: '70%', top: '225px', up: [18, 21, 33]},
        {'z-index': 0, left: '10%', top: '375px', up: [19, 22, 37]},
        {'z-index': 0, left: '30%', top: '375px', up: [19, 20, 22, 23]},
        {'z-index': 0, left: '50%', top: '375px', up: [20, 21, 23, 24]},
        {'z-index': 0, left: '70%', top: '375px', up: [21, 24, 33]},
        {'z-index': 0, left: '10%', top: '525px', up: [22, 36]},
        {'z-index': 0, left: '30%', top: '525px', up: [22, 23, 35]},
        {'z-index': 0, left: '50%', top: '525px', up: [23, 24, 35]},
        {'z-index': 0, left: '70%', top: '525px', up: [24, 34]},
        {'z-index': 1, left: '20%', top: '150px', up: [25]},
        {'z-index': 1, left: '40%', top: '150px', up: [25, 26]},
        {'z-index': 1, left: '60%', top: '150px', up: [26]},
        {'z-index': 1, left: '20%', top: '300px', up: [25, 27]},
        {'z-index': 1, left: '40%', top: '300px', up: [25, 26, 27, 28]},
        {'z-index': 1, left: '60%', top: '300px', up: [26, 28]},
        {'z-index': 1, left: '20%', top: '450px', up: [27]},
        {'z-index': 1, left: '40%', top: '450px', up: [27, 28]},
        {'z-index': 1, left: '60%', top: '450px', up: [28]},
        {'z-index': 2, left: '30%', top: '225px', up: [29]},
        {'z-index': 2, left: '50%', top: '225px', up: [29]},
        {'z-index': 2, left: '30%', top: '375px', up: [29]},
        {'z-index': 2, left: '50%', top: '375px', up: [29]},
        {'z-index': 3, left: '40%', top: '300px', up: []},
        {'z-index': 1, left: '0', top: '0', up: [38]},
        {'z-index': 1, left: '40%', top: '0', up: [39]},
        {'z-index': 1, left: '80%', top: '0', up: [40]},
        {'z-index': 1, left: '80%', top: '300px', up: [41]},
        {'z-index': 1, left: '80%', top: '600px', up: [42]},
        {'z-index': 1, left: '40%', top: '600px', up: [43]},
        {'z-index': 1, left: '0', top: '600px', up: [44]},
        {'z-index': 1, left: '0', top: '300px', up: [45]},
        {'z-index': 2, left: '0', top: '37.5px', up: [46]},
        {'z-index': 2, left: '35%', top: '0', up: [47]},
        {'z-index': 2, left: '75%', top: '0', up: [48]},
        {'z-index': 2, left: '80%', top: '262.5px', up: [49]},
        {'z-index': 2, left: '80%', top: '562.5px', up: [50]},
        {'z-index': 2, left: '45%', top: '600px', up: [51]},
        {'z-index': 2, left: '5%', top: '600px', up: [52]},
        {'z-index': 2, left: '0', top: '337.5px', up: [53]},
        {'z-index': 3, left: '0', top: '75px', up:[]},
        {'z-index': 3, left: '30%', top: '0', up:[]},
        {'z-index': 3, left: '70%', top: '0', up:[]},
        {'z-index': 3, left: '80%', top: '225px', up:[]},
        {'z-index': 3, left: '80%', top: '525px', up:[]},
        {'z-index': 3, left: '50%', top: '600px', up:[]},
        {'z-index': 3, left: '10%', top: '600px', up:[]},
        {'z-index': 3, left: '0', top: '375px', up:[]},
      ]
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
      this.autoCalc()
    },
    async stepFn () {
      if (this.step >= this.number) {
        return;
      }
      this.hitflag = false
      let next, next_i, max = -1
      let fn = (temp) => {
        if (temp == this.sign) {
          return
        }
        if (this.done(temp)) {
          return
        }
        let index = this.cards1.indexOf(temp)
        if (this.check(index) && this.map[index]['z-index'] > max) {
          next = temp
          next_i = index
          max = this.map[index]['z-index']
        }
      }
      if (this.sign != -1 && this.sign << 2 != this.next[0] << 2) {
        let card = this.sign >> 2
        for(let i = 0; i < 4; i++) {
          let temp = card * 4 + i;
          fn(temp)
        }
      }
      if (max < 0) {
        for (let temp of this.next) {
          fn(temp)
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
    autoCalc () {
      let step = this.step
      if (step >= this.number) {
        this.winflag = true
        return
      }
      let temp = [], i, max = -1, m = -1, d = false
      for (i = this.number - 1; i >= 0; i--) {
        if (!this.done(i)) {
          let card = this.cards1.indexOf(i)
          if (this.check(card)) {
            temp.push(i)
            if (this.map[card]['z-index'] > max) {
              max = this.map[card]['z-index']
            }
          }
        } else {
          d = true
        }
        if (i % 4 == 0) {
          if (temp.length > 1){
            if (d) {
              this.next = temp
              return
            }
            if (max > m) {
              this.next = temp
              m = max
            }
          }
          max = -1
          temp = []
          d = false
        }
      }
      if (m < 0) {
        this.loseflag = true
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