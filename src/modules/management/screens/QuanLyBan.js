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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../shared/styles/colors';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../../../config/firebase';

const TableCard = ({ table, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Trống':
        return colors.tableEmpty;
      case 'Đang phục vụ':
        return colors.tableOccupied;
      case 'Đã đặt':
        return colors.tableReserved;
      default:
        return colors.inactive;
    }
  };

  return (
    <View style={styles.tableCard}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(table.trangThai) }]} />
      <View style={styles.tableInfo}>
        <Text style={styles.tableName}>{table.tenBan}</Text>
        <Text style={styles.tableStatus}>{table.trangThai}</Text>
        <Text style={styles.tableSeats}>Số chỗ ngồi: {table.soChoNgoi}</Text>
      </View>
      <View style={styles.tableActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(table)}>
          <Icon name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(table)}>
          <Icon name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuanLyBan = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    tenBan: '',
    soChoNgoi: '',
    trangThai: 'Trống',
  });

  useEffect(() => {
    const tablesRef = ref(db, 'ban');
    const unsubscribe = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tableList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setTables(tableList);
      } else {
        setTables([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = () => {
    setEditingTable(null);
    setFormData({
      tenBan: '',
      soChoNgoi: '',
      trangThai: 'Trống',
    });
    setModalVisible(true);
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      tenBan: table.tenBan,
      soChoNgoi: table.soChoNgoi.toString(),
      trangThai: table.trangThai,
    });
    setModalVisible(true);
  };

  const handleDelete = (table) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa ${table.tenBan}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await set(ref(db, `ban/${table.id}`), null);
              Alert.alert('Thành công', 'Đã xóa bàn thành công');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Lỗi', 'Không thể xóa bàn');
            }
          },
        },
      ],
    );
  };

  const handleSubmit = async () => {
    try {
      if (!formData.tenBan.trim() || !formData.soChoNgoi.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const tableData = {
        tenBan: formData.tenBan.trim(),
        soChoNgoi: parseInt(formData.soChoNgoi),
        trangThai: formData.trangThai,
      };

      if (editingTable) {
        await set(ref(db, `ban/${editingTable.id}`), tableData);
        Alert.alert('Thành công', 'Đã cập nhật bàn thành công');
      } else {
        await push(ref(db, 'ban'), tableData);
        Alert.alert('Thành công', 'Đã thêm bàn mới thành công');
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin bàn');
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
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Danh sách bàn</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Icon name="add" size={24} color={colors.white} />
            <Text style={styles.addButtonText}>Thêm bàn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableList}>
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTable ? 'Cập nhật bàn' : 'Thêm bàn mới'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên bàn</Text>
              <TextInput
                style={styles.input}
                value={formData.tenBan}
                onChangeText={(text) => setFormData({ ...formData, tenBan: text })}
                placeholder="Nhập tên bàn"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số chỗ ngồi</Text>
              <TextInput
                style={styles.input}
                value={formData.soChoNgoi}
                onChangeText={(text) => setFormData({ ...formData, soChoNgoi: text })}
                placeholder="Nhập số chỗ ngồi"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.statusButtons}>
                {['Trống', 'Đang phục vụ', 'Đã đặt'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.trangThai === status && styles.statusButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, trangThai: status })}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        formData.trangThai === status && styles.statusButtonTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
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
                  {editingTable ? 'Cập nhật' : 'Thêm'}
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
  tableList: {
    padding: 16,
    gap: 16,
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  tableStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tableSeats: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
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
});

export default QuanLyBan;
