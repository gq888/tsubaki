(function(t){function s(s){for(var a,n,c=s[0],l=s[1],o=s[2],f=0,h=[];f<c.length;f++)n=c[f],Object.prototype.hasOwnProperty.call(e,n)&&e[n]&&h.push(e[n][0]),e[n]=0;for(a in l)Object.prototype.hasOwnProperty.call(l,a)&&(t[a]=l[a]);u&&u(s);while(h.length)h.shift()();return r.push.apply(r,o||[]),i()}function i(){for(var t,s=0;s<r.length;s++){for(var i=r[s],a=!0,c=1;c<i.length;c++){var l=i[c];0!==e[l]&&(a=!1)}a&&(r.splice(s--,1),t=n(n.s=i[0]))}return t}var a={},e={app:0},r=[];function n(s){if(a[s])return a[s].exports;var i=a[s]={i:s,l:!1,exports:{}};return t[s].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=t,n.c=a,n.d=function(t,s,i){n.o(t,s)||Object.defineProperty(t,s,{enumerable:!0,get:i})},n.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,s){if(1&s&&(t=n(t)),8&s)return t;if(4&s&&"object"===typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&s&&"string"!=typeof t)for(var a in t)n.d(i,a,function(s){return t[s]}.bind(null,a));return i},n.n=function(t){var s=t&&t.__esModule?function(){return t["default"]}:function(){return t};return n.d(s,"a",s),s},n.o=function(t,s){return Object.prototype.hasOwnProperty.call(t,s)},n.p="";var c=window["webpackJsonp"]=window["webpackJsonp"]||[],l=c.push.bind(c);c.push=s,c=c.slice();for(var o=0;o<c.length;o++)s(c[o]);var u=l;r.push([0,"chunk-vendors"]),i()})({0:function(t,s,i){t.exports=i("56d7")},"034f":function(t,s,i){"use strict";var a=i("85ec"),e=i.n(a);e.a},"0ca1":function(t,s,i){t.exports=i.p+"img/1.b8359830.png"},1462:function(t,s,i){},"175d":function(t,s,i){"use strict";var a=i("6997"),e=i.n(a);e.a},"426e":function(t,s,i){"use strict";var a=i("1462"),e=i.n(a);e.a},"56d7":function(t,s,i){"use strict";i.r(s);i("e260"),i("e6cf"),i("cca6"),i("a79d");var a=i("2b0e"),e=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{attrs:{id:"app"}},[i("div",{attrs:{id:"nav"}},[t._v(" GAMES: "),i("router-link",{attrs:{to:"/month"}},[t._v("Month")]),t._v(" / "),i("router-link",{attrs:{to:"/fish"}},[t._v("Fish")]),t._v(" / "),i("router-link",{attrs:{to:"/blackjack"}},[t._v("BlackJack")]),t._v(" / "),i("router-link",{attrs:{to:"/point24"}},[t._v("Point24")])],1),i("router-view")],1)},r=[],n=(i("034f"),i("2877")),c={},l=Object(n["a"])(c,e,r,!1,null,null,null),o=l.exports,u=i("8c4f"),f=function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"Sum"},[a("h1",[t._v(t._s(t.title))]),a("div",{staticClass:"row center"},[a("img",{staticClass:"avatar",attrs:{src:i("d977")}}),a("span",{staticClass:"scrore"},[t._v(t._s(t.score1))])]),a("div",{staticClass:"row"},[a("div",[a("ul",{staticClass:"cardsul"},t._l(t.arr1,(function(t){return a("li",{key:t.id,staticClass:"card"},[a("img",{attrs:{src:"./static/"+t.id+".jpg"}})])})),0)])]),a("div",{staticClass:"row",staticStyle:{"margin-top":"10px"}},[a("div",[a("ul",{staticClass:"cardsul reverse"},t._l(t.arr2,(function(t){return a("li",{key:t.id,staticClass:"card"},[a("img",{attrs:{src:"./static/"+t.id+".jpg"}})])})),0)])]),a("div",{staticClass:"row center"},[a("img",{staticClass:"avatar",attrs:{src:i("0ca1")}}),a("span",{staticClass:"scrore"},[t._v(t._s(t.score2))])]),a("div",{staticClass:"btns"},[a("input",{attrs:{type:"button",value:"HIT",disabled:!t.hitflag},on:{click:function(s){return t.hit(t.cardsChg,t.arr2)}}}),t._v(" "),a("input",{attrs:{type:"button",value:"PASS",disabled:!t.hitflag},on:{click:t.pass}})]),a("transition",[t.loseflag?a("div",{staticClass:"lose"},[a("h1",[t._v("U LOSE")]),a("input",{attrs:{type:"button",value:"AGAIN"},on:{click:t.goon}})]):t._e(),t.winflag?a("div",{staticClass:"lose"},[a("h1",[t._v("U WIN!")]),a("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e(),t.drawflag?a("div",{staticClass:"draw lose"},[a("h1",[t._v("DRAW GAME")]),a("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},h=[],p=(i("a434"),{name:"Sum",data:function(){return{title:"BlackJack",arrCard:[],sum:0,score:0,cardsOrg:[],cardsChg:[],cardsIndex:"",types:["♠","♥","♦","♣"],point:["A",2,3,4,5,6,7,8,9,10,"J","Q","K"],arr1:[],arr2:[],loseflag:!1,winflag:!1,drawflag:!1,hitflag:!0,timer:""}},created:function(){this.init(this.cardsChg)},methods:{init:function(t){this.arr1.splice(0),this.arr2.splice(0);for(var s=0;s<54;s++)t.push(s);this.shuffleCards(t),console.log(t),this.hit(t,this.arr1),this.hit(t,this.arr2),this.hit(t,this.arr1),this.hit(t,this.arr2)},getCards:function(t){for(var s in this.types)for(var i in this.point)t.push(this.types[s]+this.point[i]);return t},shuffleCards:function(t){for(var s,i,a=0;a<1e3;a++)s=Math.floor(53*Math.random()),i=t[53],t[53]=t[s],t[s]=i;return t},getRandomInt:function(t,s){return Math.floor(Math.random()*(s-t+1))+t},hit:function(t,s){var i=t.shift(),a=i>>2;s.push({id:i,value:++a>10?10:a})},getScore:function(t,s){for(var i=!1,a=0;a<t.length;a++)s+=t[a].value,1===t[a].value&&(i=!0);return console.log(i),s<=11&&!0===i?s+=10:s>21&&(s=0),s},pass:function(){this.hitflag=!1,this.timer=setInterval(this.compare,1e3)},compare:function(){this.score1===this.score2&&(this.drawflag=!0),this.score1<this.score2?this.hit(this.cardsChg,this.arr1):this.score1>this.score2&&(this.loseflag=!0,clearInterval(this.timer))},goon:function(){this.hitflag=!0,this.cardsChg=[],this.loseflag=!1,this.winflag=!1,this.drawflag=!1,clearInterval(this.timer),this.init(this.cardsChg)}},computed:{score1:function(){return this.getScore(this.arr1,this.score)},score2:function(){return this.getScore(this.arr2,this.score)}},watch:{score2:function(){0===this.score2&&(this.loseflag=!0)},score1:function(){0===this.score1&&(this.winflag=!0,clearInterval(this.timer))}}}),d=p,v=d,g=(i("739e"),Object(n["a"])(v,f,h,!1,null,"1cc3b708",null)),m=g.exports,b=function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("div",{staticClass:"Sum"},[a("h1",[t._v(t._s(t.title))]),a("div",{staticClass:"btns"},[a("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),a("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),a("div",{staticClass:"row center"},[a("img",{staticClass:"avatar",attrs:{src:i("d977")}}),a("span",{staticClass:"scrore"},[t._v(t._s(t.score1))]),a("span",{staticClass:"diff",style:{opacity:0!=t.diff1?1:0}},[t._v(t._s(t.diff1>0?"+":"")+t._s(t.diff1))])]),a("div",{staticClass:"row"},[a("div",[a("ul",{staticClass:"cardsul"},t._l(t.arr,(function(s){return a("li",{key:s,staticClass:"card"},[a("img",{class:{shanshuo:t.ssArr.indexOf(s)>=0,flyin1:t.flyin1.indexOf(s)>=0,flyin2:t.flyin2.indexOf(s)>=0,flyout1:t.flyout1.indexOf(s)>=0,flyout2:t.flyout2.indexOf(s)>=0},attrs:{src:"./static/"+s+".jpg"}})])})),0)])]),a("div",{staticClass:"row center"},[a("img",{staticClass:"avatar",attrs:{src:i("0ca1")}}),a("span",{staticClass:"scrore"},[t._v(t._s(t.score2))]),a("span",{staticClass:"diff",style:{opacity:0!=t.diff2?1:0}},[t._v(t._s(t.diff2>0?"+":"")+t._s(t.diff2))])]),a("div",{staticClass:"btns"},[a("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),a("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),a("transition",[t.loseflag?a("div",{staticClass:"lose"},[a("h1",[t._v("U LOSE")]),a("input",{attrs:{type:"button",value:"AGAIN"},on:{click:t.goon}})]):t._e(),t.winflag?a("div",{staticClass:"lose"},[a("h1",[t._v("U WIN!")]),a("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},_=[],k=(i("c740"),i("d3b7"),i("96cf"),i("1da1")),C=i("2909"),y={name:"Fish",data:function(){return{title:"Fish",diff1:0,diff2:0,step:0,cards1:[],cards2:[],ssArr:[],flyin1:[],flyin2:[],flyout1:[],flyout2:[],cardsIndex:"",arr:[],loseflag:!1,winflag:!1,hitflag:!0,lockflag:!0,timer:""}},created:function(){this.init(this.cards1)},methods:{init:function(){var t,s=this.cards1;this.arr.splice(0);for(var i=0;i<54;i++)s.push(i);this.shuffleCards(s),(t=this.cards2).push.apply(t,Object(C["a"])(s.splice(27)))},shuffleCards:function(t){for(var s,i,a=0;a<1e3;a++)s=Math.floor(53*Math.random()),i=t[53],t[53]=t[s],t[s]=i;return t},stepFn:function(){var t=this;return Object(k["a"])(regeneratorRuntime.mark((function s(){return regeneratorRuntime.wrap((function(s){while(1)switch(s.prev=s.next){case 0:return t.hitflag=!1,s.next=3,t.hit(t.step%2==0?t.cards1:t.cards2,t.arr).then((function(){t.hitflag=!0,t.step++}));case 3:case"end":return s.stop()}}),s)})))()},time:function(t,s){return new Promise((function(i){setTimeout((function(){i(),t()}),s)}))},push:function(t,s){return Object(k["a"])(regeneratorRuntime.mark((function i(){return regeneratorRuntime.wrap((function(i){while(1)switch(i.prev=i.next){case 0:t.push(s);case 1:case"end":return i.stop()}}),i)})))()},hit:function(t,s){var i=this;return Object(k["a"])(regeneratorRuntime.mark((function a(){var e,r,n;return regeneratorRuntime.wrap((function(a){while(1)switch(a.prev=a.next){case 0:if(e=t.shift(),r=e>>2,13!=r){a.next=8;break}return i.push(s,e),i.ssArr.push(e),a.next=7,i.time((function(){i.ssArr.splice(0),s.push.apply(s,Object(C["a"])((i.step%2==0?i.cards2:i.cards1).splice(0,53==e?5:3)))}),1e3);case 7:return a.abrupt("return",a.sent);case 8:if(n=10==r?0:s.findIndex((function(t){return t>>2==r})),i.push(s,e),!(n<0)){a.next=12;break}return a.abrupt("return");case 12:return i.ssArr.push(e,s[n]),a.next=15,i.time((function(){i.ssArr.splice(0),t.push.apply(t,Object(C["a"])(s.splice(n)))}),1e3);case 15:case"end":return a.stop()}}),a)})))()},pass:function(){var t=this;this.lockflag=!1,this.winflag||this.loseflag||this.stepFn().then((function(){console.log(t.arr,t.cards1,t.cards2),setTimeout(t.pass,1e3)}))},goon:function(){this.step=0,this.hitflag=!0,this.lockflag=!0,this.cards1.splice(0),this.cards2.splice(0),this.loseflag=!1,this.winflag=!1,this.init()}},computed:{score1:function(){return this.cards1.length},score2:function(){return this.cards2.length}},watch:{score2:function(t,s){var i=this;0===t?this.loseflag=!0:(this.diff2=t-s,this.time((function(){i.diff2=0}),800))},score1:function(t,s){var i=this;0===t?this.winflag=!0:(this.diff1=t-s,this.time((function(){i.diff1=0}),800))}}},w=y,x=w,O=(i("dd8e"),Object(n["a"])(x,b,_,!1,null,"461dddbb",null)),S=O.exports,j=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"Sum"},[i("h1",[t._v(t._s(t.title))]),i("div",{staticClass:"row",attrs:{style1:"overflow:scroll"}},[i("div",[i("ul",{staticClass:"cardsul flex-row center",staticStyle:{"padding-left":"0"}},[i("div",{staticClass:"flex-col center",staticStyle:{width:"100%"}},[i("point24card",{attrs:{card:t.arr[0]}}),i("div",{directives:[{name:"show",rawName:"v-show",value:t.step<3,expression:"step < 3"}],staticClass:"flex-row"},[i("span",{staticClass:"sign center",class:{choose:1==t.sign},on:{click:function(s){return t.clickSign(1)}}},[t._v("+")]),i("span",{staticClass:"sign center",class:{choose:2==t.sign},on:{click:function(s){return t.clickSign(2)}}},[t._v("-")]),i("span",{staticClass:"sign center",class:{choose:3==t.sign},on:{click:function(s){return t.clickSign(3)}}},[t._v("X")]),i("span",{staticClass:"sign center",class:{choose:4==t.sign},on:{click:function(s){return t.clickSign(4)}}},[t._v("/")])]),0!=t.sign?i("div",{staticClass:"align-center"},[t._m(0)]):t._e(),i("span",{staticClass:"vertical m-0"},[t._v("=")]),i("span",{staticClass:"m-0"},[t._v(t._s(t.calc(t.arr[0]).toFixed(2)))])],1),t._l(t.arr,(function(s,a){return i("div",{key:a,staticClass:"align-center flex-wrap center"},[0!=a?i("div",{staticClass:"center"},[i("point24card",{attrs:{card:s},nativeOn:{click:function(i){return t.clickCard(s,a)}}}),i("span",{staticClass:"sign center",on:{click:function(i){return t.clickCard(s,a)}}},[t._v("UP")])],1):t._e()])}))],2)])]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"UNDO",disabled:t.step<=0||!t.hitflag||!t.lockflag},on:{click:t.undo}}),t._v(" "),i("input",{attrs:{type:"button",value:"RESTART",disabled:!t.hitflag||!t.lockflag},on:{click:t.goon}}),t._v(" "),i("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),i("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),i("transition",[t.loseflag?i("div",{staticClass:"lose",staticStyle:{"background-color":"rgba(0,0,0,0.5)"}},[i("h1",[t._v("U LOSE")]),i("input",{attrs:{type:"button",value:"RESTART"},on:{click:t.goon}}),i("input",{attrs:{type:"button",value:"UNDO",disabled:t.step<=0},on:{click:t.undo}})]):t._e(),t.winflag?i("div",{staticClass:"lose"},[i("h1",[t._v("U WIN!")]),i("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},T=[function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"card"},[i("img",{attrs:{src:"/static/bg.jpg"}})])}],A=(i("c975"),i("a9e3"),i("f00c"),i("3835"));function E(t,s){for(var i,a,e=s-1,r=0;r<1e3;r++)i=Math.floor(Math.random()*e),a=t[e],t[e]=t[i],t[i]=a;return t}function F(t,s){return new Promise((function(i){setTimeout((function(){i(),t()}),s)}))}var R=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{},[Number.isFinite(t.card)?i("div",{},[i("img",{staticClass:"card",attrs:{src:"./static/"+t.card+".jpg"}})]):i("div",{staticClass:"align-center flex-col"},[t._m(0),i("point24card",{attrs:{card:t.card[0]}}),i("span",{staticClass:"m-0"},[t._v(t._s(["-","+","-","x","/"][t.card[1]]))]),i("point24card",{attrs:{card:t.card[2]}}),t._m(1)],1)])},N=[function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"vertical",staticStyle:{width:"50px"}},[i("span",[t._v("(")])])},function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"vertical",staticStyle:{width:"50px"}},[i("span",[t._v(")")])])}],M={name:"point24card",props:["card"]},P=M,U=(i("175d"),Object(n["a"])(P,R,N,!1,null,null,null)),I=U.exports,$=[1,2,3,3,4,4];function G(t,s,i){for(var a=0;a<s;a++)for(var e=a+1;e<s;e++){var r=[t[a],t[e]];t[e]=t[s-1];for(var n=0;n<6;n++)if(t[a]=[r[n%2],$[n],r[1*!(n%2)]],G(t,s-1,i))return!0;t[a]=r[0],t[e]=r[1]}return 1==s&&Math.abs(J(t[0])-i)<1e-7}function J(t){if(Number.isFinite(t))return 1+(t>>2);var s,i=Object(A["a"])(t,3),a=i[0],e=i[1],r=i[2];return a=J(a),r=J(r),1==e?s=a+r:2==e?s=a-r:3==e?s=a*r:4==e&&(s=a/r),s}function L(t){return console.log(t),Number.isFinite(t)?t:L(t[0])}var W={name:"point24",components:{point24card:I},data:function(){return{title:"Point24",step:0,sign:0,cards1:[],cards2:[0,0,0],arr:[],loseflag:!1,winflag:!1,hitflag:!0,lockflag:!0,number:52}},created:function(){this.init()},methods:{init:function(){var t;this.step=0;for(var s=this.cards1,i=0;i<this.number;i++)s.push(i);E(s,this.number),(t=this.arr).push.apply(t,Object(C["a"])(s.splice(0,4))),this.autoCalc()},calc:J,stepFn:function(){var t=this;return Object(k["a"])(regeneratorRuntime.mark((function s(){var i;return regeneratorRuntime.wrap((function(s){while(1)switch(s.prev=s.next){case 0:if(!(t.step>=3)){s.next=2;break}return s.abrupt("return");case 2:return i=t.cards2[t.step],t.hitflag=!1,t.sign=0,t.clickCard(i[0],t.arr.indexOf(i[0])),s.next=8,F((function(){}),1e3);case 8:return t.clickSign(i[1]),s.next=11,F((function(){}),1e3);case 11:if(t.clickCard(i[2],t.arr.indexOf(i[2])),t.hitflag=!0,!(t.step>=3)){s.next=17;break}return s.next=16,F((function(){}),1e3);case 16:t.winflag=!0;case 17:case"end":return s.stop()}}),s)})))()},clickCard:function(t,s){if(0!=s)if(0!=this.sign){var i=[this.arr[0],this.sign,this.arr.splice(s,1)[0]];this.arr.splice(0,1,i),this.sign=0,this.$set(this.cards2,this.step++,i)}else{var a=this.arr[0];this.$set(this.arr,0,this.arr[s]),this.$set(this.arr,s,a)}},undo:function(){if(0!=this.step){var t=this.cards2.splice(--this.step,1)[0],s=L(t),i=this.arr.findIndex((function(t){return L(t)==s}));this.arr.splice(i,1,t[0],t[2]),this.loseflag=!1}},clickSign:function(t){this.sign=this.sign==t?0:t},pass:function(){var t=this;this.lockflag=!1,this.winflag||this.stepFn().then((function(){setTimeout(t.pass,1e3)}))},goon:function(){this.sign=0,this.hitflag=!0,this.lockflag=!0,this.cards1.splice(0),this.arr.splice(0),this.loseflag=!1,this.winflag=!1,this.init()},autoCalc:function(){var t=this.step;if(!(t>=3)){var s=Object(C["a"])(this.arr),i=G(s,s.length,24);if(i){if(this.cards2.splice(2,1,s[0]),!(t>=2)){var a=s[0][0],e=s[0][2],r=Number.isFinite(a),n=Number.isFinite(e);this.cards2.splice(1,1,r?e:n?s[0][0]:L(a)==L(this.cards2[0])?e:a),t>=1||(this.cards2.splice(0,1,r?Number.isFinite(e[0])?e[2]:e[0]:n?Number.isFinite(a[0])?a[2]:a[0]:a),console.log(this.cards2))}}else this.loseflag=!0}}},watch:{step:function(){this.autoCalc()}}},D=W,B=D,K=(i("426e"),Object(n["a"])(B,j,T,!1,null,"60d1b0da",null)),Y=K.exports,H=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"Sum"},[i("h1",[t._v(t._s(t.title))]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),i("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),i("div",{staticClass:"row"},[i("div",[i("ul",{staticClass:"cardsul",staticStyle:{"max-width":"740px"}},t._l(t.arr,(function(s,a){return i("li",{key:a,staticClass:"cards",style:{marginTop:0!=a&&t.step==a?0:"30px"}},t._l(s,(function(s,e){return i("img",{key:s,staticClass:"card abso",style:{top:30*e+"px"},attrs:{src:"./static/"+(t.cards2[a]>e||t.step==a&&(0==t.step&&3==e||4==e)?s:"bg")+".jpg"}})})),0)})),0)])]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),i("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),i("transition",[t.loseflag?i("div",{staticClass:"lose",staticStyle:{"background-color":"rgba(0,0,0,0.8)"}},[i("h1",{staticClass:"small"},[t._v("YOUR LUCKY CLASSES:")]),i("div",{staticStyle:{"margin-top":"10px"},attrs:{class1:"row"}},[i("div",[i("ul",{staticClass:"cardsul",staticStyle:{"padding-left":"0"}},t._l(t.cards2,(function(s,a){return i("div",{key:a},[s>=4?i("img",{staticClass:"card",attrs:{src:"./static/"+(4*a+1)+".jpg"}}):t._e()])})),0)])]),i("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},Q=[],X={name:"Month",data:function(){return{title:"Month",step:0,cards1:[],cards2:[],arr:[],loseflag:!1,hitflag:!0,lockflag:!0,timer:"",number:48}},created:function(){this.init(this.cards1)},methods:{init:function(){for(var t=this.cards1,s=0;s<this.number;s++)t.push(s);E(t,this.number);for(var i=0;i<12;i++)this.cards2.push(0),this.arr.push(t.splice(0,4))},stepFn:function(){var t=this;return Object(k["a"])(regeneratorRuntime.mark((function s(){return regeneratorRuntime.wrap((function(s){while(1)switch(s.prev=s.next){case 0:return t.hitflag=!1,s.next=3,t.hit().then((function(){console.log(1),t.hitflag=!0}));case 3:case"end":return s.stop()}}),s)})))()},push:function(t,s){return Object(k["a"])(regeneratorRuntime.mark((function i(){return regeneratorRuntime.wrap((function(i){while(1)switch(i.prev=i.next){case 0:t.push(s);case 1:case"end":return i.stop()}}),i)})))()},hit:function(){var t=this;return Object(k["a"])(regeneratorRuntime.mark((function s(){var i,a,e;return regeneratorRuntime.wrap((function(s){while(1)switch(s.prev=s.next){case 0:if(i=t.step,!(t.cards2[0]>=4)){s.next=4;break}return t.loseflag=!0,s.abrupt("return");case 4:a=t.arr[i].pop(),e=a>>2,t.arr[e].unshift(a),t.step=e,t.cards2[e]++;case 9:case"end":return s.stop()}}),s)})))()},pass:function(){var t=this;this.lockflag=!1,this.loseflag||this.stepFn().then((function(){setTimeout(t.pass,1e3)}))},goon:function(){this.step=0,this.hitflag=!0,this.lockflag=!0,this.cards1.splice(0),this.cards2.splice(0),this.arr.splice(0),this.loseflag=!1,this.init()}}},q=X,z=q,V=(i("d8f4"),Object(n["a"])(z,H,Q,!1,null,"7634a58a",null)),Z=V.exports;a["a"].use(u["a"]);var tt=[{path:"/",redirect:"/month"},{path:"/month",component:Z},{path:"/fish",component:S},{path:"/point24",component:Y},{path:"/blackjack",component:m}],st=new u["a"]({routes:tt}),it=st,at=i("2f62");a["a"].use(at["a"]);var et=new at["a"].Store({state:{},mutations:{},actions:{},modules:{}});a["a"].config.productionTip=!1,new a["a"]({router:it,store:et,render:function(t){return t(o)}}).$mount("#app")},6997:function(t,s,i){},"739e":function(t,s,i){"use strict";var a=i("fd61"),e=i.n(a);e.a},"839d":function(t,s,i){},"85ec":function(t,s,i){},c45e:function(t,s,i){},d8f4:function(t,s,i){"use strict";var a=i("c45e"),e=i.n(a);e.a},d977:function(t,s,i){t.exports=i.p+"img/0.d3ad78a7.png"},dd8e:function(t,s,i){"use strict";var a=i("839d"),e=i.n(a);e.a},fd61:function(t,s,i){}});
//# sourceMappingURL=app.b4d58dce.js.map