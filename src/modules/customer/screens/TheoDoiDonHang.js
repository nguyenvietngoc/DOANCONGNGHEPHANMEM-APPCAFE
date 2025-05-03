import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../../../config/firebase';
import { TRANG_THAI_DON } from '../../customer/services/orderService';

const TheoDoiDonHang = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { menu } = useContext(AppContext);
  const [previousStatus, setPreviousStatus] = useState(null);

  useEffect(() => {
    // Lấy thông tin đơn hàng
    const orderRef = ref(db, `donhang/${orderId}`);
    const unsubscribeOrder = onValue(orderRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Kiểm tra nếu trạng thái chuyển sang đã phục vụ
        if (previousStatus !== null && 
            previousStatus !== TRANG_THAI_DON.DA_PHUC_VU && 
            data.trangThai === TRANG_THAI_DON.DA_PHUC_VU) {
          Alert.alert(
            'Đơn hàng đã được phục vụ',
            'Vui lòng thanh toán.',
            [
              {
                text: 'Thanh toán',
                onPress: () => {
                  navigation.navigate('ThanhToan', { 
                    orderId: orderId,
                    orderItems: orderItems,
                    totalAmount: data.tongTien
                  });
                },
              },
            ],
            { cancelable: false }
          );
        }
        setPreviousStatus(data.trangThai);
        setOrder(data);

        try {
          // Lấy chi tiết đơn hàng
          const chiTietRef = ref(db, 'donhang_chitiet');
          const chiTietSnapshot = await get(chiTietRef);
          const chiTietData = chiTietSnapshot.val();
          
          if (chiTietData) {
            // Lọc các chi tiết thuộc đơn hàng này
            const orderDetails = Object.values(chiTietData)
              .filter(item => item.idDonHang === orderId)
              .map(item => {
                // Tìm thông tin món từ menu
                const menuItem = menu.find(m => m.id === item.idMon);
                return {
                  ...item,
                  tenMon: menuItem?.tenMon || item.tenMon || 'Không xác định',
                  gia: menuItem?.gia || item.gia || 0
                };
              });
            setOrderItems(orderDetails);
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeOrder();
  }, [orderId, menu, previousStatus, navigation]);

  const getStatusText = (status) => {
    switch (status) {
      case TRANG_THAI_DON.CHO_XU_LY:
        return 'Chờ xử lý';
      case TRANG_THAI_DON.DANG_CHUAN_BI:
        return 'Đang chuẩn bị';
      case TRANG_THAI_DON.DA_PHUC_VU:
        return 'Đã phục vụ';
      case TRANG_THAI_DON.DA_HUY:
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case TRANG_THAI_DON.CHO_XU_LY:
        return colors.warning;
      case TRANG_THAI_DON.DANG_CHUAN_BI:
        return colors.success;
      case TRANG_THAI_DON.DA_PHUC_VU:
        return colors.success;
      case TRANG_THAI_DON.DA_HUY:
        return colors.error;
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      {order && (
        <View style={styles.content}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>Mã đơn: {order.maDon}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.trangThai) }]}>
              <Text style={styles.statusText}>{getStatusText(order.trangThai)}</Text>
            </View>
          </View>

          <View style={styles.timeInfo}>
            <Icon name="access-time" size={20} color={colors.text} />
            <Text style={styles.timeText}>
              {new Date(order.thoiGian).toLocaleString('vi-VN')}
            </Text>
          </View>

          <FlatList
            data={orderItems}
            keyExtractor={(item, index) => `${item.idMon}_${index}`}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.tenMon}</Text>
                  <Text style={styles.itemQuantity}>x{item.soLuong}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {(item.gia * item.soLuong).toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalAmount}>
                  {order.tongTien.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
  },
  timeText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    marginTop: 8,
    borderRadius: 8,
    elevation: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TheoDoiDonHang;