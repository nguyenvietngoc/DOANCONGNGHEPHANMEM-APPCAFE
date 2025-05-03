import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../../../config/firebase';

const ItemCard = ({ item, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    return status === 'ConHang' ? colors.itemAvailable : colors.itemUnavailable;
  };

  return (
    <View style={styles.itemCard}>
      <Image 
        source={require('../../../../assets/images/logoQuan.jpg')}
        style={styles.itemImage}
        resizeMode="contain"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.tenMon}</Text>
        <Text style={styles.itemDescription}>{item.moTa}</Text>
        <Text style={styles.itemPrice}>{item.gia.toLocaleString('vi-VN')} đ</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.trangThai) }]}>
          <Text style={styles.statusText}>
            {item.trangThai === 'ConHang' ? 'Còn hàng' : 'Hết hàng'}
          </Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(item)}>
          <Icon name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(item)}>
          <Icon name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuanLyMon = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    tenMon: '',
    moTa: '',
    gia: '',
    loai: 'coffee',
    trangThai: 'ConHang',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tất cả');

  useEffect(() => {
    const itemsRef = ref(db, 'mon');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setItems(itemList);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items
    .filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.tenMon.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.moTa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.loai.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedFilter === 'Tất cả' ||
        (selectedFilter === 'Còn hàng' && item.trangThai === 'ConHang') ||
        (selectedFilter === 'Hết hàng' && item.trangThai === 'HetHang');
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.tenMon.localeCompare(b.tenMon));

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      tenMon: '',
      moTa: '',
      gia: '',
      loai: 'coffee',
      trangThai: 'ConHang',
    });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      tenMon: item.tenMon,
      moTa: item.moTa,
      gia: item.gia.toString(),
      loai: item.loai,
      trangThai: item.trangThai,
    });
    setModalVisible(true);
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa ${item.tenMon}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await set(ref(db, `mon/${item.id}`), null);
              Alert.alert('Thành công', 'Đã xóa món thành công');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Lỗi', 'Không thể xóa món');
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    try {
      if (!formData.tenMon.trim() || !formData.gia.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const itemData = {
        tenMon: formData.tenMon.trim(),
        moTa: formData.moTa.trim(),
        gia: parseInt(formData.gia),
        loai: formData.loai,
        trangThai: formData.trangThai,
      };

      if (editingItem) {
        await set(ref(db, `mon/${editingItem.id}`), itemData);
        Alert.alert('Thành công', 'Đã cập nhật món thành công');
      } else {
        await push(ref(db, 'mon'), itemData);
        Alert.alert('Thành công', 'Đã thêm món mới thành công');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin món');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách món</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Icon name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={24} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm món theo tên, mô tả hoặc danh mục..."
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

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {['Tất cả', 'Còn hàng', 'Hết hàng'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.selectedFilter,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.selectedFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <ItemCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.itemList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `Không tìm thấy món nào với từ khóa "${searchQuery}"`
                : selectedFilter === 'Tất cả'
                ? 'Chưa có món nào'
                : `Không có món nào ${selectedFilter.toLowerCase()}`}
            </Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Cập nhật món' : 'Thêm món mới'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên món</Text>
              <TextInput
                style={styles.input}
                value={formData.tenMon}
                onChangeText={(text) => setFormData({ ...formData, tenMon: text })}
                placeholder="Nhập tên món"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.moTa}
                onChangeText={(text) => setFormData({ ...formData, moTa: text })}
                placeholder="Nhập mô tả món"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Giá (VNĐ)</Text>
              <TextInput
                style={styles.input}
                value={formData.gia}
                onChangeText={(text) => setFormData({ ...formData, gia: text })}
                placeholder="Nhập giá"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Loại</Text>
              <View style={styles.categoryButtons}>
                {['coffee', 'tea', 'food', 'other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.loai === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, loai: category })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.loai === category && styles.categoryButtonTextActive,
                      ]}
                    >
                      {category === 'coffee' ? 'Cà phê' :
                       category === 'tea' ? 'Trà' :
                       category === 'food' ? 'Đồ ăn' : 'Khác'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.trangThai === 'ConHang' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, trangThai: 'ConHang' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.trangThai === 'ConHang' && styles.statusButtonTextActive,
                    ]}
                  >
                    Còn hàng
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.trangThai === 'HetHang' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, trangThai: 'HetHang' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.trangThai === 'HetHang' && styles.statusButtonTextActive,
                    ]}
                  >
                    Hết hàng
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editingItem ? 'Cập nhật' : 'Thêm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '500',
  },
  itemList: {
    padding: 16,
    gap: 16,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    gap: 8,
    paddingLeft: 16,
  },
  actionButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: colors.white,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '500',
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
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  selectedFilter: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedFilterText: {
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default QuanLyMon;
