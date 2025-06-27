# CI/CD Deployment Plan: GitHub → Zeabur

## Overview

This document outlines the CI/CD setup for deploying the NestJS CRM backend from GitHub to Zeabur. The plan includes automated testing, code quality checks, and seamless deployment to production.

## Architecture Overview

```
GitHub Repository
    ↓ (Push/PR)
GitHub Actions CI/CD Pipeline
    ↓ (Tests, Lint, Build)
Zeabur Deployment
    ↓ (Auto-deploy on main branch)
Production Environment
```

## Implementation Phases

### Phase 1: Repository and Environment Setup

#### 1.1 Update main.ts for Production Deployment
- **Current Issue**: Application hardcoded to port 3000
- **Solution**: Configure dynamic port binding for Zeabur deployment
- **Changes needed**:
  ```typescript
  const port = process.env.PORT || 3000;
  await app.listen(port);
  ```
- **Additional**: Add graceful shutdown handling

#### 1.2 Environment Configuration
- **Install dependency**: `@nestjs/config` for environment management
- **Create ConfigModule**: Set up centralized configuration
- **Environment variables needed**:
  - `PORT` - Application port (provided by Zeabur)
  - `MYSQL_HOST` - MySQL host
  - `MYSQL_PORT` - MySQL port
  - `MYSQL_USERNAME` - Database username
  - `MYSQL_PASSWORD` - Database password
  - `MYSQL_NAME` - Database name
  - `JWT_SECRET` - JWT signing secret
  - `JWT_EXPIRES_IN` - Token expiration time
- **Create `.env.example`**: Template for required environment variables

#### 1.3 Package.json Enhancements
- **Production build optimization**: Ensure proper build configuration
- **Health check script**: Add endpoint for monitoring
- **Dependencies audit**: Verify all production dependencies are listed

### Phase 2: GitHub Actions CI/CD Pipeline

#### 2.1 Continuous Integration Workflow
**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to any branch
- Pull requests to main branch

**Jobs**:
1. **Code Quality**:
   - ESLint with auto-fix
   - Prettier formatting check
   - TypeScript compilation check

2. **Testing**:
   - Unit tests with Jest
   - Integration tests (when implemented)
   - Test coverage reporting

3. **Build Verification**:
   - Production build test
   - Build artifact validation

#### 2.2 Continuous Deployment Workflow
**File**: `.github/workflows/cd.yml`

**Triggers**:
- Push to main branch (after CI passes)

**Jobs**:
1. **Pre-deployment**:
   - Environment validation
   - Security checks
   - Dependency vulnerability scan

2. **Deployment**:
   - Zeabur handles automatic deployment via GitHub integration
   - Post-deployment health checks

### Phase 3: Zeabur Deployment Configuration

#### 3.1 Zeabur Service Setup
**Prerequisites**:
- Zeabur account linked to GitHub
- Zeabur GitHub App installed on repository

**Setup Steps**:
1. Create new project in Zeabur dashboard
2. Select "Deploy from GitHub"
3. Choose repository and branch (main)
4. Configure automatic deployment trigger

#### 3.2 Environment Variables Configuration
**In Zeabur Dashboard**:
- Navigate to Service → Environment Variables
- Add all required environment variables
- Configure secrets securely (database credentials, JWT secret)

#### 3.3 Production Configurations
- **Domain**: Configure custom domain or use provided `.zeabur.app` domain
- **Health Checks**: Set up application health monitoring
- **Resource Limits**: Configure CPU/memory limits based on needs
- **Scaling**: Configure auto-scaling if needed

### Phase 4: Monitoring and Documentation

#### 4.1 Health Check Implementation
**Endpoint**: `GET /health`
- **Purpose**: Application health monitoring
- **Response**: JSON with application status, database connectivity, version
- **Implementation**: Create dedicated health controller

#### 4.2 Logging Configuration
- **Structured logging**: Implement consistent log format
- **Log levels**: Configure appropriate log levels for production
- **Error tracking**: Implement error logging and monitoring

#### 4.3 Documentation Updates
- **README.md**: Add deployment instructions and environment setup
- **Environment variables**: Document all required configuration
- **Troubleshooting**: Common deployment issues and solutions

## Deployment Workflow

### Development Workflow
1. Developer creates feature branch
2. Implements changes and commits
3. Creates pull request to main
4. GitHub Actions runs CI pipeline:
   - Code quality checks
   - Unit tests
   - Build verification
5. Code review and approval
6. Merge to main branch

### Production Deployment
1. Code merged to main branch
2. GitHub Actions runs full CI pipeline
3. Zeabur automatically detects changes
4. Zeabur builds and deploys application
5. Health checks verify deployment success
6. Application available at production URL

## Security Considerations

### Environment Variables
- **Never commit secrets**: Use `.env.example` for documentation only
- **Zeabur secrets**: Store sensitive data in Zeabur environment variables
- **JWT security**: Use strong, randomly generated JWT secret

### Database Security
- **Connection security**: Use SSL/TLS for database connections
- **Credentials**: Store database credentials securely in Zeabur
- **Network security**: Configure appropriate firewall rules

### API Security
- **CORS configuration**: Properly configure allowed origins
- **Rate limiting**: Implement API rate limiting (future enhancement)
- **Input validation**: Ensure all inputs are validated

## Monitoring and Alerting

### Application Monitoring
- **Health endpoint**: Regular health checks
- **Error tracking**: Monitor application errors
- **Performance metrics**: Track response times and resource usage

### Deployment Monitoring
- **Build status**: Monitor CI/CD pipeline success rates
- **Deployment notifications**: Set up alerts for deployment failures
- **Rollback procedures**: Document rollback process for failed deployments

## Files to be Created/Modified

### New Files
- `.github/workflows/ci.yml` - Continuous Integration workflow
- `.github/workflows/cd.yml` - Continuous Deployment workflow
- `.env.example` - Environment variables template
- `src/health/health.controller.ts` - Health check endpoint
- `src/health/health.module.ts` - Health module
- `src/config/database.config.ts` - Database configuration
- `src/config/app.config.ts` - Application configuration

### Modified Files
- `src/main.ts` - Update port configuration and add graceful shutdown
- `src/app.module.ts` - Add ConfigModule and HealthModule
- `package.json` - Add health check scripts if needed
- `README.md` - Add deployment documentation

## Environment Variables Template

```bash
# Application Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USERNAME=your_username
MYSQL_PASSWORD=your_password
MYSQL_NAME=crm_database

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# API Configuration
API_PREFIX=api/v1
CORS_ORIGIN=https://your-frontend-domain.com
```

## Success Criteria

### CI/CD Pipeline
- ✅ All commits trigger appropriate CI checks
- ✅ Failed tests prevent deployment
- ✅ Code quality standards enforced
- ✅ Automatic deployment on main branch

### Production Deployment
- ✅ Application accessible via HTTPS
- ✅ Health checks pass consistently
- ✅ Environment variables configured securely
- ✅ Database connectivity verified

### Monitoring
- ✅ Health endpoint responds correctly
- ✅ Error logging functional
- ✅ Deployment notifications working
- ✅ Performance metrics available

## Next Steps

1. **Immediate**: Update main.ts for dynamic port configuration
2. **Phase 1**: Set up environment configuration and ConfigModule
3. **Phase 2**: Create GitHub Actions workflows
4. **Phase 3**: Configure Zeabur deployment
5. **Phase 4**: Implement monitoring and documentation

## Troubleshooting Guide

### Common Issues
- **Port binding errors**: Ensure `process.env.PORT` is used
- **Database connection failures**: Verify environment variables
- **Build failures**: Check dependency versions and TypeScript errors
- **Deployment timeouts**: Verify health check endpoint

### Debugging Steps
1. Check Zeabur deployment logs
2. Verify environment variables in Zeabur dashboard
3. Test health endpoint manually
4. Review GitHub Actions workflow logs
5. Validate database connectivity

## Timeline Estimate

- **Phase 1 (Setup)**: 1-2 hours
- **Phase 2 (CI/CD)**: 2-3 hours
- **Phase 3 (Deployment)**: 1-2 hours
- **Phase 4 (Monitoring)**: 1-2 hours

**Total Estimated Time**: 5-9 hours for complete CI/CD setup