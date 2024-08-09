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

# docker build -t classroom:v1.0 .

# docker run -d -p 3000:3000 --name classroom:v1.0 classroom