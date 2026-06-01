import axios from 'axios';

/**
 * Fetches an anime gif/image URL from waifu.pics or waifu.im.
 * @param {string} action - The action/tag to fetch (e.g., "kiss", "slap", "hentai", etc.)
 * @param {boolean} isNsfw - True if it should query the NSFW API (waifu.im)
 * @returns {Promise<string|null>} The image URL or null if failed.
 */
export async function fetchAnimeGif(action, isNsfw = false) {
  try {
    if (isNsfw) {
      // Waifu.im search endpoint for NSFW tags
      const response = await axios.get(`https://api.waifu.im/search/?included_tags=${action}&is_nsfw=true`);
      if (response.status === 200 && response.data.images && response.data.images.length > 0) {
        return response.data.images[0].url;
      }
    } else {
      // Waifu.pics SFW endpoint
      const response = await axios.get(`https://api.waifu.pics/sfw/${action}`);
      if (response.status === 200 && response.data.url) {
        return response.data.url;
      }
    }
  } catch (error) {
    console.error(`Error fetching anime image for action '${action}' (NSFW: ${isNsfw}):`, error.message);
  }
  return null;
}
