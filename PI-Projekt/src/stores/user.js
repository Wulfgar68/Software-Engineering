import { defineStore } from 'pinia'

// Ova trgovina definira store za korisnika
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null, 
  }),
  actions: {
    setUser(userData) {
      this.user = userData
    },
    clearUser() {
      this.user = null
    }
  }
})
