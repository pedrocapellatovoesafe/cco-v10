<script setup>
import { inject, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import iconUrl from '../icons/icon-192.png'

const router = useRouter()
const store = inject('store')
const isLoading = ref(false)

const loginUser = computed({
  get: () => store?.state?.loginUser || '',
  set: (val) => { if (store) store.state.loginUser = val }
})

const loginPass = computed({
  get: () => store?.state?.loginPass || '',
  set: (val) => { if (store) store.state.loginPass = val }
})

const loginError = computed(() => store?.state?.loginError || false)

const handleLogin = async () => {
  if (!store || isLoading.value) return
  isLoading.value = true
  try {
    const success = await store.login()
    if (success) {
      router.push('/editor')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-screen">
    <div class="login-box">
      <div class="login-header">
        <img :src="iconUrl" alt="SAFE" style="width:56px;height:56px;border-radius:50%;margin-bottom:10px;opacity:.92;" />
        <h1>✈ CCO · SAFE Aviation</h1>
        <p>Acesso restrito — Centro de Controle de Operações</p>
      </div>
      <div class="login-body" v-if="store">
        <div class="login-err" v-if="loginError">Usuário ou senha incorretos.</div>
        <div class="login-field">
          <label>Usuário</label>
          <input type="email" v-model="loginUser" placeholder="seu@email.com" autocomplete="username" @keyup.enter="handleLogin" :disabled="isLoading" />
        </div>
        <div class="login-field">
          <label>Senha</label>
          <input type="password" v-model="loginPass" placeholder="••••••••" autocomplete="current-password" @keyup.enter="handleLogin" :disabled="isLoading" />
        </div>
        <button class="login-btn" @click="handleLogin" :disabled="isLoading">
          <span v-if="isLoading">Autenticando...</span>
          <span v-else>Entrar</span>
        </button>
      </div>
      <div class="login-body" v-else>
        Carregando sistema...
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.login-box {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}
.login-header {
  background: var(--primary);
  color: var(--white);
  padding: 24px;
  text-align: center;
  border-bottom: 4px solid var(--secondary);
}
.login-header img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin-bottom: 10px;
  opacity: 0.92;
}
.login-header h1 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 4px;
  font-family: var(--font-title);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.login-header p {
  font-size: 12px;
  opacity: 0.8;
}
.login-body {
  padding: 24px;
}
.login-field {
  margin-bottom: 14px;
}
.login-field label {
  display: block;
  font-size: 11px;
  font-weight: bold;
  color: var(--primary);
  margin-bottom: 5px;
  text-transform: uppercase;
}
.login-field input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}
.login-field input:focus {
  border-color: var(--secondary);
  box-shadow: 0 0 0 3px rgba(var(--secondary-rgb), 0.1);
}
.login-btn {
  width: 100%;
  background: var(--secondary);
  color: var(--white);
  border: none;
  border-radius: 5px;
  padding: 11px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}
.login-btn:hover {
  background: var(--primary);
  transform: translateY(-1px);
}
.login-err {
  background: #fdecea;
  border: 1px solid #f5b8b5;
  color: #7b1a19;
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 12px;
  margin-bottom: 12px;
}
</style>
