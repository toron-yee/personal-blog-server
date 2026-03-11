# 通知系统说明

## 概述

通知系统分为两类：
1. **个人通知**：一对一的通知（评论回复、点赞等）
2. **系统通知**：广播给所有用户的通知（系统维护、公告等）

## 通知类型

```typescript
enum NotificationType {
  COMMENT_REPLY = 'COMMENT_REPLY',      // 评论被回复
  TOPIC_LIKED = 'TOPIC_LIKED',          // 话题被点赞
  COMMENT_LIKED = 'COMMENT_LIKED',      // 评论被点赞
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',  // 系统公告
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',    // 系统维护
}
```

---

## 个人通知

### 自动触发场景

#### 1. 评论被回复
- **触发条件**：用户创建评论时，如果是回复（有 parentId）且指定了被回复用户（replyToUserId）
- **接收者**：被回复的用户
- **内容**：`{username} 回复了你的评论`

#### 2. 话题被点赞
- **触发条件**：用户点赞话题时
- **接收者**：话题创建者
- **内容**：`{username} 点赞了你的话题`

#### 3. 评论被点赞
- **触发条件**：用户点赞评论时
- **接收者**：评论创建者
- **内容**：`{username} 点赞了你的评论`

### 个人通知 API

#### 获取通知列表
```
GET /notification?page=1&limit=20&isRead=false
```

**参数**：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `isRead`: 筛选已读/未读（可选，true/false）

**响应**：
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "COMMENT_REPLY",
      "actor": { "id": "uuid", "username": "user1" },
      "targetId": "comment-id",
      "targetType": "comment",
      "content": "user1 回复了你的评论",
      "isRead": false,
      "createdAt": "2026-03-09T10:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### 获取未读通知数
```
GET /notification/unread-count
```

**响应**：
```json
{
  "unreadCount": 5
}
```

#### 获取单条通知
```
GET /notification/:id
```

#### 标记单条通知为已读
```
PATCH /notification/:id/read
```

#### 标记所有通知为已读
```
PATCH /notification/read-all
```

#### 删除通知
```
DELETE /notification/:id
```

---

## 系统通知

### 工作原理

系统通知采用虚拟通知方案：
- 管理员创建一条系统通知记录
- 所有用户自动"接收"该通知（无需为每个用户创建记录）
- 用户标记为已读时，在 `system_notification_read` 表中创建记录
- 查询时动态判断用户是否已读

**优势**：
- 支持大规模用户，无需插入大量记录
- 性能高效
- 灵活管理

### 系统通知 API

#### 创建系统通知（管理员）
```
POST /notification/system/create
Content-Type: application/json

{
  "type": "SYSTEM_ANNOUNCEMENT",
  "title": "系统维护通知",
  "content": "系统将于今晚 22:00 进行维护，预计 2 小时完成"
}
```

**权限**：ADMIN、SUPER_ADMIN

**响应**：
```json
{
  "message": "系统通知已创建",
  "data": {
    "id": "uuid",
    "type": "SYSTEM_ANNOUNCEMENT",
    "title": "系统维护通知",
    "content": "系统将于今晚 22:00 进行维护，预计 2 小时完成",
    "isActive": true,
    "createdAt": "2026-03-09T10:00:00Z"
  }
}
```

#### 获取系统通知列表（管理员）
```
GET /notification/system/admin/list?page=1&limit=20
```

**权限**：ADMIN、SUPER_ADMIN

#### 获取用户的系统通知（包含已读状态）
```
GET /notification/system/list?page=1&limit=20
```

**响应**：
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "SYSTEM_ANNOUNCEMENT",
      "title": "系统维护通知",
      "content": "系统将于今晚 22:00 进行维护...",
      "isActive": true,
      "isRead": false,
      "createdAt": "2026-03-09T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### 获取系统通知未读数
```
GET /notification/system/unread-count
```

**响应**：
```json
{
  "unreadCount": 3
}
```

#### 标记系统通知为已读
```
PATCH /notification/system/:id/read
```

#### 标记所有系统通知为已读
```
PATCH /notification/system/read-all
```

#### 停用系统通知（管理员）
```
PATCH /notification/system/:id/deactivate
```

**权限**：ADMIN、SUPER_ADMIN

**说明**：停用后，该通知不再显示给用户，但记录保留

#### 删除系统通知（管理员）
```
DELETE /notification/system/:id
```

**权限**：ADMIN、SUPER_ADMIN

---

## 数据库设计

### 个人通知表 (notification)
```sql
CREATE TABLE notification (
  id UUID PRIMARY KEY,
  sequence BIGINT UNIQUE,
  snowflake_id BIGINT UNIQUE,
  recipient_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  type ENUM,
  target_id UUID,
  target_type VARCHAR(20),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_notification_recipient_created (recipient_id, created_at),
  INDEX idx_notification_recipient_is_read (recipient_id, is_read),
  INDEX idx_notification_recipient_type (recipient_id, type)
);
```

### 系统通知表 (system_notification)
```sql
CREATE TABLE system_notification (
  id UUID PRIMARY KEY,
  sequence BIGINT UNIQUE,
  snowflake_id BIGINT UNIQUE,
  type ENUM,
  title VARCHAR(100),
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_system_notification_is_active (is_active),
  INDEX idx_system_notification_created (created_at)
);
```

### 系统通知已读表 (system_notification_read)
```sql
CREATE TABLE system_notification_read (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL,
  read_at TIMESTAMP,
  UNIQUE KEY idx_system_notification_read_unique (user_id, notification_id),
  INDEX idx_system_notification_read_user (user_id),
  INDEX idx_system_notification_read_notification (notification_id),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (notification_id) REFERENCES system_notification(id) ON DELETE CASCADE
);
```

---

## 使用示例

### 创建系统通知
```bash
curl -X POST http://localhost:3000/notification/system/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SYSTEM_MAINTENANCE",
    "title": "系统维护",
    "content": "系统将于 2026-03-10 02:00 进行维护"
  }'
```

### 获取用户系统通知
```bash
curl http://localhost:3000/notification/system/list \
  -H "Authorization: Bearer {token}"
```

### 标记系统通知为已读
```bash
curl -X PATCH http://localhost:3000/notification/system/{notificationId}/read \
  -H "Authorization: Bearer {token}"
```

---

## 注意事项

1. **个人通知**：
   - 不给自己发送通知
   - 通知创建失败不影响主操作
   - 支持软删除

2. **系统通知**：
   - 所有激活的系统通知自动发送给所有用户
   - 停用后不再显示，但记录保留
   - 删除后无法恢复
   - 已读记录自动创建，支持级联删除

3. **性能**：
   - 系统通知采用虚拟方案，支持大规模用户
   - 已读状态通过查询判断，不影响通知创建性能
   - 建议定期清理已停用的系统通知

4. **权限**：
   - 所有通知接口都需要登录（JwtAuthGuard）
   - 系统通知管理接口需要 ADMIN 或 SUPER_ADMIN 角色
   - 用户只能查看和管理自己的通知
