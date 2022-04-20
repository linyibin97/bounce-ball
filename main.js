const n = 15 //矩阵高
const m = 10 //矩阵宽
const interval = 3 //小球发射间隔帧数
let devMode = false //调试
let devStep = 10
const debugShowAliveFrame = 10
const correctionAngel = 7 //修正角度
let debugDispaly = []
let WIDTH, HEIGHT, blockSize, RADIUS, vel, startX, startY, deadline
let gameover, shooting, skipping, canskip, canskiptimer, framcount, startColor
let canvas, ctx, eleBoard, eleRound, eleScore, eleBalls
let ballNums, readyBalls, balls
let round, score, nReward, martix
let previewOn, previewLength, previewFrameTime, previewBalls, previewPrevTime


function stateInit() {

    blockSize = WIDTH/m
    RADIUS = blockSize/6 //球半径
    vel = 1.5*RADIUS //运动方向上的速度
    startX = Math.floor(WIDTH/2)    //发射点
    startY = HEIGHT - RADIUS
    deadline = n*blockSize
    startColor = "#FFC600"    //发射球的颜色

    //运行状态
    shooting = false
    skipping = false
    canskip = false
    if (canskiptimer) clearTimeout(canskiptimer)
    canskiptimer = null
    framcount = 0   //渲染帧计数 

    ballNums = 1   //发射球的数量
    balls = new Array() //已发射的球
    readyBalls = new Array()    //待发射的球
    
    previewBalls = new Array()

    //回合相关数据
    martix = Array.from(new Array(n+5), ()=>new Array(m).fill(0))
    round = 0 //回合数记录
    score = 0 //得分
    nReward = 1
    gameover = false
}

function init() {
    // eleBoard = document.querySelector('.board')
    // canvas = document.querySelector("canvas")

    canvas = document.createElement('canvas')
    eleBoard = document.createElement('div')
    eleBoard.className = "board"
    eleBoard.innerHTML = `
        <div class="iconitem">
            <a href="https://github.com/linyibin97/bounce-ball"><span class="iconfont">&#xe645;</span></a>
        </div>
        <div class="items">
            <span class="iconfont">&#xe65e;</span>
            <span>Round</span>
            <span id="round"></span>
        </div>
        <div class="items">
            <span class="iconfont">&#xe64b;</span>
            <span>Score</span>                
            <span id="score"></span>
        </div>
        <div class="items">
            <span class="iconfont">&#xe711;</span>
            <span>×</span>   
            <span id="balls"></span>
        </div>
        <div class="iconitem" onclick="replay()">
            <span class="iconfont">&#xe6a4;</span>               
        </div>`
    
    //自适应窗口
    let windowWidth = document.documentElement.clientWidth || document.body.clientWidth
    let windowHeight = document.documentElement.clientHeight || document.body.clientHeight
    if (windowHeight/windowWidth>5.2/3) {
        WIDTH = Math.floor(windowWidth) - 4
        HEIGHT = Math.floor(WIDTH/3*5)
    } else {  
        WIDTH = Math.floor(windowHeight/2)
        HEIGHT = Math.floor(WIDTH/3*5)
    }
    eleBoard.style.width = WIDTH + "px"
    document.documentElement.style.fontSize = Math.floor(WIDTH/30) + 'px'
        
    // WIDTH = 480
    // HEIGHT = Math.floor(WIDTH/3*5)
    // console.log(windowHeight,windowWidth,WIDTH,HEIGHT)

    //移动端适配
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    canvas.width = WIDTH * ratio
    canvas.height = HEIGHT * ratio
    canvas.style.width = WIDTH + 'px'
    canvas.style.height = HEIGHT + 'px'
    ctx = canvas.getContext("2d")
    ctx.scale(ratio,ratio)
    
    // console.log(ratio,canvas.width,canvas.height)

    // ctx = canvas.getContext("2d")
    // canvas.width = WIDTH

    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)    
    ctx.textBaseline = "middle"
    ctx.textAlign = "center"

    let wrapper = document.querySelector('.wrapper')
    wrapper.appendChild(eleBoard)
    wrapper.appendChild(canvas)
    eleRound = document.getElementById('round')
    eleScore = document.getElementById('score')
    eleBalls = document.getElementById('balls')

    previewOn = true
    previewLength = 20
    previewFrameTime = 16.7
    previewPrevTime = 0

    stateInit()
}

const next = [[-1,-1],[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1]] //八个方向
next[-1] = [0,-1]
next[8] = [-1,-1] //循环
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

    if (gameover) {
        ctx.fillStyle = "#ddd"
        ctx.font= Math.floor(blockSize)+"px"+" Arial"
        ctx.fillText('GAME OVER', WIDTH/2, HEIGHT/2-blockSize) 
        ctx.font= Math.floor(blockSize *0.5)+"px"+" Arial"
        ctx.fillText('Score: '+score, WIDTH/2, HEIGHT/2+blockSize)
        return
    }

    for (let i=0; i<n; i++) {
        for (let j=0; j<m; j++) {
            //方块
            if (martix[i][j] > 0) {
                ctx.fillStyle = getBlockColor(martix[i][j])
                ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize)
                ctx.strokeStyle = "#eee"
                ctx.strokeRect(j * blockSize, i * blockSize, blockSize, blockSize)
                ctx.fillStyle = "#eee"
                ctx.font= Math.floor(blockSize*(martix[i][j]<1000? 0.4: 0.3))+"px"+" Arial"
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

    //提示线
    ctx.strokeStyle = "#aaa"
    ctx.beginPath()
    ctx.moveTo(0, deadline)
    ctx.lineTo(WIDTH, deadline)
    ctx.stroke()
    ctx.closePath()

    //显示点击跳过
    if (shooting && canskip && !skipping) {
        ctx.fillStyle = "#ddd"
        ctx.font= Math.floor(blockSize/2)+"px"+" Arial"
        ctx.fillText('click here to skip', WIDTH/2, (HEIGHT+(n*blockSize))/2) 
    }

    // ctx.fillStyle = "#ddd"
    // ctx.font= Math.floor(blockSize/3)+"px"+" Arial"
    // ctx.textBaseline = "top"
    // ctx.textAlign = "left"
    // ctx.fillText(`Round:${round}   Score:${score}   Balls:${ballNums}`, 0.1*blockSize, deadline+0.1*blockSize)
   
    // 更新数字
    eleRound.innerText = round
    eleScore.innerText = score
    eleBalls.innerText = shooting ? readyBalls.length : ballNums

    if (!shooting) {
        //非发射阶段
        new Ball(startX, startY, RADIUS, 0, 0, startColor).draw()

        if (previewOn) {
            for (let ball of previewBalls) {
                ctx.beginPath()
                ctx.strokeStyle = ball.color
                ctx.arc(ball.x, ball.y, ball.r, 0, 2*Math.PI)
                ctx.stroke()
                ctx.closePath()
            }
        }
    
    } else {
        //发射阶段
        balls.forEach(ball=>ball.draw())

        if (devMode)
            debugDispaly = debugDispaly.filter(item=>{
                item.alive = item.alive - 1
                if (item.type == 'point') {
                    ctx.beginPath()
                    ctx.fillStyle = item.color
                    ctx.arc(item.x, item.y, 3, 0, 2*Math.PI)
                    ctx.fill()
                    ctx.closePath()
                }
                if (item.type == 'line') {
                    ctx.strokeStyle = item.color
                    ctx.beginPath()
                    ctx.moveTo(item.x1, item.y1)
                    ctx.lineTo(item.x2, item.y2)
                    ctx.stroke()
                    ctx.closePath()
                }
                if (item.type == "arc") {
                    ctx.beginPath()
                    ctx.strokeStyle = item.color
                    ctx.arc(item.x, item.y, item.r, 0, 2*Math.PI)
                    ctx.stroke()
                    ctx.closePath()
                }
                return item.alive > 0
            })
    }
}

function nextRound() {
    const generateLayer = (pBlock) => {
        if (martix[n-1].some((num)=>num>0)) return false //还有未消除的方块
        martix.pop()
        const layer = new Array(m).fill(0)
        for (let j=0; j<m; j++) {
            if (Math.random()<=pBlock) { //生成方块
                layer[j] = round + random(Math.ceil(-round*0.1), Math.floor(round*0.1))
            }
        }
        layer[Math.floor(Math.random()*10)] = -(1 + (Math.random()<(pBlock-0.3)/2? 1: 0)) //生成奖励球
        martix.unshift(layer)
        return true
    }
    framcount = 0
    shooting = false
    skipping = false
    canskip = false
    previewBalls = new Array()

    if (canskiptimer) {
        clearTimeout(canskiptimer)
        canskiptimer = null
    }

    round++
    
    if (!generateLayer(0.3+0.3*(1-1/Math.pow(Math.E,(round/50))))) {
        gameOver()
        return
    }

    if (window.localStorage) {
        window.localStorage.setItem('gamedata', JSON.stringify({martix, round, score, ballNums, startX:startX/WIDTH}))
    }

    updateView()
}

const YtoI = (y) => Math.floor(y/blockSize)
const XtoJ = (x) => Math.floor(x/blockSize)
const bounce = (x0, y0, x1, y1, a0) => {
    // 碰撞时的圆心(x0,y0) 碰撞点 (x1,y2) 反弹运动距离d 速度角a
    let b = getAngel(x1, y1, x0, y0) //碰撞点与圆心连线 与 正x轴夹角
    let a1 = ((180 + 2 * b - a0) + 360) % 360
    // let x2 = x0 + d * Math.cos(a1/180*Math.PI) 
    // let y2 = y0 + d * Math.sin(a1/180*Math.PI)
    return a1
}
const eliminate = (i, j) => {
    if (0<=j && j<m && 0<=i && i<n) {
        score += 10
        martix[i][j] = Math.max(0, martix[i][j] - 1)
    }
}
const getIntersection = (line ,path) => {
    //本问题中 line为垂直线与水平线 只针对这两种线段做判断
    if (line.x1 == line.x2) {
        // 垂直线
        if (!( Math.min(path.x1,path.x2)<=line.x1 && line.x1<=Math.max(path.x1,path.x2) )) return null
        if (path.x1 == path.x2) return null
        const y0 = (line.x1 - path.x1) / (path.x1 - path.x2) * (path.y1 - path.y2) + path.y1
        if (!( Math.min(line.y1,line.y2)<=y0 && y0<=Math.max(line.y1,line.y2) )) return null
        return [line.x1, y0]
    } 
    if (line.y1 == line.y2) {
        // 水平线
        if (!( Math.min(path.y1,path.y2)<=line.y1 && line.y1<=Math.max(path.y1,path.y2) )) return null
        if (path.y1 == path.y2) return null
        const x0 = (line.y1 - path.y1) / (path.y1 - path.y2) * (path.x1 - path.x2) + path.x1
        if (!( Math.min(line.x1,line.x2)<=x0 && x0<=Math.max(line.x1,line.x2) )) return null
        return [x0, line.y1]
    } 
    return null
}
const distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))  
const isBlockIJ = (i, j) => !(0 <= i && 0 <= j && j < m && martix[i][j] <= 0)
function Line(x1, y1, x2, y2) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
}
const getLinesCollisionPoints = (si, sj, ti, tj, r, k, path) => {
    const ret = []
    const x1 = tj * blockSize
    const y1 = ti * blockSize
    const x2 = (tj + 1) * blockSize
    const y2 = (ti + 1) * blockSize
    if (si < ti && !isBlockIJ(ti - 1, tj)) {
        //墙在下
        if (devMode) debugDispaly.push({type:'line', x1:x1, y1:y1 - r, x2:x2, y2:y1 - r, alive:debugShowAliveFrame, color: 'blue'})
        let intersection = getIntersection(new Line(x1, y1 - r, x2, y1 - r), path)
        if (intersection) {
            //有交点 
            ret.push({
                x0: intersection[0], //碰撞圆心坐标
                y0: intersection[1], 
                x1: intersection[0], //碰撞点坐标
                y1: intersection[1] + r,
                k: k  //发生碰撞方块对应的编号
            })
        }
    }
    if (si > ti && !isBlockIJ(ti + 1, tj)) {
         //墙在上
        if (devMode) debugDispaly.push({type:'line', x1:x1, y1:y2 + r, x2:x2, y2:y2 + r, alive:debugShowAliveFrame, color: 'blue'})
        let intersection = getIntersection(new Line(x1, y2 + r, x2, y2 + r), path)
        if (intersection) {
            //有交点 
            ret.push({
                x0: intersection[0], //碰撞圆心坐标
                y0: intersection[1], 
                x1: intersection[0], //碰撞点坐标
                y1: intersection[1] - r,
                k: k  //发生碰撞方块对应的编号
            })
        }
    }
    if (sj < tj && !isBlockIJ(ti, tj - 1)) {
         //左边
        if (devMode) debugDispaly.push({type:'line', x1:x1 - r, y1:y1, x2:x1 - r, y2:y2, alive:debugShowAliveFrame, color: 'blue'})
        let intersection = getIntersection(new Line(x1 - r, y1, x1 - r, y2), path)
        if (intersection) {
            //有交点 
            ret.push({
                x0: intersection[0], //碰撞圆心坐标
                y0: intersection[1], 
                x1: intersection[0] + r, //碰撞点坐标
                y1: intersection[1],
                k: k  //发生碰撞方块对应的编号
            })
        }
    }
    if (sj > tj && !isBlockIJ(ti, tj + 1)) {
        //右边
        if (devMode) debugDispaly.push({type:'line', x1:x2 + r, y1:y1, x2:x2 + r, y2:y2, alive:debugShowAliveFrame, color: 'blue'})
        let intersection = getIntersection(new Line(x2 + r, y1, x2 + r, y2), path)
        if (intersection) {
            //有交点 
            ret.push({
                x0: intersection[0], //碰撞圆心坐标
                y0: intersection[1], 
                x1: intersection[0] - r, //碰撞点坐标
                y1: intersection[1],
                k: k  //发生碰撞方块对应的编号
            })
        }
    }
    return ret
}
const getArcIntersection = (px, py, r, line) => {
    //圆心P(px,py) 半径r 圆弧角度为[al,ah] l:A(x1,y1)→B(x2,y2)表示线段
    //求圆弧与线段交点
    const b = getAngel(line.x2, line.y2, line.x1, line.y1) //AB向量角
    const a = (getAngel(px, py, line.x1, line.y1) - b + 360) % 360 //向量夹角
    const lPA = distance(px, py, line.x1, line.y1)
    const lAB = distance(line.x1, line.y1, line.x2, line.y2)
    const l = lPA*Math.cos(a/180*Math.PI)
    const d = lPA*Math.sin(a/180*Math.PI)
    if (Math.abs(d) > r) return []
    const k = Math.sqrt(Math.pow(r,2)-Math.pow(d,2))
    let ret = []
    if (0 <= l+k && l+k <= lAB) {  //在线段上
        const rx = line.x1+(l+k)*Math.cos(b/180*Math.PI)
        const ry = line.y1+(l+k)*Math.sin(b/180*Math.PI)
        ret.push([rx, ry])
        //const ra = getAngel(rx, ry, px, py)
        //if ((al <= ra && ra <= ah) || (ah <= al && (ra <= ah || ra >= al))) ret.push([rx, ry]) //在圆弧上
    }
    if (Math.abs(d)!==r && 0 <= l-k && l-k <= lAB) {  //在线段上
        const rx = line.x1+(l-k)*Math.cos(b/180*Math.PI)
        const ry = line.y1+(l-k)*Math.sin(b/180*Math.PI)
        ret.push([rx, ry])
        //const ra = getAngel(rx, ry, px, py)
        //if ((al <= ra && ra <= ah) || (ah <= al && (ra <= ah || ra >= al))) ret.push([rx, ry]) //在圆弧上
    }
    return ret
}
const getArcsCollisionPoints = (si, sj, ti, tj ,r ,k ,path) => {
    // if (isBlockIJ(si+next[k-1][0], sj+next[k-1][1]) && isBlockIJ(si+next[k+1][0], sj+next[k+1][1])) return []
    // const ret = []
    // const cx = [tj * blockSize, (tj + 1) * blockSize]
    // const cy = [ti * blockSize, (ti + 1) * blockSize]
    // const angleRange = [[90, 180], [0, 90], [270, 360], [180, 270]] //有bug 暂时没用
    // for (let di = 0; di < 2; di++) {
    //     for (let dj = 0; dj < 2; dj++) {
    //         const x1 = cx[dj]
    //         const y1 = cy[di] 
    //         if (devMode) {
    //             debugDispaly.push({
    //                 type:'arc',
    //                 x:x1,
    //                 y:y1,
    //                 r:r,
    //                 alive: debugShowAliveFrame,
    //                 color:'green'
    //             })
    //         }
    //         for (let point of getArcIntersection(x1, y1, r, path)) {
    //             ret.push({
    //                 x0: point[0], //碰撞圆心坐标
    //                 y0: point[1], 
    //                 x1: x1, //碰撞点坐标
    //                 y1: y1,
    //                 k: k  //发生碰撞方块对应的编号
    //             })
    //         }
    //     }
    // }

    const calculate = (x1, y1) => {
        if (devMode) {
            debugDispaly.push({
                type:'arc',
                x:x1,
                y:y1,
                r:r,
                alive: debugShowAliveFrame,
                color:'green'
            })
        }
        for (let point of getArcIntersection(x1, y1, r, path)) {
            ret.push({
                x0: point[0], //碰撞圆心坐标
                y0: point[1], 
                x1: x1, //碰撞点坐标
                y1: y1,
                k: k  //发生碰撞方块对应的编号
            })
        }
    }
    const tx = [tj * blockSize, (tj + 1) * blockSize]
    const ty = [ti * blockSize, (ti + 1) * blockSize]
    const ret = []
    if (si < ti) {
        //左上角
        if (!(isBlockIJ(ti-1, tj) || isBlockIJ(ti-1, tj-1) || isBlockIJ(ti, tj-1))) calculate(tx[0], ty[0])
        //右上角
        if (!(isBlockIJ(ti-1, tj) || isBlockIJ(ti-1, tj+1) || isBlockIJ(ti, tj+1))) calculate(tx[1], ty[0])
    }
    if (si == ti && sj < tj) {
        //左上角
        if (!(isBlockIJ(ti-1, tj) || isBlockIJ(ti-1, tj-1) || isBlockIJ(ti, tj-1))) calculate(tx[0], ty[0])
        //左下角
        if (!(isBlockIJ(ti+1, tj) || isBlockIJ(ti+1, tj-1) || isBlockIJ(ti, tj-1))) calculate(tx[0], ty[1])
    }
    if (si == ti && sj > tj) {
        //右上角
        if (!(isBlockIJ(ti-1, tj) || isBlockIJ(ti-1, tj+1) || isBlockIJ(ti, tj+1))) calculate(tx[1], ty[0])
        //右下角
        if (!(isBlockIJ(ti+1, tj) || isBlockIJ(ti+1, tj+1) || isBlockIJ(ti, tj+1))) calculate(tx[1], ty[1])
    }
    if (si > ti) {
        //左下角
        if (!(isBlockIJ(ti+1, tj) || isBlockIJ(ti+1, tj-1) || isBlockIJ(ti, tj-1))) calculate(tx[0], ty[1])
        //右下角
        if (!(isBlockIJ(ti+1, tj) || isBlockIJ(ti+1, tj+1) || isBlockIJ(ti, tj+1))) calculate(tx[1], ty[1])
    }
    return ret
}
const display = (i, j) => {
    let s = '------'
    s += '\n'
    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            // console.log(isBlockIJ(i+di, j+dj))
            s += (isBlockIJ(i+di, j+dj) ? '1 ' : '0 ')
        }
        s += '\n'
    }
    s += '------'
    console.log(s)
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
        let d = this.vel    //前进距离
        let bounced = null //记录反弹过的方块

        while (d>0) {
            let i = YtoI(this.y)
            let j = XtoJ(this.x)
            // 运动轨迹的终点(nx,ny)
            let nx = this.x + Math.cos(this.a0/180*Math.PI)*d
            let ny = this.y + Math.sin(this.a0/180*Math.PI)*d
            let path = new Line(this.x, this.y, nx, ny)

            if (devMode) debugDispaly.push({type:'line', x1:this.x, y1:this.y, x2:nx, y2:ny, alive:debugShowAliveFrame, color: 'skyblue'})

            let collisionPoint = null
            //判断与边的交点
            for (let k=0; k<8; k++) {
                if ((bounced !== (i+next[k][0])*m+(j+next[k][1])) && isBlockIJ(i+next[k][0], j+next[k][1])) {
                    let points = new Array().concat(
                        getLinesCollisionPoints(i, j, i+next[k][0], j+next[k][1], this.r, k, path),
                        getArcsCollisionPoints(i, j, i+next[k][0], j+next[k][1], this.r, k, path)
                    )
                    for (let point of points) {
                        //找到距离起点最近的交点
                        if (!collisionPoint || distance(this.x, this.y, point.x0, point.y0) < distance(this.x, this.y, collisionPoint.x0, collisionPoint.y0)) 
                            collisionPoint = point
                    }
                }
            }

            if (collisionPoint) {
                //发生碰撞
                if (devMode) {
                    debugDispaly.push({
                        type: 'point',
                        x:collisionPoint.x1,
                        y:collisionPoint.y1,
                        alive:debugShowAliveFrame,
                        color:'red'
                    })
                    debugDispaly.push({
                        type: 'point',
                        x:collisionPoint.x0,
                        y:collisionPoint.y0,
                        alive:debugShowAliveFrame,
                        color:'yellow'
                    })
                }
                
                bounced = (i+next[collisionPoint.k][0])*m+(j+next[collisionPoint.k][1])
                d -= distance(this.x, this.y, collisionPoint.x0, collisionPoint.y0)
                this.x = collisionPoint.x0
                this.y = collisionPoint.y0
                this.a0 = bounce(
                    collisionPoint.x0, 
                    collisionPoint.y0,
                    collisionPoint.x1,
                    collisionPoint.y1,
                    this.a0
                )
                if (shooting) eliminate(i+next[collisionPoint.k][0],j+next[collisionPoint.k][1])
            } else {
                this.x = nx
                this.y = ny
                d = 0
            }

            //限制运动角度不能在水平+-correctionAngel内 会导致消除过快或者无限循环
            if (0 <= this.a0 && this.a0 < correctionAngel) this.a0 = correctionAngel
            if (180 - correctionAngel < this.a0 && this.a0 < 180) this.a0 = 180 - correctionAngel
            if (180 <= this.a0 && this.a0 < 180 + correctionAngel) this.a0 = 180 + correctionAngel
            if (360 - correctionAngel < this.a0 && this.a0 < 360) this.a0 = 360 - correctionAngel
        }

        //奖励球
        if (shooting) {
            let i = YtoI(this.y)
            let j = XtoJ(this.x)
            if (0<=i && i<n && 0<=j && j<m && martix[i][j]<0) {
                ballNums += Math.abs(martix[i][j])
                martix[i][j] = 0
            }
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
        if (skipping) {
            loop()
        } else {
            if (!devMode) requestAnimationFrame(loop) 
                else setTimeout(loop, devStep)
        }
    }
    else {
        nextRound()
    }
}

function showPreview(x, y) {
    if (gameover || shooting || !previewOn) return
    let curr = Date.now()
    if (curr - previewPrevTime < previewFrameTime) return
    previewPrevTime = curr
    if (y > deadline) return
    previewBalls = new Array()
    let ball = new Ball(startX,
        startY,
        RADIUS,
        vel,
        getAngel(x, y, startX, startY),
        '#333'
    )
    for (let i=0; i<previewLength; i++) {
        for (let j=0; j<interval; j++) {
            ball.move()
            if (ball.y+ball.r>HEIGHT) break
        }
        if (ball.y+ball.r>HEIGHT) break
        previewBalls.push({
            x: ball.x,
            y: ball.y,
            r: ball.r,
            color: '#555'
        })
        
    }
    updateView()
}

function handleClick(x, y) {
    // console.log(event.offsetX-startX, event.offsetY-startY, getAngel(event.offsetX, event.offsetY, startX, startY))
    // return
    if (gameover) {
        replay()
        return
    }
    if (y > deadline) {
        if (shooting && canskip) {
            skipping = true
        }
        return
    }
    if (shooting) return

    for (let i=0; i<ballNums; i++) {
        readyBalls.unshift(new Ball(
            startX,
            startY,
            RADIUS,
            vel,
            getAngel(x, y, startX, startY),
            i==0? startColor : `rgb(${random(32, 255)},${random(32, 255)},${random(32, 255)})`
        ))
    }

    shooting = true
    canskiptimer = setTimeout(()=>{
        canskip = true
        canskiptimer = null
    },10000) //十秒后可跳过
    loop()
}

function gameOver() {
    gameover = true
    updateView()
    // alert('Game Over! score:'+score)
    // replay()
}

function replay() {
    if (window.localStorage) {
        window.localStorage.removeItem('gamedata')
    }
    stateInit()
    nextRound() 
}

window.onload = ()=>{
    init()
    canvas.onclick = (event) => {
        // console.log(event.offsetX, event.offsetY)
        handleClick(event.offsetX, event.offsetY)
    }

    canvas.onmousemove = (event) => {
        showPreview(event.offsetX, event.offsetY)
    }
    canvas.ontouchstart =(event) => {
        event.preventDefault()
    }
    canvas.ontouchend = (event) => {
        // console.log(event.changedTouches[0].clientX - event.target.offsetLeft - event.target.clientLeft, 
        //             event.changedTouches[0].clientY - event.target.offsetTop - event.target.clientTop)
        handleClick(event.changedTouches[0].clientX - event.target.offsetLeft - event.target.clientLeft, 
                    event.changedTouches[0].clientY - event.target.offsetTop - event.target.clientTop)
        event.preventDefault()
    }
    canvas.ontouchmove = (event) => {
        // console.log(event)
        showPreview(event.changedTouches[0].clientX - event.target.offsetLeft - event.target.clientLeft, 
                    event.changedTouches[0].clientY - event.target.offsetTop - event.target.clientTop)
        event.preventDefault()
    }
    //test
    if (devMode) {
        for (let i=0; i<n*0.8; i++) 
        for (let j=0; j<m; j++) {
            martix[i][j] = random(-10000,3000)
            if (martix[i][j] < 0) {
                if (Math.random()<0.1) martix[i][j] = -1
                    else martix[i][j] = 0
            }
        }
        updateView()
        ballNums = 10000
        return
    }

    if (window.localStorage && localStorage.getItem('gamedata')) {
        let data = JSON.parse(localStorage.getItem('gamedata'))
        martix = data.martix || martix
        round = data.round || round
        score = data.score || score
        ballNums = data.ballNums || ballNums
        startX = data.startX*WIDTH || startX
        updateView()
    } else {
        nextRound()  
    }  
}
