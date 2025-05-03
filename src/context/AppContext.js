import React, { createContext, useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, update, get } from 'firebase/database';
import { db } from '../config/firebase';
import { TRANG_THAI_DON } from '../modules/customer/services/orderService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [cartsByTable, setCartsByTable] = useState({}); // { tableId: [...cartItems] }
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);

  // Getter cho giỏ hàng của bàn hiện tại
  const cart = selectedTable ? (cartsByTable[selectedTable.id] || []) : [];

  useEffect(() => {
    // Listen to tables changes
    const tablesRef = ref(db, 'tables');
    const unsubscribeTables = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tableList = Object.entries(data).map(([id, table]) => ({
          id,
          ...table,
        }));
        setTables(tableList);
      }
    });

    // Listen to menu changes
    const menuRef = ref(db, 'mon');
    const unsubscribeMenu = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const menuList = Object.entries(data)
          .map(([id, item]) => ({
            id,
            ...item,
          }))
          .filter(item => item.trangThai === 'ConHang')
          .sort((a, b) => a.tenMon.localeCompare(b.tenMon));
        setMenu(menuList);
      } else {
        setMenu([]);
      }
    });

    // Listen to orders changes
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const orderList = Object.entries(data).map(([id, order]) => ({
          id,
          ...order,
        }));
        setOrders(orderList);
      }
    });

    return () => {
      unsubscribeTables();
      unsubscribeMenu();
      unsubscribeOrders();
    };
  }, []);

  const addToCart = (item) => {
    if (!selectedTable) return;

    setCartsByTable(current => {
      const tableCart = current[selectedTable.id] || [];
      const existingItem = tableCart.find(i => i.id === item.id);

      const updatedTableCart = existingItem
        ? tableCart.map(i => i.id === item.id 
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
          )
        : [...tableCart, { ...item, quantity: item.quantity || 1 }];

      return {
        ...current,
        [selectedTable.id]: updatedTableCart
      };
    });
  };

  const updateCartItemQuantity = (itemId, change) => {
    if (!selectedTable) return;

    setCartsByTable(current => {
      const tableCart = current[selectedTable.id] || [];
      const updatedTableCart = tableCart
        .map(item => item.id === itemId
          ? { ...item, quantity: Math.max(1, (item.quantity || 0) + change) }
          : item
        )
        .filter(item => item.quantity > 0);

      return {
        ...current,
        [selectedTable.id]: updatedTableCart
      };
    });
  };

  const removeFromCart = (itemId) => {
    if (!selectedTable) return;

    setCartsByTable(current => {
      const tableCart = current[selectedTable.id] || [];
      return {
        ...current,
        [selectedTable.id]: tableCart.filter(item => item.id !== itemId)
      };
    });
  };

  const clearCart = () => {
    if (!selectedTable) return;

    setCartsByTable(current => ({
      ...current,
      [selectedTable.id]: []
    }));
  };

  const createOrder = async () => {
    if (!selectedTable) {
      throw new Error('Vui long chon ban truoc khi dat hang');
    }

    const currentCart = cartsByTable[selectedTable.id] || [];
    if (currentCart.length === 0) {
      throw new Error('Gio hang trong');
    }

    try {
      // 1. Tạo đơn hàng mới
      const donHangRef = ref(db, 'donhang');
      const newDonHangRef = push(donHangRef);
      
      const tongTien = currentCart.reduce(
        (sum, item) => sum + (item.gia || 0) * (item.quantity || 0), 
        0
      );

      const donHang = {
        maDon: newDonHangRef.key,
        idBan: selectedTable.id,
        tongTien: tongTien,
        thoiGian: Date.now(),
        trangThai: TRANG_THAI_DON.CHO_XU_LY
      };

      await set(newDonHangRef, donHang);

      // 2. Thêm chi tiết đơn hàng
      const chiTietUpdates = {};
      currentCart.forEach((item, index) => {
        chiTietUpdates[`donhang_chitiet/${newDonHangRef.key}_${index}`] = {
          idDonHang: newDonHangRef.key,
          idMon: item.id,
          soLuong: item.quantity,
          gia: item.gia,
          tenMon: item.tenMon,
          ghiChu: item.ghiChu || ''
        };
      });

      await update(ref(db), chiTietUpdates);

      // 3. Cập nhật trạng thái bàn
      const banRef = ref(db, `ban/${selectedTable.id}`);
      await update(banRef, {
        trangThai: 'DangPhucVu',
        idDonHang: newDonHangRef.key
      });

      // 4. Xóa giỏ hàng
      clearCart();

      return newDonHangRef.key;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  };

  const completeOrder = async (orderId, paymentMethod = 'tien_mat') => {
    try {
      const orderRef = ref(db, `donhang/${orderId}`);
      const orderSnapshot = await get(orderRef);
      const orderData = orderSnapshot.val();

      if (!orderData) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Lấy chi tiết đơn hàng
      const orderDetailsRef = ref(db, 'donhang_chitiet');
      const orderDetailsSnapshot = await get(orderDetailsRef);
      const orderDetailsData = orderDetailsSnapshot.val();
      const orderDetails = orderDetailsData ? 
        Object.values(orderDetailsData)
          .filter(item => item.idDonHang === orderId)
          .map(item => ({
            idMon: item.idMon,
            tenMon: item.tenMon,
            soLuong: item.soLuong,
            gia: item.gia,
            thanhTien: item.gia * item.soLuong
          })) : [];

      // Tạo bảng thanh toán
      const paymentRef = ref(db, 'thanh_toan');
      const newPaymentRef = push(paymentRef);
      await set(newPaymentRef, {
        idDonHang: orderId,
        thoiGian: new Date().toISOString(),
        tongTien: orderData.tongTien,
        hinhThucThanhToan: paymentMethod,
        trangThai: 'da_thanh_toan',
        idBan: orderData.idBan || null,
        chiTiet: orderDetails
      });

      // Cập nhật trạng thái đơn hàng
      await update(orderRef, {
        trangThai: TRANG_THAI_DON.DA_THANH_TOAN,
        thoiGianHoanThanh: new Date().toISOString(),
        hinhThucThanhToan: paymentMethod,
        idThanhToan: newPaymentRef.key
      });

      // Cập nhật trạng thái bàn
      if (orderData.idBan) {
        const tableRef = ref(db, `ban/${orderData.idBan}`);
        await update(tableRef, {
          trangThai: 'Trống'
        });
      }

      return true;
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để cập nhật đơn hàng');
    }

    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Nếu hoàn thành đơn hàng, tạo bản ghi thanh toán
      if (newStatus === 'completed') {
        const orderSnapshot = await get(orderRef);
        const orderData = orderSnapshot.val();

        const thanhToanRef = ref(db, 'thanhtoan');
        const newThanhToanRef = push(thanhToanRef);
        await set(newThanhToanRef, {
          orderId: orderId,
          userId: user.id,
          amount: orderData.total,
          createdAt: new Date().toISOString(),
          status: 'pending'
        });

        // Cập nhật báo cáo doanh thu
        const date = new Date();
        const reportRef = ref(db, `baocaodoanhthu/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`);
        const reportSnapshot = await get(reportRef);
        const currentReport = reportSnapshot.val() || { totalRevenue: 0, numberOfOrders: 0 };
        
        await update(reportRef, {
          totalRevenue: currentReport.totalRevenue + orderData.total,
          numberOfOrders: currentReport.numberOfOrders + 1
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const cancelOrder = async (orderId) => {
    if (!user) {
      throw new Error('Vui lòng đăng nhập để hủy đơn hàng');
    }

    try {
      // Lấy thông tin đơn hàng
      const orderRef = ref(db, `orders/${orderId}`);
      const orderSnapshot = await get(orderRef);
      const orderData = orderSnapshot.val();

      if (!orderData) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      // Cập nhật trạng thái bàn
      const tableRef = ref(db, `tables/${orderData.tableId}`);
      await update(tableRef, {
        status: 'available',
        currentOrderId: null
      });

      // Xóa chi tiết đơn hàng
      const chiTietRef = ref(db, 'donhang_chitiet');
      const chiTietSnapshot = await get(chiTietRef);
      const chiTietData = chiTietSnapshot.val();

      if (chiTietData) {
        const deletePromises = Object.entries(chiTietData)
          .filter(([_, item]) => item.idDonHang === orderId)
          .map(([key]) => remove(ref(db, `donhang_chitiet/${key}`)));
        
        await Promise.all(deletePromises);
      }

      // Cập nhật đơn hàng thành đã hủy
      await update(orderRef, {
        status: 'canceled',
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  };

  const addTable = async (table) => {
    try {
      const tablesRef = ref(db, 'tables');
      await push(tablesRef, table);
      return true;
    } catch (error) {
      console.error('Error adding table:', error);
      return false;
    }
  };

  const updateTable = async (tableId, updates) => {
    try {
      const tableRef = ref(db, `tables/${tableId}`);
      await update(tableRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating table:', error);
      return false;
    }
  };

  const deleteTable = async (tableId) => {
    try {
      const tableRef = ref(db, `tables/${tableId}`);
      await remove(tableRef);
      return true;
    } catch (error) {
      console.error('Error deleting table:', error);
      return false;
    }
  };

  const addMenuItem = async (item) => {
    try {
      const menuRef = ref(db, 'mon');
      await push(menuRef, item);
      return true;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return false;
    }
  };

  const updateMenuItem = async (itemId, updates) => {
    try {
      const itemRef = ref(db, `mon/${itemId}`);
      await update(itemRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return false;
    }
  };

  const deleteMenuItem = async (itemId) => {
    try {
      const itemRef = ref(db, `mon/${itemId}`);
      await remove(itemRef);
      return true;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        selectedTable,
        tables,
        menu,
        orders,
        user,
        setUser,
        addToCart,
        updateCartItemQuantity,
        removeFromCart,
        clearCart,
        createOrder,
        completeOrder,
        updateOrderStatus,
        cancelOrder,
        addTable,
        updateTable,
        deleteTable,
        setSelectedTable,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
