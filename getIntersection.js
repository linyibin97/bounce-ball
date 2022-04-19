function Line(x1, y1, x2, y2) {
  this.x1 = x1
  this.y1 = y1
  this.x2 = x2
  this.y2 = y2
}

var getIntersection = function (l1, l2) {
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

console.log(getIntersection( new Line(0,0,1,1) ,new Line(1,0,2,1) ))
// console.log(getIntersection( new Line(242, 588.87, 290.4, 588.87) ,new Line(252,592.48,252.59,580.39) ))