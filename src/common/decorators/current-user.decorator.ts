import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 当前用户参数装饰器
 * 用于在控制器方法中获取当前登录用户信息
 * 
 * @example
 * // 获取完整用户对象
 * @Get()
 * getProfile(@CurrentUser() user: User) {}
 * 
 * // 获取用户特定属性
 * @Get()
 * getUserId(@CurrentUser('id') userId: string) {}
 * 
 * @param data 可选的用户属性名，指定要获取的用户属性
 * @param ctx 执行上下文，用于获取HTTP请求对象
 * @returns 用户对象或指定的用户属性
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 从执行上下文切换到HTTP上下文并获取请求对象
    const request = ctx.switchToHttp().getRequest();
    // 如果指定了属性名，则返回用户对象的对应属性，否则返回完整用户对象
    return data ? request.user?.[data] : request.user;
  },
);