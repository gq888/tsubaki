import { shuffleCards } from "../utils/help.js";
import point24card from "./point24card.vue";
// var opts    =  [ " + " , " * " , " - " , " - " , " / " , " / " ];
var opts = [1, 3, 2, 2, 4, 4];

function process(nums, len, aim) {
  for (var i = 0; i < len; i++) {
    for (var j = i + 1; j < len; j++) {
      var numij = [nums[i], nums[j]];
      nums[j] = nums[len - 1];
      for (var k = 0; k < 6; k++) {
        // nums[i]  =   ' ( '   +  numij[k % 2 ]  +  opts[k]  +  numij[( ! (k % 2 ) * 1 )]  +   ' ) ' ;
        nums[i] = [numij[k % 2], opts[k], numij[!(k % 2) * 1]];
        if (process(nums, len - 1, aim)) {
          return true;
        }
      }
      nums[i] = numij[0];
      nums[j] = numij[1];
    }
  }
  // return  (len  ==   1 )  &&  (Math.abs(( new  Function( " return "   +  nums[ 0 ])())  -  aim)  <   0.0000001 );
  return len == 1 && Math.abs(calc(nums[0]) - aim) < 0.0000001;
}

let fns = [
  () => {},
  (a, b) => a + b,
  (a, b) => a - b,
  (a, b) => a * b,
  (a, b) => a / b
];

function calc(a) {
  if (Number.isFinite(a)) {
    return (a >> 2) + 1;
  } else {
    let [num1, sign, num2] = a;
    num1 = calc(num1);
    num2 = calc(num2);
    return fns[sign](num1, num2);
  }
}

function first(i) {
  console.log(i);
  return Number.isFinite(i) ? i : first(i[0]);
}

export default {
  name: "point24",
  components: {
    point24card
  },
  data() {
    return {
      title: "Point24",
      sign: 0,
      cards1: [],
      cards2: [0, 0, 0],
      signs: ["UP", "+", "-", "X", "/"],
      arr: [],
      number: 52
    };
  },
  // 初始化
  methods: {
    init() {
      this.sign = 0;
      this.cards1.splice(0);
      this.arr.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
      this.arr.push(...cards.splice(0, 4));
      this.autoCalc();
    },
    calc,
    first,
    process,
    clickSign(sign) {
      this.sign = this.sign == sign ? 0 : sign;
    },
    autoCalc() {
      let step = this.step;
      let temp = [...this.arr];
      process(temp, temp.length, 24);
      this.cards2.splice(2, 1, temp[0]);
      if (step >= 2) {
        return;
      }
      let temp00 = temp[0][0],
        temp02 = temp[0][2];
      let l = Number.isFinite(temp00);
      let r = Number.isFinite(temp02);

      this.cards2.splice(
        1,
        1,
        l
          ? temp02
          : r
          ? temp[0][0]
          : first(temp00) == first(this.cards2[0])
          ? temp02
          : temp00
      );
      if (step >= 1) {
        return;
      }

      this.cards2.splice(
        0,
        1,
        l
          ? Number.isFinite(temp02[0])
            ? temp02[2]
            : temp02[0]
          : r
          ? Number.isFinite(temp00[0])
            ? temp00[2]
            : temp00[0]
          : temp00
      );
      console.log(this.cards2);
    }
  },
  watch: {
    step() {
      this.autoCalc();
    }
  }
};
