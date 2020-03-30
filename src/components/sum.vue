<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <div >
      <div class="row">
        <br/>
        <div>
          <ul class="cardsul">
            <li v-for="item in arr1" :key='item.id' class="card">{{ item.id }}</li>
          </ul>
        </div>
        <span class="scrore">{{score1}}</span>
      </div>
    </div>
  <div class="row">
    <div>
      <ul class="cardsul">
        <li v-for="item in arr2" :key='item.id' class="card">{{ item.id }}</li>
      </ul>
    </div>
    <span class="scrore">{{score2}}</span>
  </div>
<div class="btns">

  <input type="button" value="HIT" @click="hit(cardsChg,arr2)" v-if="hitflag"/>
  <input type="button" value="PASS" @click="pass" v-if="hitflag" />
</div>
    <transition>
    <div class="lose" v-if="loseflag">
      <h1>U LOSE</h1>
      <input type="button" value="AGAIN" @click="goon"/>
    </div>
    <div class="lose" v-if="winflag">
      <h1>U WIN!</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    <div class="draw lose" v-if="drawflag">
      <h1>DRAW GAME</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'Sum',
  data () {
    return {
      title: '迷之规则的BalckJack',
      arrCard: [],
      sum: 0,
      score: 0,
      cardsOrg: [],
      cardsChg: [],
      cardsIndex: '',
      types: ['♠', '♥', '♦', '♣'],
      point: ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'],
      arr1: [],
      arr2: [],
      loseflag: false,
      winflag: false,
      drawflag: false,
      hitflag: true,
      timer: ''
    }
  },
  created: function () {
    this.init(this.cardsChg)
    // console.log(this.cardsOrg)
    // console.log(this.cardsChg)
  },
  // mounted: function () {
  // },
  // 初始化
  methods: {
    init (cards) {
      this.arr1 = []
      this.arr2 = []
      this.getCards(this.cardsOrg)
      this.getCards(cards)
      this.shuffleCards(cards)
      console.log(cards)
      this.hit(cards, this.arr1)
      this.hit(cards, this.arr2)
      this.hit(cards, this.arr1)
      this.hit(cards, this.arr2)
    },
    // 获取牌库
    getCards (cards) {
      for (let i in this.types) {
        for (let j in this.point) {
          cards.push(this.types[i] + this.point[j])
        }
      }
      return cards
    },
    // 洗牌
    shuffleCards (cards) {
      let rand, tmp
      for (let i = 0; i < 1000; i++) {
        rand = this.getRandomInt(1, 51)
        tmp = cards[0]
        cards[0] = cards[rand]
        cards[rand] = tmp
      }
      return cards
    },
    // 取随机数
    getRandomInt (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    // 摸牌
    hit (cards, arr) {
      var currentCard = cards.shift()
      var value = (this.cardsOrg.indexOf(currentCard) + 1) % 13
      arr.push(
        {id: currentCard, value: value > 10 || value === 0 ? value = 10 : value})
    },
    // 计算点数
    getScore (ary, score) {
      let flag = false
      for (let i = 0; i < ary.length; i++) {
        score += ary[i].value
        if (ary[i].value === 1) {
          flag = true
        }
      }
      console.log(flag)
      if (score <= 11 && flag === true) {
        score += 10
      } else if (score > 21) {
        score = 0
      }
      return score
    },
    pass () {
      this.hitflag = false
      this.timer = setInterval(this.compare, 1000)
    },

    compare () {
      if (this.score1 === this.score2) {
        this.drawflag = true
      } if (this.score1 < this.score2) {
        this.hit(this.cardsChg, this.arr1)
      } else if (this.score1 > this.score2) {
        this.loseflag = true
        clearInterval(this.timer)
      }
    },
    goon () {
      this.hitflag = true
      this.cardsChg = []
      this.loseflag = false
      this.winflag = false
      this.drawflag = false
      clearInterval(this.timer)
      // this.cardsOrg = []
      this.init(this.cardsChg)
    }
  },
  computed: {
    // 监听点数
    score1: function () {
      return this.getScore(this.arr1, this.score)
    },
    score2: function () {
      return this.getScore(this.arr2, this.score)
    }
  },
  watch: {
    score2 () {
      if (this.score2 === 0) {
        this.loseflag = true
      }
    },
    score1 () {
      if (this.score1 === 0) {
        this.winflag = true
        clearInterval(this.timer)
      }
    }
  }
}
</script>

<style scoped>

h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}

* {
  padding: 0;
  margin: 0;
}
li {
  list-style: none;
}
.Sum {
  position: relative;
  width: 1200px;
  height: 800px;
  color: #dfcdc3;
  margin: 100px auto;
  background-color: #5f6769;
}

.row {
  height: 300px;

  background-color: #3c4245;
}
h1 {
  padding-top: 30px;
  margin: 30px  auto;
  width: 100%;
}
span {
  margin-top: 10px;
  float: left;
  font-size: 40px;
  margin-left: 20px;
}
input {
  margin: 20px auto;
  font-size: 50px;
  color: #dfcdc3;
  padding: 0 10px;
}

.cardsul {
  padding-left: 50px;
}
.card {
  float: left;
  margin: 10px 10px ;
  margin-top: 30px;
  width: 100px;
  height: 150px;
  line-height: 150px;
  font-size: 50px;
  background-color: #719192;
  border-radius: 10px;
}
.scrore {
  float: right;
  margin: 10px 10px;
  width: 100px;
  height: 150px;
  line-height: 150px;
  font-size: 50px;
  font-weight: 700;
  color: #dfcdc3;
}
.lose {
  position: absolute;
  top:0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.5);
}

.lose h1 {
  position: absolute;
  top: 200px;
  font-size: 200px;

}

.draw h1 {
  position: absolute;
  top: 100px;
  font-size: 200px;
}
.lose input {
  position: absolute;
  bottom: 100px;
  margin-left: -60px;

}
  .v-enter,
  .v-leave-to {
    opacity: 0;
  }
  .v-enter-active,
  .v-leave-active {
    transition: all 1s ease;
  }
</style>
