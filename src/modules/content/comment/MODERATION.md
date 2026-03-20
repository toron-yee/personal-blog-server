# 评论违规处理系统

## 概述

完整的三层评论违规检测和处理系统：
- **第一层**：实时过滤（关键词、格式、URL等）
- **第二层**：异步审核（内容安全API）
- **第三层**：人工审核（管理员后台）

## 数据模型

### Comment 实体新增字段

```typescript
// 评论状态
status: CommentStatus  // NORMAL | FLAGGED | PENDING_REVIEW | REJECTED | HIDDEN

// 违规信息
violationType: ViolationType  // spam | abuse | illegal | sensitive | advertisement | other
violationReason: string  // 违规原因说明
reviewedBy: string  // 审核人ID
reviewedAt: Date  // 审核时间
```

### 快速查询索引

```
idx_comment_status              - 按状态查询
idx_comment_topic_status        - 按话题+状态查询
idx_comment_creator_status      - 按创建者+状态查询
idx_comment_reviewed_at         - 按审核时间排序
```

## 使用流程

### 1. 发布评论时的实时检测

```typescript
// 在 CommentService.create() 中调用
const checkResult = await this.contentModerationService.checkContentRealtime(content);

if (checkResult.isViolation) {
  // 标记为 FLAGGED，进入审核队列
  await this.flagComment(
    commentId,
    checkResult.violationType,
    checkResult.reason
  );
  // 返回错误给用户
  throw new Error(checkResult.reason);
}

// 通过检测，发布评论
comment.status = CommentStatus.NORMAL;
```

### 2. 异步审核任务

```typescript
// 后台定时任务（如使用 @nestjs/schedule）
@Cron('0 */5 * * * *')  // 每5分钟执行一次
async moderateComments() {
  // 获取所有 FLAGGED 的评论
  const flaggedComments = await this.commentRepository.find({
    where: { status: CommentStatus.FLAGGED }
  });

  for (const comment of flaggedComments) {
    // 调用内容安全API
    const result = await this.contentModerationService.checkContentAsync(
      comment.content
    );

    if (result.isViolation) {
      // 确认违规，标记为 PENDING_REVIEW
      await this.updateToPendingReview(
        [comment.id],
        result.violationType,
        result.reason
      );
    } else {
      // 误判，恢复为 NORMAL
      await this.restoreComment(comment.id, 'system');
    }
  }
}
```

### 3. 管理员后台查询和处理

#### 查询违规评论

```bash
GET /comment/admin/violations?status=pending_review&page=1&limit=20
GET /comment/admin/violations?creatorId=xxx&violationType=spam
GET /comment/admin/violations?topicId=xxx&startDate=2024-01-01&endDate=2024-01-31
```

#### 获取待审核数量

```bash
GET /comment/admin/pending-count
# 返回: { count: 42 }
```

#### 获取用户违规统计

```bash
GET /comment/admin/user/{userId}/violations
# 返回: [
#   { status: 'rejected', count: 5 },
#   { status: 'hidden', count: 2 }
# ]
```

#### 拒绝评论

```bash
POST /comment/admin/{commentId}/reject
{
  "violationType": "spam",
  "reason": "包含广告链接"
}
```

#### 隐藏评论

```bash
POST /comment/admin/{commentId}/hide
{
  "reason": "用户举报：辱骂内容"
}
```

#### 恢复评论

```bash
POST /comment/admin/{commentId}/restore
{
  "reason": "误判，已确认内容合规"
}
```

## 关键方法

### CommentService

| 方法 | 说明 |
|------|------|
| `findViolations(filters)` | 多维度查询违规评论 |
| `flagComment(id, type, reason)` | 标记为可疑 |
| `rejectComment(id, type, reason, reviewedBy)` | 拒绝评论 |
| `hideComment(id, reason, reviewedBy)` | 隐藏评论 |
| `restoreComment(id, reviewedBy)` | 恢复评论 |
| `getUserViolationStats(userId)` | 用户违规统计 |
| `getPendingReviewCount()` | 待审核数量 |
| `updateToPendingReview(ids, type, reason)` | 批量更新为待审核 |

### ContentModerationService

| 方法 | 说明 |
|------|------|
| `checkContentRealtime(content)` | 实时过滤检查 |
| `checkContentAsync(content)` | 异步审核检查（调用API） |
| `isLikelySpam(content)` | 判断是否垃圾信息 |
| `isLikelyAbuse(content)` | 判断是否辱骂内容 |

## 实时过滤规则

### 敏感词检查
- 包含违法、诈骗、赌博等敏感词

### 广告检查
- 包含2个以上广告关键词（微信、支付宝、联系我等）

### 垃圾信息检查
- 连续重复字符超过5个
- 包含URL链接

### 长度检查
- 超过5000字符

## 集成外部API

### 阿里云内容安全

```typescript
// 在 ContentModerationService.checkContentAsync() 中
async checkContentAsync(content: string) {
  const client = new AlibabaCloud.Client({
    accessKeyId: process.env.ALIBABA_ACCESS_KEY,
    accessKeySecret: process.env.ALIBABA_SECRET_KEY,
  });

  const result = await client.textModeration({
    content,
    scenes: ['spam', 'abuse', 'illegal'],
  });

  if (result.violationType) {
    return {
      isViolation: true,
      violationType: this.mapViolationType(result.violationType),
      reason: result.reason,
      confidence: result.confidence,
    };
  }

  return { isViolation: false };
}
```

### 腾讯云内容安全

```typescript
// 类似集成腾讯云 TMS API
```

## 通知用户

当评论被拒绝时，应该通知用户：

```typescript
// 在 rejectComment() 后调用
await this.notificationService.notify(comment.creator.id, {
  type: 'COMMENT_REJECTED',
  title: '您的评论被拒绝',
  message: `您在话题"${topic.title}"的评论因"${reason}"被拒，请修改后重新发布`,
  commentId: comment.id,
  violationType: violationType,
});
```

## 监控和告警

建议监控以下指标：

1. **待审核评论数量** - 超过阈值时告警
2. **拒绝率** - 异常高时告警
3. **用户违规频率** - 同一用户短时间内多次违规时告警
4. **API调用失败** - 内容安全API不可用时告警

## 性能优化

1. **批量处理** - 使用 `updateToPendingReview()` 批量更新
2. **异步任务** - 使用消息队列（如 RabbitMQ）处理审核任务
3. **缓存** - 缓存敏感词库和黑名单
4. **索引** - 已建立的4个索引支持快速查询

## 数据保留策略

- 正常评论：永久保留
- 拒绝评论：保留30天后删除（或根据业务需求调整）
- 隐藏评论：保留90天后删除
- 审核记录：永久保留用于审计
