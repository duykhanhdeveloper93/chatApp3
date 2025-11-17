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
                echo "🐳 Khởi động MySQL, Redis, RabbitMQ..."
                sh '''
                    docker compose --project-name ${PROJECT_NAME} up -d mysql redis rabbitmq
                    echo "⏳ Đợi MySQL khởi động..."
                    sleep 20
                '''
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo "🚀 Build & khởi động lại backend..."
                sh '''
                    docker compose --project-name ${PROJECT_NAME} down -v --remove-orphans
                    docker compose --project-name ${PROJECT_NAME} up -d --build
                '''
            }
        }

        stage('Run Safe Migrations') {
            steps {
                echo "⚙️ Chạy migration an toàn trực tiếp trên host..."
                dir("${BACKEND_DIR}") {
                    sh '''
                        # Load .env
                        export $(grep -v '^#' .env | xargs)

                        # Kiểm tra DB
                        TABLE_COUNT=$(docker exec chat-mysql sh -c "mysql -u$DB_USERNAME -p$DB_PASSWORD -D$DB_NAME -se 'SHOW TABLES;' | wc -l")
                        
                        if [ "$TABLE_COUNT" -eq 0 ]; then
                            echo "📄 DB trống → chạy tất cả migration..."
                            npx ts-node -r tsconfig-paths/register ./src/data-source.ts migration:run
                        else
                            echo "✅ DB đã có bảng → chạy migration chưa chạy..."
                            npx ts-node -r tsconfig-paths/register ./src/data-source.ts migration:run
                        fi
                    '''
                }
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
                docker compose --project-name ${PROJECT_NAME} down
            '''
        }
    }
}
