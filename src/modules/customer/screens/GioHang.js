import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';

const GioHang = ({ navigation }) => {
  const { cart, updateCartItemQuantity, removeFromCart, createOrder, clearCart, selectedTable } = useContext(AppContext);

  useEffect(() => {
    if (!selectedTable) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn bàn trước khi xem giỏ hàng',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ChonBan'),
          },
        ],
        { cancelable: false }
      );
    }
  }, [selectedTable, navigation]);

  const handleUpdateQuantity = (item, change) => {
    const newQuantity = (item.quantity || 0) + change;
    if (newQuantity > 0) {
      updateCartItemQuantity(item.id, change);
    } else {
      Alert.alert(
        'Xác nhận',
        'Bạn có muốn xóa món này khỏi giỏ hàng?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Xóa',
            onPress: () => removeFromCart(item.id),
            style: 'destructive',
          },
        ],
      );
    }
  };

  const handleDatHang = async () => {
    if (!selectedTable) {
      Alert.alert('Thông báo', 'Vui lòng chọn bàn trước khi đặt hàng');
      navigation.navigate('ChonBan');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống');
      return;
    }

    try {
      const orderId = await createOrder();
      navigation.navigate('TheoDoiDonHang', { orderId });
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt hàng. Vui lòng thử lại sau.');
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.gia || 0) * (item.quantity || 0), 0);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={require('../../../../assets/images/logoQuan.jpg')} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.tenMon}</Text>
        <Text style={styles.itemPrice}>
          {(item.gia || 0).toLocaleString('vi-VN')} đ
        </Text>
        <Text style={styles.itemTotal}>
          Thành tiền: {((item.gia || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} đ
        </Text>
      </View>
      <View style={styles.itemActions}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item, -1)}
          >
            <Icon name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity || 0}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item, 1)}
          >
            <Icon name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => Alert.alert(
            'Xác nhận',
            'Bạn có muốn xóa món này khỏi giỏ hàng?',
            [
              {
                text: 'Hủy',
                style: 'cancel',
              },
              {
                text: 'Xóa',
                onPress: () => removeFromCart(item.id),
                style: 'destructive',
              },
            ],
          )}
        >
          <Icon name="delete" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        {selectedTable && (
          <View style={styles.tableInfo}>
            <Icon name="table-restaurant" size={20} color={colors.primary} />
            <Text style={styles.tableText}>{selectedTable.tenBan}</Text>
          </View>
        )}
      </View>

      {selectedTable ? (
        <>
          <FlatList
            data={cart.filter(item => item.tableId === selectedTable.id)}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cartList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Giỏ hàng trống</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => navigation.navigate('DanhSachMon')}
                >
                  <Text style={styles.browseButtonText}>Xem thực đơn</Text>
                </TouchableOpacity>
              </View>
            }
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalAmount}>
                {calculateTotal().toLocaleString('vi-VN')} đ
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.orderButton, cart.length === 0 && styles.orderButtonDisabled]}
              onPress={handleDatHang}
              disabled={cart.length === 0}
            >
              <Text style={styles.orderButtonText}>
                {cart.length === 0 ? 'Giỏ hàng trống' : 'Đặt hàng'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Vui lòng chọn bàn trước khi xem giỏ hàng</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('ChonBan')}
          >
            <Text style={styles.browseButtonText}>Chọn bàn</Text>
          </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
  },
  itemTotal: {
    fontSize: 14,
    color: colors.text,
  },
  itemActions: {
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: colors.border,
    borderRadius: 6,
    padding: 6,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 12,
  },
  removeButton: {
    marginTop: 8,
    padding: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  orderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  tableText: {
    marginLeft: 4,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  orderButtonDisabled: {
    backgroundColor: colors.disabled,
  },
});

export default GioHang;