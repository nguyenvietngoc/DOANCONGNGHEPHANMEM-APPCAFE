import { ref, onValue, get } from 'firebase/database';
import { db } from '../../../config/firebase';

const TIMEOUT = 30000; // 30 seconds timeout

// Hàm bọc promise với timeout
const withTimeout = (promise, timeout) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

export const menuService = {
  /**
   * Lấy danh sách tất cả các món
   * @returns {Promise<Array>} Mảng chứa thông tin các món
   */
  getAllItems: async () => {
    try {
      const menuRef = ref(db, 'mon');
      const snapshot = await withTimeout(get(menuRef), TIMEOUT);

      if (snapshot.exists()) {
        const items = [];
        // Chuyển đổi dữ liệu từ snapshot sang mảng
        snapshot.forEach((child) => {
          // Chỉ lấy các món còn hàng
          if (child.val().trangThai === 'ConHang') {
            items.push({ id: child.key, ...child.val() });
          }
        });
        // Sắp xếp theo tên món
        return items.sort((a, b) => a.tenMon.localeCompare(b.tenMon));
      }
      return [];
    } catch (error) {
      console.error('Get menu items error:', error);
      throw error;
    }
  },

  /**
   * Lắng nghe sự thay đổi của danh sách món
   * @param {Function} callback Hàm được gọi khi có thay đổi
   * @returns {Function} Hàm hủy đăng ký lắng nghe
   */
  subscribeToMenu: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const menuRef = ref(db, 'mon');
    return onValue(menuRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((child) => {
          // Chỉ lấy các món còn hàng
          if (child.val().trangThai === 'ConHang') {
            items.push({ id: child.key, ...child.val() });
          }
        });
        callback(items.sort((a, b) => a.tenMon.localeCompare(b.tenMon)));
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error subscribing to menu:', error);
      callback([]);
    });
  },

  /**
   * Lấy thông tin chi tiết của một món
   * @param {string} itemId ID của món
   * @returns {Promise<Object>} Thông tin món
   */
  getItemById: async (itemId) => {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }

      const itemRef = ref(db, `mon/${itemId}`);
      const snapshot = await withTimeout(get(itemRef), TIMEOUT);

      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Get item error:', error);
      throw error;
    }
  }
};