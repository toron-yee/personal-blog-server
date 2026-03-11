# 对象存储设计方案

## 概述

为了支持图片上传（用户头像、话题封面等），需要集成对象存储服务。本文档提出一个灵活的架构设计，支持多种存储后端。

## 架构设计

### 分层架构

```
Controller (上传接口)
    ↓
Service (业务逻辑)
    ↓
StorageService (存储抽象层)
    ↓
具体实现 (OSS/S3/MinIO/本地)
```

### 核心概念

1. **StorageService** - 存储抽象层，定义统一接口
2. **具体实现** - 根据配置选择不同的存储后端
3. **DTO** - 上传请求和响应数据结构
4. **拦截器** - 处理文件验证和转换

## 实现方案对比

### 方案 A：阿里云 OSS（推荐用于生产）

**优点**：
- 功能完整，支持 CDN 加速
- 安全性高，支持权限控制
- 成本低，按使用量计费
- 国内访问速度快

**缺点**：
- 需要付费
- 依赖第三方服务

**集成步骤**：
```bash
npm install ali-oss
```

### 方案 B：MinIO（推荐用于自建）

**优点**：
- 开源免费
- S3 兼容，易于迁移
- 可自建部署
- 支持分布式

**缺点**：
- 需要自己维护服务器
- 需要配置 CDN

**部署**：
```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### 方案 C：本地文件系统（推荐用于开发）

**优点**：
- 无需额外配置
- 开发调试方便
- 零成本

**缺点**：
- 不支持分布式
- 需要自己处理备份
- 不适合生产环境

## 推荐实现方案

采用**策略模式**，支持多种存储后端，通过配置切换。

### 1. 定义存储接口

```typescript
// storage.interface.ts
export interface IStorageProvider {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  delete(url: string): Promise<void>;
  getUrl(key: string): string;
}
```

### 2. 创建存储模块

```
storage/
├── storage.module.ts
├── storage.service.ts
├── interfaces/
│   └── storage.interface.ts
├── providers/
│   ├── oss.provider.ts
│   ├── minio.provider.ts
│   └── local.provider.ts
└── dto/
    ├── upload.dto.ts
    └── upload-response.dto.ts
```

### 3. 环境配置

```env
# .env
STORAGE_TYPE=local  # local | oss | minio

# 本地存储
LOCAL_STORAGE_PATH=./uploads

# 阿里云 OSS
OSS_REGION=oss-cn-beijing
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET=my-bucket

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=my-bucket
```

### 4. 使用示例

```typescript
// topic.controller.ts
@Post(':id/upload-cover')
@UseInterceptors(FileInterceptor('file'))
async uploadCover(
  @Param('id') topicId: string,
  @UploadedFile() file: Express.Multer.File,
) {
  const url = await this.storageService.upload(
    file,
    `topics/${topicId}/cover`
  );

  await this.topicService.updateCover(topicId, url);

  return new Response('上传成功', { url });
}
```

## 详细实现步骤

### 第一步：创建存储接口

```typescript
// storage.interface.ts
export interface IStorageProvider {
  upload(file: Express.Multer.File, path: string): Promise<string>;
  delete(url: string): Promise<void>;
  getUrl(key: string): string;
}
```

### 第二步：实现本地存储（开发用）

```typescript
// local.provider.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider } from '../interfaces/storage.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private basePath = process.env.LOCAL_STORAGE_PATH || './uploads';

  async upload(file: Express.Multer.File, filePath: string): Promise<string> {
    const dir = path.join(this.basePath, path.dirname(filePath));

    // 创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fullPath = path.join(this.basePath, filePath);
    fs.writeFileSync(fullPath, file.buffer);

    return `/uploads/${filePath}`;
  }

  async delete(url: string): Promise<void> {
    const filePath = path.join(this.basePath, url.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}
```

### 第三步：实现 MinIO 存储

```typescript
// minio.provider.ts
import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import { IStorageProvider } from '../interfaces/storage.interface';

@Injectable()
export class MinioStorageProvider implements IStorageProvider {
  private client: Minio.Client;
  private bucket = process.env.MINIO_BUCKET || 'my-bucket';

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async upload(file: Express.Multer.File, filePath: string): Promise<string> {
    await this.client.putObject(
      this.bucket,
      filePath,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    return `${process.env.MINIO_ENDPOINT}/${this.bucket}/${filePath}`;
  }

  async delete(url: string): Promise<void> {
    const key = url.split('/').pop();
    await this.client.removeObject(this.bucket, key);
  }

  getUrl(key: string): string {
    return `${process.env.MINIO_ENDPOINT}/${this.bucket}/${key}`;
  }
}
```

### 第四步：创建存储服务

```typescript
// storage.service.ts
import { Injectable } from '@nestjs/common';
import { IStorageProvider } from './interfaces/storage.interface';
import { LocalStorageProvider } from './providers/local.provider';
import { MinioStorageProvider } from './providers/minio.provider';

@Injectable()
export class StorageService {
  private provider: IStorageProvider;

  constructor() {
    const storageType = process.env.STORAGE_TYPE || 'local';

    switch (storageType) {
      case 'minio':
        this.provider = new MinioStorageProvider();
        break;
      case 'local':
      default:
        this.provider = new LocalStorageProvider();
        break;
    }
  }

  async upload(file: Express.Multer.File, path: string): Promise<string> {
    // 文件验证
    this.validateFile(file);

    // 生成文件名
    const fileName = this.generateFileName(file);
    const filePath = `${path}/${fileName}`;

    return this.provider.upload(file, filePath);
  }

  async delete(url: string): Promise<void> {
    return this.provider.delete(url);
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('不支持的文件类型');
    }

    if (file.size > maxSize) {
      throw new Error('文件大小超过限制');
    }
  }

  private generateFileName(file: Express.Multer.File): string {
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop();
    return `${timestamp}.${ext}`;
  }
}
```

### 第五步：创建存储模块

```typescript
// storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
```

### 第六步：在 Topic 模块中使用

```typescript
// topic.module.ts
import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule, ...],
  controllers: [TopicController],
  providers: [TopicService],
})
export class TopicModule {}
```

```typescript
// topic.controller.ts
@Post(':id/upload-cover')
@UseInterceptors(FileInterceptor('file'))
async uploadCover(
  @Param('id') topicId: string,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: any,
) {
  // 验证权限
  const topic = await this.topicService.findOne(topicId);
  if (topic.creator.id !== user.id) {
    throw new ForbiddenException('无权修改此话题');
  }

  // 上传文件
  const url = await this.storageService.upload(
    file,
    `topics/${topicId}/cover`
  );

  // 更新话题
  await this.topicService.updateCover(topicId, url);

  return new Response('上传成功', { url });
}
```

## 数据库设计

### 话题表添加字段

```sql
ALTER TABLE topic ADD COLUMN cover VARCHAR(500) COMMENT '话题封面图片URL';
```

### 用户表添加字段

```sql
ALTER TABLE user ADD COLUMN avatar VARCHAR(500) COMMENT '用户头像URL';
```

## 文件上传最佳实践

### 1. 文件验证
- 检查文件类型（MIME type）
- 检查文件大小
- 检查文件内容（防止伪造）

### 2. 安全性
- 生成随机文件名，避免路径遍历
- 限制上传速率
- 使用 HTTPS 传输
- 定期清理过期文件

### 3. 性能优化
- 使用 CDN 加速
- 图片压缩和缩略图生成
- 异步上传处理
- 支持断点续传

### 4. 错误处理
- 上传失败重试
- 清理临时文件
- 记录上传日志

## 迁移策略

### 从本地存储迁移到 MinIO

```typescript
// migration.service.ts
async migrateToMinio() {
  const topics = await this.topicRepository.find();

  for (const topic of topics) {
    if (topic.cover && topic.cover.startsWith('/uploads/')) {
      const localPath = path.join('./uploads', topic.cover.replace('/uploads/', ''));
      const file = fs.readFileSync(localPath);

      const url = await this.minioService.upload(
        file,
        `topics/${topic.id}/cover`
      );

      await this.topicRepository.update(topic.id, { cover: url });
    }
  }
}
```

## 成本对比

| 方案 | 初始成本 | 月度成本 | 适用场景 |
|------|--------|--------|--------|
| 本地存储 | 0 | 0 | 开发、小型项目 |
| MinIO | 服务器成本 | 服务器成本 | 中型项目、自建 |
| 阿里云 OSS | 0 | 按使用量 | 生产环境、大型项目 |

## 下一步

1. **选择存储方案** - 根据项目需求选择合适的存储后端
2. **实现存储服务** - 按照上述步骤实现存储模块
3. **集成到各模块** - 在 Topic、User 等模块中集成上传功能
4. **添加图片处理** - 集成图片压缩、缩略图生成等功能
5. **性能优化** - 配置 CDN、缓存等优化措施
