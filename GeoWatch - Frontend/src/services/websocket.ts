import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

export const createWebSocketClient = (endpoint: string) => {
  const socket = new SockJS(endpoint)
  return Stomp.over(socket)
}
