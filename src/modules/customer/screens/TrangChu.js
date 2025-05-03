import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { AppContext } from '../../../context/AppContext';

const categories = [
  { id: 'coffee', name: 'Cà phê', icon: 'coffee' },
  { id: 'tea', name: 'Trà', icon: 'emoji-food-beverage' },
  { id: 'juice', name: 'Nước ép', icon: 'local-drink' },
  { id: 'food', name: 'Đồ ăn', icon: 'restaurant' },
];

const TrangChu = ({ navigation }) => {
  const { menu, selectedTable, addToCart } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = React.useState('coffee');

  const filteredMenu = menu.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (item) => {
    if (!selectedTable) {
      Alert.alert('Thông báo', 'Vui lòng chọn bàn trước khi đặt món', [
        {
          text: 'Chọn bàn',
          onPress: () => navigation.navigate('ChonBan'),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ]);
      return;
    }
    addToCart(item);
    Alert.alert('Thành công', 'Đã thêm món vào giỏ hàng');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ChonBan')}>
          {selectedTable ? (
            <View style={styles.tableInfo}>
              <Icon name="table-restaurant" size={24} color={colors.primary} />
              <Text style={styles.tableName}>Bàn {selectedTable.name}</Text>
            </View>
          ) : (
            <View style={styles.selectTable}>
              <Icon name="add" size={24} color={colors.primary} />
              <Text style={styles.selectTableText}>Chọn bàn</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('GioHang')}
        >
          <Icon name="shopping-cart" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categories}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Icon
                name={category.icon}
                size={24}
                color={
                  selectedCategory === category.id
                    ? colors.buttonText
                    : colors.text
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.menuGrid}>
          {filteredMenu.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => navigation.navigate('ChiTietMon', { item })}
            >
              <Image source={require('../../../../assets/images/icon.png')} style={styles.menuImage} />
              <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                <Text style={styles.menuPrice}>
                  {item.price.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  selectTable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectTableText: {
    fontSize: 16,
    color: colors.primary,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  categories: {
    padding: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedCategoryText: {
    color: colors.buttonText,
  },
  menuGrid: {
    padding: 16,
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

export default TrangChu;