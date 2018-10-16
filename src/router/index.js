import Vue from 'vue'
import Router from 'vue-router'
import ImageGallery from '@/components/ImageGallery'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Adaptiva',
      component: ImageGallery
    }
  ]
})
