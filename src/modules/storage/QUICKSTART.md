# 文件存储服务 - 快速开始

## 1. 安装依赖

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## 2. 配置环境变量

### 开发环境（本地存储）

在 `.env` 文件中添加：

```env
NODE_ENV=development
APP_URL=http://localhost:3000
```

### 生产环境（S3）

```env
NODE_ENV=production
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### MinIO（自建）

```env
NODE_ENV=production
S3_ENDPOINT=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=my-bucket
AWS_REGION=us-east-1
```

## 3. 启动 MinIO（可选）

```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

访问控制台：http://localhost:9001

## 4. 测试上传

### 使用 Swagger

1. 启动服务：`npm run start:dev`
2. 访问：http://localhost:3000/api/docs
3. 找到 `POST /api/storage/upload`
4. 点击 "Try it out"
5. 选择文件并上传

### 使用 cURL

```bash
curl -X POST http://localhost:3000/api/storage/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=test"
```

### 使用 Postman

1. 创建 POST 请求：`http://localhost:3000/api/storage/upload`
2. Headers：`Authorization: Bearer YOUR_TOKEN`
3. Body：选择 `form-data`
4. 添加字段：
   - `file`：选择文件
   - `folder`：输入 `test`

## 5. 验证结果

### 本地存储

检查文件是否存在：

```bash
ls uploads/test/
```

访问文件：

```
http://localhost:3000/uploads/test/1234567890-abc123.jpg
```

### S3/MinIO

登录控制台查看存储桶中的文件。

## 6. 在代码中使用

```typescript
import { StorageService } from '../storage/storage.service';

@Injectable()
export class YourService {
  constructor(private readonly storageService: StorageService) {}

  async uploadImage(file: Express.Multer.File) {
    const url = await this.storageService.uploadFile(file, 'images');
    return url;
  }
}
```

## 常见问题

### Q: 本地存储的文件无法访问？
A: 确保 `main.ts` 中配置了静态资源：
```typescript
app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});
```

### Q: S3 上传失败？
A: 检查环境变量是否正确，特别是 `AWS_ACCESS_KEY_ID` 和 `AWS_SECRET_ACCESS_KEY`。

### Q: MinIO 连接失败？
A: 确保 MinIO 服务已启动，并且 `S3_ENDPOINT` 配置正确。

## 下一步

- 查看完整文档：`STORAGE_USAGE.md`
- 集成到其他模块（User、Topic 等）
- 配置 CDN 加速
- 添加图片压缩功能
