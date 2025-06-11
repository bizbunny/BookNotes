//functions as middleware
//use this for frequently accessed data. Save space and optimize performiance.
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); //content will be cached for 1 hour before revalidating (expiring)

class CacheService {
    static async getOrSet(key, fetchFn, ttl) {
        const cached = cache.get(key);
        if (cached) return cached;
        
        const data = await fetchFn();
        cache.set(key, data, ttl);
        return data;
    }
}

module.exports = CacheService;