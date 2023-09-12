<template>
  <view>

  </view>
</template>

<script setup lang="ts">

import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
// import { io } from 'socket.io-client'
onLoad(() => {
  console.log('onLoad', XMLHttpRequest, WebSocket)
  // const socket = io('http://localhost:3000/events', {
  //   reconnectionDelayMax: 10000,
  //   auth: {
  //     token: '123'
  //   },
  //   query: {
  //     'my-key': 'my-value'
  //   },
  //   transports: ['polling', 'websocket']
  // })
  // socket.on('connect', function () {
  //   console.log('Connected')

  //   socket.emit('events', { test: 'test' })
  //   socket.emit('identity', 0, (response) => console.log('Identity:', response))
  // })
  // socket.on('events', function (data) {
  //   console.log('event', data)
  // })
  // socket.on('exception', function (data) {
  //   console.log('event', data)
  // })
  // socket.on('disconnect', function () {
  //   console.log('Disconnected')
  // })

  // socket.on('connect_error', (error) => {
  //   console.error(error)
  // })
})
</script>

<style></style>
