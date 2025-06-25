<script setup>

import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase.js'
import { useRouter } from 'vue-router'

const router = useRouter();
const email = ref('')
const password = ref('')
const response = ref({ error: false, message: '' })
const login = async () => {
 try {
 const userCredential = await signInWithEmailAndPassword(auth, email.value,
password.value);
 response.value.error = false;
 response.value.message = 'Korisnik prijavljen: ' +
JSON.stringify(userCredential.user);
 } catch (error) {
 response.value.error = true;
 response.value.message = 'Greška pri prijavi: ' + error.message;
 }
};
</script>
<template>
 <form @submit.prevent="login">
 <h2>Prijava</h2> <hr>
 <input v-model="email" type="email" placeholder="Email...">
 <input v-model="password" type="password" placeholder="Lozinka...">
 <button type="submit">Prijavi se</button>
 <br>
<button type="button" @click="router.push('/register')">Registracija</button>
 <span :class="response.error ? 'text-rose-600' : 'text-emerald-600'">{{
response.message }}</span>
 </form>
</template>
