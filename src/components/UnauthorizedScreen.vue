<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="error-screen">
    <div class="error-box">
      <div class="error-icon">🔒</div>
      <h1>Acesso Restrito</h1>
      <p>Você precisa estar autenticado para acessar esta área do Centro de Controle de Operações.</p>
      <button class="login-btn" @click="goLogin">Ir para Login</button>
    </div>
  </div>
</template>

<style scoped>
.error-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f4f8;
  padding: 20px;
}
.error-box {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 25px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}
.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}
h1 {
  color: #1d2951;
  margin-bottom: 15px;
  font-size: 24px;
}
p {
  color: #666;
  margin-bottom: 25px;
  line-height: 1.5;
}
.login-btn {
  background: #1d2951;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover {
  background: #162040;
}
</style>
