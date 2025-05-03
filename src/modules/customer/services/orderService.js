import { ref, get, set, push, update, onValue } from 'firebase/database';
import { db } from '../../../config/firebase';

const TIMEOUT = 30000; // 30 seconds timeout

// Trạng thái đơn hàng
const TRANG_THAI_DON = {
  CHO_XU_LY: 'ChoXuLy',      // Chờ xử lý
  DANG_CHUAN_BI: 'DangChuanBi', // Đang chuẩn bị
  DA_PHUC_VU: 'DaPhucVu',      // Đã phục vụ
  DA_THANH_TOAN: 'DaThanhToan', // Đã thanh toán
  DA_HUY: 'DaHuy'               // Đã hủy
};

const withTimeout = (promise, timeout) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const orderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderData) => {
    try {
      // Validation
      if (!orderData.idBan || !orderData.tongTien) {
        throw new Error('Missing required fields');
      }
      
      if (typeof orderData.tongTien !== 'number' || orderData.tongTien <= 0) {
        throw new Error('Invalid tongTien');
      }

      const ordersRef = ref(db, 'donhang');
      const newOrderRef = push(ordersRef);
      const orderWithId = {
        ...orderData,
        maDon: newOrderRef.key,
        thoiGian: Date.now(),
        trangThai: TRANG_THAI_DON.CHO_XU_LY
      };

      await withTimeout(
        set(newOrderRef, orderWithId),
        TIMEOUT
      );

      return { success: true, orderId: newOrderRef.key };
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // Thêm chi tiết đơn hàng
  addOrderDetails: async (orderId, items) => {
    try {
      if (!orderId || !items || !items.length) {
        throw new Error('Invalid order details');
      }

      const updates = {};
      items.forEach((item, index) => {
        if (!item.idMon || !item.soLuong || !item.gia) {
          throw new Error('Invalid item data');
        }
        updates[`donhang_chitiet/${orderId}_${index}`] = {
          idDonHang: orderId,
          idMon: item.idMon,
          soLuong: item.soLuong,
          gia: item.gia,
          tenMon: item.tenMon,
          ghiChu: item.ghiChu || ''
        };
      });

      await withTimeout(
        update(ref(db), updates),
        TIMEOUT
      );

      return { success: true };
    } catch (error) {
      console.error('Add order details error:', error);
      throw error;
    }
  },

  // Lấy thông tin đơn hàng
  getOrderById: async (orderId) => {
    try {
      if (!orderId) {
        throw new Error('Order ID is required');
      }

      const orderRef = ref(db, `donhang/${orderId}`);
      const snapshot = await withTimeout(
        get(orderRef),
        TIMEOUT
      );

      if (snapshot.exists()) {
        return { id: snapshot.key, ...snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (orderId, status) => {
    try {
      if (!orderId || !Object.values(ORDER_STATUS).includes(status)) {
        throw new Error('Invalid order ID or status');
      }

      const orderRef = ref(db, `donhang/${orderId}`);
      await withTimeout(
        update(orderRef, { trangThai: status }),
        TIMEOUT
      );

      return { success: true };
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  // Lắng nghe thay đổi đơn hàng realtime
  subscribeToOrder: (orderId, callback) => {
    if (!orderId || typeof callback !== 'function') {
      throw new Error('Invalid parameters');
    }

    const orderRef = ref(db, `donhang/${orderId}`);
    return onValue(orderRef, (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.key, ...snapshot.val() } : null);
    }, (error) => {
      console.error('Subscribe to order error:', error);
      callback(null);
    });
  },

  // Lắng nghe danh sách đơn hàng theo trạng thái
  subscribeToOrdersByStatus: (status, callback) => {
    if (!Object.values(ORDER_STATUS).includes(status) || typeof callback !== 'function') {
      throw new Error('Invalid parameters');
    }

    const ordersRef = ref(db, 'donhang');
    return onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((child) => {
          if (child.val().trangThai === status) {
            orders.push({ id: child.key, ...child.val() });
          }
        });
        callback(orders);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Subscribe to orders error:', error);
      callback([]);
    });
  }
};

export { TRANG_THAI_DON };
