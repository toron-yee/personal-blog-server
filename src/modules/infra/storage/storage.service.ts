import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import * as crypto from 'crypto';
import * as path from 'path';
import { STORAGE_PROVIDER } from './storage.constants';

/**
 * 存储服务
 * 根据环境自动选择存储提供者
 */
@Injectable()
export class StorageService {
  private readonly allowedFolders: string[];
  private readonly allowedMimeTypes: string[];
  private readonly maxFileSize: number;

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
    private readonly configService: ConfigService,
  ) {
    this.allowedFolders = this.parseAllowedFolders(
      this.configService.get(
        'STORAGE_ALLOWED_FOLDERS',
        'avatars,topics,general,covers,instation',
      ),
    );

    // 配置允许的文件类型
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    // 配置最大文件大小（默认5MB）
    this.maxFileSize = parseInt(
      this.configService.get('MAX_FILE_SIZE', `${5 * 1024 * 1024}`),
      10,
    ) || 5 * 1024 * 1024;
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
    const safeFolder = this.normalizeFolder(folder);

    // 生成唯一文件名
    const fileName = this.generateFileName(file);

    // 构建存储路径
    const filePath = `${safeFolder}/${fileName}`;

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

  private normalizeFolder(folder?: string): string {
    const target = (folder?.trim() || 'general')
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '');

    if (!target || target.includes('..')) {
      throw new BadRequestException('存储目录不合法');
    }

    if (!this.allowedFolders.includes(target)) {
      throw new BadRequestException(
        `不支持的存储目录。允许的目录: ${this.allowedFolders.join(', ')}`,
      );
    }

    return target;
  }

  private parseAllowedFolders(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
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
