import {
  shuffleCards,
  wait,
} from '../utils/help.js'
import move from '../directives/move.js'

export default {
  name: 'Spider',
  data () {
    return {
      title: 'Spider',
      cards0: [],
      cards1: [],
      cards2: [],
      cards3: [],
      cards4: [],
      cards5: [],
      cards6: [],
      cards7: [],
      cards8: [],
      cards9: [],
      cards: [[], [], [], [], [], [], [], [], [], []],
      fresh: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      arr: [],
      sign: -99,
      index: -99,
      dragCard: -99,
      dragItem: -99,
      enterItem: -99,
      turn: 1,
      types: ['♥', '♠', '♦', '♣'],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 52,
    }
  },
  directives: {move},
  created: function () {
    this.init()
  },
  // 初始化
  methods: {
    init () {
      let cards = this.cards[0]
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number)
      for (let i = 6; i < 10; i++) {
        this.cards[i].push(this.cards[0].splice(-1)[0])
      }
    },
    findPos (card) {
      for (let i = 2; i < 10; i++) {
        if(this.cards[i].indexOf(card) >= 0) {
          return i
        }
      }
      return -99
    },
    checkDown (card) {
      console.log('down', card)
      let type = card % 2
      let level = card >> 2
      if (level == 12) {
        return false
      }
      let up1 = ((level + 1) % 13) * 4 + !type
      let up2 = up1 + 2
      let pos1 = this.findPos(up1)
      let pos2 = this.findPos(up2)
      if (pos1 < 0 && pos2 < 0) {
        return false
      } else if (pos1 >= 6 && pos2 >= 6) {
        let pos = this.findPos(card)
        let top1 = this.cards[pos1][this.cards[pos1].length - 1]
        let top2 = this.cards[pos2][this.cards[pos2].length - 1]
        if (top1 != up1 && top2 != up2) {
          return false
        }
        if (pos == (top1 == up1 ? pos1 : pos2)) {
          return false
        }
        return [pos, top1 == up1 ? pos1 : pos2]
      }
      if (pos1 >= 6 || pos2 >= 6) {
        let cards = pos1 >= 6 ? this.cards[pos1] :this.cards[pos2]
        let up = pos1 >= 6 ? up1 : up2
        let index = cards.indexOf(up)
        if (index == cards.length - 1) {
          let pos = this.findPos(card)
          if (pos == (pos1 >= 6 ? pos1 : pos2)) {
            return false
          }
          return [pos, pos1 >= 6 ? pos1 : pos2]
        }
        return this.checkUp(cards[index + 1])
      }
      let first
      if (pos1 - 2 == up1 % 4) {
        let i = 0
        let top = this.cards[pos1][this.cards[pos1].length - 1]
        while (top - 4 * i >= up1) {
          let res = this.checkDown(top - 4 * i)
          if (!res) {
            break
          }
          if (!first) {
            first = res
          }
          i++
        }
        if (top - 4 * i < up1) {
          return first
        }
      }
      if (pos2 - 2 == up2 % 4) {
        let i = 0
        let top = this.cards[pos2][this.cards[pos2].length - 1]
        while (top - 4 * i >= up2) {
          let res = this.checkDown(top - 4 * i)
          if (!res) {
            break
          }
          if (!first) {
            first = res
          }
          i++
        }
        if (top - 4 * i < up2) {
          return first
        }
      }
      return false
    },
    checkUp (card) {
      console.log('up', card)
      if (this.record[card] !== undefined) {
        // return this.record[card]
      }
      this.record[card] = false
      let type = card % 4
      let level = card >> 2
      let first = false
      for (let i = 0; i <= level; i++) {
        let temp = i * 4 + type
        let pos = this.findPos(temp)
        if (pos < 0) {
          if (i == level) {
            first = first || [pos, type + 2]
            break
          }
          return false
        }
        if (pos == type + 2) {
          continue
        }
        let index = this.cards[pos].indexOf(temp)
        if (index == this.cards[pos].length - 1) {
          first = first || [pos, type + 2]
          continue
        }
        let res = this.checkMove(this.cards[pos][index + 1])
        if (!res) {
          return false
        }
        if (!first) {
          first = res
        }
      }
      this.record[card] = first
      return first
    },
    checkMove (card) {
      console.log('move', card)
      return this.checkDown(card) || this.checkUp(card)
    },
    async stepFn () {
      this.hitflag = false
      let next = false;
      for (let i = 6; i < 10; i++) {
        this.record = []
        next = this.checkMove(this.cards[i][0])
        if (next) {
          break
        }
      }
      this.record = []
      !next && this.cards[1].length > 0 && (next = this.checkMove(this.cards[1][0]))
      if (!next) {
        this.hitflag = true
        return this.clickCard(0)
      }
      this.sign = -99
      await this.clickCard(next[0] < 0 ? 1 : next[0])
      console.log(next, this.sign)
      await wait(1000)
      await this.clickCard(next[1])
      this.hitflag = true
    },
    async addCard () {
      for (let i = 6; i < 10; i++) {
        if (this.cards[i].length <= 0) {
          if (this.cards[1].length > 0) {
            this.arr.push([i, 1, 0, 1])
            this.cards[i].push(this.cards[1].splice(0, 1)[0])
          } else if (this.cards[0].length > 0) {
            this.arr.push([i, 0, this.cards[0].length - 1, 1])
            this.cards[i].push(this.cards[0].splice(-1)[0])
          }
        }
      }
      if (this.cards[0].length <= 0 && this.cards[1].length <= 0) {
        if (this.lock) {
          return false
        }
        this.dragCard = -99
        this.dragItem = -99
        this.enterItem = -99
        this.lock = true
        for (let i = 0; i < this.number; i++) {
          let type = i % 4
          while (this.cards[type + 2].length <= i >> 2) {
            this.sign = -99
            let next = this.checkUp(i)
            await this.clickCard(next[0])
            await wait(500)
            await this.clickCard(next[1])
            for (let i = 6; i < 10; i++) {
              if (this.cards[i].length <= 0) {
                for (let j = 6; j < 10; j++) {
                  if (this.cards[j].length > 1) {
                    this.cards[i].push(this.cards[j].splice(-1)[0])
                  }
                }
              }
            }
          }
        }
        this.sign = -99
        this.winflag = true
        this.lock = false
      }
    },
    async clickCard (index) {
      let len = this.cards[index].length
      if (index == 0) {
        if (this.cards[0].length > 0) {
          this.arr.push([1, 0, this.turn > 3 ? 1 : 4 - this.turn])
          this.cards[1].unshift(...this.cards[0].splice(this.turn > 3 ? -1 : this.turn - 4))
        } else {
          this.arr.push([0, 1, this.cards[1].length])
          this.cards[0].unshift(...this.cards[1].splice(0))
          this.turn++
        }
        this.sign = -99
      } else if (index == 1) {
        if (len > 0) {
          this.sign = this.cards[index][0]
          this.index = index
        }
      } else if (index < 6) {
        if (this.sign == index - 2 + len * 4) {
          this.arr.push([index, this.index, this.cards[this.index].indexOf(this.sign), 1])
          this.cards[index].push(this.cards[this.index].splice(this.cards[this.index].indexOf(this.sign), 1)[0])
          this.sign = -99
        } else {
          if (len > 0) {
            this.sign = this.cards[index][len - 1]
            this.index = index
          }
        }
      } else {
        let top = this.cards[index][len - 1], i
        if (this.index >= 6 && (i = this.cards[this.index].findIndex(card => {
            return card >> 2 < 12 && card % 2 != top % 2 && ((card >> 2) + 1) % 13 == (top >> 2)
          })) >= 0) {
          this.arr.push([index, this.index, i, this.cards[this.index].length - i])
          this.cards[index].push(...this.cards[this.index].splice(i))
          this.sign = -99
        } else if (this.index < 6 && this.sign >> 2 < 12 && this.sign % 2 != top % 2 && ((this.sign >> 2) + 1) % 13 == (top >> 2)) {
          this.arr.push([index, this.index, this.cards[this.index].indexOf(this.sign), 1])
          this.cards[index].push(this.cards[this.index].splice(this.cards[this.index].indexOf(this.sign), 1)[0])
          this.sign = -99
        } else {
          if (len > 0) {
            this.sign = top
            this.index = index
          }
        }
      }
      if (this.sign < 0) {
        await this.addCard()
      }
    },
    undo () {
      this.sign = -99
      if (this.step <= 0) {
        return
      }
      let temp = this.arr.pop(), add = false
      if (temp[1] == 0) {
        if (temp[0] == 1)
          return this.cards[0].push(...this.cards[1].splice(0, temp[2]))
        else {
          add = true
          this.cards[0].push(this.cards[temp[0]].splice(0, 1)[0])
        }
      } else if (temp[1] == 1) {
        if (temp[0] != 0) {
          console.log(temp, this.cards[temp[0]])
          this.cards[1].unshift(this.cards[temp[0]].splice(-1)[0])
          add = true
          if (temp[0] < 6 || this.cards[temp[0]].length > 0){
            return
          }
        } else {
          this.cards[1].unshift(...this.cards[0].splice(0))
          this.turn--
          return
        }
      }
      if (add) {
        temp = this.arr.pop()
      }
      console.log(this.cards[temp[1]])
      this.cards[temp[1]].splice(temp[2], 0, ...this.cards[temp[0]].splice(-temp[3]))
      console.log(this.cards[temp[1]])
    },
    start (e) {
      let item = e.detail.vnode.key % this.number
      console.log('start', item)
      if (!this.hitflag || !this.lockflag) {
        return false
      }
      let drag = this.findPos(item)
      if (drag < 0 && item != this.cards[1][0]) {
        return
      }
      let data = e.detail.vnode._moveData
      data.offsetLeft = e.detail.el.offsetLeft
      data.offsetTop = e.detail.el.offsetTop
      // this.sign = -99
      this.dragItem = drag
      if (this.dragItem < 0) {
        this.dragItem = 1
      }
      this.dragCard = item
      this.enterItem = -99
    },
    async end () {
      let enter = this.enterItem
      let drag = this.dragItem
      console.log('end',this.dragItem, drag, this.enterItem, enter)
      if (!this.hitflag || !this.lockflag) {
        return
      }
      if (drag == 1 && this.dragCard != this.cards[1][0]) {
        return
      }
      await this.clickCard(drag).catch(console.log)
      if (this.sign != -99 && enter != drag && enter >= 0) {
        await this.clickCard(enter).catch(console.log)
      }
      this.fresh[drag]++
      this.enterItem = -99
      this.dragItem = -99
      this.dragCard = -99
    },
    enter (item) {
      console.log('enter', item)
      // this.enterItem = item
    },
    leave (item) {
      console.log('leave', item)
      // if (this.enterItem == item) {
      //   this.enterItem = -99
      // }
    },
    moveEnter (item) {
      console.log("moveEnter", item, this.dragItem)
      if (item == this.dragItem) {
        return
      }
      this.enterItem = item
      this.moveflag = false
    },
    move (e) {
      if (!this.hitflag || !this.lockflag) {
        return false
      }
      if (this.dragItem == 1 && this.dragCard != this.cards[1][0]) {
        return
      }
      let data = e.detail.vnode._moveData
      e.detail.el.style.left = data.offsetX + data.offsetLeft + 'px'
      e.detail.el.style.top = data.offsetY + data.offsetTop + 'px'
      if (this.moveflag) {
        console.log("leave", this.enterItem, this.dragItem)
        this.enterItem = -99
        this.moveflag = false
      } else {
        this.moveflag = true
      }
      console.log("move", this.dragItem)
      if (this.dragItem >= 6) {
        let index= this.cards[this.dragItem].indexOf(this.dragCard)
        let j = 0
        for (let down of this.$refs.down) {
          let res = down.className.match("drag")
          if(!res || ++j <= index) {
            continue
          }
          down.style.left = data.offsetX + 'px'
          down.style.top = data.offsetY + (j - 1) * 30 + 'px'
        }
      }
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
      this.hitflag = true
      this.lockflag = true
      for (let i = 0; i < 10; i ++) {
        this.cards[i].splice(0)
      }
      this.fresh = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      this.turn = 1
      this.sign = -99
      this.dragItem = -99
      this.dragCard = -99
      this.enterItem = -99
      this.arr.splice(0)
      this.loseflag = false
      this.winflag = false
      this.init()
    },
  },
  computed: {
    step () {
      return this.arr.length
    },
  },
}