import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Loads tokens from token.txt or tokens.txt files in the root folder.
 * @param {string} rootPath - The root path of the project.
 * @returns {string[]} An array of token strings.
 */
export function loadTokens(rootPath = '.') {
  const fileNames = ['token.txt', 'tokens.txt'];
  for (const fileName of fileNames) {
    const filePath = path.join(rootPath, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
  }
  return [];
}

/**
 * Validates a single Discord User Token by making an HTTP request to Discord API.
 * @param {string} token 
 * @returns {Promise<{valid: boolean, username?: string, id?: string, error?: string}>}
 */
export async function validateToken(token) {
  try {
    const response = await axios.get('https://discord.com/api/v9/users/@me', {
      headers: {
        'Authorization': token.trim(),
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      const user = response.data;
      const discrim = user.discriminator && user.discriminator !== '0' ? `#${user.discriminator}` : '';
      return {
        valid: true,
        username: `${user.username}${discrim}`,
        id: user.id
      };
    }
  } catch (error) {
    const statusText = error.response ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message;
    return { valid: false, error: statusText };
  }
  return { valid: false, error: 'Unknown response status' };
}

/**
 * Sends a message to a Discord channel using a secondary token.
 * @param {string} token 
 * @param {string} channelId 
 * @param {string} content 
 * @returns {Promise<boolean>}
 */
export async function sendTokenMessage(token, channelId, content) {
  try {
    const response = await axios.post(
      `https://discord.com/api/v9/channels/${channelId}/messages`,
      { content },
      {
        headers: {
          'Authorization': token.trim(),
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    return response.status === 200 || response.status === 201;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data.retry_after || 1;
      await new Promise(r => setTimeout(r, (retryAfter + 0.1) * 1000));
      return sendTokenMessage(token, channelId, content); // Retry after delay
    }
    console.error(`Error sending message with token ${token.slice(-4)}:`, error.message);
    return false;
  }
}

/**
 * Adds a reaction to a message using a secondary token.
 * @param {string} token 
 * @param {string} channelId 
 * @param {string} messageId 
 * @param {string} emoji - Unicode emoji (URL encoded)
 * @returns {Promise<boolean>}
 */
export async function addTokenReaction(token, channelId, messageId, emoji) {
  try {
    const encodedEmoji = encodeURIComponent(emoji);
    const response = await axios.put(
      `https://discord.com/api/v9/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`,
      {},
      {
        headers: {
          'Authorization': token.trim(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );
    return response.status === 204;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data.retry_after || 1;
      await new Promise(r => setTimeout(r, (retryAfter + 0.1) * 1000));
      return addTokenReaction(token, channelId, messageId, emoji); // Retry
    }
    console.error(`Error reacting with token ${token.slice(-4)}:`, error.message);
    return false;
  }
}
