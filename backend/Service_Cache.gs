/**
 * Service_Cache.gs
 * Centralized Cache Management
 */

var CACHE_TTL = 21600; // 6 Hours (Max allowed) for Master Data

var Service_Cache = {
  get: function (key) {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(key);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && parsed.__chunked) {
          var fullStr = "";
          for (var i = 0; i < parsed.count; i++) {
            var chunk = cache.get(key + "_chunk_" + i);
            if (!chunk) return null; // Incomplete or expired chunk
            fullStr += chunk;
          }
          return JSON.parse(fullStr);
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Cache Get Error: " + e.toString());
    }
    return null;
  },

  put: function (key, value, expirationInSeconds) {
    try {
      var cache = CacheService.getScriptCache();
      var ttl = expirationInSeconds || 600; // Default 10 mins
      var str = JSON.stringify(value);
      var chunkLimit = 95000;

      if (str.length > chunkLimit) {
        var chunks = Math.ceil(str.length / chunkLimit);
        // Put metadata pointer
        cache.put(key, JSON.stringify({ __chunked: true, count: chunks }), ttl);
        // Put chunks
        for (var i = 0; i < chunks; i++) {
          cache.put(key + "_chunk_" + i, str.substring(i * chunkLimit, (i + 1) * chunkLimit), ttl);
        }
      } else {
        cache.put(key, str, ttl);
      }
    } catch (e) {
      console.warn("Cache Put Error: " + e.toString());
    }
  },

  remove: function (key) {
    try {
      var cache = CacheService.getScriptCache();
      var cached = cache.get(key);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object" && parsed.__chunked) {
          for (var i = 0; i < parsed.count; i++) {
            cache.remove(key + "_chunk_" + i);
          }
        }
      }
      cache.remove(key);
    } catch (e) {
      console.warn("Cache Remove Error: " + e.toString());
    }
  }
};
