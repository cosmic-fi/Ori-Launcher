import axios from 'axios';

export const baseURL = 'https://api.cosmicfi.online/api'; 
/**
 * Fetch all Minecraft servers.
 * @returns {Promise<Array>} Array of server objects, or [] on error.
 */
export async function fetchPlayerCounts() {
  try {
    const response = await axios.get(`${baseURL}/players-hype`); // ← changed
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    // @ts-ignore
    return { totalOnlinePlayers: 0 };
  }
}

/**
 * Fetch all posts from the RSS feed (rss.json).
 * @returns {Promise<Object>} The RSS feed object, or {} on error.
 */
export async function fetchNews() {
  const res = await fetch(`${baseURL}/news`);
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  return await res.json();
}

export async function fetchFaceAndSkin(username) {
  // Face: 512px, Skin: full PNG, Burst: bust image
  const faceUrl = `https://minotar.net/avatar/${username}.png`;
  const skinUrl = `https://minotar.net/skin/${username}.png`;
  const burstUrl = `https://minotar.net/bust/${username}/600.png`;

  return {
    face: faceUrl,
    skin: skinUrl,
    burst: burstUrl
  };
}