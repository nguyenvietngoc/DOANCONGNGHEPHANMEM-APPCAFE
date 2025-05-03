import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppContext } from '../../../context/AppContext';
import { colors } from '../../shared/styles/colors';

const MenuItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={() => onPress(item)}>
    <Image source={{ uri: item.hinhAnh }} style={styles.menuImage} />
    <View style={styles.menuInfo}>
      <Text style={styles.menuName}>{item.tenMon}</Text>
      <Text style={styles.menuPrice}>
        {item.gia.toLocaleString('vi-VN')}đ
      </Text>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.loai}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const DanhSachMon = ({ navigation }) => {
  const { menu, cart } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (menu) {
      // Extract unique categories from menu items
      const uniqueCategories = ['Tất cả', ...new Set(menu.map(item => item.loai))];
      setCategories(uniqueCategories);
      setLoading(false);
    }
  }, [menu]);

  const filteredMenu = menu
    .filter(item => 
      (selectedCategory === 'Tất cả' || item.loai === selectedCategory) &&
      (searchQuery === '' || 
        item.tenMon.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.moTa?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => a.tenMon.localeCompare(b.tenMon));

  const renderCategoryButton = (category) => {
    let icon;
    switch (category) {
      case 'coffee':
        icon = 'local-cafe';
        break;
      case 'tea':
        icon = 'emoji-food-beverage';
        break;
      case 'food':
        icon = 'restaurant';
        break;
      case 'drink':
        icon = 'local-bar';
        break;
      case 'smoothie':
        icon = 'blender';
        break;
      default:
        icon = category === 'Tất cả' ? 'list' : 'more-horiz';
    }

    // Convert category name for display
    const displayName = category === 'Tất cả' ? category : {
      'coffee': 'Cà phê',
      'tea': 'Trà',
      'food': 'Món ăn',
      'drink': 'Nước',
      'smoothie': 'Sinh tố',
    }[category] || category;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryButton,
          selectedCategory === category && styles.selectedCategory,
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Icon 
          name={icon} 
          size={20} 
          color={selectedCategory === category ? colors.white : colors.text} 
        />
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category && styles.selectedCategoryText,
          ]}
        >
          {displayName}
        </Text>
      </TouchableOpacity>
    );
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Thực đơn</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('GioHang')}
        >
          <View style={styles.cartContainer}>
            <Icon name="shopping-cart" size={24} color={colors.text} />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cart.reduce((total, item) => total + (item.quantity || 0), 0)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={24} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textLight}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map(renderCategoryButton)}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMenu}
        renderItem={({ item }) => (
          <MenuItem
            item={item}
            onPress={() => navigation.navigate('ChiTietMon', { item })}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `Không tìm thấy món nào với từ khóa "${searchQuery}"`
                : selectedCategory === 'Tất cả'
                ? 'Không có món nào'
                : `Không có món nào trong danh mục ${selectedCategory}`}
            </Text>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    padding: 8,
  },
  cartButton: {
    padding: 8,
  },
  cartContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesList: {
    padding: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.text,
    fontSize: 14,
    marginLeft: 4,
  },
  selectedCategoryText: {
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  menuInfo: {
    flex: 1,
    padding: 12,
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  menuPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default DanhSachMon;