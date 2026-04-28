---
name: "docker"
description: "Docker container MCP server. Invoke when user needs to build images, run containers, or manage Docker deployments."
---

# Docker MCP Server

Docker container management skill for M-A System enterprise management platform.

## Configuration

```json
{
  "docker": {
    "command": "npx",
    "args": ["-y", "docker-mcp@latest"],
    "disabled": true
  }
}
```

**Note**: Requires Docker Desktop to be installed. Set `disabled: false` after installing Docker.

## Docker Commands

### Container Operations
```bash
docker ps                  # List running containers
docker ps -a             # List all containers
docker run -d nginx       # Run container in detached mode
docker run -p 8080:80 nginx  # Port mapping
docker stop <id>          # Stop container
docker start <id>         # Start container
docker restart <id>       # Restart container
docker rm <id>            # Remove container
```

### Image Operations
```bash
docker images             # List local images
docker pull nginx:latest   # Pull image
docker rmi <image>        # Remove image
docker build -t app:v1 .   # Build image from Dockerfile
docker tag app:v1 app:v2   # Tag image
docker push user/app:v1   # Push to registry
```

### Docker Compose
```bash
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose ps          # List services
docker-compose logs -f     # Follow logs
docker-compose build       # Build images
```

## ma-system Dockerfile Example

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3005
CMD ["node", "server.js"]
```

## Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3005:3005"
    environment:
      - DB_SERVER=host.docker.internal
    depends_on:
      - mssql
  mssql:
    image: mssql-server
    environment:
      SA_PASSWORD: M-A_SYSTEM_2026
      ACCEPT_EULA: Y
```

## Usage

Invoke this skill when:
- User needs to build Docker images
- User wants to run containers
- User needs Docker Compose setup
- User asks for container management