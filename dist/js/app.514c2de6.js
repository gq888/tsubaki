(function(t){function s(s){for(var i,n,c=s[0],o=s[1],l=s[2],f=0,h=[];f<c.length;f++)n=c[f],Object.prototype.hasOwnProperty.call(e,n)&&e[n]&&h.push(e[n][0]),e[n]=0;for(i in o)Object.prototype.hasOwnProperty.call(o,i)&&(t[i]=o[i]);u&&u(s);while(h.length)h.shift()();return a.push.apply(a,l||[]),r()}function r(){for(var t,s=0;s<a.length;s++){for(var r=a[s],i=!0,c=1;c<r.length;c++){var o=r[c];0!==e[o]&&(i=!1)}i&&(a.splice(s--,1),t=n(n.s=r[0]))}return t}var i={},e={app:0},a=[];function n(s){if(i[s])return i[s].exports;var r=i[s]={i:s,l:!1,exports:{}};return t[s].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=t,n.c=i,n.d=function(t,s,r){n.o(t,s)||Object.defineProperty(t,s,{enumerable:!0,get:r})},n.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,s){if(1&s&&(t=n(t)),8&s)return t;if(4&s&&"object"===typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&s&&"string"!=typeof t)for(var i in t)n.d(r,i,function(s){return t[s]}.bind(null,i));return r},n.n=function(t){var s=t&&t.__esModule?function(){return t["default"]}:function(){return t};return n.d(s,"a",s),s},n.o=function(t,s){return Object.prototype.hasOwnProperty.call(t,s)},n.p="";var c=window["webpackJsonp"]=window["webpackJsonp"]||[],o=c.push.bind(c);c.push=s,c=c.slice();for(var l=0;l<c.length;l++)s(c[l]);var u=o;a.push([0,"chunk-vendors"]),r()})({0:function(t,s,r){t.exports=r("56d7")},"034f":function(t,s,r){"use strict";var i=r("85ec"),e=r.n(i);e.a},"0ca1":function(t,s,r){t.exports=r.p+"img/1.b8359830.png"},"56d7":function(t,s,r){"use strict";r.r(s);r("e260"),r("e6cf"),r("cca6"),r("a79d");var i=r("2b0e"),e=function(){var t=this,s=t.$createElement,r=t._self._c||s;return r("div",{attrs:{id:"app"}},[r("div",{attrs:{id:"nav"}},[t._v(" GAMES: "),r("router-link",{attrs:{to:"/fish"}},[t._v("Fish")]),t._v(" / "),r("router-link",{attrs:{to:"/blackjack"}},[t._v("BlackJack")])],1),r("router-view")],1)},a=[],n=(r("034f"),r("2877")),c={},o=Object(n["a"])(c,e,a,!1,null,null,null),l=o.exports,u=r("8c4f"),f=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"Sum"},[i("h1",[t._v(t._s(t.title))]),i("div",{staticClass:"row center"},[i("img",{staticClass:"avatar",attrs:{src:r("d977")}}),i("span",{staticClass:"scrore"},[t._v(t._s(t.score1))])]),i("div",{staticClass:"row"},[i("div",[i("ul",{staticClass:"cardsul"},t._l(t.arr1,(function(t){return i("li",{key:t.id,staticClass:"card"},[i("img",{attrs:{src:"./static/"+t.id+".jpg"}})])})),0)])]),i("div",{staticClass:"row",staticStyle:{"margin-top":"10px"}},[i("div",[i("ul",{staticClass:"cardsul reverse"},t._l(t.arr2,(function(t){return i("li",{key:t.id,staticClass:"card"},[i("img",{attrs:{src:"./static/"+t.id+".jpg"}})])})),0)])]),i("div",{staticClass:"row center"},[i("img",{staticClass:"avatar",attrs:{src:r("0ca1")}}),i("span",{staticClass:"scrore"},[t._v(t._s(t.score2))])]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"HIT",disabled:!t.hitflag},on:{click:function(s){return t.hit(t.cardsChg,t.arr2)}}}),t._v(" "),i("input",{attrs:{type:"button",value:"PASS",disabled:!t.hitflag},on:{click:t.pass}})]),i("transition",[t.loseflag?i("div",{staticClass:"lose"},[i("h1",[t._v("U LOSE")]),i("input",{attrs:{type:"button",value:"AGAIN"},on:{click:t.goon}})]):t._e(),t.winflag?i("div",{staticClass:"lose"},[i("h1",[t._v("U WIN!")]),i("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e(),t.drawflag?i("div",{staticClass:"draw lose"},[i("h1",[t._v("DRAW GAME")]),i("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},h=[],d=(r("a434"),{name:"Sum",data:function(){return{title:"BlackJack",arrCard:[],sum:0,score:0,cardsOrg:[],cardsChg:[],cardsIndex:"",types:["♠","♥","♦","♣"],point:["A",2,3,4,5,6,7,8,9,10,"J","Q","K"],arr1:[],arr2:[],loseflag:!1,winflag:!1,drawflag:!1,hitflag:!0,timer:""}},created:function(){this.init(this.cardsChg)},methods:{init:function(t){this.arr1.splice(0),this.arr2.splice(0);for(var s=0;s<54;s++)t.push(s);this.shuffleCards(t),console.log(t),this.hit(t,this.arr1),this.hit(t,this.arr2),this.hit(t,this.arr1),this.hit(t,this.arr2)},getCards:function(t){for(var s in this.types)for(var r in this.point)t.push(this.types[s]+this.point[r]);return t},shuffleCards:function(t){for(var s,r,i=0;i<1e3;i++)s=Math.floor(53*Math.random()),r=t[53],t[53]=t[s],t[s]=r;return t},getRandomInt:function(t,s){return Math.floor(Math.random()*(s-t+1))+t},hit:function(t,s){var r=t.shift(),i=r>>2;s.push({id:r,value:++i>10?10:i})},getScore:function(t,s){for(var r=!1,i=0;i<t.length;i++)s+=t[i].value,1===t[i].value&&(r=!0);return console.log(r),s<=11&&!0===r?s+=10:s>21&&(s=0),s},pass:function(){this.hitflag=!1,this.timer=setInterval(this.compare,1e3)},compare:function(){this.score1===this.score2&&(this.drawflag=!0),this.score1<this.score2?this.hit(this.cardsChg,this.arr1):this.score1>this.score2&&(this.loseflag=!0,clearInterval(this.timer))},goon:function(){this.hitflag=!0,this.cardsChg=[],this.loseflag=!1,this.winflag=!1,this.drawflag=!1,clearInterval(this.timer),this.init(this.cardsChg)}},computed:{score1:function(){return this.getScore(this.arr1,this.score)},score2:function(){return this.getScore(this.arr2,this.score)}},watch:{score2:function(){0===this.score2&&(this.loseflag=!0)},score1:function(){0===this.score1&&(this.winflag=!0,clearInterval(this.timer))}}}),p=d,v=p,g=(r("739e"),Object(n["a"])(v,f,h,!1,null,"1cc3b708",null)),m=g.exports,b=function(){var t=this,s=t.$createElement,i=t._self._c||s;return i("div",{staticClass:"Sum"},[i("h1",[t._v(t._s(t.title))]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),i("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),i("div",{staticClass:"row center"},[i("img",{staticClass:"avatar",attrs:{src:r("d977")}}),i("span",{staticClass:"scrore"},[t._v(t._s(t.score1))]),i("span",{staticClass:"diff",style:{opacity:0!=t.diff1?1:0}},[t._v(t._s(t.diff1>0?"+":"")+t._s(t.diff1))])]),i("div",{staticClass:"row"},[i("div",[i("ul",{staticClass:"cardsul"},t._l(t.arr,(function(s){return i("li",{key:s,staticClass:"card"},[i("img",{class:{shanshuo:t.ssArr.indexOf(s)>=0,flyin1:t.flyin1.indexOf(s)>=0,flyin2:t.flyin2.indexOf(s)>=0,flyout1:t.flyout1.indexOf(s)>=0,flyout2:t.flyout2.indexOf(s)>=0},attrs:{src:"./static/"+s+".jpg"}})])})),0)])]),i("div",{staticClass:"row center"},[i("img",{staticClass:"avatar",attrs:{src:r("0ca1")}}),i("span",{staticClass:"scrore"},[t._v(t._s(t.score2))]),i("span",{staticClass:"diff",style:{opacity:0!=t.diff2?1:0}},[t._v(t._s(t.diff2>0?"+":"")+t._s(t.diff2))])]),i("div",{staticClass:"btns"},[i("input",{attrs:{type:"button",value:"STEP",disabled:!t.hitflag||!t.lockflag},on:{click:t.stepFn}}),t._v(" "),i("input",{attrs:{type:"button",value:"AUTO",disabled:!t.hitflag||!t.lockflag},on:{click:t.pass}})]),i("transition",[t.loseflag?i("div",{staticClass:"lose"},[i("h1",[t._v("U LOSE")]),i("input",{attrs:{type:"button",value:"AGAIN"},on:{click:t.goon}})]):t._e(),t.winflag?i("div",{staticClass:"lose"},[i("h1",[t._v("U WIN!")]),i("input",{attrs:{type:"button",value:"GO ON"},on:{click:t.goon}})]):t._e()])],1)},y=[],_=(r("c740"),r("d3b7"),r("96cf"),r("1da1")),w=r("2909"),C={name:"Fish",data:function(){return{title:"Fish",diff1:0,diff2:0,step:0,cards1:[],cards2:[],ssArr:[],flyin1:[],flyin2:[],flyout1:[],flyout2:[],cardsIndex:"",arr:[],loseflag:!1,winflag:!1,hitflag:!0,lockflag:!0,timer:""}},created:function(){this.init(this.cards1)},methods:{init:function(){var t,s=this.cards1;this.arr.splice(0);for(var r=0;r<54;r++)s.push(r);this.shuffleCards(s),(t=this.cards2).push.apply(t,Object(w["a"])(s.splice(27)))},shuffleCards:function(t){for(var s,r,i=0;i<1e3;i++)s=Math.floor(53*Math.random()),r=t[53],t[53]=t[s],t[s]=r;return t},stepFn:function(){var t=this;return Object(_["a"])(regeneratorRuntime.mark((function s(){return regeneratorRuntime.wrap((function(s){while(1)switch(s.prev=s.next){case 0:return t.hitflag=!1,s.next=3,t.hit(t.step%2==0?t.cards1:t.cards2,t.arr).then((function(){t.hitflag=!0,t.step++}));case 3:case"end":return s.stop()}}),s)})))()},time:function(t,s){return new Promise((function(r){setTimeout((function(){r(),t()}),s)}))},push:function(t,s){return Object(_["a"])(regeneratorRuntime.mark((function r(){return regeneratorRuntime.wrap((function(r){while(1)switch(r.prev=r.next){case 0:t.push(s);case 1:case"end":return r.stop()}}),r)})))()},hit:function(t,s){var r=this;return Object(_["a"])(regeneratorRuntime.mark((function i(){var e,a,n;return regeneratorRuntime.wrap((function(i){while(1)switch(i.prev=i.next){case 0:if(e=t.shift(),a=e>>2,13!=a){i.next=8;break}return r.push(s,e),r.ssArr.push(e),i.next=7,r.time((function(){r.ssArr.splice(0),s.push.apply(s,Object(w["a"])((r.step%2==0?r.cards2:r.cards1).splice(0,53==e?5:3)))}),1e3);case 7:return i.abrupt("return",i.sent);case 8:if(n=10==a?0:s.findIndex((function(t){return t>>2==a})),r.push(s,e),!(n<0)){i.next=12;break}return i.abrupt("return");case 12:return r.ssArr.push(e,s[n]),i.next=15,r.time((function(){r.ssArr.splice(0),t.push.apply(t,Object(w["a"])(s.splice(n)))}),1e3);case 15:case"end":return i.stop()}}),i)})))()},pass:function(){var t=this;this.lockflag=!1,this.winflag||this.loseflag||this.stepFn().then((function(){console.log(t.arr,t.cards1,t.cards2),setTimeout(t.pass,1e3)}))},goon:function(){this.step=0,this.hitflag=!0,this.lockflag=!0,this.cards1.splice(0),this.cards2.splice(0),this.loseflag=!1,this.winflag=!1,this.init()}},computed:{score1:function(){return this.cards1.length},score2:function(){return this.cards2.length}},watch:{score2:function(t,s){var r=this;0===t?this.loseflag=!0:(this.diff2=t-s,this.time((function(){r.diff2=0}),800))},score1:function(t,s){var r=this;0===t?this.winflag=!0:(this.diff1=t-s,this.time((function(){r.diff1=0}),800))}}},k=C,O=k,x=(r("dd8e"),Object(n["a"])(O,b,y,!1,null,"461dddbb",null)),j=x.exports;i["a"].use(u["a"]);var S=[{path:"/",redirect:"/fish"},{path:"/fish",component:j},{path:"/blackjack",component:m}],A=new u["a"]({routes:S}),I=A,M=r("2f62");i["a"].use(M["a"]);var P=new M["a"].Store({state:{},mutations:{},actions:{},modules:{}});i["a"].config.productionTip=!1,new i["a"]({router:I,store:P,render:function(t){return t(l)}}).$mount("#app")},"739e":function(t,s,r){"use strict";var i=r("fd61"),e=r.n(i);e.a},"839d":function(t,s,r){},"85ec":function(t,s,r){},d977:function(t,s,r){t.exports=r.p+"img/0.d3ad78a7.png"},dd8e:function(t,s,r){"use strict";var i=r("839d"),e=r.n(i);e.a},fd61:function(t,s,r){}});
//# sourceMappingURL=app.514c2de6.js.map