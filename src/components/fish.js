export default {
  name: 'Fish',
  data () {
    return {
      title: 'Fish',
      score: 0,
      step: 0,
      cards1: [],
      cards2: [],
      ssArr: [],
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
    // 摸牌
    hit (cards, arr) {
      return new Promise((resolve) => {
        var currentCard = cards.shift()
        var value = currentCard >> 2
        if (value == 13) {
          arr.push(currentCard)
          this.ssArr.push(currentCard)
          return setTimeout(() => {
            this.ssArr.splice(0)
            arr.push(...((this.step % 2) == 0 ? this.cards2 : this.cards1).splice(currentCard == 53 ? -5 : -3))
            resolve()
          }, 1000)
        }
        var index = (value == 10) ? 0 : arr.findIndex(item => (item >> 2) == value)
        arr.push(currentCard)
        if (index < 0) {
          return resolve()
        } else {
          this.ssArr.push(currentCard, arr[index])
          setTimeout(() => {
            this.ssArr.splice(0)
            cards.push(...arr.splice(index))
            resolve()
          }, 1000)
        }
      })
    },
    pass () {
      this.lockflag = false
      if (!this.winflag && !this.loseflag) {
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
    score2 () {
      if (this.score2 === 0) {
        this.winflag = true
      }
    },
    score1 () {
      if (this.score1 === 0) {
        this.loseflag = true
        // clearInterval(this.timer)
      }
    }
  }
}