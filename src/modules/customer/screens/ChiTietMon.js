import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';

const ChiTietMon = ({ route, navigation }) => {
  const { item } = route.params;
  const [soLuong, setSoLuong] = useState(1);
  const { addToCart, selectedTable } = useContext(AppContext);

  const tangSoLuong = () => {
    setSoLuong(soLuong + 1);
  };

  const giamSoLuong = () => {
    if (soLuong > 1) {
      setSoLuong(soLuong - 1);
    }
  };

  const handleThemVaoGio = () => {
    if (!selectedTable) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn bàn trước khi thêm món vào giỏ',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Chọn bàn',
            onPress: () => navigation.navigate('ChonBan'),
          },
        ]
      );
      return;
    }

    addToCart({
      ...item,
      quantity: soLuong,
      tableId: selectedTable.id,
    });
    Alert.alert('Thông báo', 'Đã thêm món vào giỏ hàng');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết món</Text>
        <TouchableOpacity onPress={() => navigation.navigate('GioHang')}>
          <Icon name="shopping-cart" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Image source={require('../../../../assets/images/logoQuan.jpg')} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.name}>{item.tenMon}</Text>
          <Text style={styles.description}>{item.moTa}</Text>
          <Text style={styles.price}>{item.gia.toLocaleString('vi-VN')} đ</Text>

          
          <View style={styles.quantityContainer}>
            <TouchableOpacity onPress={giamSoLuong} style={styles.quantityButton}>
              <Icon name="remove" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.quantity}>{soLuong}</Text>
            <TouchableOpacity onPress={tangSoLuong} style={styles.quantityButton}>
              <Icon name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={handleThemVaoGio}>
          <Text style={styles.addButtonText}>
            {selectedTable 
              ? `Thêm vào giỏ - ${(item.gia * soLuong).toLocaleString('vi-VN')} đ`
              : 'Vui lòng chọn bàn'
            }
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
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    color: colors.primary,
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  quantityButton: {
    backgroundColor: colors.border,
    borderRadius: 8,
    padding: 8,
  },
  quantity: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  tableText: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default ChiTietMon;