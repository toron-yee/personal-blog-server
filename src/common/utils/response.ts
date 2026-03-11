export class Response<T = any> {
  message: string;
  data: T | null;

  constructor(message: string = '操作成功', data: T | null = null) {
    this.message = message;
    this.data = data;
  }
}
