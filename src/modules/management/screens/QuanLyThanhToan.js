import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../../../config/firebase';
import { colors } from '../../shared/styles/colors';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const QuanLyThanhToan = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paymentsRef = ref(db, 'thanh_toan');
    const unsubscribe = onValue(paymentsRef, async (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const paymentsArray = await Promise.all(
            Object.entries(data).map(async ([id, payment]) => {
              // Lấy thông tin đơn hàng
              const orderRef = ref(db, `donhang/${payment.idDonHang}`);
              const orderSnapshot = await get(orderRef);
              const orderData = orderSnapshot.val();

              return {
                id,
                ...payment,
                orderInfo: orderData || null
              };
            })
          );

          // Sắp xếp theo thời gian mới nhất
          const sortedPayments = paymentsArray.sort(
            (a, b) => new Date(b.thoiGian) - new Date(a.thoiGian)
          );

          setPayments(sortedPayments);
        } else {
          setPayments([]);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách thanh toán');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'tien_mat':
        return 'Tiền mặt';
      case 'chuyen_khoan':
        return 'Chuyển khoản';
      default:
        return 'Không xác định';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => {
        navigation.navigate('ChiTietThanhToan', { paymentId: item.id });
      }}
    >
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentId}>Mã TT: {item.id.slice(-8)}</Text>
        <Text style={styles.paymentTime}>
          {format(new Date(item.thoiGian), 'HH:mm - dd/MM/yyyy', { locale: vi })}
        </Text>
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Mã đơn:</Text>
          <Text style={styles.value}>{item.idDonHang.slice(-8)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Hình thức:</Text>
          <Text style={[
            styles.value,
            { color: item.hinhThucThanhToan === 'tien_mat' ? colors.success : colors.primary }
          ]}>
            {getPaymentMethodText(item.hinhThucThanhToan)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Số tiền:</Text>
          <Text style={styles.amount}>
            {item.tongTien.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        {item.orderInfo?.idBan && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Bàn:</Text>
            <Text style={styles.value}>{item.orderInfo.idBan}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý thanh toán</Text>
      </View>

      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Icon name="receipt-long" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Chưa có thanh toán nào</Text>
            </View>
          )
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
  listContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  paymentTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  paymentInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default QuanLyThanhToan;
