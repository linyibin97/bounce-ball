const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

let WIDTH = 480
let HEIGHT = 960

canvas.width = WIDTH;
canvas.height = HEIGHT;

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

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l
const config = {
    speed : 10,
    ballsize : 10
}
const balls = new Array()
window.onload = ()=>{
    for (let i=0; i<100; i++) {
        balls.push(new Ball(
            random(0,WIDTH),
            random(0,HEIGHT),
            config.ballsize,
            random(-config.speed,config.speed),
            random(-config.speed,config.speed),
            `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`
        ))
    }
    loop()
}
