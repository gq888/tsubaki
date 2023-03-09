export default {
  name: 'Fish',
  data () {
    return {
      title: 'Fish',
      diff1: 0,
      diff2: 0,
      step: 0,
      cards1: [],
      cards2: [],
      ssArr: [],
      flyin1: [],
      flyin2: [],
      flyout1: [],
      flyout2: [],
      cardsIndex: '',
      arr: [],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      timer: ''
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
      this.cards2.push(...cards.splice(27))
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
      await this.hit((this.step % 2) == 0 ? this.cards1 : this.cards2, this.arr).then(() => {
        this.hitflag = true
        this.step ++;
      })
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
          arr.push(...((this.step % 2) == 0 ? this.cards2 : this.cards1).splice(0, currentCard == 53 ? 5 : 3))
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
      if (!this.winflag && !this.loseflag) {
        this.stepFn().then(() => {
          console.log(this.arr, this.cards1,this.cards2)
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
      this.loseflag = false
      this.winflag = false
      // clearInterval(this.timer)
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
    }
  },
  watch: {
    score2 (val, old) {
      if (val === 0) {
        this.loseflag = true
      } else {
        this.diff2 = val - old
        this.time(() => {
          this.diff2 = 0
        }, 800)
      }
    },
    score1 (val, old) {
      if (val === 0) {
        this.winflag = true
        // clearInterval(this.timer)
      } else {
        this.diff1 = val - old
        this.time(() => {
          this.diff1 = 0
        }, 800)
      }
    }
  }
}