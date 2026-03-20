import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { IStorageProvider } from '../interfaces/storage-provider.interface';

/**
 * S3 兼容存储提供者
 * 支持 AWS S3、MinIO、阿里云OSS等S3兼容服务
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly endpoint?: string;
  private readonly publicUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    this.region = this.configService.get('AWS_REGION', 'us-east-1');
    this.accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.endpoint = this.normalizeOptionalUrl(
      this.configService.get<string>('S3_ENDPOINT'),
    ); // 用于MinIO等自建服务
    this.publicUrl = this.normalizeOptionalUrl(
      this.configService.get<string>('S3_PUBLIC_URL'),
    ); // 自定义公开访问URL（如CDN）

    if (!this.bucketName) {
      throw new Error('S3_BUCKET_NAME environment variable is required');
    }

    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required',
      );
    }

    // 初始化 S3 客户端
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      ...(this.endpoint && {
        endpoint: this.endpoint,
        forcePathStyle: true, // MinIO需要
      }),
    });
  }

  /**
   * 上传文件到S3
   */
  async upload(file: Express.Multer.File, filePath: string): Promise<string> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
        ACL: 'public-read',
      },
    });

    await upload.done();

    return this.getUrl(filePath);
  }

  /**
   * 从S3删除文件
   */
  async delete(url: string): Promise<void> {
    // 从URL中提取key
    const key = this.extractKeyFromUrl(url);

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * 获取文件URL
   */
  getUrl(key: string): string {
    // 如果配置了自定义公开URL（如CDN），使用它
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // 如果是自建服务（如MinIO），使用endpoint
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucketName}/${key}`;
    }

    // AWS S3 标准URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * 从URL中提取key
   */
  private extractKeyFromUrl(url: string): string {
    // 处理不同格式的URL
    if (this.publicUrl && url.startsWith(this.publicUrl)) {
      return url.replace(`${this.publicUrl}/`, '');
    }

    if (this.endpoint && url.startsWith(this.endpoint)) {
      return url.replace(`${this.endpoint}/${this.bucketName}/`, '');
    }

    // AWS S3 URL
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : url;
  }

  private normalizeOptionalUrl(value?: string): string | undefined {
    return value ? value.replace(/\/+$/, '') : undefined;
  }
}
