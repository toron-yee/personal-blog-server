## nest-cli常用命令
```bash
# 语法  注意创建顺序：先创建Module, 再创建Controller和Service  如果想避免生成测试文件，在命令的后边加 --no-spec  不创文件夹--flat
$ nest g [文件类型] [文件名] [文件目录] --flat --no-spec

# 创建CRUD资源  在src文件夹
nest g res user modules --no-spec
nest g res auth modules/system --no-spec

# 模块
nest g mo user modules

# 控制器
nest g co user modules

# 服务类
nest g s user modules

# 创建拦截器文件
nest g interceptor common/interceptors/result --flat --no-spec

# 创建过滤器文件
nest g filter common/filters/http-exception --flat --no-spec

#守卫
nest g guard common/guards/jwt --flat --no-spec

# 装饰器
nest g decorator common/decorators/public --flat --no-spec

# 管道
nest g pipe common/pipes/Validation --flat --no-spec

# 中间件
nest g mi common/middlewares/logger --flat --no-spec
```