import { createRouter, createWebHistory } from 'vue-router'

const LoginScreen = () => import('../components/LoginScreen.vue')
const UploadScreen = () => import('../components/UploadScreen.vue')
const EditorScreen = () => import('../components/EditorScreen.vue')
const CalendarScreen = () => import('../components/CalendarScreen.vue')
const RestricoesScreen = () => import('../components/RestricoesScreen.vue')
const UnauthorizedScreen = () => import('../components/UnauthorizedScreen.vue')

const SESSION_KEY = 'cco_auth'
const TOKEN_KEY = 'cco_token'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginScreen,
    meta: { requiresAuth: false }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: UnauthorizedScreen,
    meta: { requiresAuth: false }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: UploadScreen,
    meta: { requiresAuth: true }
  },
  {
    path: '/editor',
    name: 'Editor',
    component: EditorScreen,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarScreen,
    meta: { requiresAuth: true }
  },
  {
    path: '/restricoes',
    name: 'Restricoes',
    component: RestricoesScreen,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'Root',
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/unauthorized'
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Navigation guard para verificar autenticação
router.beforeEach((to, from, next) => {
  let isAuthenticated = false
  try {
    isAuthenticated = !!localStorage.getItem(TOKEN_KEY)
  } catch (e) {
    console.error('LocalStorage access error:', e)
  }

  if (to.path === '/') {
    return next(isAuthenticated ? '/editor' : '/login')
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/unauthorized')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/upload')
  } else {
    next()
  }
})

export default router
