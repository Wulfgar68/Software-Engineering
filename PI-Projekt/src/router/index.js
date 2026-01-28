import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  { path: '/', redirect: '/marketplace' },
  { path: '/login', component: () => import('@/components/Auth/Login.vue') },
  { path: '/register', component: () => import('@/components/Auth/Register.vue') },

  { path: '/marketplace', component: () => import('@/components/Marketplace.vue') },
  { path: '/book/:id', component: () => import('@/components/Knjige/BookDetails.vue'), props: true },

  { path: '/favorites', component: () => import('@/components/Knjige/Favoriti.vue'), meta: { requiresAuth: true } },

  {
    path: '/profile',
    component: () => import('@/components/UserProfile.vue'),
    props: () => {
      const auth = useAuthStore()
      return { uid: auth.user?.uid || '' }
    },
    meta: { requiresAuth: true }
  },

  { path: '/dodaj_knjigu', component: () => import('@/components/Knjige/BookForm.vue'), meta: { requiresAuth: true } },

  { path: '/chats', component: () => import('@/components/Chat/ChatList.vue'), meta: { requiresAuth: true } },
  { path: '/chat/:id', component: () => import('@/components/Chat/ChatRoom.vue'), props: true, meta: { requiresAuth: true } },

  { path: '/users', component: () => import('@/components/Users.vue'), meta: { requiresAuth: true } },

  { path: '/user/:uid', component: () => import('@/components/UserProfile.vue'), props: true },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else {
    next()
  }
})

export default router
