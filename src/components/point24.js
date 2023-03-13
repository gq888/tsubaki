import { shuffleCards, timeout } from '../utils/help.js'
import point24card from './point24card.vue'
// var opts    =  [ " + " , " * " , " - " , " - " , " / " , " / " ];
var opts = [1, 2, 3, 3, 4, 4]

function  process(nums, len, aim)
{
   for ( var  i  =   0 ; i  <  len; i ++ ) { 
     for ( var  j  =  i + 1 ; j  <  len; j ++ ) {
       var  numij  =  [nums[i],nums[j]];
      nums[j]  =  nums[len  -   1 ];
       for ( var  k  =   0 ; k  <   6 ; k ++ ){                
        // nums[i]  =   ' ( '   +  numij[k % 2 ]  +  opts[k]  +  numij[( ! (k % 2 ) * 1 )]  +   ' ) ' ;                
        nums[i] = [numij[k % 2 ], opts[k], numij[( ! (k % 2 ) * 1 )]]
        if (process(nums, len - 1 , aim)) {
          return   true ;
        }                
      }
      nums[i]  =  numij[ 0 ];
      nums[j]  =  numij[ 1 ];
    } 
  }
   // return  (len  ==   1 )  &&  (Math.abs(( new  Function( " return "   +  nums[ 0 ])())  -  aim)  <   0.0000001 ); 
   return len == 1 && Math.abs(calc(nums[0]) - aim) < 0.0000001
}

function calc(a) {
  if(Number.isFinite(a)) {
    return (a >> 2) + 1
  } else {
    let res, [num1, sign, num2] = a
    num1 = calc(num1)
    num2 = calc(num2)
    if (sign == 1) {
      res = num1 + num2
    } else if (sign == 2) {
      res = num1 - num2
    } else if (sign == 3) {
      res = num1 * num2
    } else if (sign == 4) {
      res = num1 / num2
    }
    return res
  }
}

function first(i) {console.log(i)
  return Number.isFinite(i) ? i : first(i[0])
}

// function  getexp(aim, nums){
//    if (process(nums, nums.length, aim)){
//      return  nums[ 0 ].substring( 1 ,nums[ 0 ].length - 1 );
//   } else {
//      return   " No expression =  "   +  aim; 
//   }
// }

export default {
  name: 'point24',
  components: {
    point24card,
  },
  data () {
    return {
      title: 'Point24',
      step: 0,
      sign: 0,
      cards1: [],
      cards2: [0, 0, 0],
      arr: [],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 52
    }
  },
  created: function () {
    this.init()
  },
  // 初始化
  methods: {
    init () {
      this.step = 0
      let cards = this.cards1
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number)
      this.arr.push(...cards.splice(0, 4))
      this.autoCalc()
    },
    calc,
    async stepFn () {
      if (this.step >= 3) {
        return;
      }
      let temp = this.cards2[this.step]
      this.hitflag = false
      this.sign = 0
      this.clickCard(temp[0], this.arr.indexOf(temp[0]))
      await timeout(() => {}, 1000)
      this.clickSign(temp[1])
      await timeout(() => {}, 1000)
      this.clickCard(temp[2], this.arr.indexOf(temp[2]))
      this.hitflag = true
    },
    clickCard (card, i) {
      if (i == 0) {
        return;
      }
      if (this.sign != 0) {
        let temp = [this.arr[0], this.sign, this.arr.splice(i, 1)[0]]
        this.arr.splice(0, 1, temp)
        this.sign = 0;
        this.$set(this.cards2, this.step++, temp)
        if (this.step >= 3) {
          this.winflag = true
        }
      } else {
        let temp = this.arr[0];
        this.$set(this.arr, 0, this.arr[i])
        this.$set(this.arr, i, temp)
      }
    },
    undo () {
      if (this.step == 0) {
        return;
      }
      let temp = this.cards2.splice(--this.step, 1)[0]
      let s = first(temp)
      let i = this.arr.findIndex(a => first(a) == s)
      this.arr.splice(i, 1, temp[0], temp[2])
      this.loseflag = false
    },
    clickSign (sign) {
      this.sign = this.sign == sign ? 0 : sign;
    },
    pass () {
      this.lockflag = false
      if (!this.winflag) {
        this.stepFn().then(() => {
          setTimeout(this.pass, 1000)
        })
      } else {
        // this.lockflag = true
      }
    },
    goon () {
      this.sign = 0
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
      if (step >= 3) {
        return;
      }
      let temp = [...this.arr]
      let f = process(temp, temp.length, 24)
      if (!f) {
        this.loseflag = true;
        return;
      }
      this.cards2.splice(2, 1, temp[0])
      if (step >= 2) {
        return;
      }
      let temp00 = temp[0][0], temp02 = temp[0][2]
      let l = Number.isFinite(temp00)
      let r = Number.isFinite(temp02)
      
      this.cards2.splice(1, 1, l ? temp02 : r ? temp [0][0] : first(temp00) == first(this.cards2[0]) ? temp02 : temp00)
      if (step >= 1) {
        return;
      }
      
      this.cards2.splice(0, 1, l ? Number.isFinite(temp02[0]) ? temp02[2] : temp02[0] : r ? Number.isFinite(temp00[0]) ? temp00[2] : temp00[0] : temp00)
      console.log(this.cards2)
    }
  },
  watch: {
    step () {
      this.autoCalc()
    },
  },
}