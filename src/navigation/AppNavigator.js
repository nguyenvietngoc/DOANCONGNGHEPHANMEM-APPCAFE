import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Màn hình chung
import ChonVaiTro from '../modules/auth/screens/ChonVaiTro';

// Màn hình khách hàng
import ChonBan from '../modules/customer/screens/ChonBan';
import TrangChu from '../modules/customer/screens/TrangChu';
import DanhSachMon from '../modules/customer/screens/DanhSachMon';
import ChiTietMon from '../modules/customer/screens/ChiTietMon';
import GioHang from '../modules/customer/screens/GioHang';
import ThanhToan from '../modules/customer/screens/ThanhToan';
import TheoDoiDonHang from '../modules/customer/screens/TheoDoiDonHang';

// Màn hình quản lý
import DangNhap from '../modules/auth/screens/DangNhap';
import TrangChuNhanVien from '../modules/management/screens/TrangChuNhanVien';
import QuanLyBan from '../modules/management/screens/QuanLyBan';
import QuanLyMon from '../modules/management/screens/QuanLyMon';
import QuanLyDonHang from '../modules/management/screens/QuanLyDonHang';
import ChiTietDonHang from '../modules/management/screens/ChiTietDonHang';
import QuanLyThanhToan from '../modules/management/screens/QuanLyThanhToan';
import BaoCaoDoanhThu from '../modules/management/screens/BaoCaoDoanhThu';

const RootStack = createNativeStackNavigator();
const CustomerStack = createNativeStackNavigator();
const StaffStack = createNativeStackNavigator();

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: '#1E88E5',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

// Stack Navigator cho khách hàng
const CustomerNavigator = () => (
  <CustomerStack.Navigator
    screenOptions={defaultScreenOptions}
    initialRouteName="ChonBan"
  >
    <CustomerStack.Screen 
      name="ChonBan" 
      component={ChonBan}
      options={{ title: 'Chọn bàn' }}
    />
    <CustomerStack.Screen 
      name="TrangChu" 
      component={TrangChu}
      options={{ title: 'Trang chủ' }}
    />
    <CustomerStack.Screen 
      name="DanhSachMon" 
      component={DanhSachMon}
      options={{ title: 'Danh sách món' }}
    />
    <CustomerStack.Screen 
      name="ChiTietMon" 
      component={ChiTietMon}
      options={{ title: 'Chi tiết món' }}
    />
    <CustomerStack.Screen 
      name="GioHang" 
      component={GioHang}
      options={{ title: 'Giỏ hàng' }}
    />
    <CustomerStack.Screen 
      name="ThanhToan" 
      component={ThanhToan}
      options={{ title: 'Thanh toán' }}
    />
    <CustomerStack.Screen 
      name="TheoDoiDonHang" 
      component={TheoDoiDonHang}
      options={{ title: 'Theo dõi đơn hàng' }}
    />
  </CustomerStack.Navigator>
);

// Stack Navigator cho nhân viên
const StaffNavigator = () => (
  <StaffStack.Navigator
    screenOptions={defaultScreenOptions}
    initialRouteName="DangNhap"
  >
    <StaffStack.Screen 
      name="DangNhap" 
      component={DangNhap}
      options={{ headerShown: false }}
    />
    <StaffStack.Screen 
      name="TrangChuNhanVien" 
      component={TrangChuNhanVien}
      options={{ 
        title: 'Trang chủ',
        headerLeft: null,
      }}
    />
    <StaffStack.Screen 
      name="QuanLyBan" 
      component={QuanLyBan}
      options={{ title: 'Quản lý bàn' }}
    />
    <StaffStack.Screen 
      name="QuanLyMon" 
      component={QuanLyMon}
      options={{ title: 'Quản lý món' }}
    />
    <StaffStack.Screen 
      name="QuanLyDonHang" 
      component={QuanLyDonHang}
      options={{ title: 'Quản lý đơn hàng' }}
    />
    <StaffStack.Screen 
      name="ChiTietDonHang" 
      component={ChiTietDonHang}
      options={{ title: 'Chi tiết đơn hàng' }}
    />
    <StaffStack.Screen 
      name="QuanLyThanhToan" 
      component={QuanLyThanhToan}
      options={{ title: 'Quản lý thanh toán' }}
    />
    <StaffStack.Screen 
      name="BaoCaoDoanhThu" 
      component={BaoCaoDoanhThu}
      options={{ title: 'Báo cáo doanh thu' }}
    />
  </StaffStack.Navigator>
);

// Root Navigator
const AppNavigator = () => (
  <NavigationContainer>
    <RootStack.Navigator
      screenOptions={{
        headerShown: false
      }}
      initialRouteName="ChonVaiTro"
    >
      <RootStack.Screen name="ChonVaiTro" component={ChonVaiTro} />
      <RootStack.Screen name="CustomerFlow" component={CustomerNavigator} />
      <RootStack.Screen name="StaffFlow" component={StaffNavigator} />
    </RootStack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
