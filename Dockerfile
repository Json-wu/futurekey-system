# 使用 Node.js 官方 LTS 版本作为基础镜像
FROM node:16

# 创建并设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json 文件
COPY package*.json ./

# 安装应用依赖
RUN npm install

# 复制应用源代码到工作目录
COPY . .

# 暴露应用运行的端口
EXPOSE 3000

# 运行应用
CMD ["node", "src/app.js"]



