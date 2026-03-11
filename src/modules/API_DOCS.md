# API 接口文档

## 认证模块 (auth)

### POST /auth/send-code
发送邮箱验证码
- Body: `{ email }`
- Response: `{ message }`

### POST /auth/register
用户注册
- Body: `{ email, code, username, password, nickname, avatar, website, intro }`
- Response: `{ accessToken, refreshToken, user }`

### POST /auth/login
登录
- Body: `{ email, password }`
- Response: `{ accessToken, refreshToken, user }`

### POST /auth/refresh
刷新Token
- Body: `{ refreshToken }`
- Response: `{ accessToken, refreshToken }`

### POST /auth/verify-email
验证邮箱（找回密码第一步）
- Body: `{ email, code }`
- Response: `{ resetToken }`

### POST /auth/reset-password
重置密码（找回密码第二步）
- Body: `{ email, code, newPassword }`
- Response: `{ message }`

### POST /auth/logout
退出登录
- Auth: 需要 JWT
- Response: `{ message }`

### PATCH /auth/password
修改密码
- Body: `{ oldPassword, newPassword }`
- Auth: 需要 JWT
- Response: `{ accessToken, refreshToken }`

### GET /auth/profile
获取当前用户信息
- Auth: 需要 JWT
- Response: `{ user }`

---

## 用户管理 (user)

### POST /user
创建用户（管理员）
- Body: `{ email, username, password, nickname, avatar, website, intro, role }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ user }`

### GET /user
分页查询用户列表（管理员）
- Query: `{ page, pageSize, username, email, role, orderBy, order }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total, page, pageSize }`

### GET /user/profile/:userId
获取用户公开资料
- Response: `{ id, username, nickname, avatar, website, intro, createdAt, stats: { topicCount, commentCount, topicLikeCount, commentLikeCount } }`

### GET /user/me/info
获取当前用户信息
- Auth: 需要 JWT
- Response: `{ id, email, username, nickname, avatar, website, intro, role, createdAt, updatedAt, stats }`

### PATCH /user/me/profile
更新当前用户个人资料
- Body: `{ nickname, avatar, website, intro }`
- Auth: 需要 JWT
- Response: `{ user }`

### GET /user/:id
获取指定用户（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ user }`

### PATCH /user/:id
更新用户（管理员）
- Body: `{ username, nickname, avatar, website, intro, role }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ user }`

### DELETE /user/:id
删除用户（超级管理员）
- Auth: 需要 JWT + SUPER_ADMIN
- Response: `{ message }`

---

## 话题管理 (topic)

### POST /topic
创建话题
- Body: `{ title, content, contentType, categoryId, tagIds, cover }`
  - contentType: 'html' | 'markdown' | 'plain' (默认: 'html')
- Auth: 需要 JWT
- Response: `{ topic }`

### GET /topic
获取所有话题（分页）
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total, page, limit }`

### GET /topic/hot/list
获取热门话题
- Query: `{ limit=10 }`
- Response: `{ data: [] }`

### GET /topic/recommended/list
获取推荐话题
- Query: `{ limit=10 }`
- Response: `{ data: [] }`

### GET /topic/search/keyword
搜索话题
- Query: `{ keyword, page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /topic/user/:userId
获取用户的话题列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /topic/category/:categoryId
按分类获取话题
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /topic/tag/:tagId
按标签获取话题
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /topic/drafts/list
获取我的草稿列表
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT
- Response: `{ data: [], total, page, limit }`

### POST /topic/:id/publish
发布草稿
- Auth: 需要 JWT
- Response: `{ topic }`

### PATCH /topic/:id/draft
保存为草稿
- Body: `{ title, content, contentType, categoryId, tagIds, cover }`
- Auth: 需要 JWT
- Response: `{ topic }`

### GET /topic/:id
获取话题详情
- Response: `{ topic }`

### POST /topic/:id/view
增加话题浏览次数
- Response: `{ viewed: true }`

### PATCH /topic/:id
更新话题
- Body: `{ title, content, contentType, categoryId, tagIds, cover }`
  - contentType: 'html' | 'markdown' | 'plain'
- Auth: 需要 JWT
- Response: `{ topic }`

### DELETE /topic/:id
删除话题
- Auth: 需要 JWT
- Response: `{ message }`

### POST /topic/:id/sticky
置顶话题（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /topic/:id/unsticky
取消置顶（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /topic/:id/recommend
推荐话题（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /topic/:id/unrecommend
取消推荐（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

---

## 分类管理 (category)

### POST /category
创建分类（管理员）
- Body: `{ name, description, icon }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ category }`

### GET /category
获取所有分类
- Response: `{ data: [] }`

### GET /category/active/list
获取启用的分类
- Response: `{ data: [] }`

### GET /category/:id
获取分类详情
- Response: `{ category }`

### GET /category/:id/topic-count
获取分类下的话题数量
- Response: `{ count }`

### PATCH /category/:id
更新分类（管理员）
- Body: `{ name, description, icon }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ category }`

### POST /category/:id/enable
启用分类（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /category/:id/disable
禁用分类（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### DELETE /category/:id
删除分类（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

---

## 标签管理 (tag)

### POST /tag
创建标签（管理员）
- Body: `{ name, description }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ tag }`

### GET /tag
获取所有标签
- Response: `{ data: [] }`

### GET /tag/active/list
获取启用的标签
- Response: `{ data: [] }`

### GET /tag/hot/list
获取热门标签
- Query: `{ limit=10 }`
- Response: `{ data: [] }`

### GET /tag/:id
获取标签详情
- Response: `{ tag }`

### GET /tag/:id/topic-count
获取标签下的话题数量
- Response: `{ count }`

### PATCH /tag/:id
更新标签（管理员）
- Body: `{ name, description }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ tag }`

### POST /tag/:id/enable
启用标签（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /tag/:id/disable
禁用标签（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### DELETE /tag/:id
删除标签（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

---

## 评论管理 (comment)

### POST /comment
创建评论
- Body: `{ topicId, content, parentId }`
- Auth: 需要 JWT
- Response: `{ comment }`

### GET /comment/topic/:topicId
获取话题的评论列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /comment/:commentId/replies
获取评论的回复列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /comment/user/:userId
获取用户的评论列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /comment/:id
获取评论详情
- Response: `{ comment }`

### PATCH /comment/:id
更新评论
- Body: `{ content }`
- Auth: 需要 JWT
- Response: `{ comment }`

### DELETE /comment/:id
删除评论
- Auth: 需要 JWT
- Response: `{ message }`

### GET /comment/admin/violations
查询违规评论（管理员）
- Query: `{ status, violationType, topicId, creatorId, startDate, endDate, page=1, limit=20 }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total }`

### GET /comment/admin/pending-count
获取待审核评论数量（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ count }`

### GET /comment/admin/user/:userId/violations
获取用户的违规统计（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ violationCount, types: {} }`

### POST /comment/admin/:id/reject
拒绝评论（管理员）
- Body: `{ violationType, reason }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /comment/admin/:id/hide
隐藏评论（管理员）
- Body: `{ reason }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### POST /comment/admin/:id/restore
恢复评论（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### GET /comment/admin/:id/reports
获取评论的举报列表（管理员）
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total }`

---

## 评论点赞 (comment-like)

### POST /comment-like
点赞评论
- Body: `{ commentId }`
- Auth: 需要 JWT
- Response: `{ message }`

### DELETE /comment-like/:commentId
取消点赞
- Auth: 需要 JWT
- Response: `{ message }`

### GET /comment-like/:commentId/is-liked
检查是否点赞
- Auth: 需要 JWT
- Response: `{ isLiked }`

### GET /comment-like/:commentId/users
获取评论的点赞用户列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /comment-like/user/liked-comments
获取用户点赞的评论列表
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT
- Response: `{ data: [], total }`

### GET /comment-like/:commentId/count
获取评论的点赞数量
- Response: `{ count }`

---

## 话题点赞 (topic-like)

### POST /topic-like
点赞话题
- Body: `{ topicId }`
- Auth: 需要 JWT
- Response: `{ message }`

### DELETE /topic-like/:topicId
取消点赞
- Auth: 需要 JWT
- Response: `{ message }`

### GET /topic-like/:topicId/is-liked
检查是否点赞
- Auth: 需要 JWT
- Response: `{ isLiked }`

### GET /topic-like/:topicId/users
获取话题的点赞用户列表
- Query: `{ page=1, limit=20 }`
- Response: `{ data: [], total }`

### GET /topic-like/user/liked-topics
获取用户点赞的话题列表
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT
- Response: `{ data: [], total }`

### GET /topic-like/:topicId/count
获取话题的点赞数量
- Response: `{ count }`

---

## 举报管理 (report)

### POST /report
创建举报
- Body: `{ targetId, targetType, reason, description }`
- Auth: 需要 JWT
- Response: `{ report }`

### GET /report/admin/list
获取举报列表（管理员）
- Query: `{ page=1, limit=20, status, type }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total }`

### GET /report/admin/:id
获取举报详情（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ report }`

### PATCH /report/admin/:id
处理举报（管理员）
- Body: `{ status, action, remark }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ report }`

### DELETE /report/admin/:id
删除举报（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### GET /report/admin/stats/overview
获取举报统计（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ totalCount, statusStats, typeStats }`

### GET /report/admin/target/:targetId
按目标查询举报（管理员）
- Query: `{ type, page=1, limit=20 }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total }`

### GET /report/user/history
获取我的举报历史
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT
- Response: `{ data: [], total }`

---

## 通知管理 (notification)

### GET /notification
获取通知列表
- Query: `{ page=1, limit=20, isRead }`
- Auth: 需要 JWT
- Response: `{ data: [], total }`

### GET /notification/unread-count
获取未读通知数
- Auth: 需要 JWT
- Response: `{ unreadCount }`

### GET /notification/:id
获取通知详情
- Auth: 需要 JWT
- Response: `{ notification }`

### PATCH /notification/:id/read
标记通知为已读
- Auth: 需要 JWT
- Response: `{ message }`

### PATCH /notification/read-all
标记所有通知为已读
- Auth: 需要 JWT
- Response: `{ message }`

### DELETE /notification/:id
删除通知
- Auth: 需要 JWT
- Response: `{ message }`

### POST /notification/system/create
创建系统通知（管理员）
- Body: `{ type, title, content }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ notification }`

### GET /notification/system/admin/list
获取系统通知列表（管理员）
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ data: [], total }`

### GET /notification/system/list
获取系统通知
- Query: `{ page=1, limit=20 }`
- Auth: 需要 JWT
- Response: `{ data: [], total }`

### GET /notification/system/unread-count
获取系统通知未读数
- Auth: 需要 JWT
- Response: `{ unreadCount }`

### PATCH /notification/system/:id/read
标记系统通知为已读
- Auth: 需要 JWT
- Response: `{ message }`

### PATCH /notification/system/read-all
标记所有系统通知为已读
- Auth: 需要 JWT
- Response: `{ message }`

### PATCH /notification/system/:id/deactivate
停用系统通知（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

### DELETE /notification/system/:id
删除系统通知（管理员）
- Auth: 需要 JWT + ADMIN/SUPER_ADMIN
- Response: `{ message }`

---

## 文件存储 (storage)

### POST /storage/upload
上传文件
- Form: `{ file, folder }`
- Auth: 需要 JWT
- Response: `{ url, filename, size, mimetype }`

### DELETE /storage/delete
删除文件
- Body: `{ url }`
- Auth: 需要 JWT
- Response: `{ message }`

---

## 邮件服务 (email)

### POST /email/send
发送邮件（管理员）
- Body: `{ to, subject, content }`
- Auth: 需要 JWT + ADMIN
- Response: `{ message }`

---

## 认证说明

- **Public**: 无需认证
- **JWT**: 需要在 Header 中传递 `Authorization: Bearer <token>`
- **ADMIN/SUPER_ADMIN**: 需要相应的角色权限

## 分页参数

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 20

## 缓存说明

部分 GET 接口使用 Redis 缓存，缓存时间在代码中标注（单位：秒）

## 富文本支持

话题内容支持三种格式：

### 1. HTML 格式 (contentType: 'html')
- 支持完整的 HTML 标签
- 自动进行 XSS 防护，移除危险脚本
- 适合复杂的排版需求

### 2. Markdown 格式 (contentType: 'markdown')
- 支持标准 Markdown 语法
- 前端需要使用 Markdown 渲染库（如 marked、markdown-it）
- 相对安全，自动清理 HTML 标签

### 3. 纯文本格式 (contentType: 'plain')
- 不进行任何格式处理
- 最安全的选项

### XSS 防护

所有富文本内容都会自动进行 XSS 防护：
- 移除 `<script>` 标签及其内容
- 移除事件处理器属性（onclick、onload 等）
- 移除 `<iframe>` 标签
- 移除 `javascript:` 协议链接
- 移除 `data:text/html` 协议

### 前端编辑器推荐

- **HTML**: TinyMCE、Quill、Editor.js
- **Markdown**: CodeMirror、Monaco Editor、Vditor
- **纯文本**: 普通 textarea
