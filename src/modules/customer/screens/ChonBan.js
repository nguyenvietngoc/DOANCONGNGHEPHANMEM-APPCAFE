import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppContext } from '../../../context/AppContext';
import { colors } from '../../shared/styles/colors';
import { tableService } from '../../management/services/tableService';

const TableItem = ({ item, onPress }) => (
  <TouchableOpacity
    style={[
      styles.tableItem,
      item.trangThai === 'Đang phục vụ' && styles.tableBusy,
      item.trangThai === 'Đã đặt' && styles.tableReserved,
    ]}
    onPress={() => onPress(item)}
    disabled={item.trangThai !== 'Trống'}
  >
    <Icon
      name={
        item.trangThai === 'Trống'
          ? 'event-seat'
          : item.trangThai === 'Đang phục vụ'
          ? 'restaurant'
          : 'schedule'
      }
      size={32}
      color={item.trangThai === 'Trống' ? colors.primary : colors.white}
    />
    <Text
      style={[
        styles.tableName,
        (item.trangThai === 'Đang phục vụ' || item.trangThai === 'Đã đặt') &&
          styles.tableTextLight,
      ]}
    >
      {item.tenBan}
    </Text>
    <Text
      style={[
        styles.tableSeats,
        (item.trangThai === 'Đang phục vụ' || item.trangThai === 'Đã đặt') &&
          styles.tableTextLight,
      ]}
    >
      {item.soChoNgoi} chỗ ngồi
    </Text>
    <Text
      style={[
        styles.tableStatus,
        (item.trangThai === 'Đang phục vụ' || item.trangThai === 'Đã đặt') &&
          styles.tableTextLight,
      ]}
    >
      {item.trangThai}
    </Text>
  </TouchableOpacity>
);

const ChonBan = ({ navigation }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedTable } = useContext(AppContext);

  useEffect(() => {
    const unsubscribe = tableService.subscribeToTables((tablesData) => {
      // Chuyển đổi từ object sang mảng và sort
      const tablesList = tablesData ? Object.entries(tablesData).map(([id, table]) => ({
        id,
        ...table
      })) : [];
      setTables(tablesList.sort((a, b) => a.tenBan.localeCompare(b.tenBan)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectTable = (table) => {
    if (table.trangThai !== 'Trống') {
      Alert.alert('Thông báo', 'Bàn này hiện không khả dụng');
      return;
    }

    Alert.alert(
      'Xác nhận',
      `Bạn muốn chọn ${table.tenBan}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await tableService.updateTableStatus(table.id, 'Đang phục vụ');
              setSelectedTable(table);
              navigation.navigate('DanhSachMon');
            } catch (error) {
              console.error('Error updating table status:', error);
              Alert.alert('Lỗi', 'Không thể chọn bàn. Vui lòng thử lại sau.');
            }
          },
        },
      ],
      { cancelable: true }
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
        <Text style={styles.title}>Chọn bàn</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-seat" size={64} color={colors.textLight} />
          <Text style={styles.emptyText}>Không có bàn nào</Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          renderItem={({ item }) => (
            <TableItem item={item} onPress={handleSelectTable} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tableList}
          numColumns={2}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2;

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
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
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
  tableList: {
    padding: 16,
  },
  tableItem: {
    width: itemWidth,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableBusy: {
    backgroundColor: colors.error,
  },
  tableReserved: {
    backgroundColor: colors.warning,
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  tableSeats: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  tableStatus: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  tableTextLight: {
    color: colors.white,
  },
});

export default ChonBan;