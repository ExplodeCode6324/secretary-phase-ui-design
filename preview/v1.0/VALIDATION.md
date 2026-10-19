# 正式设计 v1.0 发布验证

日期：2026-10-19。静态参考实现，未接入后端或Tauri。

## 本次检查

- `node --check prototype.js`、`node --check signal-motion.js`：通过。
- `node --test tests/signal-motion.test.cjs`：21项全部通过，覆盖真实缺口、三帧互斥、同次接触合并、取消/禁用/移除/模式变化、输入提交边界、头像与分隔线清理。
- `python3 scripts/check-preview.py`、`git diff --check`：通过。
- Chrome 1470×920：深浅色页面可读；品牌实际样式为border 0px、box-shadow none、文字双色text-shadow。静态字形没有矩形装饰框。
- 品牌样本冻结第二帧：三个帧组透明度为0/1/0，九个字形副本（三帧×三层），副本继承文字蓝边；切回对话后临时identity层为0。控制台无错误。冻结验证仅证明帧可见性，不等于真实时序性能测试。
- 内嵌浏览器479px窄屏：竖排品牌可读，右栏收起，body scrollWidth与视口同为479px，无水平溢出。
- 正式文档的本地链接、代码行号范围与资源链接检查通过。

## 当前截图

- [深色](dark.png) / [浅色](light.png)：同一1470×920视口。
- [窄屏](narrow.png)：内嵌浏览器479px。
- [品牌第二帧](identity-frame.png)：冻结检查，非播放录像。

## 可重复观察

启动README中的本地服务器。进入 `/#motion`，开启冻结并选择第一/第二/第三帧，然后触发“PERRI品牌动效样本”。关闭冻结重新触发可检查播放与恢复。对话页品牌与两个头像沿用同一三层显示。靠近分隔线可观察克制故障。

本轮仅调整品牌字形边缘、文档及发布清理，保留既有动效实现。实际Tauri WebView的帧率、CPU/GPU与功耗仍需技术实现阶段测量。
