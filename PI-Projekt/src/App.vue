<template>
  <div>
    <NavBar /> <!-- ako imaš navigaciju -->
    <router-view /> <!-- ovdje će se prikazivati komponente ovisno o ruti -->
    <Footer /> <!-- ako imaš footer -->
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';
</script>