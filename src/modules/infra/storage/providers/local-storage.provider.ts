import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider } from '../interfaces/storage-provider.interface';

/**
 * 本地存储提供者
 * 用于开发环境，将文件保存到本地 uploads 目录
 */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;
  private readonly uploadUrlPrefix = '/uploads/';

  constructor(private readonly configService: ConfigService) {
    // 项目根目录的 uploads 文件夹
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // 本地访问的基础URL
    this.baseUrl = this.normalizeBaseUrl(
      this.configService.get('APP_URL', 'http://localhost:3000'),
    );

    // 确保 uploads 目录存在
    this.ensureUploadDir();
  }

  /**
   * 确保上传目录存在
   */
  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 上传文件到本地
   */
  async upload(file: Express.Multer.File, filePath: string): Promise<string> {
    const { normalizedRelativePath, fullPath } = this.resolveStoragePath(filePath);
    const fullDir = path.dirname(fullPath);

    // 创建目录（如果不存在）
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(fullPath, file.buffer);

    // 返回可访问的URL
    return `${this.baseUrl}${this.uploadUrlPrefix}${normalizedRelativePath}`;
  }

  /**
   * 删除本地文件
   */
  async delete(url: string): Promise<void> {
    // 从URL中提取文件路径
    const filePath = this.extractFilePathFromUrl(url);
    const { fullPath } = this.resolveStoragePath(filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /**
   * 获取文件URL
   */
  getUrl(key: string): string {
    return `${this.baseUrl}${this.uploadUrlPrefix}${key}`;
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '');
  }

  private extractFilePathFromUrl(url: string): string {
    const normalizedUrl = url.trim();
    const prefix = `${this.baseUrl}${this.uploadUrlPrefix}`;

    if (!normalizedUrl.startsWith(prefix)) {
      throw new BadRequestException('文件 URL 不合法');
    }

    return decodeURIComponent(normalizedUrl.slice(prefix.length));
  }

  private resolveStoragePath(relativePath: string) {
    const normalizedRelativePath = path.posix.normalize(
      relativePath.replace(/\\/g, '/'),
    );

    if (
      !normalizedRelativePath ||
      normalizedRelativePath.startsWith('..') ||
      path.isAbsolute(normalizedRelativePath)
    ) {
      throw new BadRequestException('非法文件路径');
    }

    const rootPath = path.resolve(this.uploadDir);
    const fullPath = path.resolve(this.uploadDir, normalizedRelativePath);

    if (fullPath !== rootPath && !fullPath.startsWith(`${rootPath}${path.sep}`)) {
      throw new BadRequestException('非法文件路径');
    }

    return { normalizedRelativePath, fullPath };
  }
}
