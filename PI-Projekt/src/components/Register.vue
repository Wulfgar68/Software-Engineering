<script setup>
import { ref } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase.js'
import { useRouter } from 'vue-router'

const router = useRouter();
const email = ref('')
const password = ref('')
const response = ref({ error: false, message: '' })
const register = async () => {
 try {
 const userCredential = await createUserWithEmailAndPassword(auth, email.value,
password.value);
 response.value.error = false;
 response.value.message = 'Korisnik registriran: ' +
JSON.stringify(userCredential.user);
 } catch (error) {
 response.value.error = true;
 response.value.message = 'Greška pri registraciji: ' + error.message;
 }
};
</script>
<template>
 <form @submit.prevent="register">
 <h2>Registracija</h2> <hr>
 <input v-model="email" type="email" placeholder="Email...">
 <input v-model="password" type="password" placeholder="Lozinka...">
 <button type="submit">Registriraj se</button>
 <br>
 <button @click="router.push('./login')">Prijava</button>
 <span :class="response.error ? 'text-rose-600' : 'text-emerald-600'">{{
response.message }}</span>
 </form>
</template>
