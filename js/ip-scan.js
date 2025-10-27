class IPScanner {
  constructor(startIp, endIp, port = 443, maxWorkers = 8) {
    this.startIp = startIp
    this.endIp = endIp
    this.port = port
    this.maxWorkers = maxWorkers
    this.activeWorkers = 0
    this.taskQueue = []
    this.results = []
    this.scannedCount = 0
    this.totalCount = 0
    this.callback = null
  }

  async startScan(callBack) {
    this.callback = callBack
    const ipRange = this.calculateIpRange()
    this.totalCount = ipRange.length

    // 创建Worker池
    this.workerPool = []
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(new URL('./scan-worker.js', import.meta.url))

      worker.onmessage = (e) => {
        this.handleWorkerResponse(e.data.data)
        this.activeWorkers--
        this.processQueue()
      }

      this.workerPool.push(worker)
    }

    // 分发任务
    ipRange.forEach((ip) => {
      this.taskQueue.push(ip)
    })

    this.processQueue()
  }

  processQueue() {
    while (this.activeWorkers < this.maxWorkers && this.taskQueue.length > 0) {
      const ip = this.taskQueue.shift()
      const worker = this.workerPool[this.activeWorkers]

      worker.postMessage({
        ip,
        port: this.port,
      })

      this.activeWorkers++
      this.updateProgress()
    }
  }

  handleWorkerResponse(data) {
    this.scannedCount++
    this.results.push(data)
    this.updateProgress()
  }

  updateProgress() {
    const percent = Math.round((this.scannedCount / this.totalCount) * 100)
    document.getElementById(
      'progress'
    ).innerHTML = `已完成 ${this.scannedCount}/${this.totalCount} (${percent}%)`
    if (percent === 100) {
      this.callback(this.results.filter((item) => item.isActive))
      this.workerPool.forEach((work) => work.terminate())
    }
  }

  calculateIpRange() {
    const ipToInt = (ip) => ip.split('.').reduce((acc, x) => acc * 256 + +x, 0)
    const intToIp = (int) =>
      [int >>> 24, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.')

    const start = ipToInt(this.startIp)
    const end = ipToInt(this.endIp)
    const range = []

    for (let i = start; i <= end; i++) {
      range.push(intToIp(i))
    }

    return range
  }
}

window.IPScanner = IPScanner
