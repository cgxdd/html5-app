function testConnection(ip, port, time = 3000) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`wss://${ip}:${port}/pecsearch`)
    const timer = setTimeout(() => {
      ws.close()
      resolve(false)
    }, time)

    ws.onopen = () => {
      clearTimeout(timer)
      ws.close()
      resolve(true)
    }
    ws.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
  })
}

self.onmessage = async (e) => {
  const { ip, port } = e.data
  const isActive = await testConnection(ip, port)
  self.postMessage({
    type: 'result',
    data: { ip, port, isActive },
  })
}
