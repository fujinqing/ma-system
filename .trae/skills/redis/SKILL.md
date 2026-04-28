---
name: "redis"
description: "Redis MCP server for caching and session management. Invoke when user needs cache operations, distributed locks, or real-time data management."
---

# Redis MCP Server

Redis caching and session management skill for M-A System enterprise management platform.

## Configuration

```json
{
  "redis": {
    "command": "npx",
    "args": ["-y", "redis-mcp@latest"],
    "env": {
      "REDIS_HOST": "localhost",
      "REDIS_PORT": "6379"
    }
  }
}
```

## Redis Data Types

### Strings
```bash
SET key value           # Set string
GET key                 # Get string
INCR counter           # Increment
DECR counter           # Decrement
APPEND key suffix       # Append
```

### Hashes
```bash
HSET user:1 name "John" email "john@example.com"  # Set hash
HGET user:1 name          # Get field
HGETALL user:1            # Get all fields
HDEL user:1 email         # Delete field
HINCRBY user:1 age 1      # Increment field
```

### Lists
```bash
LPUSH queue "task1"       # Push to left
RPUSH queue "task2"       # Push to right
LPOP queue                # Pop from left
RPOP queue                # Pop from right
LRANGE queue 0 -1         # Get all
```

### Sets
```bash
SADD tags "vue" "react"    # Add members
SMEMBERS tags             # Get all members
SISMEMBER tags "vue"      # Check membership
SREM tags "react"         # Remove member
```

### Sorted Sets
```bash
ZADD leaderboard 100 "player1"  # Add with score
ZINCRBY leaderboard 50 "player1"  # Increment score
ZREVRANGE leaderboard 0 9       # Top 10
```

## Common Use Cases

### Cache
```javascript
// Set cache with expiry
await client.set('user:1', JSON.stringify(user), 'EX', 3600);
// Get cache
const data = await client.get('user:1');
```

### Session Store
```javascript
// Store session
await client.hset('session:123', { userId: 1, role: 'admin' });
await client.expire('session:123', 86400);
// Get session
const session = await client.hgetall('session:123');
```

### Distributed Lock
```javascript
const lock = await client.set('lock:resource', '1', 'NX', 'EX', 30);
if (lock) {
  // Critical section
  await client.del('lock:resource');
}
```

### Rate Limiter
```javascript
const key = `rate:${ip}`;
const count = await client.incr(key);
if (count === 1) await client.expire(key, 60);
if (count > 100) return 'Too many requests';
```

## Usage

Invoke this skill when:
- User needs caching implementation
- User wants distributed locks
- User needs session management
- User asks for real-time data operations