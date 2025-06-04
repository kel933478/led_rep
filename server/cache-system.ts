import { createClient, RedisClientType } from 'redis';

interface CacheConfig {
  enabled: boolean;
  redisUrl?: string;
  defaultTTL: number;
  cryptoPricesTTL: number;
}

class CacheSystem {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private fallbackCache: Map<string, { data: any; expiry: number }> = new Map();

  constructor() {
    this.config = {
      enabled: process.env.REDIS_ENABLED === 'true',
      redisUrl: process.env.REDIS_URL,
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
      cryptoPricesTTL: parseInt(process.env.CACHE_CRYPTO_TTL || '60') // 1 minute
    };

    if (this.config.enabled && this.config.redisUrl) {
      this.initializeRedis();
    } else {
      console.log('Redis cache disabled, using in-memory fallback cache');
    }
  }

  private async initializeRedis() {
    try {
      this.client = createClient({
        url: this.config.redisUrl
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.client = null; // Fallback to memory cache
      });

      this.client.on('connect', () => {
        console.log('Redis cache connected successfully');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to memory cache
        const cached = this.fallbackCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }
        this.fallbackCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const finalTTL = ttl || this.config.defaultTTL;

    try {
      if (this.client) {
        await this.client.setEx(key, finalTTL, JSON.stringify(value));
      } else {
        // Fallback to memory cache
        this.fallbackCache.set(key, {
          data: value,
          expiry: Date.now() + (finalTTL * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.client) {
        await this.client.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // Fallback: clear matching keys from memory cache
        const keysToDelete = Array.from(this.fallbackCache.keys()).filter(key => 
          key.includes(pattern.replace('*', ''))
        );
        keysToDelete.forEach(key => this.fallbackCache.delete(key));
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  // Spécifique pour les prix crypto
  async getCryptoPrices(): Promise<any> {
    return this.get('crypto_prices');
  }

  async setCryptoPrices(prices: any): Promise<void> {
    await this.set('crypto_prices', prices, this.config.cryptoPricesTTL);
  }

  // Cache des données utilisateur
  async getUserData(userId: number, userType: 'client' | 'admin'): Promise<any> {
    return this.get(`user_${userType}_${userId}`);
  }

  async setUserData(userId: number, userType: 'client' | 'admin', data: any): Promise<void> {
    await this.set(`user_${userType}_${userId}`, data, 600); // 10 minutes
  }

  async invalidateUserData(userId: number, userType: 'client' | 'admin'): Promise<void> {
    await this.delete(`user_${userType}_${userId}`);
  }

  // Cache des données dashboard
  async getDashboardData(userType: 'client' | 'admin'): Promise<any> {
    return this.get(`dashboard_${userType}`);
  }

  async setDashboardData(userType: 'client' | 'admin', data: any): Promise<void> {
    await this.set(`dashboard_${userType}`, data, 180); // 3 minutes
  }

  async invalidateDashboardData(): Promise<void> {
    await this.invalidatePattern('dashboard_*');
  }

  // Statistics et métriques
  async getStats(): Promise<any> {
    if (!this.client) {
      return {
        connected: false,
        fallbackCacheSize: this.fallbackCache.size,
        type: 'memory'
      };
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        connected: true,
        type: 'redis',
        memoryUsage: this.parseMemoryInfo(info),
        keyspace: this.parseKeyspaceInfo(keyspace)
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        type: 'redis'
      };
    }
  }

  private parseMemoryInfo(info: string): any {
    const lines = info.split('\r\n');
    const memoryInfo: any = {};
    
    lines.forEach(line => {
      if (line.includes('used_memory_human')) {
        memoryInfo.usedMemory = line.split(':')[1];
      }
      if (line.includes('used_memory_peak_human')) {
        memoryInfo.peakMemory = line.split(':')[1];
      }
    });
    
    return memoryInfo;
  }

  private parseKeyspaceInfo(info: string): any {
    const lines = info.split('\r\n');
    const keyspaceInfo: any = {};
    
    lines.forEach(line => {
      if (line.startsWith('db0:')) {
        const parts = line.split(':')[1].split(',');
        keyspaceInfo.keys = parts[0].split('=')[1];
        keyspaceInfo.expires = parts[1].split('=')[1];
      }
    });
    
    return keyspaceInfo;
  }

  // Nettoyage mémoire périodique pour le cache fallback
  startCleanupInterval() {
    setInterval(() => {
      if (!this.client) {
        const now = Date.now();
        for (const [key, cached] of this.fallbackCache.entries()) {
          if (cached.expiry <= now) {
            this.fallbackCache.delete(key);
          }
        }
      }
    }, 60000); // Nettoyage toutes les minutes
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    this.fallbackCache.clear();
  }
}

export const cacheSystem = new CacheSystem();

// Middleware de cache pour Express
export function cacheMiddleware(ttl: number = 300) {
  return async (req: any, res: any, next: any) => {
    const key = `cache_${req.method}_${req.originalUrl}`;
    
    try {
      const cached = await cacheSystem.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheSystem.set(key, data, ttl);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}