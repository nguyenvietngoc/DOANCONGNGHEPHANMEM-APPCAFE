import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { db } from '../../../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { TRANG_THAI_DON } from '../../customer/services/orderService';

const QuanLyDonHang = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    // Lắng nghe thay đổi dữ liệu đơn hàng từ Firebase
    const ordersRef = ref(db, 'donhang');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển đổi object thành array và lọc bỏ node 'structure'
        const ordersArray = Object.entries(data)
          .filter(([key]) => key !== 'structure')
          .map(([id, values]) => ({
            id,
            ...values,
          }))
          .sort((a, b) => b.thoiGian - a.thoiGian);
        setOrders(ordersArray);
      } else {
        setOrders([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
      setLoading(false);
    });

    // Lắng nghe thay đổi dữ liệu bàn từ Firebase
    const tablesRef = ref(db, 'ban');
    const unsubscribeTables = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Chuyển đổi thành object để dễ tra cứu
        const tablesObject = {};
        Object.entries(data)
          .filter(([key]) => key !== 'structure')
          .forEach(([id, values]) => {
            tablesObject[id] = values;
          });
        setTables(tablesObject);
      } else {
        setTables({});
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
    };
  }, []);

  const handleUpdateStatus = async (order, newStatus) => {
    let title = '';
    let message = '';
    
    switch(newStatus) {
      case TRANG_THAI_DON.DANG_CHUAN_BI:
        title = 'Xác nhận bắt đầu chuẩn bị';
        message = 'Bạn có chắc muốn bắt đầu chuẩn bị đơn hàng này?';
        break;
      case TRANG_THAI_DON.DA_PHUC_VU:
        title = 'Xác nhận đã phục vụ';
        message = 'Bạn có chắc đơn hàng đã được phục vụ?';
        break;
      case TRANG_THAI_DON.DA_THANH_TOAN:
        title = 'Xác nhận thanh toán';
        message = 'Bạn có chắc đơn hàng đã được thanh toán?';
        break;
      case TRANG_THAI_DON.DA_HUY:
        title = 'Xác nhận hủy đơn';
        message = 'Bạn có chắc muốn hủy đơn hàng này?';
        break;
    }

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const orderRef = ref(db, `donhang/${order.id}`);
              await update(orderRef, {
                trangThai: newStatus,
                capNhatLanCuoi: Date.now()
              });

              // Nếu đơn hàng đã thanh toán hoặc hủy, cập nhật trạng thái bàn thành trống
              if (newStatus === TRANG_THAI_DON.DA_THANH_TOAN || newStatus === TRANG_THAI_DON.DA_HUY) {
                const banRef = ref(db, `ban/${order.idBan}`);
                await update(banRef, {
                  trangThai: 'Trống',
                  capNhatLanCuoi: Date.now()
                });
              }

              Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
            } catch (error) {
              console.error('Update status error:', error);
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái đơn hàng');
            }
          }
        }
      ]
    );
  };

  const layTextTrangThai = (trangThai) => {
    switch (trangThai) {
      case TRANG_THAI_DON.CHO_XU_LY:
        return 'Chờ xử lý';
      case TRANG_THAI_DON.DANG_CHUAN_BI:
        return 'Đang chuẩn bị';
      case TRANG_THAI_DON.DA_PHUC_VU:
        return 'Đã phục vụ';
      case TRANG_THAI_DON.DA_THANH_TOAN:
        return 'Đã thanh toán';
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

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    return order.trangThai === selectedFilter;
  });

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => navigation.navigate('ChiTietDonHang', { donHangId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Mã đơn: #{item.maDon}</Text>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Icon name="access-time" size={20} color={colors.text} />
          <Text style={styles.infoValue}>
            {new Date(item.thoiGian).toLocaleString('vi-VN')}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThai) }]}>
          <Text style={styles.statusText}>{layTextTrangThai(item.trangThai)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Icon name="table-restaurant" size={20} color={colors.text} />
          <Text style={styles.infoValue}>
            {tables[item.idBan]?.tenBan || `Bàn số ${item.idBan}`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="payment" size={20} color={colors.text} />
          <Text style={styles.infoValue}>
            {item.tongTien.toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        {item.trangThai === TRANG_THAI_DON.CHO_XU_LY && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateStatus(item, TRANG_THAI_DON.DANG_CHUAN_BI)}
          >
            <Text style={styles.actionButtonText}>Bắt đầu chuẩn bị</Text>
          </TouchableOpacity>
        )}

        {item.trangThai === TRANG_THAI_DON.DANG_CHUAN_BI && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateStatus(item, TRANG_THAI_DON.DA_PHUC_VU)}
          >
            <Text style={styles.actionButtonText}>Đã phục vụ</Text>
          </TouchableOpacity>
        )}

        {item.trangThai === TRANG_THAI_DON.DA_PHUC_VU && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleUpdateStatus(item, TRANG_THAI_DON.DA_THANH_TOAN)}
          >
            <Text style={styles.actionButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        )}

        {(item.trangThai === TRANG_THAI_DON.CHO_XU_LY || 
          item.trangThai === TRANG_THAI_DON.DANG_CHUAN_BI) && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleUpdateStatus(item, TRANG_THAI_DON.DA_HUY)}
          >
            <Text style={styles.actionButtonText}>Hủy đơn</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === 'all' && styles.filterButtonActive
        ]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[
          styles.filterButtonText,
          selectedFilter === 'all' && styles.filterButtonTextActive
        ]}>Tất cả</Text>
      </TouchableOpacity>
      {Object.values(TRANG_THAI_DON).map(status => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            selectedFilter === status && styles.filterButtonActive
          ]}
          onPress={() => setSelectedFilter(status)}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === status && styles.filterButtonTextActive
          ]}>{layTextTrangThai(status)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
      </View>

      {renderFilterButtons()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="receipt-long" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  orderItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  orderHeader: {
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  orderTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  orderInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default QuanLyDonHang;