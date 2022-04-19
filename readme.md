# 弹弹球
[Demo](https://linyibin97.github.io/bounce-ball/)

![preview](https://raw.githubusercontent.com/linyibin97/bounce-ball/master/figure.png)

## 玩法
- 通过发射小球消除方块
- 方块会不断增加，下落到横线上游戏结束
- 每回合小球+1，拾取奖励球可增加小球

## 物理模型
- v1.0 将小球的速度分解为x轴与y轴两个方向，比较简单的碰撞检测，只考虑x轴y轴方向上的碰撞反弹。
- v2.0 小球速度记录为速度大小与角度
- v3.0 更真实且精准的运动模型，考虑小球撞角的情况。

## 调试模式
将全局变量devMode设置为True可以直观地观察几何计算

![collision](https://raw.githubusercontent.com/linyibin97/bounce-ball/master/collision.png)
