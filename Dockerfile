# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 接收环境变量作为构建参数
ARG NODE_ENV=production
ARG S3_BUCKET_NAME
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=us-east-1
ARG S3_ENDPOINT
ARG S3_PUBLIC_URL
ARG DB_TYPE=mysql
ARG DB_HOST
ARG DB_PORT=3306
ARG DB_USERNAME
ARG DB_PASSWORD
ARG DB_DATABASE
ARG DB_SYNCHRONIZE=false
ARG DB_LOGGING=false
ARG PORT=3000

# 复制依赖文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 创建 .env.production 文件
RUN cat > .env.production << EOF
NODE_ENV=${NODE_ENV}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION}
S3_ENDPOINT=${S3_ENDPOINT}
S3_PUBLIC_URL=${S3_PUBLIC_URL}
DB_TYPE=${DB_TYPE}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
DB_SYNCHRONIZE=${DB_SYNCHRONIZE}
DB_LOGGING=${DB_LOGGING}
PORT=${PORT}
EOF

# 创建 uploads 目录
RUN mkdir -p uploads

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/main"]
