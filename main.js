const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")

let WIDTH = 480
let HEIGHT = 800

let ballNums = 1   //发射球的数量
let balls = new Array() //已发射的球
let readyBalls = new Array()    //待发射的球
let pasue = false
let framcount = 0   //渲染帧计数
const interval = 4 //小球发射间隔帧数
let RADIUS = 10 //球半径
let vel = RADIUS //运动方向上的速度
let startX = Math.floor(WIDTH/2)    //发射点
let startY = HEIGHT - RADIUS
let startColor = "#122738"    //发射球的颜色
//方块矩阵
const n = 15
const m = 10
const martix = Array.from(new Array(n), ()=>new Array(m).fill(0))
const blockSize = WIDTH/m

const deadline = n*blockSize

canvas.width = WIDTH
canvas.height = HEIGHT
ctx.fillStyle = "#000"
ctx.fillRect(0, 0, WIDTH, HEIGHT)
ctx.textBaseline = "middle"
ctx.textAlign = "center"
ctx.strokeStyle = "#eee"

const blockColor = ['#FF9A04','#FED905','#B3DA03','#03934B','#028C73','#036A89','#04209B','#852F90','#C00173','#D00024']
const getBlockColor = (num)=>{
    num = Math.floor((n%100)/10)
    return blockColor[num]
}

const random = (l,h)=>Math.floor(Math.random()*(h-l)) + l
const YtoI = (y) => Math.floor(y/blockSize)
const XtoJ = (x) => Math.floor(x/blockSize)


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
                ctx.fillText('+'+(-martix[i][j]), (j+0.5) * blockSize, (i+0.5) * blockSize)
            }
        }
    }

    ctx.beginPath()
    ctx.moveTo(0, deadline)
    ctx.lineTo(WIDTH, deadline)
    ctx.stroke()
    ctx.closePath()

    if (!pasue) {
        new Ball(startX, startY-RADIUS, RADIUS, 0, 0, startColor).draw()
    } else {
        balls.forEach(ball=>ball.draw())
    }
    
}

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
        ctx.closePath()
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
        } else if (YtoI(y)<n && dx<0 && martix[YtoI(y)][XtoJ(x+dx-r)]>0) {
            martix[YtoI(y)][XtoJ(x+dx-r)]--
            this.x = Math.abs(dx) + 2*r - x + 2*(XtoJ(x+dx-r)+1)*blockSize
            this.velX = -this.velX
        } else if (YtoI(y)<n && dx>0 && martix[YtoI(y)][XtoJ(x+dx+r)]>0) {
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
        } else if (YtoI(y+dy-r)<n && dy<0 && martix[YtoI(y+dy-r)][XtoJ(x)]>0) {
            martix[YtoI(y+dy-r)][XtoJ(x)]--
            this.y = Math.abs(dy) + 2*r - y + 2*(YtoI(y+dy-r)+1)*blockSize
            this.velY = -this.velY
        } else if (YtoI(y+dy+r)<n && dy>0 && martix[YtoI(y+dy+r)][XtoJ(x)]>0) {
            martix[YtoI(y+dy+r)][XtoJ(x)]--
            this.y = 2*(YtoI(y+dy+r))*blockSize - 2*r - y - Math.abs(dy)
            this.velY = -this.velY
        } else {
            this.y = y + dy
        } 

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
        if (ball.y+ball.r<HEIGHT) {
            startX = ball.x
            startColor = ball.color
            return true
        } else 
            return false
    })



    if (balls.length>0 || readyBalls.length>0) {
        updateView()
        requestAnimationFrame(loop)
    }
    else {
        framcount = 0
        pasue = false
        updateView()
    }
}

function shoot(event) {
    // console.log(YtoI(event.offsetY),XtoJ(event.offsetX))
    // console.log(event.offsetY,HEIGHT)
    // return
    if (pasue) return
    //排除角度太小的情况
    if (event.offsetY > deadline) return
    //点击的点 与 发射点（底部中间） 的距离
    
    const dX = event.offsetX - startX
    const dY = event.offsetY - startY
    const velX = vel * dX / Math.sqrt(dX*dX + dY*dY)
    const velY = vel * dY / Math.sqrt(dX*dX + dY*dY)
    
    for (let i=0; i<ballNums; i++) {
        readyBalls.unshift(new Ball(
            startX,
            startY,
            RADIUS,
            velX,
            velY,
            i==0? startColor : `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`
        ))
    }

    pasue = true
    loop()
}

window.onload = ()=>{
    canvas.onclick = shoot

    for (let i=0; i<n/2; i++) 
        for (let j=0; j<m; j++) {
            martix[i][j] = random(-10,10)
            if (martix[i][j] < 0) {
                if (Math.random()<0.2) martix[i][j] = -1
                    else martix[i][j] = 0
            }
        }

    updateView()
}
