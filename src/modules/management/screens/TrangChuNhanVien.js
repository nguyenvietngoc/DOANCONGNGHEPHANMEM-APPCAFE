import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';

const MenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <Icon name={icon} size={32} color={colors.white} />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
  </TouchableOpacity>
);

const TrangChuNhanVien = ({ navigation }) => {
  const { user, setUser } = useContext(AppContext);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: () => {
            setUser(null);
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChonVaiTro' }],
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang chủ nhân viên</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Icon name="account-circle" size={48} color={colors.primary} />
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{user?.hoTen || 'Admin'}</Text>
          <Text style={styles.userRole}>{user?.chucVu || 'Quản lý'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.menuGrid}>
          <MenuItem
            icon="table-restaurant"
            title="Quản lý bàn"
            onPress={() => navigation.navigate('QuanLyBan')}
          />
          <MenuItem
            icon="restaurant-menu"
            title="Quản lý món"
            onPress={() => navigation.navigate('QuanLyMon')}
          />
          <MenuItem
            icon="receipt-long"
            title="Quản lý đơn hàng"
            onPress={() => navigation.navigate('QuanLyDonHang')}
          />
          <MenuItem
            icon="payments"
            title="Quản lý thanh toán"
            onPress={() => navigation.navigate('QuanLyThanhToan')}
          />
          <MenuItem
            icon="insert-chart"
            title="Báo cáo doanh thu"
            onPress={() => navigation.navigate('BaoCaoDoanhThu')}
          />
        </View>
      </ScrollView>
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  logoutButton: {
    padding: 8,
  },
  userInfo: {
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userTextContainer: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  menuItem: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
});

export default TrangChuNhanVien;