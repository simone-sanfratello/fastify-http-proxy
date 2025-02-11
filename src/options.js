'use strict'

const DEFAULT_PING_INTERVAL = 30_000
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 3
const DEFAULT_MAX_RECONNECTION_RETRIES = Infinity
const DEFAULT_RECONNECT_INTERVAL = 1_000
const DEFAULT_RECONNECT_DECAY = 1.5
const DEFAULT_CONNECTION_TIMEOUT = 5_000
const DEFAULT_RECONNECT_ON_CLOSE = false

function validateOptions (options) {
  if (!options.upstream && !options.websocket && !((options.upstream === '' || options.wsUpstream === '') && options.replyOptions && typeof options.replyOptions.getUpstream === 'function')) {
    throw new Error('upstream must be specified')
  }
  
  if (options.wsReconnect) {
    const wsReconnect = options.wsReconnect

    if (wsReconnect.pingInterval !== undefined && (typeof wsReconnect.pingInterval !== 'number' || wsReconnect.pingInterval < 0)) {
      throw new Error('wsReconnect.pingInterval must be a non-negative number')
    }
    wsReconnect.pingInterval = wsReconnect.pingInterval ?? DEFAULT_PING_INTERVAL

    if (wsReconnect.maxReconnectAttempts !== undefined && (typeof wsReconnect.maxReconnectAttempts !== 'number' || wsReconnect.maxReconnectAttempts < 0)) {
      throw new Error('wsReconnect.maxReconnectAttempts must be a non-negative number')
    }
    wsReconnect.maxReconnectAttempts = wsReconnect.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS

    if (wsReconnect.maxReconnectionRetries !== undefined) {
      if (typeof wsReconnect.maxReconnectionRetries !== 'number' || wsReconnect.maxReconnectionRetries < 1) {
        throw new Error('wsReconnect.maxReconnectionRetries must be a number greater than or equal to 1')
      }
    }
    wsReconnect.maxReconnectionRetries = wsReconnect.maxReconnectionRetries ?? DEFAULT_MAX_RECONNECTION_RETRIES

    if (wsReconnect.reconnectInterval !== undefined && (typeof wsReconnect.reconnectInterval !== 'number' || wsReconnect.reconnectInterval < 0)) {
      throw new Error('wsReconnect.reconnectInterval must be a non-negative number')
    }
    wsReconnect.reconnectInterval = wsReconnect.reconnectInterval ?? DEFAULT_RECONNECT_INTERVAL

    if (wsReconnect.reconnectDecay !== undefined && (typeof wsReconnect.reconnectDecay !== 'number' || wsReconnect.reconnectDecay < 1)) {
      throw new Error('wsReconnect.reconnectDecay must be a number greater than or equal to 1')
    }
    wsReconnect.reconnectDecay = wsReconnect.reconnectDecay ?? DEFAULT_RECONNECT_DECAY

    if (wsReconnect.connectionTimeout !== undefined && (typeof wsReconnect.connectionTimeout !== 'number' || wsReconnect.connectionTimeout < 0)) {
      throw new Error('wsReconnect.connectionTimeout must be a non-negative number')
    }
    wsReconnect.connectionTimeout = wsReconnect.connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT

    if (wsReconnect.reconnectOnClose !== undefined && typeof wsReconnect.reconnectOnClose !== 'boolean') {
      throw new Error('wsReconnect.reconnectOnClose must be a boolean')
    }
    wsReconnect.reconnectOnClose = wsReconnect.reconnectOnClose ?? DEFAULT_RECONNECT_ON_CLOSE
  }

  return options

}

module.exports = {
  validateOptions
}
