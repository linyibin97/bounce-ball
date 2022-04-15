const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

let vel = 10 //运动方向上的速度
let RADIUS = 10   //球半径
let WIDTH = 480
let HEIGHT = 800
canvas.width = WIDTH
canvas.height = HEIGHT
ctx.fillStyle = "#000"
ctx.fillRect(0, 0, WIDTH, HEIGHT)

let ballNums = 100   //发射球的数量
let balls = new Array() //已发射的球
let readyBalls = new Array()    //待发射的球
let pasue = false
let framcount = 0   //渲染帧计数
const interval = 5 //小球发射间隔

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l

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
        this.x += this.velX
        this.y += this.velY
    }
    conllisionDectect() {
        if(this.x - this.r < 0 || this.x + this.r > WIDTH) {
            this.velX = -this.velX
        }
        if(this.y - this.r < 0 || this.y + this.r > HEIGHT) {
            this.velY = -this.velY
        }
    }
}

// let prev = 0

function loop() {

    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

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

    balls = balls.filter(ball=>{
        ball.draw()
        ball.conllisionDectect()
        ball.move()
        return ball.y+ball.r<HEIGHT
    })

    if (balls.length>0 || readyBalls.length>0) requestAnimationFrame(loop)
        else pasue = false
}

function shoot(event) {
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
    framcount = 0
    loop()
}

window.onload = ()=>{
    canvas.onclick = shoot
}
