import Vue from 'vue';
import Router from 'vue-router';
import Music from '../pages/music.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/lcx/music/',
      name: 'Music',
      component: Music
    }
  ]
});
