/**
 * 存储提供者接口
 * 定义统一的文件存储操作
 */
export interface IStorageProvider {
  /**
   * 上传文件
   * @param file 文件对象
   * @param path 存储路径
   * @returns 文件访问URL
   */
  upload(file: Express.Multer.File, path: string): Promise<string>;

  /**
   * 删除文件
   * @param url 文件URL或key
   */
  delete(url: string): Promise<void>;

  /**
   * 获取文件URL
   * @param key 文件key
   */
  getUrl(key: string): string;
}
