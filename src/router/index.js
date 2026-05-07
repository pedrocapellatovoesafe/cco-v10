import { createRouter, createWebHistory } from 'vue-router'
import LoginScreen from '../components/LoginScreen.vue'
import UploadScreen from '../components/UploadScreen.vue'
import EditorScreen from '../components/EditorScreen.vue'
import CalendarScreen from '../components/CalendarScreen.vue'

const SESSION_KEY = 'cco_auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginScreen,
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
    path: '/',
    redirect: () => {
      const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === '1'
      return isAuthenticated ? '/upload' : '/login'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === '1'
      return isAuthenticated ? '/upload' : '/login'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes
})

// Navigation guard para verificar autenticação
router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === '1'

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Rota protegida, mas não autenticado - redireciona para login
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // Já autenticado tentando acessar login - vai para upload
    next('/upload')
  } else {
    // Permite a navegação
    next()
  }
})

export default router
