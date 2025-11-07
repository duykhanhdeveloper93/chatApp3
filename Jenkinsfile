pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        PROJECT_NAME = 'chatapp'
        BACKEND_DIR = 'backend'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 Lấy source code từ GitHub..."
                git branch: 'main',
                    url: 'https://github.com/duykhanhdeveloper93/chatApp3'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "📦 Cài đặt dependencies cho backend..."
                    sh 'npm install'
                }
            }
        }

        stage('Start Database Services') {
            steps {
                echo "🐳 Khởi động MySQL, Redis, RabbitMQ trước..."
                sh '''
                    docker compose -p ${PROJECT_NAME} up -d mysql redis rabbitmq
                    echo "⏳ Đợi MySQL khởi động..."
                    sleep 20
                '''
            }
        }

        stage('Check and Generate Migration If Needed') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🧠 Kiểm tra DB và generate migration nếu cần..."

                    sh '''
                        # Tạo file .env tạm nếu chưa có
                        if [ ! -f .env ]; then
                            cat > .env <<EOF
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=chat_user
DB_PASSWORD=chat_password
DB_NAME=chat_app_dev
NODE_ENV=development
JWT_SECRET=2f1a92a1a6d8481fb9f60e6a5e8d7f79b42e6ef6a9243c1d8d0f4f2a9c3b7d88
RABBITMQ_DEFAULT_USER=chat_user
RABBITMQ_DEFAULT_PASS=chat_password
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672
RABBITMQ_HOST=rabbitmq
REDIS_HOST=redis
REDIS_PORT=6379
EOF
                        fi

                        export $(grep -v '^#' .env | xargs)

                        echo "🔍 Kiểm tra bảng trong MySQL..."
                        TABLE_COUNT=$(docker exec chat-mysql sh -c "mysql -u$DB_USERNAME -p$DB_PASSWORD -D$DB_NAME -se 'SHOW TABLES;' | wc -l")

                        if [ "$TABLE_COUNT" -eq 0 ]; then
                            echo "📄 DB trống → sinh migration mới..."
                            MIGRATION_NAME="Init$(date +%s)"
                            npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate \
                                -d src/data-source.ts src/migrations/$MIGRATION_NAME \
                                || echo "⚠️ Không có thay đổi để generate"
                        else
                            echo "✅ DB đã có bảng → bỏ qua generate."
                        fi
                    '''
                }
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo "🚀 Build & khởi động lại toàn bộ project..."
                sh '''
                    docker compose -p ${PROJECT_NAME} down -v --remove-orphans
                    docker compose -p ${PROJECT_NAME} up -d --build
                '''
            }
        }

        stage('Run Safe Migrations') {
            steps {
                echo "⚙️ Chạy migration an toàn..."
                sh '''
                    if docker ps | grep -q chat-backend; then
                        docker exec chat-backend sh -c "npm run migration:run || echo '⚠️ Migration lỗi nhẹ — bỏ qua.'"
                    else
                        echo "❌ Backend chưa chạy — bỏ qua bước migration"
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "🏁 Pipeline hoàn tất."
        }
        success {
            echo "✅ Triển khai thành công toàn bộ hệ thống!"
        }
        failure {
            echo "❌ Triển khai thất bại — kiểm tra log để biết chi tiết."
            sh '''
                echo "🧹 Dừng các container lỗi..."
                docker compose -p ${PROJECT_NAME} down
            '''
        }
    }
}
