/**
 * 卡片工具函数
 * 提供卡片相关的常量和工具函数
 */

// 卡片花色
export const CARD_TYPES = ["♥", "♠", "♦", "♣"];

// 卡片点数
export const CARD_POINTS = ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "JOKER"];

/**
 * 计算卡片占位符文本
 * @param {number|string} cardId - 卡片ID
 * @param {string[]} types - 卡片花色数组
 * @param {Array<string|number>} points - 卡片点数数组
 * @returns {string} 卡片占位符文本
 */
export function getCardPlaceholderText(cardId, types = CARD_TYPES, points = CARD_POINTS) {
  if (typeof cardId === 'number') {
    const suit = cardId < 52 ? types[cardId % 4] : "";
    const point = points[cardId >> 2];
    return `${suit}${point}`;
  }
  return '';
}

/**
 * 获取卡片图像URL
 * @param {number|string} cardId - 卡片ID
 * @returns {string} 卡片图像URL
 */
export function getCardImageSrc(cardId) {
  return `./static/${cardId}.webp`;
}

/**
 * 导出默认对象，方便一次性导入
 */
export default {
  CARD_TYPES,
  CARD_POINTS,
  getCardPlaceholderText,
  getCardImageSrc
};