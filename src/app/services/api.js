// @ts-nocheck
import axios from 'axios';
import { apiBase, starlightBaseURL } from '../utils/helper';

export const baseURL = apiBase;
export const fabricMetaURL = 'https://meta.fabricmc.net/v1/versions';

const starlightBaseUrl = starlightBaseURL;

/**
 * Fetch all Minecraft servers.
 * @returns {Promise<Array>} Array of server objects, or [] on error.
 */
export async function fetchPlayerCounts() {
  try {
    const response = await axios.get(`${baseURL}/active-players`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return { totalOnlinePlayers: 0 };
  }
}

/**
 * Fetch all posts from the RSS feed (rss.json).
 * @returns {Promise<Object>} The RSS feed object, or {} on error.
 */
export async function fetchNews() {
  const res = await fetch(`${baseURL}/news`, {
    headers: {
      'User-Agent': 'OriLauncher/2.0.0 (Electron)',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    mode: 'cors'
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('[fetchNews] JSON parse failed:', err);
    return [];
  }
}


// Helper function to add delay between requests
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to validate URL accessibility
async function validateImageUrl(url, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                headers: {
                    'User-Agent': 'OriLauncher/2.0.0 (Electron)',
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache'
                },
                mode: 'cors'
            });
            if (response.ok) {
                return url;
            }
            if (response.status === 404) {
                return null; // Don't retry 404s
            }
        } catch (error) {
            if (attempt === retries) {
                console.warn(`Failed to validate image URL after ${retries + 1} attempts:`, url, error.message);
                return null;
            }
            await delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
    }
    return null;
}

// Updated fetchStarlightSkins function - returns URLs instead of base64
async function fetchStarlightSkins(username) {
    const baseUrl = starlightBaseURL;
    const skinTypes = [
        { key: 'face', path: '/face/512' },
        { key: 'rawSkin', path: '/skin' },
        { key: 'default', path: '/default/512' },
        { key: 'lunging', path: '/lunging/512' },
        { key: 'walking', path: '/walking/512' },
        { key: 'running', path: '/running/512' },
        { key: 'crouching', path: '/crouching/512' },
        { key: 'crossed', path: '/crossed/512' },
        { key: 'criss_cross', path: '/criss_cross/512' },
        { key: 'ultimate', path: '/ultimate/512' },
        { key: 'isometric', path: '/isometric/512' },
        { key: 'head', path: '/head/512' },
        { key: 'bust', path: '/bust/512' },
        { key: 'full', path: '/full/512' },
        { key: 'skin', path: '/skin/512' },
        { key: 'processed', path: '/processed/512' },
        { key: 'pixel', path: '/pixel/512' },
        { key: 'orb', path: '/orb/512' },
        { key: 'ornament', path: '/ornament/512' },
        { key: 'christmas', path: '/christmas/512' },
        { key: 'halloween', path: '/halloween/512' }
    ];

    const results = {};
    
    // Sequential downloads with delay to prevent API overload
    for (const skinType of skinTypes) {
        const url = `${baseUrl}${skinType.path}/${username}`;
        const validatedUrl = await validateImageUrl(url);
        
        if (validatedUrl) {
            results[skinType.key] = validatedUrl;
        }
        
        // Add delay between requests
        await delay(150);
    }

    return results;
}

// Updated fetchSkinDataForUser function
async function fetchSkinDataForUser(username) {
    try {
        const skinData = await fetchStarlightSkins(username);
        
        // Validate that we have critical skin data
        if (!skinData.face && !skinData.rawSkin) {
            console.warn(`No critical skin data found for ${username}`);
            return null; // This will trigger MHF_Steve fallback
        }
        
        return skinData;
    } catch (error) {
        console.error('Error fetching skin data:', error);
        return null;
    }
}

// Updated fetchFaceAndSkin function - now returns URLs
async function fetchFaceAndSkin(username, accountType = 'online') {
    console.log(`Fetching skin data for ${username} (${accountType})`);
    
    try {
        // Try Starlight Skins API for all account types
        const skinData = await fetchSkinDataForUser(username);
        
        if (skinData && (skinData.face || skinData.rawSkin)) {
            console.log(`Successfully fetched skin data for ${username}`);
            return {
                face: skinData.face || null,
                skin: skinData.rawSkin || null,
                renders: skinData // All render types
            };
        }
        
        // Fallback to MHF_Steve if no valid skin data
        console.log(`Falling back to MHF_Steve for ${username}`);
        const steveSkinData = await fetchSkinDataForUser('MHF_Steve');
        
        if (steveSkinData) {
            return {
                face: steveSkinData.face || null,
                skin: steveSkinData.rawSkin || null,
                renders: steveSkinData
            };
        }
        
        // Final hardcoded fallback URLs
        const starlightBaseUrl = starlightBaseURL;
        return {
            face: `${starlightBaseUrl}/face/512/MHF_Steve`,
            skin: `${starlightBaseUrl}/skin/MHF_Steve`,
            renders: {
                face: `${starlightBaseUrl}/face/512/MHF_Steve`,
                rawSkin: `${starlightBaseUrl}/skin/MHF_Steve`,
                default: `${starlightBaseUrl}/default/512/MHF_Steve`,
                bust: `${starlightBaseUrl}/bust/512/MHF_Steve`,
                full: `${starlightBaseUrl}/full/512/MHF_Steve`
            }
        };
        
    } catch (error) {
        console.error(`Error in fetchFaceAndSkin for ${username}:`, error);
        
        // Final hardcoded fallback URLs
        const starlightBaseUrl = 'https://starlightskins.lunareclipse.studio/render/ultimate';
        return {
            face: `${starlightBaseUrl}/face/512/MHF_Steve`,
            skin: `${starlightBaseUrl}/skin/MHF_Steve`,
            renders: {
                face: `${starlightBaseUrl}/face/512/MHF_Steve`,
                rawSkin: `${starlightBaseUrl}/skin/MHF_Steve`,
                default: `${starlightBaseUrl}/default/512/MHF_Steve`,
                bust: `${starlightBaseUrl}/bust/512/MHF_Steve`,
                full: `${starlightBaseUrl}/full/512/MHF_Steve`
            }
        };
    }
}