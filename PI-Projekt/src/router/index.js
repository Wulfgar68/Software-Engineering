import { createRouter, createWebHistory } from 'vue-router';


// importirane komponente za rute
import Login from '../components/Auth/Login.vue';
import Register from '../components/Auth/Register.vue';
import Marketplace from '../components/Marketplace.vue';
import Profile from '../components/Auth/Profile.vue';
import BookDetails from '../components/Knjige/BookDetails.vue';

const routes = [
  { path: '/', redirect: '/marketplace' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/marketplace', component: Marketplace },
  { path: '/profile', component: Profile },
  { path: '/book/:id', component: BookDetails, props: true },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;