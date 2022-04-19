const n = 15 //矩阵高
const m = 10 //矩阵宽
const interval = 3 //小球发射间隔帧数
const devMode = true //调试
const devStep = 20

let WIDTH, HEIGHT, blockSize, RADIUS, vel, startX, startY, deadline
let shooting, skipping, canskip, canskiptimer, framcount, startColor
let canvas, ctx, eleBoard, eleRound, eleScore, eleBalls
let ballNums, readyBalls, balls
let round, score, nReward, martix

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

    //回合相关数据
    martix = Array.from(new Array(n+5), ()=>new Array(m).fill(0))
    round = 0 //回合数记录
    score = 0 //得分
    nReward = 1

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

    stateInit()
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
                ctx.strokeStyle = "#eee"
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

    ctx.strokeStyle = "#aaa"
    ctx.beginPath()
    ctx.moveTo(0, deadline)
    ctx.lineTo(WIDTH, deadline)
    ctx.stroke()
    ctx.closePath()

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

    eleRound.innerText = round
    eleScore.innerText = score
    eleBalls.innerText = ballNums

    if (!shooting) {
        new Ball(startX, startY-RADIUS, RADIUS, 0, 0, startColor).draw()
    } else {
        balls.forEach(ball=>ball.draw())
    }
    
}

function nextRound() {
    const generateLayer = (pBlock) => {
        if (martix[n-1].some((num)=>num>0)) return false //还有未消除的方块
        martix.pop()
        const layer = new Array(m).fill(0)
        layer[Math.floor(Math.random()*10)] = -nReward //生成奖励球
        for (let j=0; j<m; j++) {
            if (layer[j]<0) continue
            if (Math.random()<=pBlock) { //生成方块
                layer[j] = round + random(Math.ceil(-round*0.1), Math.floor(round*0.1))
            }
        }
        martix.unshift(layer)
        return true
    }
    framcount = 0
    shooting = false
    skipping = false
    canskip = false
    if (canskiptimer) {
        clearTimeout(canskiptimer)
        canskiptimer = null
    }

    round++
    
    if (!generateLayer(0.3+0.4*(1-1/Math.pow(Math.E,(round/50))))) {
        gameOver()
        return
    }

    if (window.localStorage) {
        window.localStorage.setItem('gamedata', JSON.stringify({martix, round, score}))
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
        const distanceOfPointToSegLine = (px,py,x1,y1,x2,y2) => {
            //点P(px,py) A(x1,y1)B(x2,y2)表示线段
            //向量法求点到线段最短距离 返回线段上与P距离最小的点和长度
            const b = getAngel(x2,y2,x1,y1) //AB向量角
            const a = (getAngel(px,py,x1,y1) - b + 360) % 360 //向量夹角
            const lPA = distance(px,py,x1,y1)
            const lPB = distance(px,py,x2,y2)
            const lAB = distance(x1,y1,x2,y2)
            const l = lPA*Math.cos(a/180*Math.PI)
            if (l>0 && l<lAB) {
                //P在AB方向上的投影在AB内
                return [
                    x1+l*Math.cos(b/180*Math.PI),
                    y1+l*Math.sin(b/180*Math.PI),
                    lPA*Math.sin(a/180*Math.PI),
                    l
                ]
            }
            //返回距离较小的端点
            if (lPA>lPB) return [x2,y2,lPB,l]
                else return [x1,y1,lPA,l]
        }
        const getIntersection = (l1 ,l2) => {
            const Point = function (x,y) {
                this.x = x;
                this.y = y;
            }
            const vectorCross= (v1,v2) => {
                return v1[0]*v2[1]-v2[0]*v1[1];
            }
            //点p在线段point1——point2上，且是有交点的前提下
            const isPointInLine = (point1,point2,p) => {
                let minX=min(point1.x,point2.x);
                let minY=min(point1.y,point2.y);
                let maxX=max(point1.x,point2.x);
                let maxY=max(point1.y,point2.y);
                if(p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY&&vectorCross(getLine(point1,p),getLine(p,point2))===0){
                    return true;
                }
                return false;    
            }
            const update = (x,y,arr) => {//获取坐标最小的点
                if(arr.length===0||x<arr[0]||(x===arr[0]&&y<arr[1])){
                    arr=[x,y];        
                }
                return arr;
            }
            const min = (a,b) => {
                return Math.min(a,b);
            }
            const max = (a,b) => {
                return Math.max(a,b);
            }
            const getLine = (Q1,P1) => {
                let Q1P1=[P1.x-Q1.x,P1.y-Q1.y];
                return Q1P1;
            }
            let P1 = new Point(l1.x1,l1.y1);
            let P2 = new Point(l1.x2,l1.y2);
            let Q1 = new Point(l2.x1,l2.y1);
            let Q2 = new Point(l2.x2,l2.y2);
            let arr = [];
            if (Math.max(P1.x, P2.x) < Math.min(Q1.x, Q2.x) ||
                Math.max(Q1.x, Q2.x) < Math.min(P1.x, P2.x) ||
                Math.max(P1.y, P2.y) < Math.min(Q1.y, Q2.y) ||
                Math.max(Q1.y, Q2.y) < Math.min(P1.y, P2.y)) {
                return null;
            }
            let Q1P1=getLine(Q1,P1);
            let Q1P2=getLine(Q1,P2);
            let Q1Q2=getLine(Q1,Q2);
            let P1P2=getLine(P1,P2);
            let P1Q1=getLine(P1,Q1);
            let P1Q2=getLine(P1,Q2);
            let P2Q2=getLine(P2,Q2);
            let crossV=vectorCross(Q1P1,Q1Q2)*vectorCross(Q1P2,Q1Q2);
            let crossV2=vectorCross(P1Q1,P1P2)*vectorCross(P1Q2,P1P2);
            if(crossV>0||crossV2>0){
                return null;
            }
            //let crossP1P2_Q1Q2=vectorCross(P1P2,Q1Q2);
            if(vectorCross(Q1P1,P1Q2)===0||vectorCross(Q1P2,P2Q2)===0||vectorCross(Q1P2,P2Q2)===0){//共线
                let isQ1inP1P2=isPointInLine(P1,P2,Q1);
                if(isQ1inP1P2){
                    arr=update(Q1.x,Q1.y,arr);
                }
                let isQ2inP1P2=isPointInLine(P1,P2,Q2);
                if(isQ2inP1P2){
                    arr=update(Q2.x,Q2.y,arr);
                }
                let isP1inQ1Q2=isPointInLine(Q1,Q2,P1);
                if(isP1inQ1Q2){
                    arr=update(P1.x,P1.y,arr);
                }
                let isP2inQ1Q2=isPointInLine(Q1,Q2,P2);
                if(isP2inQ1Q2){
                    arr=update(P2.x,P2.y,arr);
                }
            } else {
                let s1=Math.abs(vectorCross(Q1Q2,Q1P2))*0.5;
                let s2=Math.abs(vectorCross(Q1Q2,Q1P1))*0.5;
                let lamda=s1/s2;
                let x,y;
                x=(P2.x+lamda*P1.x)/(1+lamda);
                y=(P2.y+lamda*P1.y)/(1+lamda);
                arr=[x,y];
            }
            return arr.length>0 ? arr : null
        }

        const distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))  
        const isBlockIJ = (i, j) => !(0 <= i && 0 <= j && j < m && martix[i][j] <= 0)
        const isBlockXY = (x, y) => {
            //检测x, y是否不能通过
            if (x<0 || x>WIDTH) return true
            if (y<0) return true //底部可通过（运动结束）
            return martix[YtoI(y)][XtoJ(x)] > 0
        }
        const next = [[-1,-1],[-1,0],[-1,1],[0,1],[1,1],[1,0],[1,-1],[0,-1]] //八个方向
        next[-1] = [[0,-1]]
        next[8] = [-1,-1] //循环

        let d = this.vel    //前进距离
        let bounced = {} //记录反弹过的方块

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
                let intersection = getIntersection(new Line(x1, y2 + r, x2, y2 + r), path)
                console.log('i,j ', ti, tj)
                console.log('x1,y1 ', x1, y1)
                console.log('x2,y2 ', x2, y2)
                console.log(new Line(x1, y2 + r, x2, y2 + r))
                console.log(path)
                console.log(intersection)
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

        while (d>0) {
            let i = YtoI(this.y)
            let j = XtoJ(this.x)
            // 运动轨迹的终点(nx,ny)
            let nx = this.x + Math.cos(this.a0/180*Math.PI)*d
            let ny = this.y + Math.sin(this.a0/180*Math.PI)*d

            let path = new Line(this.x, this.y, nx, ny)

            let collisionPoint = null

            display(i, j)
            //判断与边的交点
            for (let k=0; k<8; k++) {
                if (!bounced[(i+next[k][0])*m+(j+next[k][1])] && isBlockIJ(i+next[k][0], j+next[k][1])) {
                    let points = getLinesCollisionPoints(i, j, i+next[k][0], j+next[k][1], this.r, k, path)
                    for (let point of points) {
                        //找到距离起点最近的交点
                        if (!collisionPoint || distance(this.x, this.y, point.x0, point.y0) < distance(this.x, this.y, collisionPoint.x0, collisionPoint.y0)) 
                            collisionPoint = point
                    }   
                }
            }

            if (collisionPoint) {
                //发生碰撞
                console.log(collisionPoint)
                bounced[(i+next[collisionPoint.k][0])*m+(j+next[collisionPoint.k][1])] = true
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
            } else {
                this.x = nx
                this.y = ny
                d = 0
            }
        }


        // const updateX = () => {
        //     if (nX<this.x && isBlock(nX - this.r, nY)) {
        //         // console.log('left')
        //         bounced = true
        //         eliminate(YtoI(nY),XtoJ(nX-this.r))
        //         const x0 = (XtoJ(nX-this.r)+1)*blockSize + this.r
        //         const y0 = nY + (x0 - nX) * Math.tan(this.a0/180*Math.PI);
        //         [nX, nY, this.a0] = bounce(x0, y0, x0-this.r, y0, distance(x0, y0, nX, nY), this.a0)
        //     } else if (nX>this.x && isBlock(nX + this.r, nY)) {
        //         // console.log('right')
        //         bounced = true
        //         eliminate(YtoI(nY),XtoJ(nX+this.r))
        //         const x0 = (XtoJ(nX+this.r))*blockSize - this.r
        //         const y0 = nY + (x0 - nX) * Math.tan(this.a0/180*Math.PI);
        //         [nX, nY, this.a0] = bounce(x0, y0, x0+this.r, y0, distance(x0, y0, nX, nY), this.a0)
        //     }
        // }
        // const updateY = ()=> {
        //     if (nY>this.y && isBlock(nX, nY + this.r)) {
        //         // console.log('bottom')
        //         bounced = true
        //         eliminate(YtoI(nY+this.r),XtoJ(nX))
        //         const y0 = (YtoI(nY+this.r))*blockSize - this.r
        //         const x0 = nX + (y0 - nY) / Math.tan(this.a0/180*Math.PI);
        //         [nX, nY, this.a0] = bounce(x0, y0, x0, y0+this.r, distance(x0, y0, nX, nY), this.a0)
        //     } else if (nY<this.y && isBlock(nX, nY - this.r)) {
        //         // console.log('top')
        //         bounced = true
        //         eliminate(YtoI(nY-this.r),XtoJ(nX))
        //         const y0 = (YtoI(nY-this.r)+1)*blockSize + this.r
        //         const x0 = nX + (y0 - nY) / Math.tan(this.a0/180*Math.PI);
        //         [nX, nY, this.a0] = bounce(x0, y0, x0, y0-this.r, distance(x0, y0, nX, nY), this.a0)
        //     }
        // }
        // // console.log(`
        // // (${this.x.toFixed(1)},${this.y.toFixed(1)})
        // // (${nX.toFixed(1)},${nY.toFixed(1)})
        // // ${this.a0.toFixed(1)}
        // // `)
        // let bounced = false
        // // 对边进行检测, 考虑两个方向的先后顺序
        // if (Math.abs(nY-this.y)>Math.abs(nX-this.x)) {
        //     updateY()
        //     updateX()
        // } else {
        //     updateX()
        //     updateY()
        // }

        // //对四个角检测
        // if (!bounced) {
        //     let i = YtoI(this.y)
        //     let j = XtoJ(this.x)
        //     if (0<i && i<n-1 && 0<j && j<m-1) {  
        //         const lx = j * blockSize
        //         const ly = i * blockSize
        //         const hx = (j+1) * blockSize
        //         const hy = (i+1) * blockSize
        //         if ((martix[i][j-1]>0)+(martix[i-1][j-1]>0)+(martix[i-1][j]>0)==1) {
        //             //左上三格仅有一格为方块 左上坐标(lx,ly)作为碰撞点 近似地认为在距离最小点处发生碰撞
        //             const [x0, y0, dis, d] = distanceOfPointToSegLine(lx,ly,this.x,this.y,nX,nY)
        //             if (dis < this.r) {
        //                 console.log('↖')
        //                 eliminate(i,j-1)
        //                 eliminate(i-1,j-1)
        //                 eliminate(i-1,j);
        //                 [nX, nY, this.a0] = bounce(x0, y0, lx, ly, this.vel-d, this.a0)
        //             }
        //         }
        //         if ((martix[i-1][j]>0)+(martix[i-1][j+1]>0)+(martix[i][j+1]>0)==1) {
        //             //右上
        //             const [x0, y0, dis, d] = distanceOfPointToSegLine(hx,ly,this.x,this.y,nX,nY)
        //             if (dis < this.r) {
        //                 console.log(this.r,dis,'↗')
        //                 eliminate(i-1,j)
        //                 eliminate(i-1,j+1)
        //                 eliminate(i,j+1);
        //                 [nX, nY, this.a0] = bounce(x0, y0, hx, ly, this.vel-d, this.a0)
        //             }
        //         }
        //         if ((martix[i][j+1]>0)+(martix[i+1][j+1]>0)+(martix[i+1][j]>0)==1) {
        //             //右下
        //             const [x0, y0, dis, d] = distanceOfPointToSegLine(hx,hy,this.x,this.y,nX,nY)
        //             if (dis < this.r) {
        //                 console.log('↘')
        //                 eliminate(i,j+1)
        //                 eliminate(i+1,j+1)
        //                 eliminate(i+1,j);
        //                 [nX, nY, this.a0] = bounce(x0, y0, hx, hy, this.vel-d, this.a0)
        //             }
        //         }
        //         if ((martix[i+1][j]>0)+(martix[i+1][j-1]>0)+(martix[i][j-1]>0)==1) {
        //             //左下
        //             const [x0, y0, dis, d] = distanceOfPointToSegLine(lx,hy,this.x,this.y,nX,nY)
        //             if (dis < this.r) {
        //                 console.log('↙')
        //                 eliminate(i+1,j)
        //                 eliminate(i+1,j-1)
        //                 eliminate(i,j-1);
        //                 [nX, nY, this.a0] = bounce(x0, y0, lx, hy, this.vel-d, this.a0)
        //             }
        //         }
        //     }
        // }
        // }

        // this.x = nX
        // this.y = nY


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

function handleClick(event) {
    // console.log(event.offsetX-startX, event.offsetY-startY, getAngel(event.offsetX, event.offsetY, startX, startY))
    // return
    
    if (event.offsetY > deadline) {
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
            getAngel(event.offsetX, event.offsetY, startX, startY),
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
    alert('Game Over! score:'+score)
    replay()
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
    canvas.onclick = handleClick

    //test
    if (devMode) {
        for (let i=0; i<n*0.8; i++) 
        for (let j=0; j<m; j++) {
            martix[i][j] = random(-20,10)
            if (martix[i][j] < 0) {
                if (Math.random()<0.1) martix[i][j] = -1
                    else martix[i][j] = 0
            }
        }
        updateView()
        // ballNums = 10
        return
    }

    // if (window.localStorage && localStorage.getItem('gamedata')) {
    //     let data = JSON.parse(localStorage.getItem('gamedata'))
    //     martix = data.martix
    //     round = data.round
    //     score = data.score
    //     updateView()
    // } else {
    //     nextRound()  
    // }  
}
