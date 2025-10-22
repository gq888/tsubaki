import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";
import { defineAsyncComponent } from "vue";

/**
 * point24card 组件 - 根据环境选择
 */
const point24card =
  typeof window === "undefined"
    ? { name: "point24card", template: "<div>Mock point24card</div>" }
    : defineAsyncComponent(() => import("./point24card.vue"));
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
  (a, b) => a / b,
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
  return Number.isFinite(i) ? i : first(i[0]);
}

const Point24 = {
  name: "point24",
  components: { point24card },
  data() {
    return {
      title: "Point24",
      sign: 0,
      cards1: [],
      cards2: [0, 0, 0],
      signs: ["UP", "+", "-", "X", "/"],
      arr: [],
      number: 52,
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
      this.autoCalc(); // 恢复autoCalc调用
    },
    calc,
    first,
    process,
    clickSign(sign) {
      this.sign = this.sign == sign ? 0 : sign;
    },
    // 记录操作
    recordOperation(type, data) {
      this.gameManager.recordOperation({
        type: type,
        ...data,
        timestamp: Date.now(),
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "combine":
          // 撤销组合操作
          this.cards2.splice(this.step, 1);
          this.arr.splice(
            this.arr.findIndex(
              (a) => this.first(a) == this.first(operation.combined),
            ),
            1,
            operation.left,
            operation.right,
          );
          break;
      }
    },

    // 重写clickCard方法，使用GameStateManager记录操作
    clickCard(card, i) {
      if (i == 0) {
        console.log(`索引为0，直接返回`);
        return;
      }
      if (i === -1) {
        throw new Error(`没找到该卡片`);
      }
      if (this.sign != 0) {
        let left = this.arr[0];
        let right = this.arr.splice(i, 1)[0];
        let combined = [left, this.sign, right];
        this.arr.splice(0, 1, combined);
        this.sign = 0;
        this.cards2.splice(this.step, 1, combined);
        this.recordOperation("combine", {
          left: left,
          right: right,
          combined: combined,
        });
      } else {
        let temp = this.arr[0];
        this.arr.splice(0, 1, this.arr[i]);
        this.arr.splice(i, 1, temp);
      }
    },

    // 重写stepFn方法
    async stepFn() {
      await this.gameManager.step(async () => {
        if (this.step >= 3) {
          console.log(`步数已达到3，检查游戏结果...`);
          // this.autoCalc(); // 调用autoCalc来检查游戏结果
          return;
        }
        let temp = this.cards2[this.step];
        this.sign = 0;
        const index1 = this.arr.findIndex((a) => this.first(a) == this.first(temp[0]));
        this.clickCard(temp[0], index1);
        await this.wait();
        this.clickSign(temp[1]);
        await this.wait();
        const index2 = this.arr.findIndex((a) => this.first(a) == this.first(temp[2]));
        this.clickCard(temp[2], index2);
      });
    },
    autoCalc() {
      if (this.step >= 3) {
        try {
          const result = this.calc(this.arr[0]);
          if (result == 24) {
            console.log("游戏胜利！");
            this.gameManager.setWin();
          } else {
            console.log("游戏失败！");
            this.gameManager.setLose();
          }
        } catch (error) {
          console.log("计算过程出错:", error.message);
          this.gameManager.stopAuto();
        }
        return;
      }
      let step = this.step;
      let temp = [...this.arr];
      let f = this.process(temp, temp.length, 24);
      if (!f) {
        this.gameManager.setLose();
        return;
      }
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
              : temp00,
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
            : temp00,
      );
    },
    /**
     * 将公式结构转换为可读字符串
     * 递归处理嵌套的公式结构，类似于point24card组件的渲染方式
     */
    formulaToString(formula) {
      if (Number.isFinite(formula)) {
        // 如果是数字，直接返回牌的文本表示
        return getCardPlaceholderText(formula);
      } else if (Array.isArray(formula) && formula.length === 3) {
        // 如果是数组 [左操作数, 运算符, 右操作数]
        const [left, operator, right] = formula;
        const operatorSymbol = this.signs[operator] || this.signs[0];
        const leftStr = this.formulaToString(left);
        const rightStr = this.formulaToString(right);
        return `(${leftStr} ${operatorSymbol} ${rightStr})`;
      } else {
        // 其他情况，返回字符串表示
        return String(formula);
      }
    },

    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              24点游戏 (Point24)               ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示4张牌（显示完整公式而不仅仅是第一张牌）
      console.log('━━━ 当前牌面 ━━━');
      const cards = [];
      for (let i = 0; i < 4; i++) {
        if (this.arr[i] !== undefined) {
          const formulaStr = this.formulaToString(this.arr[i]);
          cards.push(`[${i}] ${formulaStr}`);
        }
      }
      console.log(`  ${cards.join('  ')}\n`);
      
      // 显示运算符
      console.log('━━━ 可用运算符 ━━━');
      console.log('  [+] 加  [-] 减  [×] 乘  [÷] 除\n');
      
      // 显示计算历史
      if (this.history && this.history.length > 0) {
        console.log('━━━ 计算历史 ━━━');
        this.history.forEach((h, idx) => {
          console.log(`  ${idx + 1}. ${h}`);
        });
        console.log('');
      }
      
      // 显示当前结果
      if (this.result !== undefined && this.result !== null) {
        console.log(`当前结果: ${this.result}`);
        if (this.result === 24) {
          console.log('🎉 恭喜！达到24点！');
        }
      }
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     */
    getAvailableActions() {
      const actions = [];
      
      // 撤销按钮
      actions.push({
        id: 1,
        label: '撤销 (◀︎)',
        method: 'undo',
        args: [],
        disabled: !this.canUndo
      });
      
      // 重新开始按钮
      actions.push({
        id: 2,
        label: '重新开始 (RESTART)',
        method: 'goon',
        args: []
      });
      
      // 过滤掉禁用的按钮
      return actions.filter(a => !a.disabled);
    },
  },
};

// 使用工厂函数创建增强的point24组件并导出
export default GameComponentPresets.puzzleGame(Point24, 800);
