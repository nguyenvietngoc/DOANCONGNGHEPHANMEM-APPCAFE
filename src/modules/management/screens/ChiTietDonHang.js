import React, { useState, useEffect } from 'react';
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
import { db } from '../../../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { TRANG_THAI_DON } from '../../customer/services/orderService';

const ChiTietDonHang = ({ route, navigation }) => {
  const { donHangId } = route.params;
  const [donHang, setDonHang] = useState(null);
  const [chiTiet, setChiTiet] = useState([]);
  const [monAn, setMonAn] = useState({});
  const [dsBan, setDsBan] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin đơn hàng
    const donHangRef = ref(db, `donhang/${donHangId}`);
    const unsubscribeDonHang = onValue(donHangRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDonHang(data);
      }
    });

    // Lấy chi tiết đơn hàng
    const chiTietRef = ref(db, 'donhang_chitiet');
    const unsubscribeChiTiet = onValue(chiTietRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chiTietArray = Object.entries(data)
          .filter(([key]) => key !== 'structure')
          .map(([id, detail]) => ({
            id,
            ...detail,
          }))
          .filter((detail) => detail.idDonHang === donHangId);
        setChiTiet(chiTietArray);
      }
    });

    // Lấy thông tin món ăn
    const monRef = ref(db, 'mon');
    const unsubscribeMon = onValue(monRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const monObject = {};
        Object.entries(data).forEach(([id, mon]) => {
          monObject[id] = mon;
        });
        setMonAn(monObject);
      }
    });

    // Lấy danh sách bàn
    const banRef = ref(db, 'ban');
    const unsubscribeBan = onValue(banRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const banObject = {};
        Object.entries(data).forEach(([id, ban]) => {
          banObject[id] = ban;
        });
        setDsBan(banObject);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeDonHang();
      unsubscribeChiTiet();
      unsubscribeMon();
      unsubscribeBan();
    };
  }, [donHangId]);

  const handleUpdateStatus = async (newStatus) => {
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
              const donHangRef = ref(db, `donhang/${donHangId}`);
              await update(donHangRef, { trangThai: newStatus });

              // Nếu đơn hàng đã thanh toán hoặc hủy, cập nhật trạng thái bàn thành trống
              if (newStatus === TRANG_THAI_DON.DA_THANH_TOAN || newStatus === TRANG_THAI_DON.DA_HUY) {
                const banRef = ref(db, `ban/${donHang.idBan}`);
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

  const getStatusText = (status) => {
    switch (status) {
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

  const renderChiTietItem = ({ item }) => {
    const mon = monAn[item.idMon];
    if (!mon) return null;

    return (
      <View style={styles.orderItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{mon.tenMon}</Text>
          <Text style={styles.itemPrice}>
            {mon.gia.toLocaleString('vi-VN')}đ
          </Text>
        </View>
        <View style={styles.itemQuantity}>
          <Text style={styles.quantityText}>x{item.soLuong}</Text>
          <Text style={styles.itemTotal}>
            {(mon.gia * item.soLuong).toLocaleString('vi-VN')}đ
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!donHang) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Chi tiết đơn hàng</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderCode}>Mã đơn: {donHang.maDon}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(donHang.trangThai) }]}>
            <Text style={styles.statusText}>{getStatusText(donHang.trangThai)}</Text>
          </View>
        </View>

        <View style={styles.tableInfo}>
          <Icon name="table-restaurant" size={20} color={colors.text} />
          <Text style={styles.tableText}>
            {dsBan[donHang.idBan]?.tenBan || `Bàn số ${donHang.idBan}`}
          </Text>
        </View>

        <View style={styles.timeInfo}>
          <Icon name="access-time" size={20} color={colors.text} />
          <Text style={styles.timeText}>
            {new Date(donHang.thoiGian).toLocaleString('vi-VN')}
          </Text>
        </View>

        <FlatList
          data={chiTiet}
          renderItem={renderChiTietItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalAmount}>
            {donHang.tongTien.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <View style={styles.actions}>
          {donHang.trangThai === TRANG_THAI_DON.CHO_XU_LY && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleUpdateStatus(TRANG_THAI_DON.DANG_CHUAN_BI)}
            >
              <Text style={styles.actionButtonText}>Bắt đầu chuẩn bị</Text>
            </TouchableOpacity>
          )}

          {donHang.trangThai === TRANG_THAI_DON.DANG_CHUAN_BI && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleUpdateStatus(TRANG_THAI_DON.DA_PHUC_VU)}
            >
              <Text style={styles.actionButtonText}>Đã phục vụ</Text>
            </TouchableOpacity>
          )}

          {donHang.trangThai !== TRANG_THAI_DON.DA_PHUC_VU && 
           donHang.trangThai !== TRANG_THAI_DON.DA_HUY &&
           donHang.trangThai !== TRANG_THAI_DON.DA_THANH_TOAN && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={() => handleUpdateStatus(TRANG_THAI_DON.DA_HUY)}
            >
              <Text style={styles.actionButtonText}>Hủy đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Cân đối với nút back
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  tableText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  timeText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemQuantity: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  quantityText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  totalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    minWidth: 150,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
  },
  tableText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    flexGrow: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChiTietDonHang;
