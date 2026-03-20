# 博客系统模块总览

## 当前分层

项目当前按子域拆成 4 个聚合模块：

- `identity`：认证与用户
- `content`：话题、评论、分类、标签
- `interaction`：举报、通知、点赞
- `infra`：邮件、文件存储

目录结构如下：

```text
modules/
├─ identity/
│  ├─ auth/
│  ├─ user/
│  └─ identity.module.ts
├─ content/
│  ├─ category/
│  ├─ comment/
│  ├─ tag/
│  ├─ topic/
│  └─ content.module.ts
├─ interaction/
│  ├─ comment-like/
│  ├─ notification/
│  ├─ report/
│  ├─ topic-like/
│  └─ interaction.module.ts
└─ infra/
   ├─ email/
   ├─ storage/
   └─ infra.module.ts
```

## 设计原则

- Controller 负责 HTTP 入口，不承载复杂业务规则。
- Service 负责业务编排，但尽量不要直接承担通知、统计这类副作用细节。
- 跨子域调用优先走公开 service，不鼓励到处直接注入别人的 repository。
- 基础设施能力统一放在 `infra`，业务模块只依赖抽象后的服务能力。

## 当前已经收口的副作用

- 用户查询统一通过 `identity/user` 暴露的读服务获取。
- 评论回复、评论点赞、话题点赞通知统一通过 `interaction/notification/notification-trigger.service.ts` 触发。
- 话题评论数统一通过 `content/topic/topic-stats.service.ts` 维护。
- 举报目标的举报数统一通过 `interaction/report/report-target-counter.service.ts` 维护。

## 添加新模块的建议

1. 先判断它属于 `identity`、`content`、`interaction` 还是 `infra`。
2. 在对应子域目录下创建模块，而不是再往 `system/` 里堆。
3. 如果是跨子域副作用，优先抽成独立触发器或协作服务，不要直接塞回主业务 service。
4. 只有在确实共享的情况下才导出 service，避免把模块边界重新打穿。

## 迁移说明

- 旧的 `modules/system` 已不再承载业务代码，仅保留历史目录占位。
- 旧的 `SystemModule`、`CommonModule` 已移除。
- `AppModule` 当前通过 `InfraModule`、`IdentityModule`、`ContentModule`、`InteractionModule` 装配应用。

## 相关文档

- `interaction/notification/NOTIFICATION.md`
- `content/comment/MODERATION.md`
- `infra/storage/STORAGE_USAGE.md`
