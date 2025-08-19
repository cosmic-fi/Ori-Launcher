// Modern skin service with clean architecture
class SkinService {
    constructor() {
        this.baseUrl = 'https://starlightskins.lunareclipse.studio/render';
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Generate all possible skin URLs for a username
    generateSkinUrls(username) {
        const renders = {
            pixel: {
                full: `${this.baseUrl}/pixel/${username}/full`,
                bust: `${this.baseUrl}/pixel/${username}/bust`,
                face: `${this.baseUrl}/pixel/${username}/face`
            },
            default: {
                full: `${this.baseUrl}/default/${username}/full`,
                bust: `${this.baseUrl}/default/${username}/bust`,
                face: `${this.baseUrl}/default/${username}/face`
            },
            walking: {
                full: `${this.baseUrl}/walking/${username}/full`,
                bust: `${this.baseUrl}/walking/${username}/bust`,
                face: `${this.baseUrl}/walking/${username}/face`
            },
            archer: {
                full: `${this.baseUrl}/archer/${username}/full`,
                bust: `${this.baseUrl}/archer/${username}/bust`,
                face: `${this.baseUrl}/archer/${username}/face`
            },
            reading: {
                full: `${this.baseUrl}/reading/${username}/full`,
                bust: `${this.baseUrl}/reading/${username}/bust`,
                face: `${this.baseUrl}/reading/${username}/face`
            },
            dungeons: {
                full: `${this.baseUrl}/dungeons/${username}/full`,
                bust: `${this.baseUrl}/dungeons/${username}/bust`,
                face: `${this.baseUrl}/dungeons/${username}/face`
            },
            crossed:{
                full: `${this.baseUrl}/crossed/${username}/full`,
                bust: `${this.baseUrl}/crossed/${username}/bust`,
                face: `${this.baseUrl}/crossed/${username}/face`
            },
            lunging: {
                full: `${this.baseUrl}/lunging/${username}/full`,
                bust: `${this.baseUrl}/lunging/${username}/bust`,
                face: `${this.baseUrl}/lunging/${username}/face`
            },
            crouching: {
                full: `${this.baseUrl}/crouching/${username}/full`,
                bust: `${this.baseUrl}/crouching/${username}/bust`,
                face: `${this.baseUrl}/crouching/${username}/face`
            },
            isometric: {
                full: `${this.baseUrl}/isometric/${username}/full`,
                bust: `${this.baseUrl}/isometric/${username}/bust`,
                face: `${this.baseUrl}/isometric/${username}/face`
            },
            ultimate: {
                full: `${this.baseUrl}/ultimate/${username}/full`,
                bust: `${this.baseUrl}/ultimate/${username}/bust`,
                face: `${this.baseUrl}/ultimate/${username}/face`
            },
            pointing: {
                full: `${this.baseUrl}/pointing/${username}/full`,
                bust: `${this.baseUrl}/pointing/${username}/bust`,
                face: `${this.baseUrl}/pointing/${username}/face`
            },
            skin: {
                default: `${this.baseUrl}/skin/${username}/default`,
                processed: `${this.baseUrl}/skin/${username}/processed`,
                barebone: `${this.baseUrl}/skin/${username}/barebones`
            }
        };
        return renders;
    }

    // Validate if a skin URL is accessible
    async validateSkinUrl(url, timeout = 5000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, { 
                method: 'HEAD', 
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Get skin data for a user with smart fallbacks
    async getSkinData(username) {
        // Check cache first
        const cacheKey = username.toLowerCase();
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            // Generate URLs for the username
            const urls = this.generateSkinUrls(username);
            
            // Validate critical URLs (face and rawSkin)
            const [faceValid, rawSkinValid] = await Promise.all([
                this.validateSkinUrl(urls.face),
                this.validateSkinUrl(urls.rawSkin)
            ]);

            // If user has valid skin, return their URLs
            if (faceValid || rawSkinValid) {
                const skinData = {
                    username,
                    hasCustomSkin: true,
                    urls,
                    timestamp: Date.now()
                };
                
                this.cache.set(cacheKey, { data: skinData, timestamp: Date.now() });
                return skinData;
            }

            // Fallback to Steve
            return this.getSteveSkinData();
            
        } catch (error) {
            console.error(`Error fetching skin data for ${username}:`, error);
            return this.getSteveSkinData();
        }
    }

    // Get default Steve skin data
    getSteveSkinData() {
        const steveUrls = this.generateSkinUrls('MHF_Steve');
        return {
            username: 'MHF_Steve',
            hasCustomSkin: false,
            urls: steveUrls,
            timestamp: Date.now()
        };
    }

    // Get specific render URL with fallback
    getSkinUrl(skinData, renderType = 'default') {
        if (!skinData || !skinData.urls) {
            return this.generateSkinUrls('MHF_Steve')[renderType] || this.generateSkinUrls('MHF_Steve').default;
        }
        
        return skinData.urls[renderType] || skinData.urls.default;
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Clear expired cache entries
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }
}

// Export singleton instance
export const skinService = new SkinService();