#!/bin/bash

# WrtnLabs Unified Deployment Script
# ==================================
# One-command deployment for the complete system

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_banner() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "  WrtnLabs Unified Deployment System"
    echo "  Complete Stack: AutoBE + Backend + AI Services"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# Check if Docker is running
check_docker() {
    print_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env() {
    print_info "Checking environment configuration..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before proceeding."
        print_info "Especially set: ZAI_API_KEY, POSTGRES_PASSWORD, JWT_SECRET"
        exit 1
    fi
    print_success "Environment configuration found"
}

# Deploy the system
deploy() {
    print_banner
    
    check_docker
    check_env
    
    print_info "Starting deployment..."
    
    # Pull latest images
    print_info "Pulling Docker images..."
    docker compose pull
    
    # Build services
    print_info "Building services..."
    docker compose build --parallel
    
    # Start services
    print_info "Starting services..."
    docker compose up -d
    
    # Wait for services to be healthy
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    print_info "Checking service health..."
    
    services=("postgres" "redis" "chromadb" "backend" "autobe" "agentica" "vector-store" "connectors" "autoview" "nginx")
    
    for service in "${services[@]}"; do
        if docker compose ps | grep "$service" | grep -q "Up"; then
            print_success "$service is running"
        else
            print_warning "$service may not be healthy"
        fi
    done
    
    echo ""
    print_success "Deployment complete!"
    echo ""
    print_info "Service URLs:"
    echo "  • API Gateway:     http://localhost"
    echo "  • Backend API:     http://localhost/api"
    echo "  • AutoBE Agent:    http://localhost/autobe"
    echo "  • AutoView UI:     http://localhost:3005"
    echo "  • PostgreSQL:      localhost:5432"
    echo "  • Redis:           localhost:6379"
    echo "  • ChromaDB:        localhost:8000"
    echo ""
    print_info "Check logs: docker compose logs -f [service-name]"
    print_info "Stop system: docker compose down"
    print_info "Full reset:  docker compose down -v"
}

# Stop the system
stop() {
    print_info "Stopping all services..."
    docker compose down
    print_success "All services stopped"
}

# View logs
logs() {
    if [ -z "$1" ]; then
        print_info "Showing logs for all services..."
        docker compose logs -f
    else
        print_info "Showing logs for $1..."
        docker compose logs -f "$1"
    fi
}

# Show service status
status() {
    print_info "Service Status:"
    docker compose ps
}

# Restart specific service or all
restart() {
    if [ -z "$1" ]; then
        print_info "Restarting all services..."
        docker compose restart
    else
        print_info "Restarting $1..."
        docker compose restart "$1"
    fi
    print_success "Restart complete"
}

# Health check
healthcheck() {
    print_info "Running health checks..."
    
    endpoints=(
        "http://localhost/health:API Gateway"
        "http://localhost:3000/health:Backend"
        "http://localhost:3001/health:AutoBE"
        "http://localhost:3002/health:Agentica"
        "http://localhost:3003/health:Vector Store"
        "http://localhost:3004/health:Connectors"
        "http://localhost:3005/health:AutoView"
    )
    
    for endpoint in "${endpoints[@]}"; do
        url="${endpoint%%:*}"
        name="${endpoint##*:}"
        
        if curl -sf "$url" > /dev/null 2>&1; then
            print_success "$name is healthy"
        else
            print_error "$name is unhealthy"
        fi
    done
}

# Main command router
case "$1" in
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    restart)
        restart "$2"
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    health)
        healthcheck
        ;;
    *)
        echo "WrtnLabs Deployment Script"
        echo ""
        echo "Usage: $0 {deploy|stop|restart|logs|status|health}"
        echo ""
        echo "Commands:"
        echo "  deploy          - Deploy the complete system"
        echo "  stop            - Stop all services"
        echo "  restart [name]  - Restart all services or specific service"
        echo "  logs [name]     - View logs (all or specific service)"
        echo "  status          - Show service status"
        echo "  health          - Run health checks"
        echo ""
        echo "Examples:"
        echo "  $0 deploy                 # Deploy everything"
        echo "  $0 logs backend           # View backend logs"
        echo "  $0 restart autobe         # Restart AutoBE service"
        exit 1
        ;;
esac

