import { Injectable, BadRequestException } from '@nestjs/common';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import * as crypto from 'crypto';
import * as path from 'path';

/**
 * 存储服务
 * 根据环境自动选择存储提供者
 */
@Injectable()
export class StorageService {
  private readonly provider: IStorageProvider;
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;

  constructor() {
    // 根据环境选择存储提供者
    const nodeEnv = process.env.NODE_ENV || 'development';

    if (nodeEnv === 'production') {
      this.provider = new S3StorageProvider();
      console.log('✓ Storage: Using S3-compatible storage');
    } else {
      this.provider = new LocalStorageProvider();
      console.log('✓ Storage: Using local storage');
    }

    // 配置允许的文件类型
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    // 配置最大文件大小（默认5MB）
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
  }

  /**
   * 上传文件
   * @param file 文件对象
   * @param folder 存储文件夹（如 'avatars', 'topics'）
   * @returns 文件访问URL
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    // 验证文件
    this.validateFile(file);

    // 生成唯一文件名
    const fileName = this.generateFileName(file);

    // 构建存储路径
    const filePath = `${folder}/${fileName}`;

    // 上传文件
    return this.provider.upload(file, filePath);
  }

  /**
   * 删除文件
   * @param url 文件URL
   */
  async deleteFile(url: string): Promise<void> {
    if (!url) {
      return;
    }

    return this.provider.delete(url);
  }

  /**
   * 获取文件URL
   * @param key 文件key
   */
  getFileUrl(key: string): string {
    return this.provider.getUrl(key);
  }

  /**
   * 验证文件
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('文件不能为空');
    }

    // 验证文件类型
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `不支持的文件类型。允许的类型: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    // 验证文件大小
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(`文件大小不能超过 ${maxSizeMB}MB`);
    }
  }

  /**
   * 生成唯一文件名
   */
  private generateFileName(file: Express.Multer.File): string {
    // 获取文件扩展名
    const ext = path.extname(file.originalname);

    // 生成随机哈希
    const hash = crypto.randomBytes(16).toString('hex');

    // 时间戳
    const timestamp = Date.now();

    return `${timestamp}-${hash}${ext}`;
  }
}
