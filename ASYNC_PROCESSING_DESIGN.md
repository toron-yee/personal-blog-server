# 异步处理架构设计

## 概述
为了进一步提升系统性能，建议使用消息队列（Bull/RabbitMQ）处理耗时操作，避免阻塞主线程。

## 需要异步化的操作

### 1. 评论内容审核
**当前流程**：
```
用户提交评论 → 实时检测 → 异步审核 → 返回响应
```

**问题**：
- 外部 API 调用可能很慢
- 阻塞用户请求

**异步方案**：
```
用户提交评论 → 立即返回 → 后台异步审核 → 更新评论状态
```

### 2. 统计更新
**需要异步化的统计**：
- 话题浏览数 (viewCount)
- 话题点赞数 (likeCount)
- 话题评论数 (commentCount)
- 评论点赞数 (likeCount)
- 分类话题数
- 标签使用次数 (usageCount)

**当前问题**：
- 每次操作都需要更新数据库
- 高并发时产生锁竞争

**异步方案**：
```
操作发生 → 发送到队列 → 后台批量更新 → 定期同步到数据库
```

### 3. 举报处理通知
**需要异步化的通知**：
- 举报被处理时通知举报人
- 内容被隐藏时通知创建者
- 违规警告通知用户

## 实施方案

### 方案 A：Bull + Redis（推荐）
**优点**：
- 基于 Redis，部署简单
- 与现有缓存基础设施集成
- 支持重试、延迟、优先级
- 有 NestJS 官方支持

**实施步骤**：
```bash
npm install @nestjs/bull bull
```

**创建队列**：
```typescript
// comment-moderation.queue.ts
@Processor('comment-moderation')
export class CommentModerationProcessor {
  @Process()
  async handleCommentModeration(job: Job<CreateCommentDto>) {
    // 异步审核逻辑
  }
}

// statistics.queue.ts
@Processor('statistics')
export class StatisticsProcessor {
  @Process('update-like-count')
  async updateLikeCount(job: Job<{type: string, targetId: string}>) {
    // 异步更新统计
  }
}
```

### 方案 B：RabbitMQ
**优点**：
- 功能更强大
- 支持复杂的消息路由
- 更好的可靠性保证

**缺点**：
- 需要额外的基础设施
- 部署和维护更复杂

## 优先级

### 第一阶段（立即实施）
- [x] 查询优化（已完成）
- [x] 索引优化（已完成）
- [ ] 集成 Bull 队列
- [ ] 异步评论审核

### 第二阶段（后续优化）
- [ ] 异步统计更新
- [ ] 批量更新优化
- [ ] 监控和告警

### 第三阶段（可选）
- [ ] 迁移到 RabbitMQ
- [ ] 分布式追踪
- [ ] 性能监控仪表板

## 预期性能提升

| 优化项 | 性能提升 | 实施难度 |
|-------|--------|--------|
| 查询优化 | 50-80% 查询减少 | 低 ✅ |
| 索引优化 | 30-50% 查询速度 | 低 ✅ |
| 缓存策略 | 70-90% 响应时间 | 低 ✅ |
| 异步处理 | 用户体验改善 | 中 |

## 实施建议

1. **立即实施**：查询优化 + 索引优化 + 缓存（已完成）
2. **短期**（1-2周）：集成 Bull，异步化评论审核
3. **中期**（1个月）：异步统计更新，性能监控
4. **长期**：根据实际需求考虑 RabbitMQ 迁移

## 监控指标

- 平均响应时间
- 数据库查询次数
- 缓存命中率
- 队列处理延迟
- 错误率

## 参考资源

- [NestJS Bull 文档](https://docs.nestjs.com/techniques/queues)
- [Bull 官方文档](https://github.com/OptimalBits/bull)
- [RabbitMQ 官方文档](https://www.rabbitmq.com/documentation.html)
