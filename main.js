const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

const n = 15 //矩阵高
const m = 10 //矩阵宽
let ballNums = 0   //发射球的数量
let balls = new Array() //已发射的球
let readyBalls = new Array()    //待发射的球
let pasue = false
let framcount = 0   //渲染帧计数
const interval = 3 //小球发射间隔帧数
const martix = Array.from(new Array(n+5), ()=>new Array(m).fill(0))
let startColor = "#FFC600"    //发射球的颜色
let WIDTH, HEIGHT, blockSize, RADIUS, vel, startX, startY, deadline
let eleBoard, eleRound, eleScore, eleBalls
const dev = false //调试模式

function dataInit() {
    eleBoard = document.querySelector('.board')
    eleRound = document.getElementById('round')
    eleScore = document.getElementById('score')
    eleBalls = document.getElementById('balls')
    //自适应窗口
    let windowWidth = document.documentElement.clientWidth || document.body.clientWidth
    let windowHeight = document.documentElement.clientHeight || document.body.clientHeight
    if (windowHeight/windowWidth>5.2/3) {
        WIDTH = Math.floor(windowWidth)
        HEIGHT = Math.floor(WIDTH/3*5)
        eleBoard.style = `width: ${WIDTH}px;`
    } else {  
        WIDTH = Math.floor(windowHeight/2)
        HEIGHT = Math.floor(WIDTH/3*5)
        eleBoard.style = `width: ${WIDTH}px;` + "border-left: 2px solid #eee;border-right: 2px solid #eee;"
        document.getElementsByTagName('canvas')[0].style = "border-left: 2px solid #eee;border-right: 2px solid #eee;";
    }
    document.documentElement.style.fontSize = Math.floor(WIDTH/30) + 'px'
        
    // WIDTH = 480
    // HEIGHT = Math.floor(WIDTH/3*5)
    // console.log(windowHeight,windowWidth,WIDTH,HEIGHT)
    canvas.width = WIDTH
    canvas.height = HEIGHT
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.strokeStyle = "#eee"
    
    blockSize = WIDTH/m
    RADIUS = blockSize/6 //球半径
    vel = 1.5*RADIUS //运动方向上的速度
    startX = Math.floor(WIDTH/2)    //发射点
    startY = HEIGHT - RADIUS
    deadline = n*blockSize
}

const blockColor = ['#33691E','#1B5E20','#004D40','#006064','#0D47A1','#1A237E','#311B92','#4A148C','#880E4F','#B71C1C']
const getBlockColor = (num)=>{
    num = Math.floor((num%50)/5)    //每5变化一次颜色
    return blockColor[num]
}

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l
const getAngel = (tx,ty,sx,sy) => {
    let dx = tx - sx
    let dy = ty - sy
    if (dx == 0 && dy ==0) return 0
    if (dx == 0) return dy > 0 ? 90 : 270
    let theta = (Math.atan(dy / dx) / Math.PI * 180)
    if (theta >= 0) return dx > 0 ? theta : theta + 180
    if (theta < 0) return dy < 0 ? theta + 360 : theta + 180
}

//更新视图
function updateView() {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let i=0; i<n; i++) {
        for (let j=0; j<m; j++) {
            //方块
            if (martix[i][j] > 0) {
                ctx.fillStyle = getBlockColor(martix[i][j])
                ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize)
                ctx.strokeRect(j * blockSize, i * blockSize, blockSize, blockSize)
                ctx.fillStyle = "#eee"
                ctx.font= Math.floor(blockSize/2)+"px"+" Arial"
                ctx.textBaseline = "middle"
                ctx.textAlign = "center"
                ctx.fillText(martix[i][j], (j+0.5) * blockSize, (i+0.5) * blockSize)
            }
            //奖励球
            if (martix[i][j] < 0) {
                ctx.beginPath()
                ctx.fillStyle = "#222"
                ctx.arc((j+0.5) * blockSize, (i+0.5) * blockSize,  blockSize/3, 0, 2*Math.PI)
                ctx.fill()
                ctx.closePath()
                ctx.fillStyle = "#ddd"
                ctx.font= Math.floor(blockSize/3)+"px"+" Arial"
                ctx.textBaseline = "middle"
                ctx.textAlign = "center"
                ctx.fillText('+'+(-martix[i][j]), (j+0.5) * blockSize, (i+0.5) * blockSize)
            }
        }
    }

    ctx.beginPath()
    ctx.moveTo(0, deadline)
    ctx.lineTo(WIDTH, deadline)
    ctx.stroke()
    ctx.closePath()

    // ctx.fillStyle = "#ddd"
    // ctx.font= Math.floor(blockSize/3)+"px"+" Arial"
    // ctx.textBaseline = "top"
    // ctx.textAlign = "left"
    // ctx.fillText(`Round:${round}   Score:${score}   Balls:${ballNums}`, 0.1*blockSize, deadline+0.1*blockSize)

    eleRound.innerText = round
    eleScore.innerText = score
    eleBalls.innerText = ballNums

    if (!pasue) {
        new Ball(startX, startY-RADIUS, RADIUS, 0, 0, startColor).draw()
    } else {
        balls.forEach(ball=>ball.draw())
    }
    
}

let round = 0 //回合数记录
let score = 0
let pBlock = 0.3
let pReward = 0.1
let nReward = 0
let nBlock = 0

function generateLayer() {
    if (martix[n-1].some((num)=>num>0)) return false //还有未消除的方块
    martix.pop()
    const layer = new Array(m).fill(0)
    if (round % 3 == 0) layer[Math.floor(Math.random()*10)] = -nReward //每3层生成奖励球
    for (let j=0; j<m; j++) {
        if (layer[j]<0) continue
        if (Math.random()<pBlock) { //生成方块
            layer[j] = nBlock
        }
    }
    martix.unshift(layer)
    return true
}

function nextRound() {
    pBlock = Math.min(0.6, pBlock+0.02)
    nBlock++
    nReward = Math.floor(round/50) + 1
    round++
    ballNums++
    if (!generateLayer()) {
        alert('Game Over! score:'+score)
        history.go(0)
        return
    }
    updateView()
}

class Ball {
    constructor(x, y, r, vel, a0, color) {
        this.x = x
        this.y = y
        this.r = r
        this.vel = vel
        this.a0 = a0
        this.color = color
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI)
        ctx.fill()
        ctx.closePath()
    }
    move() {
        const YtoI = (y) => Math.floor(y/blockSize)
        const XtoJ = (x) => Math.floor(x/blockSize)
        const bounce = (x0, y0, x1, y1, d, a) => {
            // 碰撞时的圆心(x0,y0) 碰撞点 (x1,y2) 反弹运动距离d 速度角a
            let b = getAngel(x1, y1, x0, y0) //碰撞点与圆心连线 与 正x轴夹角
            let a1 = ((180 + 2 * b - a) + 360) % 360
            let x2 = x0 + d * Math.cos(a1/180*Math.PI) 
            let y2 = y0 + d * Math.sin(a1/180*Math.PI)
            return [x2, y2, a1]
        }
        const eliminate = (i, j) => {
            if (0<=j && j<m && 0<=i && i<n) {
                score += 10
                martix[i][j] = Math.max(0, martix[i][j] - 1)
            }
        }

        // #region
        // const i = YtoI(this.y)
        // const j = XtoJ(this.x)
        // const x = this.x
        // const y = this.y
        // const r = this.r
        // const a0 = this.a0
        // const vel = this.vel 
        // let nextX = x + Math.cos(a0/180*Math.PI)*vel
        // let nextY = y + Math.sin(a0/180*Math.PI)*vel
        // if (nextX - r < 0) {
        //     let x0 = r
        //     let y0 = y + (x - r) * Math.tan(a0/180*Math.PI)
        //     let d = vel - Math.sqrt(Math.pow(x0-x,2)+Math.pow(y0-y,2))
        //     let [x2, y2, a1] = bounce(x0, y0, 0, y0, d, a0)
        //     nextX = x2
        //     nextY = y2
        //     this.a0 = a1
        // } 
        // if (nextX + r > WIDTH) {
        //     let x0 = WIDTH - r
        //     let y0 = y + (WIDTH - r - x) * Math.tan(a0/180*Math.PI)
        //     let d = vel - Math.sqrt(Math.pow(x0-x,2)+Math.pow(y0-y,2))
        //     let [x2, y2, a1] = bounce(x0, y0, WIDTH, y0, d, a0)
        //     nextX = x2
        //     nextY = y2
        //     this.a0 = a1
        // }
        // if (nextY - r < 0) {
        //     let x0 = x + (y - r) / Math.tan(a0/180*Math.PI)
        //     let y0 = r
        //     let d = vel - Math.sqrt(Math.pow(x0-x,2)+Math.pow(y0-y,2))
        //     let [x2, y2, a1] = bounce(x0, y0, x0, 0, d, a0)
        //     nextX = x2
        //     nextY = y2
        //     this.a0 = a1
        // }
        // this.x = nextX
        // this.y = nextY
        // #endregion

        const isBlock = (x, y) => {
            //检测x, y是否不能通过
            if (x<0 || x>WIDTH) return true
            if (y<0) return true //底部可通过（运动结束）
            return martix[YtoI(y)][XtoJ(x)] > 0
        }
        const distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))
        
        //对边进行检测
        const updateX = () => {
            if (nX<this.x && isBlock(nX - this.r, nY)) {
                console.log('left')
                eliminate(YtoI(nY),XtoJ(nX-this.r))
                const x0 = (XtoJ(nX-this.r)+1)*blockSize + this.r
                const y0 = nY + (x0 - nX) * Math.tan(this.a0/180*Math.PI);
                [nX, nY, this.a0] = bounce(x0, y0, x0-this.r, y0, distance(x0, y0, nX, nY), this.a0)
            } else if (nX>this.x && isBlock(nX + this.r, nY)) {
                console.log('right')
                eliminate(YtoI(nY),XtoJ(nX+this.r))
                const x0 = (XtoJ(nX+this.r))*blockSize - this.r
                const y0 = nY + (x0 - nX) * Math.tan(this.a0/180*Math.PI);
                [nX, nY, this.a0] = bounce(x0, y0, x0+this.r, y0, distance(x0, y0, nX, nY), this.a0)
            }
        }
        const updateY = ()=> {
            if (nY>this.y && isBlock(nX, nY + this.r)) {
                console.log('bottom')
                eliminate(YtoI(nY+this.r),XtoJ(nX))
                const y0 = (YtoI(nY+this.r))*blockSize - this.r
                const x0 = nX + (y0 - nY) / Math.tan(this.a0/180*Math.PI);
                [nX, nY, this.a0] = bounce(x0, y0, x0, y0+this.r, distance(x0, y0, nX, nY), this.a0)
            } else if (nY<this.y && isBlock(nX, nY - this.r)) {
                console.log('top')
                eliminate(YtoI(nY-this.r),XtoJ(nX))
                const y0 = (YtoI(nY-this.r)+1)*blockSize + this.r
                const x0 = nX + (y0 - nY) / Math.tan(this.a0/180*Math.PI);
                [nX, nY, this.a0] = bounce(x0, y0, x0, y0-this.r, distance(x0, y0, nX, nY), this.a0)
            }
        }
        
        let nX = this.x + Math.cos(this.a0/180*Math.PI)*this.vel
        let nY = this.y + Math.sin(this.a0/180*Math.PI)*this.vel

        console.log(`
        (${this.x.toFixed(1)},${this.y.toFixed(1)})
        (${nX.toFixed(1)},${nY.toFixed(1)})
        ${this.a0.toFixed(1)}
        `)
        
        // 1帧内碰撞两条边的问题
        if (Math.abs(nY-this.y)>Math.abs(nX-this.x)) {
            updateY()
            updateX()
        } else {
            updateX()
            updateY()
        }

        //对四个角检测

        this.x = nX
        this.y = nY


        //奖励球
        let i = YtoI(this.y)
        let j = XtoJ(this.x)
        if (0<=i && i<n && 0<=j && j<m && martix[i][j]<0) {
            ballNums += Math.abs(martix[i][j])
            martix[i][j] = 0
        }
    }
}

// let prev = 0

function loop() {
    // let curr = Date.now()
    // if (curr-prev>18) console.log(curr-prev)
    // prev = curr
    
    // console.log(readyBalls)
    // console.log(balls)
    //每interval帧发射一个小球  
    if (readyBalls.length>0 && framcount == 0) {
        balls.push(readyBalls.pop())
    }
    framcount = (framcount + 1) % interval

    //移动小球 并去除碰撞底部的小球
    balls = balls.filter(ball=>{
        ball.move()
        if (ball.x<0 || ball.x>WIDTH || ball.y<0) return false
        startX = ball.x
        startColor = ball.color
        return ball.y+ball.r<HEIGHT
    })

    if (balls.length>0 || readyBalls.length>0) {
        updateView()
        if (!dev) requestAnimationFrame(loop)
        // setTimeout(loop, 500)
    }
    else {
        framcount = 0
        pasue = false
        nextRound()
    }
}

function shoot(event) {
    // console.log(event.offsetX-startX, event.offsetY-startY, getAngel(event.offsetX, event.offsetY, startX, startY))
    // return

    if (pasue) return
    //排除角度太小的情况
    if (event.offsetY > deadline) return
        
    for (let i=0; i<ballNums; i++) {
        readyBalls.unshift(new Ball(
            startX,
            startY,
            RADIUS,
            vel,
            getAngel(event.offsetX, event.offsetY, startX, startY),
            i==0? startColor : `rgb(${random(32, 255)},${random(32, 255)},${random(32, 255)})`
        ))
    }

    pasue = true
    loop()
}

window.onload = ()=>{
    dataInit()
    canvas.onclick = shoot
    document.body.onkeyup = ()=>{
        if (dev && (readyBalls.length>0 || balls.length>0)) {
            loop()
        }
    }

    //test
    for (let i=0; i<n*0.5; i++) 
    for (let j=0; j<m; j++) {
        martix[i][j] = random(-30,20)
        if (martix[i][j] < 0) {
            if (Math.random()<0.1) martix[i][j] = -1
                else martix[i][j] = 0
        }
    }
    ballNums = 10

    nextRound()    
}
