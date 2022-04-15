const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

const RADIUS = 10   //球半径
const BALLCOLOR = '#FFC600' //球颜色
let WIDTH = 480
let HEIGHT = 800
let vel = 10 //运动方向上的速度
let ballNums = 1 //发射球的数量
let balls = new Array()

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l

canvas.width = WIDTH;
canvas.height = HEIGHT;
ctx.fillStyle = "#000"
ctx.fillRect(0, 0, WIDTH, HEIGHT)

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

function loop() {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    for (let ball of balls) {
        ball.draw()
        ball.conllisionDectect()
        ball.move()
    }

    requestAnimationFrame(loop)
}

function shoot(event) {
    //点击的点 与 发射点（底部中间） 的距离
    const startX = Math.floor(WIDTH/2)
    const startY = HEIGHT - RADIUS
    const dX = event.offsetX - startX
    const dY = event.offsetY - startY
    const velX = vel * dX / Math.sqrt(dX*dX + dY*dY)
    const velY = vel * dY / Math.sqrt(dX*dX + dY*dY)
    
    balls.push(new Ball(startX,startY,RADIUS,velX,velY,`rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`))
}

window.onload = ()=>{
    canvas.onclick = shoot
    loop()
}
