# 墨水屏优化指南

## 新增功能

### 🔧 改进的黑白转换算法

本次更新引入了先进的 **Floyd-Steinberg 抖动算法**，显著改善了墨水屏显示效果：

#### 之前的简单阈值处理
```
原始图像 → 灰度 → 简单阈值(130) → 黑白图像
```
问题：锯齿严重，字体模糊，对比度不足

#### 新的智能处理流程
```
原始图像 → 灰度 → 对比度增强 → 轻微锐化 → Floyd-Steinberg抖动 → 黑白图像
```
优势：
- ✅ 锯齿大幅减少
- ✅ 字体清晰锐利
- ✅ 细节保留更完整
- ✅ 墨水屏可读性显著提升

### 🎨 字体渲染优化

新的字体渲染设置确保在各种环境下都有最佳显示效果：

```css
font-family: "Noto Sans CJK SC", "Noto Sans SC", "Noto Sans", "Microsoft YaHei", sans-serif !important;
-webkit-font-smoothing: antialiased !important;
-moz-osx-font-smoothing: grayscale !important;
text-rendering: optimizeLegibility !important;
```

### 📱 推荐URL参数

在请求截图时，使用以下参数获得最佳墨水屏效果：

```
http://your-ha-ip:10000/dashboard-lovelace/0?viewport=800x480&einkColors=2
```

参数说明：
- `viewport=800x480`: 设置适合墨水屏的分辨率
- `einkColors=2`: 启用黑白墨水屏模式
- 可选 `invert=true` 反色（白底黑字）

### 🔄 抖动算法原理

Floyd-Steinberg抖动通过将像素误差分散到周围像素来模拟灰度：

```
当前像素 → 计算误差 → 分配给相邻像素
    ↓
  [ ] [7/16] [ ]
    ↓
[3/16] [5/16] [1/16]
```

这种算法能够：
- 保持图像细节
- 减少锯齿感
- 提供平滑的灰度过渡

### 📋 测试建议

1. **测试不同内容类型**：
   - 文本密集的仪表盘
   - 图表和图形
   - 混合内容页面

2. **调整显示参数**：
   - 尝试不同的分辨率
   - 测试反色和非反色效果
   - 观察不同光照条件下的表现

3. **对比效果**：
   - 更新前后的截图对比
   - 在实际墨水屏上测试显示效果

### 🐛 故障排除

如果遇到问题：

1. **字体显示异常**：
   - 清除浏览器缓存
   - 检查系统字体安装

2. **图像处理慢**：
   - 减小截图分辨率
   - 检查系统内存使用

3. **颜色转换问题**：
   - 确保 `einkColors=2` 参数正确
   - 检查URL格式是否正确