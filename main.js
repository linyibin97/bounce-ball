const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

let ballNums = 10   //发射球的数量
let balls = new Array() //已发射的球
let readyBalls = new Array()    //待发射的球
let pasue = false
let framcount = 0   //渲染帧计数
const interval = 5 //小球发射间隔

let RADIUS = 10 //球半径
let vel = RADIUS //运动方向上的速度
let WIDTH = 480
let HEIGHT = 800

//方块矩阵
const n = 15
const m = 10
const martix = Array.from(new Array(n), ()=>new Array(m).fill(0))
const blockSize = WIDTH/m

canvas.width = WIDTH
canvas.height = HEIGHT
ctx.fillStyle = "#000"
ctx.fillRect(0, 0, WIDTH, HEIGHT)
ctx.font= Math.floor(blockSize/2)+"px"+" Arial"
ctx.textBaseline = "middle"
ctx.textAlign = "center"
ctx.strokeStyle = "#eee"

//更新视图
function updateView() {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let i=0; i<n; i++) {
        for (let j=0; j<m; j++) {
            if (martix[i][j]<=0) continue
            ctx.fillStyle = "#163042"
            ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize)
            ctx.strokeRect(j * blockSize, i * blockSize, blockSize, blockSize)
            ctx.fillStyle = "#eee"
            ctx.fillText(martix[i][j], j * blockSize + Math.floor(blockSize/2), i * blockSize + Math.floor(blockSize/2))
        }
    }

    balls.forEach(ball=>ball.draw())
}

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l
const YtoI = (y) => Math.floor(y/blockSize)
const XtoJ = (x) => Math.floor(x/blockSize)

class Ball {
    constructor(x, y, r, velX, velY, color) {
        this.x = x
        this.y = y
        this.r = r
        this.velX = velX
        this.velY = velY
        this.color = color
    }
    draw() {
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI)
        ctx.fill()
    }
    move() {
        // this.x += this.velX
        // this.y += this.velY
        // if(this.x - this.r < 0 || this.x + this.r > WIDTH) {
        //     this.velX = -this.velX
        // }
        // if(this.y - this.r < 0 || this.y + this.r > HEIGHT) {
        //     this.velY = -this.velY
        // }

        let x = this.x
        let y = this.y
        let r = this.r
        let dx = this.velX 
        let dy = this.velY 

        if (x+dx-r<0) {
            this.x = Math.abs(dx) + 2*r - x
            this.velX = -this.velX
        } else if (x+dx+r>WIDTH) {
            this.x = 2*WIDTH - 2*r - x - Math.abs(dx)
            this.velX = -this.velX
        } else if (YtoI(y)<n && martix[YtoI(y)][XtoJ(x+dx-r)]>0) {
            martix[YtoI(y)][XtoJ(x+dx-r)]--
            this.x = Math.abs(dx) + 2*r - x + 2*(XtoJ(x+dx-r)+1)*blockSize
            this.velX = -this.velX
        } else if (YtoI(y)<n && martix[YtoI(y)][XtoJ(x+dx+r)]>0) {
            martix[YtoI(y)][XtoJ(x+dx+r)]--
            this.x = 2*(XtoJ(x+dx+r))*blockSize - 2*r - x - Math.abs(dx)
            this.velX = -this.velX
        } else {
            this.x = x + dx
        }
        
        if (y+dy-r<0) {
            this.y = Math.abs(dy) + 2*r - y
            this.velY = -this.velY
        } else if (y+dy+r>HEIGHT) {
            this.y = y + dy
        } else if (YtoI(y+dy-r)<n && martix[YtoI(y+dy-r)][XtoJ(x)]>0) {
            martix[YtoI(y+dy-r)][XtoJ(x)]--
            this.y = Math.abs(dy) + 2*r - y + 2*(YtoI(y+dy-r)+1)*blockSize
            this.velY = -this.velY
        } else if (YtoI(y+dy+r)<n && martix[YtoI(y+dy+r)][XtoJ(x)]>0) {
            martix[YtoI(y+dy+r)][XtoJ(x)]--
            this.y = 2*(YtoI(y+dy+r))*blockSize - 2*r - y - Math.abs(dy)
            this.velY = -this.velY
        } else {
            this.y = y + dy
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
        return ball.y+ball.r<HEIGHT
    })

    updateView()

    if (balls.length>0 || readyBalls.length>0) 
        requestAnimationFrame(loop)
    else {
        framcount = 0
        pasue = false
    }
}

function shoot(event) {
    // console.log(YtoI(event.offsetY),XtoJ(event.offsetX))
    // console.log(event.offsetY,HEIGHT)
    // return
    if (pasue) return
    //排除角度太小的情况
    if (event.offsetY > 0.9 * HEIGHT) return
    //点击的点 与 发射点（底部中间） 的距离
    const startX = Math.floor(WIDTH/2)
    const startY = HEIGHT - RADIUS
    const dX = event.offsetX - startX
    const dY = event.offsetY - startY
    const velX = vel * dX / Math.sqrt(dX*dX + dY*dY)
    const velY = vel * dY / Math.sqrt(dX*dX + dY*dY)
    
    for (let i=0; i<ballNums; i++) {
        readyBalls.push(new Ball(startX,startY,RADIUS,velX,velY,`rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`))
    }

    pasue = true
    loop()
}

window.onload = ()=>{
    canvas.onclick = shoot

    for (let i=0; i<n/2; i++) 
        for (let j=0; j<m; j++) {
            martix[i][j] = Math.max(0,random(-50,50))
        }

    updateView()
}
