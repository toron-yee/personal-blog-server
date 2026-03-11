# 分布式 ID 生成方案

## 概述

系统采用**混合方案**来处理分布式环境下的 ID 生成：

- **sequence**：数据库自增（单机环境）
- **snowflakeId**：雪花 ID（分布式环境）

## 为什么需要两个 ID？

### sequence（数据库自增）

**用途**：
- 单机环境下的自增序列
- 用于排序和分页
- 简单高效

**特点**：
- 数据库层面保证唯一性
- 严格递增
- 性能最优

**限制**：
- 分布式环境下会冲突
- 依赖数据库

### snowflakeId（雪花 ID）

**用途**：
- 分布式环境下的全局唯一 ID
- 用于跨数据中心的 ID 生成
- 预留用于未来扩展

**特点**：
- 全局唯一
- 大致有序（按时间）
- 支持分布式

**结构**（64位）：
```
┌─────────────────────────────────────────────────────────────┐
│ 1位符号 │ 41位时间戳 │ 10位机器ID │ 12位序列号 │
└─────────────────────────────────────────────────────────────┘
```

## 实现细节

### 1. 雪花 ID 生成器

```typescript
// 自动生成雪花 ID
const id = snowflakeIdGenerator.generate();

// 解析雪花 ID
const info = SnowflakeIdGenerator.parse(id);
// {
//   timestamp: Date,
//   dataCenterId: number,
//   machineId: number,
//   sequence: number
// }
```

### 2. 自动生成机制

通过 TypeORM Subscriber 在实体插入时自动生成：

```typescript
@EventSubscriber()
export class SnowflakeIdSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>) {
    if (event.entity && !event.entity.snowflakeId) {
      event.entity.snowflakeId = snowflakeIdGenerator.generate();
    }
  }
}
```

### 3. 环境配置

```env
# 数据中心 ID（0-31）
DATA_CENTER_ID=1

# 机器 ID（0-31）
MACHINE_ID=1
```

## 使用场景

### 单机环境

```typescript
// 使用 sequence 排序
const users = await userRepository.find({
  order: { sequence: 'DESC' }
});
```

### 分布式环境

```typescript
// 使用 snowflakeId 作为全局唯一标识
const user = await userRepository.findOne({
  where: { snowflakeId: id }
});
```

## 性能对比

| 方案 | 性能 | 分布式 | 有序 | 复杂度 |
|------|------|--------|------|--------|
| 数据库自增 | ⭐⭐⭐⭐⭐ | ❌ | ✅ | 低 |
| 雪花 ID | ⭐⭐⭐⭐ | ✅ | ✅ | 中 |
| UUID | ⭐⭐⭐ | ✅ | ❌ | 低 |
| 时间戳 | ⭐⭐⭐⭐ | ⚠️ | ✅ | 低 |

## 迁移到分布式

当需要从单机迁移到分布式时：

1. **保留 sequence**：用于向后兼容
2. **启用 snowflakeId**：新数据使用雪花 ID
3. **逐步迁移**：将旧数据的 snowflakeId 补齐

```typescript
// 迁移脚本
async function migrateToSnowflakeId() {
  const users = await userRepository.find({
    where: { snowflakeId: IsNull() }
  });

  for (const user of users) {
    user.snowflakeId = snowflakeIdGenerator.generate();
    await userRepository.save(user);
  }
}
```

## 最佳实践

### 1. 选择合适的 ID

```typescript
// 单机环境：使用 sequence
const user = await userRepository.findOne({
  where: { sequence: 123 }
});

// 分布式环境：使用 snowflakeId
const user = await userRepository.findOne({
  where: { snowflakeId: 123456789 }
});
```

### 2. 配置数据中心和机器 ID

```env
# 数据中心 1，机器 1
DATA_CENTER_ID=1
MACHINE_ID=1

# 数据中心 1，机器 2
DATA_CENTER_ID=1
MACHINE_ID=2

# 数据中心 2，机器 1
DATA_CENTER_ID=2
MACHINE_ID=1
```

### 3. 监控 ID 生成

```typescript
// 检查 ID 生成速率
const id1 = snowflakeIdGenerator.generate();
const id2 = snowflakeIdGenerator.generate();
console.log(`ID 差值: ${id2 - id1}`); // 应该是 1（同毫秒内）
```

## 常见问题

### Q: 为什么 sequence 不能用于分布式？

A: 因为每个数据库实例都会从 1 开始自增，导致 ID 冲突。

### Q: 雪花 ID 能保证严格递增吗？

A: 不能。同一毫秒内的 ID 是递增的，但跨毫秒可能不严格递增。

### Q: 如何处理时钟回拨？

A: 当前实现会等待时钟追上。生产环境建议使用 NTP 同步时钟。

### Q: 雪花 ID 会溢出吗？

A: 不会。41位时间戳可以支持 69 年（从 2021 年到 2090 年）。

## 参考资源

- [Twitter Snowflake](https://github.com/twitter-archive/snowflake)
- [Distributed ID Generation](https://en.wikipedia.org/wiki/Snowflake_ID)
