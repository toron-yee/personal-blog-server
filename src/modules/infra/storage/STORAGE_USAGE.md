# 文件存储服务使用文档

## 概述

文件存储服务支持根据 `STORAGE_DRIVER` 环境变量切换存储策略：
- `local`：使用本地存储
- `s3`：使用 S3 兼容存储

## 快速开始

### 1. 安装依赖

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage multer @nestjs/platform-express
npm install -D @types/multer
```

### 2. 环境配置

在 `.env` 中配置以下变量：

#### 开发环境（本地存储）

```env
STORAGE_DRIVER=local
APP_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
STORAGE_ALLOWED_FOLDERS=avatars,topics,general,covers,instation
```

#### 生产环境（S3）

```env
STORAGE_DRIVER=s3
S3_BUCKET_NAME=my-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

#### MinIO 配置

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=my-bucket
AWS_REGION=us-east-1
```

### 3. 启动 MinIO（可选）

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

访问 MinIO 控制台：http://localhost:9001

### 4. 在其他模块中使用

#### 导入 StorageModule

```typescript
// topic.module.ts
import { Module } from '@nestjs/common';
import { StorageModule } from '@/modules/infra/storage/storage.module';

@Module({
  imports: [StorageModule],
  // ...
})
export class TopicModule {}
```

#### 在 Service 中使用

```typescript
// topic.service.ts
import { Injectable } from '@nestjs/common';
import { StorageService } from '@/modules/infra/storage/storage.service';

@Injectable()
export class TopicService {
  constructor(private readonly storageService: StorageService) {}

  async uploadCover(file: Express.Multer.File): Promise<string> {
    return this.storageService.uploadFile(file, 'topics');
  }

  async deleteCover(url: string): Promise<void> {
    return this.storageService.deleteFile(url);
  }
}
```

#### 在 Controller 中使用

```typescript
// topic.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('topic')
export class TopicController {
  constructor(
    private readonly topicService: TopicService,
    private readonly storageService: StorageService,
  ) {}

  @Post(':id/upload-cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('id') topicId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.storageService.uploadFile(file, 'topics');
    await this.topicService.updateCover(topicId, url);
    return { url };
  }
}
```

## API 接口

### 上传文件

```http
POST /api/storage/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: 文件（必填）
- folder: 存储文件夹（可选，默认 'general'）
```

**响应示例**：

```json
{
  "message": "上传成功",
  "data": {
    "url": "http://localhost:3000/uploads/topics/1234567890-abc123.jpg",
    "filename": "cover.jpg",
    "size": 102400,
    "mimetype": "image/jpeg"
  }
}
```

### 删除文件

```http
DELETE /api/storage/delete
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "url": "http://localhost:3000/uploads/topics/1234567890-abc123.jpg"
}
```

## 文件验证

### 支持的文件类型

- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `image/svg+xml`

### 文件大小限制

默认最大 5MB，可通过 `MAX_FILE_SIZE` 环境变量配置。

允许上传的目录由 `STORAGE_ALLOWED_FOLDERS` 控制，默认值：

- `avatars`
- `topics`
- `general`
- `covers`
- `instation`

## 存储路径规范

建议按功能模块组织文件夹：

- `avatars/` - 用户头像
- `topics/` - 话题封面
- `comments/` - 评论图片
- `general/` - 通用文件

## 本地存储

### 文件存储位置

```
project-root/
└── uploads/
    ├── avatars/
    ├── topics/
    └── general/
```

### 访问URL

```
http://localhost:3000/uploads/{folder}/{filename}
```

### 静态资源配置

已在 `main.ts` 中配置：

```typescript
app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});
```

## S3 兼容存储

### 支持的服务

- AWS S3
- MinIO
- 阿里云 OSS
- 腾讯云 COS
- 其他 S3 兼容服务

### URL 生成规则

1. **自定义公开URL**（优先）：
   ```
   {S3_PUBLIC_URL}/{key}
   ```

2. **自建服务**（如 MinIO）：
   ```
   {S3_ENDPOINT}/{S3_BUCKET_NAME}/{key}
   ```

3. **AWS S3 标准**：
   ```
   https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}
   ```

## 最佳实践

### 1. 文件命名

系统自动生成唯一文件名：

```
{timestamp}-{random-hash}.{ext}
```

示例：`1709876543210-a1b2c3d4e5f6.jpg`

### 2. 权限控制

上传和删除接口都需要登录认证（`JwtAuthGuard`）。

### 3. 错误处理

```typescript
try {
  const url = await this.storageService.uploadFile(file, 'topics');
} catch (error) {
  if (error.message.includes('不支持的文件类型')) {
    // 处理文件类型错误
  }
  if (error.message.includes('文件大小不能超过')) {
    // 处理文件大小错误
  }
}
```

### 4. 清理旧文件

更新文件时，记得删除旧文件：

```typescript
async updateCover(topicId: string, newFile: Express.Multer.File) {
  const topic = await this.findOne(topicId);

  // 删除旧文件
  if (topic.cover) {
    await this.storageService.deleteFile(topic.cover);
  }

  // 上传新文件
  const url = await this.storageService.uploadFile(newFile, 'topics');

  // 更新数据库
  await this.topicRepository.update(topicId, { cover: url });
}
```

## 迁移指南

### 从本地存储迁移到 S3

1. 修改环境变量：
   ```env
   NODE_ENV=production
   S3_BUCKET_NAME=my-bucket
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   ```

2. 迁移现有文件（可选）：
   ```typescript
   async migrateToS3() {
     const topics = await this.topicRepository.find();

     for (const topic of topics) {
       if (topic.cover && topic.cover.startsWith('http://localhost')) {
         // 读取本地文件
         const localPath = topic.cover.replace('http://localhost:3000/uploads/', '');
         const file = fs.readFileSync(path.join('uploads', localPath));

         // 上传到 S3
         const url = await this.storageService.uploadFile(
           { buffer: file, mimetype: 'image/jpeg' } as any,
           'topics'
         );

         // 更新数据库
         await this.topicRepository.update(topic.id, { cover: url });
       }
     }
   }
   ```

## 故障排查

### 本地存储无法访问

检查：
1. `uploads` 目录是否存在
2. `main.ts` 中是否配置了静态资源
3. URL 是否正确（`http://localhost:3000/uploads/...`）

### S3 上传失败

检查：
1. 环境变量是否正确配置
2. AWS 凭证是否有效
3. 存储桶是否存在
4. 网络连接是否正常

### MinIO 连接失败

检查：
1. MinIO 服务是否启动
2. `S3_ENDPOINT` 是否正确
3. `forcePathStyle: true` 是否设置

## 性能优化

### 1. 使用 CDN

配置 `S3_PUBLIC_URL` 指向 CDN：

```env
S3_PUBLIC_URL=https://cdn.example.com
```

### 2. 图片压缩

可以集成 `sharp` 进行图片压缩：

```bash
npm install sharp
```

```typescript
import * as sharp from 'sharp';

async uploadFile(file: Express.Multer.File, folder: string) {
  // 压缩图片
  const compressed = await sharp(file.buffer)
    .resize(1920, 1080, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toBuffer();

  file.buffer = compressed;

  return this.provider.upload(file, folder);
}
```

### 3. 异步上传

对于大文件，可以使用队列异步处理。

## 安全建议

1. **不要提交敏感信息**：`.env` 文件不要提交到 Git
2. **使用 IAM 角色**：生产环境建议使用 IAM 角色而非密钥
3. **限制文件类型**：只允许必要的文件类型
4. **限制文件大小**：防止恶意上传大文件
5. **验证文件内容**：检查文件头，防止伪造文件类型
6. **使用 HTTPS**：生产环境必须使用 HTTPS

## 相关文档

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [MinIO 文档](https://min.io/docs/minio/linux/index.html)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
