<template>
  <div id="app">
    <div id="nav">
      GAMES:
      &nbsp;
      <router-link to="/month">Month</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/fish">Fish</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/blackjack">BlackJack</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/point24">Point24</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/Tortoise">Tortoise</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/Sort">Sort</router-link>
      &nbsp;
      /
      &nbsp;
      <router-link to="/Pairs">Pairs</router-link>
      <!-- &nbsp;
      /
      &nbsp;
      <router-link to="/Spider">Spider</router-link> -->
    </div>
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
