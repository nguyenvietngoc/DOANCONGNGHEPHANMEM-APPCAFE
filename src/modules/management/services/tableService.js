// Import các hàm cần thiết từ firebase/database
import { ref, get, set, update, remove, onValue } from 'firebase/database';
// Import đối tượng database đã được khởi tạo
import { db } from '../../../config/firebase';

// Thời gian chờ tối đa cho mỗi request là 30 giây
const TIMEOUT = 30000; // 30 seconds timeout

/**
 * Hàm bọc promise với timeout
 * @param {Promise} promise Promise cần thêm timeout
 * @param {number} timeout Thời gian timeout tính bằng milliseconds
 * @returns {Promise} Promise mới có timeout
 */
const withTimeout = (promise, timeout) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

/**
 * Hàm kiểm tra tính hợp lệ của dữ liệu bàn
 * @param {Object} tableData Dữ liệu bàn cần kiểm tra
 * @throws {Error} Nếu dữ liệu không hợp lệ
 */
const validateTableData = (tableData) => {
  // Kiểm tra các trường bắt buộc
  if (!tableData.tenBan || !tableData.soChoNgoi) {
    throw new Error('Missing required fields');
  }
  // Kiểm tra số chỗ ngồi phải là số dương
  if (typeof tableData.soChoNgoi !== 'number' || tableData.soChoNgoi <= 0) {
    throw new Error('Invalid soChoNgoi');
  }
  // Kiểm tra trạng thái bàn hợp lệ
  if (!['Trống', 'Đang phục vụ', 'Đã đặt'].includes(tableData.trangThai)) {
    throw new Error('Invalid trangThai');
  }
};

// Export đối tượng chứa các phương thức xử lý bàn
export const tableService = {
  /**
   * Lấy danh sách tất cả các bàn
   * @returns {Promise<Array>} Mảng chứa thông tin các bàn
   */
  getAllTables: async () => {
    try {
      // Tạo reference đến node 'ban' trong database
      const tablesRef = ref(db, 'ban');
      // Lấy dữ liệu với timeout
      const snapshot = await withTimeout(
        get(tablesRef),
        TIMEOUT
      );

      if (snapshot.exists()) {
        const tables = [];
        // Chuyển đổi dữ liệu từ snapshot sang mảng
        snapshot.forEach((child) => {
          if (child.key !== 'structure') {
            tables.push({ id: child.key, ...child.val() });
          }
        });
        return tables;
      }
      return [];
    } catch (error) {
      console.error('Get tables error:', error);
      throw error;
    }
  },

  /**
   * Lắng nghe sự thay đổi của danh sách bàn
   * @param {Function} callback Hàm được gọi khi có thay đổi
   * @returns {Function} Hàm hủy đăng ký lắng nghe
   */
  subscribeToTables: (callback) => {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const tablesRef = ref(db, 'ban');
    return onValue(tablesRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({}); // Trả về object rỗng nếu không có dữ liệu
      }
    }, (error) => {
      console.error('Error subscribing to tables:', error);
      callback({}); // Trả về object rỗng nếu có lỗi
    });
  },

  /**
   * Thêm bàn mới
   * @param {Object} tableData Thông tin bàn cần thêm
   * @returns {Promise<Object>} Kết quả thêm bàn
   */
  addTable: async (tableData) => {
    try {
      validateTableData(tableData);

      const newTableRef = ref(db, `ban/ban${Date.now()}`);
      await withTimeout(
        set(newTableRef, {
          ...tableData,
          trangThai: tableData.trangThai || 'Trống'
        }),
        TIMEOUT
      );

      return { success: true, tableId: newTableRef.key };
    } catch (error) {
      console.error('Add table error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin bàn
   * @param {string} tableId ID của bàn cần cập nhật
   * @param {Object} tableData Thông tin mới của bàn
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  updateTable: async (tableId, tableData) => {
    try {
      if (!tableId) {
        throw new Error('Table ID is required');
      }
      validateTableData(tableData);

      const tableRef = ref(db, `ban/${tableId}`);
      await withTimeout(
        update(tableRef, tableData),
        TIMEOUT
      );

      return { success: true };
    } catch (error) {
      console.error('Update table error:', error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái bàn
   * @param {string} tableId ID của bàn
   * @param {string} status Trạng thái mới
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  updateTableStatus: async (tableId, status) => {
    try {
      if (!tableId || !status) {
        throw new Error('Table ID and status are required');
      }
      if (!['Trống', 'Đang phục vụ', 'Đã đặt'].includes(status)) {
        throw new Error('Invalid status');
      }

      const tableRef = ref(db, `ban/${tableId}/trangThai`);
      await withTimeout(
        set(tableRef, status),
        TIMEOUT
      );

      return { success: true };
    } catch (error) {
      console.error('Update table status error:', error);
      throw error;
    }
  },

  /**
   * Xóa bàn
   * @param {string} tableId ID của bàn cần xóa
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteTable: async (tableId) => {
    try {
      if (!tableId) {
        throw new Error('Table ID is required');
      }

      const tableRef = ref(db, `ban/${tableId}`);
      await withTimeout(
        remove(tableRef),
        TIMEOUT
      );

      return { success: true };
    } catch (error) {
      console.error('Delete table error:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của một bàn
   * @param {string} tableId ID của bàn
   * @returns {Promise<Object>} Thông tin bàn
   */
  getTableById: async (tableId) => {
    try {
      if (!tableId) {
        throw new Error('Table ID is required');
      }

      const tableRef = ref(db, `ban/${tableId}`);
      const snapshot = await withTimeout(
        get(tableRef),
        TIMEOUT
      );

      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Get table error:', error);
      throw error;
    }
  },

  /**
   * Lắng nghe sự thay đổi của một bàn cụ thể
   * @param {string} tableId ID của bàn
   * @param {Function} callback Hàm được gọi khi có thay đổi
   * @returns {Function} Hàm hủy đăng ký lắng nghe
   */
  subscribeToTable: (tableId, callback) => {
    if (!tableId || typeof callback !== 'function') {
      throw new Error('Invalid parameters');
    }

    const tableRef = ref(db, `ban/${tableId}`);
    return onValue(tableRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.key, ...snapshot.val() });
      }
    });
  }
};
