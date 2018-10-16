<template>
  <div>
    <h2>Lorem Picsum Image Gallery</h2>
    <div class="row">
      <input 
      :disabled="isPlaying" 
      type="text" 
      v-model="searchTerm"
      v-show="!modalIsActive"
      placeholder="Live Search..."/>    
    </div>
    <div class="row error-wrapper" v-if="errors.length">
      <span
        v-for="error in errors">{{ error }}</span>
    </div>
    <div class="row" v-if="images.length">
      <div class="column small-12" style="min-height: 310px;">
        <div 
          class="image-wrapper" 
          v-for="(image, i) in images"
          v-if="image.isActive && !modalIsActive">
          <img :src="image.src" @click="enlargeImage(image)"/>
        </div>
      </div>
      <div class="column small-12">
        <button @click="loadImage(true)">Back</button>
        <button @click="playGallery">{{ buttonText }}</button>
        <button @click="loadImage(false)">Forward</button>
      </div>
    </div>
    <transition v-if="showModal">
      <div class="modal-mask">
        <div class="modal-wrapper">
          <div class="modal-container">

            <div class="modal-header">
              <slot name="header">
              </slot>
            </div>

            <div class="modal-body">
              <slot name="body">
                <img @click="enlargeImage" :src="images[activeIndex].modal"/></slot>
              </slot>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
  import $ from 'jquery'
  import { isArray, map, merge, debounce, filter } from 'lodash'
  const defaultUser = 'Alejandro Escamilla'
  export default {
    data () {
      return {
        activeIndex: 0,
        buttonText: 'Play',
        errors: [],
        images: [],
        interval: null,
        isPlaying: false,
        modalIsActive: false,
        responseData: [],
        searchTerm: '',
        showModal: false
      }
    },
    watch: {
      isPlaying: function(v) {
        if (!v) {
          window.clearInterval(this.interval)
          this.buttonText = 'Play'
        }
        else {
          this.interval = window.setInterval(this.loadImage.bind(this, false), 2000)
          this.buttonText = 'Pause'
        }
      },
      searchTerm: debounce(function() {
        this.handleResponse(this.responseData)
      }, 500)
    },
    created: function() {
      $.ajax({
        url: 'https://picsum.photos/list',
        error: () => {
        },
        success: (response) => {
          if (response && isArray(response) && response.length) {
            this.responseData = response
            this.handleResponse(response)
          }
          else {
            this.errors = ['Unable to parse response. Please try again later.']
          }
        }
      })
    },
    methods: {
      /** Simulate a modal like image */
      enlargeImage: function() {
        this.showModal = !this.showModal
        if (!this.showModal) {
          window.setTimeout(function() {
            this.modalIsActive = false
          }.bind(this), 500)
        }
        else {
          this.modalIsActive = true
          this.isPlaying = false
        }
      },
      /** Handles setting of currently active image */
      handleFadeout: function(isBackButton) {
        this.images[this.activeIndex].isActive = false
        /** If user clicks the back button and we are on the first image then loop back to the last image */
        if (isBackButton && this.activeIndex == 0) {
          const length = this.images.length - 1
          this.activeIndex = length
          this.images[this.activeIndex].isActive = true
          return
        }
        if (!isBackButton && this.activeIndex < (this.images.length - 1)) {
          this.activeIndex++
          this.images[this.activeIndex].isActive = true
          return
        }
        if (isBackButton && this.activeIndex) {
          this.activeIndex--
        }
        /** If User clicks the forward button and we are on the last image then loop back to the first image */
        if (!isBackButton && this.activeIndex == (this.images.length - 1)) {
          this.activeIndex = 0
        }
        this.images[this.activeIndex].isActive = true
      },
      /** Determine if we are filtering based on the users search term or the default search term */
      handleResponse: function(response) {
        let images = response
        const searchTerm = this.searchTerm
        if (this.searchTerm) {
          images = filter(response, function(image) {
            const author = image.author.toLowerCase()
            return author.indexOf(searchTerm) > - 1
          })
        }
        else {
          images = filter(response, function(image) {
            return image.author == defaultUser
          })
        }
        if (!images.length) {
          this.errors = [`No authors found that match your search term. Please try again later.`]
          this.images = []
        }
        else {
          this.errors = []
        }
        this.activeIndex = 0
        this.images = map(images, function(image, index) {
          const copiedImage = JSON.parse(JSON.stringify(image))
          return merge({}, image, { 
            isActive: index == 0, 
            src: `https://picsum.photos/500/300?image=${image.id}`,
            modal: `https://picsum.photos/750/450?image=${image.id}`})
        })
      },
      loadImage: function(isBackButton) {
        let isFadingOut = true
        $('.image-wrapper').fadeOut(
        {
          complete: function() {
            isFadingOut = false
            this.handleFadeout(isBackButton)
            window.setTimeout(function() {
              $('.image-wrapper').fadeIn()
            })
          }.bind(this)
        })
        /** Don't let the user click on next/forward until the current image is finished fading out */
        if (isFadingOut) {
          return
        }
      },
      playGallery: function() {
        this.isPlaying = !this.isPlaying
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.error-wrapper{
  border: 1px solid;
  padding: 10px;
  box-shadow: 1px 1px #888888;
}
.error-wrapper span {
  color: red;
}
.row {
  width: 100%;
  min-height: 20px;
}
input {
  margin-bottom: 1.5rem;
  float: left;
}
@media (min-width: 520px){
  input {
    float: none;
    position: relative;
    right: 11.5rem;
  }
}
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 750px;
  height: 450px;
  margin: 0px auto;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
}

</style>
