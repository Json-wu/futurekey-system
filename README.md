# futurekey-system

## Setup

1. Clone the repository.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
4. Fill in the required environment variables in the `.env` file.
5. Run the application:
    ```bash
    npm start
    ```
# set NODE_ENV=production&& node src/app.js

# docker build -t classroom:v1.0 .

# docker run -d -p 3000:3000 --name classroom:v1.0 classroom


# ssh -i C:\\Users\\wyq.pem ec2-user@13.56.248.149

# npm install sqlite3 --registry=https://registry.npmjs.org/  --node_sqlite3_binary_host_mirror=http://npm.taobao.org/mirrors

# netstat -anp | grep 3000  kill -9 pid

# 修改环境变量

1.vim ~/.bash_profile

2.source ~/.bash_profile