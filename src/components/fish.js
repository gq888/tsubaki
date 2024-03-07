import message from './message.vue'

export default {
  name: 'Fish',
  components: {
    message
  },
  data () {
    return {
      title: 'FISHING CONTEST OF DOG TEAM',
      diff1: 0,
      diff2: 0,
      diff3: 0,
      diff4: 0,
      step: 0,
      cards1: [],
      cards2: [],
      cards3: [],
      cards4: [],
      ssArr: [],
      flyin1: [],
      flyin2: [],
      flyout1: [],
      flyout2: [],
      cardsIndex: '',
      arr: [],
      winflag: false,
      hitflag: true,
      lockflag: true,
      timer: '',
    }
  },
  created: function () {
    this.init(this.cards1)
  },
  // 初始化
  methods: {
    init () {
      let cards = this.cards1
      this.arr.splice(0)
      for (let i = 0; i < 54; i++) {
        cards.push(i);
      }
      this.shuffleCards(cards)
      this.cards2.push(...cards.splice(-14))
      this.cards3.push(...cards.splice(-13))
      this.cards4.push(...cards.splice(-13))
      console.log(cards,this.cards2,this.cards3)
    },
    // 洗牌
    shuffleCards (cards) {
      let rand, tmp
      for (let i = 0; i < 1000; i++) {
        rand = Math.floor(Math.random() * 53)
        tmp = cards[53]
        cards[53] = cards[rand]
        cards[rand] = tmp
      }
      return cards
    },
    async stepFn () {
      this.hitflag = false
      let cards = this['cards' + ((this.step % 4) + 1)]
      while (cards.length <= 0) {
        this.step++
        cards = this['cards' + ((this.step % 4) + 1)]
      }
      await this.hit(cards, this.arr)
      let i
      for (i = 1; i <= 4; i++) {
        if ((this.step % 4) + 1 != i && this['cards' + i].length > 0) {
          break
        }
      }
      if (i > 4) {
        this.winflag = true
        return
      }
      this.hitflag = true
      this.step ++;
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
      // var type = (this.step % 2) == 0 ? 'flyout1' : 'flyout2'
      // this[type].push(item)
      // await this.time(() => {
      //   this[type].splice(0)
      // }, 500)
    },
    // 摸牌
    async hit (cards, arr) {
      var currentCard = cards.shift()
      var value = currentCard >> 2
      if (value == 13) {
        this.push(arr, currentCard)
        this.ssArr.push(currentCard)
        return await this.time(() => {
          this.ssArr.splice(0)
          for (let i = 1; i <= 4; i++) {
            i != (this.step % 4) + 1 && arr.push(...this['cards' + i].splice(0, currentCard == 53 ? 5 : 3))
          }
          // arr.push(...((this.step % 2) == 0 ? this.cards2 : this.cards1).splice(0, currentCard == 53 ? 5 : 3))
        }, 1000)
      }
      var index = (value == 10) ? 0 : arr.findIndex(item => (item >> 2) == value)
      this.push(arr, currentCard)
      if (index < 0) {
        return
      }
      this.ssArr.push(currentCard, arr[index])
      await this.time(() => {
        this.ssArr.splice(0)
        cards.push(...arr.splice(index))
      }, 1000)
    },
    pass () {
      this.lockflag = false
      if (!this.winflag) {
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
      this.cards3.splice(0)
      this.cards4.splice(0)
      this.winflag = false
      this.init()
    }
  },
  computed: {
    // 监听点数
    score1: function () {
      return this.cards1.length;
    },
    score2: function () {
      return this.cards2.length;
    },
    score3: function () {
      return this.cards3.length;
    },
    score4: function () {
      return this.cards4.length;
    },
  },
  watch: {
    score4 (val, old) {
      this.diff4 = val - old
      this.time(() => {
        this.diff4 = 0
      }, 800)
    },
    score3 (val, old) {
      this.diff3 = val - old
      this.time(() => {
        this.diff3 = 0
      }, 800)
    },
    score2 (val, old) {
      this.diff2 = val - old
      this.time(() => {
        this.diff2 = 0
      }, 800)
    },
    score1 (val, old) {
      this.diff1 = val - old
      this.time(() => {
        this.diff1 = 0
      }, 800)
    }
  }
}