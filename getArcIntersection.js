function Line(x1, y1, x2, y2) {
  this.x1 = x1
  this.y1 = y1
  this.x2 = x2
  this.y2 = y2
}
const distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2))  
const getAngel = (tx,ty,sx,sy) => {
  let dx = tx - sx
  let dy = ty - sy
  if (dx == 0 && dy ==0) return 0
  if (dx == 0) return dy > 0 ? 90 : 270
  let theta = (Math.atan(dy / dx) / Math.PI * 180)
  if (theta >= 0) return dx > 0 ? theta : theta + 180
  if (theta < 0) return dy < 0 ? theta + 360 : theta + 180
}
const minDistanceOfPointToSegLine = (px,py,x1,y1,x2,y2) => {
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
          // lPA*Math.sin(a/180*Math.PI),
          // l
      ]
  }
  //返回距离较小的端点
  if (lPA>lPB) return [x2,y2]//[x2,y2,lPB,l]
      else return [x1,y1]//[x1,y1,lPA,l]
}

function getArcIntersection (px, py, r, al, ah, line) {
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
  console.log('l,k,AB', l, k, lAB)
  console.log('l+k', l+k)
  console.log(line.x1+(l+k)*Math.cos(b/180*Math.PI), line.y1+(l+k)*Math.sin(b/180*Math.PI))
  console.log('l-k', l-k)
  console.log(line.x1+(l-k)*Math.cos(b/180*Math.PI), line.y1+(l-k)*Math.sin(b/180*Math.PI))
  let ret = []
  if (0 <= l+k && l+k <= lAB) {  //在线段上
    const rx = line.x1+(l+k)*Math.cos(b/180*Math.PI)
    const ry = line.y1+(l+k)*Math.sin(b/180*Math.PI)
    const ra = getAngel(rx, ry, px, py)
    console.log(ra)
    if ((al <= ra && ra <= ah) || (ah <= al && (ra <= ah || ra >= al))) ret.push([rx, ry]) //在圆弧上
  }
  if (Math.abs(d)!==r && 0 <= l-k && l-k <= lAB) {  //在线段上
    const rx = line.x1+(l-k)*Math.cos(b/180*Math.PI)
    const ry = line.y1+(l-k)*Math.sin(b/180*Math.PI)
    const ra = getAngel(rx, ry, px, py)
    console.log(ra)
    if ((al <= ra && ra <= ah) || (ah <= al && (ra <= ah || ra >= al))) ret.push([rx, ry])
  }
  return ret
}

console.log(getArcIntersection(0, 0, 1, 270, 360, new Line(1,-1,0,0)).map(a=>[a[0].toFixed(2),a[1].toFixed(2)] ))