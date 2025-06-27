# Docker Deployment Guide for CRM Backend

## Overview

This guide covers deploying the NestJS CRM backend using Docker, both locally and on Zeabur platform.

## Files Created

- **Dockerfile**: Multi-stage build for optimized production image
- **docker-compose.yml**: Complete stack with MySQL and phpMyAdmin
- **.dockerignore**: Excludes unnecessary files from build context
- **zeabur.json**: Zeabur platform configuration
- **scripts/init.sql**: MySQL initialization script

## Local Docker Development

### Option 1: Docker Compose (Recommended)

Run the complete stack including MySQL database:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f crm-backend

# Stop services
docker-compose down

# Clean up volumes (removes database data)
docker-compose down -v
```

**Services Available:**
- **CRM Backend**: http://localhost:3000
- **MySQL Database**: localhost:3306
- **phpMyAdmin**: http://localhost:8080

### Option 2: Docker Build Only

Build and run just the NestJS application:

```bash
# Build the image
docker build -t crm-backend .

# Run with external database
docker run -p 3000:3000 \
  -e DB_HOST=your_mysql_host \
  -e DB_USERNAME=your_username \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=simple_crm \
  -e JWT_SECRET=your_jwt_secret \
  crm-backend
```

## Zeabur Deployment

### Method 1: Automatic Detection

1. Push your code to GitHub
2. Connect repository to Zeabur
3. Zeabur will automatically detect the NestJS framework
4. Set environment variables in Zeabur dashboard

### Method 2: Using Dockerfile

1. Zeabur will use the provided `Dockerfile` for build
2. The `zeabur.json` file provides additional configuration
3. Deployment will be optimized with multi-stage build

### Required Environment Variables on Zeabur

Set these in your Zeabur service configuration:

```bash
NODE_ENV=production
PORT=3000

# Database (use Zeabur MySQL service)
DB_HOST=your_zeabur_mysql_host
DB_PORT=3306
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=simple_crm

# JWT Configuration
JWT_SECRET=your_production_jwt_secret_here
JWT_EXPIRES_IN=24h

# Optional
CORS_ORIGIN=https://your-frontend-domain.com
```

## Docker Image Features

### Multi-Stage Build
- **Builder stage**: Installs dependencies and builds application
- **Production stage**: Only includes built app and production dependencies
- **Size optimization**: Excludes dev dependencies and source code

### Security Features
- **Non-root user**: Runs as `nestjs` user (uid 1001)
- **Minimal base**: Uses Alpine Linux for smaller attack surface
- **Health checks**: Built-in health monitoring

### Performance Features
- **Layer caching**: Optimized layer order for faster rebuilds
- **Clean npm cache**: Reduces image size
- **Production dependencies only**: Excludes dev tools

## Health Checks

The Docker image includes built-in health checks:

```bash
# Check container health
docker ps

# Manual health check
curl http://localhost:3000/api/v1/health/live
```

Health check endpoints:
- `/api/v1/health/live` - Basic liveness probe
- `/api/v1/health/ready` - Readiness probe (includes DB check)
- `/api/v1/health` - Full health status

## Database Initialization

The application automatically handles database setup:

1. **Connection**: Connects to MySQL on startup
2. **Migrations**: Runs SQL migrations from `src/database/migrations/`
3. **Seeding**: Creates default admin user if none exists
4. **Error Handling**: Continues startup even if DB is temporarily unavailable

## Troubleshooting

### Build Issues

```bash
# Check build logs
docker-compose logs crm-backend

# Rebuild without cache
docker-compose build --no-cache crm-backend
```

### Database Connection Issues

```bash
# Check MySQL container
docker-compose logs mysql

# Verify database connectivity
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Check network connectivity
docker-compose exec crm-backend ping mysql
```

### Environment Variable Issues

```bash
# Check environment variables in container
docker-compose exec crm-backend env | grep DB_

# Verify configuration
docker-compose exec crm-backend node -e "console.log(process.env.DB_HOST)"
```

## Production Considerations

### Security
- Change default JWT secret
- Use strong database passwords
- Enable SSL/TLS for database connections
- Regularly update base images

### Monitoring
- Set up log aggregation
- Monitor health check endpoints
- Configure alerts for failures
- Track resource usage

### Scaling
- Use read replicas for database
- Implement horizontal pod autoscaling
- Configure load balancing
- Set up database connection pooling

## Migration from Existing Setup

If you have an existing MySQL container named "SimpleCRM":

```bash
# Stop existing container
docker stop SimpleCRM

# Use existing database with docker-compose
# Update docker-compose.yml container_name if needed
docker-compose up -d
```

The application will automatically detect existing tables and only run new migrations.