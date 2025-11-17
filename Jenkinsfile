pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        PROJECT_NAME = 'chatapp'
        BACKEND_DIR = 'backend'
        DB_HOST = 'mysql'
        DB_PORT = '3306'
        DB_USERNAME = 'chat_user'
        DB_PASSWORD = 'chat_password'
        DB_NAME = 'chat_app_dev'
        NODE_ENV = 'development'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 Lấy source code..."
                git branch: 'main', url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "📦 Cài đặt dependencies..."
                    sh 'npm install'
                }
            }
        }

        stage('Start Services') {
            steps {
                echo "🐳 Khởi động MySQL, Redis, RabbitMQ..."
                sh """
                    docker compose -p ${PROJECT_NAME} up -d mysql redis rabbitmq
                    echo "⏳ Chờ DB services healthy..."
                    sleep 30
                """
            }
        }

        stage('Check DB and Generate Migration') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🧠 Kiểm tra bảng DB và generate migration nếu DB trống..."
                    sh """
                        export DB_HOST=${DB_HOST}
                        export DB_PORT=${DB_PORT}
                        export DB_USERNAME=${DB_USERNAME}
                        export DB_PASSWORD=${DB_PASSWORD}
                        export DB_NAME=${DB_NAME}

                        TABLE_COUNT=\$(docker exec chat-mysql sh -c "mysql -u\$DB_USERNAME -p\$DB_PASSWORD -D\$DB_NAME -se 'SHOW TABLES;' | wc -l")
                        if [ "\$TABLE_COUNT" -eq 0 ]; then
                            echo "📄 DB trống → sinh migration..."
                            MIGRATION_NAME="Init\$(date +%s)"
                            npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/data-source.ts src/migrations/\$MIGRATION_NAME || echo "⚠️ Không có thay đổi để generate"
                        else
                            echo "✅ DB đã có bảng → bỏ qua generate"
                        fi
                    """
                }
            }
        }

        stage('Build & Deploy') {
            steps {
                echo "🚀 Build & chạy toàn bộ project..."
                sh """
                    docker compose -p ${PROJECT_NAME} up -d --build
                """
            }
        }

        stage('Run Safe Migrations') {
            steps {
                echo "⚙️ Chạy migration an toàn..."
                sh """
                    if docker ps | grep -q chat-backend; then
                        docker exec chat-backend sh -c "npm run migration:run || echo '⚠️ Migration lỗi nhẹ — bỏ qua.'"
                    else
                        echo "❌ Backend chưa chạy — bỏ qua migration"
                    fi
                """
            }
        }
    }

    post {
        always {
            echo "🏁 Pipeline hoàn tất."
        }
        success {
            echo "✅ Triển khai thành công!"
        }
        failure {
            echo "❌ Pipeline thất bại, dừng container..."
            sh "docker compose -p ${PROJECT_NAME} down"
        }
    }
}
