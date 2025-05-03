import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';

const ThanhToan = ({ route, navigation }) => {
  const { orderId, orderItems, totalAmount } = route.params;
  const { completeOrder } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const handleThanhToan = async () => {
    try {
      setLoading(true);
      await completeOrder(orderId, 'chuyen_khoan');
      Alert.alert(
        'Thành công',
        'Thanh toán thành công! Cảm ơn quý khách.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'DanhSachMon' }],
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.tenMon}</Text>
        <Text style={styles.itemQuantity}>x{item.soLuong}</Text>
      </View>
      <Text style={styles.itemPrice}>
        {(item.gia * item.soLuong).toLocaleString('vi-VN')}đ
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderCode}>Mã đơn: {orderId}</Text>
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
          <FlatList
            data={orderItems}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.idMon}_${index}`}
          />
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalAmount}>
            {totalAmount.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paymentButton,
            loading && styles.paymentButtonDisabled
          ]}
          onPress={handleThanhToan}
          disabled={loading}
        >
          <Text style={styles.paymentButtonText}>
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Text>
        </TouchableOpacity>
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
  },
  orderInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
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
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
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
  paymentButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonDisabled: {
    opacity: 0.7,
  },
  paymentButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ThanhToan;