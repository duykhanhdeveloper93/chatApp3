#!/bin/bash

# Stop script for Chat App
echo "🛑 Stopping Chat Application..."

# Stop and remove containers
docker-compose down

echo "✅ Chat Application stopped!"
echo ""
echo "💡 To remove all data: docker-compose down -v"
echo "🧹 To clean up images: docker system prune"
