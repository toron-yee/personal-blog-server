import { Injectable } from '@nestjs/common';
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

  constructor() {
    // 项目根目录的 uploads 文件夹
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // 本地访问的基础URL
    this.baseUrl = process.env.APP_URL || 'http://localhost:3000';

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
    const fullDir = path.join(this.uploadDir, path.dirname(filePath));

    // 创建目录（如果不存在）
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }

    // 写入文件
    const fullPath = path.join(this.uploadDir, filePath);
    fs.writeFileSync(fullPath, file.buffer);

    // 返回可访问的URL
    return `${this.baseUrl}/uploads/${filePath}`;
  }

  /**
   * 删除本地文件
   */
  async delete(url: string): Promise<void> {
    // 从URL中提取文件路径
    const filePath = url.replace(`${this.baseUrl}/uploads/`, '');
    const fullPath = path.join(this.uploadDir, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /**
   * 获取文件URL
   */
  getUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }
}
