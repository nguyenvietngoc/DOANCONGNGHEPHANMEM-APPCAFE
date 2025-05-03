import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../config/firebase';
import { colors } from '../../shared/styles/colors';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

const BaoCaoDoanhThu = () => {
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    cashRevenue: 0,
    transferRevenue: 0,
    dailyRevenue: [],
    monthlyOrders: 0,
    averageOrderValue: 0,
  });

  useEffect(() => {
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    const paymentsRef = ref(db, 'thanh_toan');
    const unsubscribe = onValue(paymentsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          let totalRevenue = 0;
          let cashRevenue = 0;
          let transferRevenue = 0;
          let monthlyOrders = 0;
          
          // Khởi tạo mảng doanh thu theo ngày
          const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
          const dailyRevenue = daysInMonth.map(day => ({
            date: format(day, 'yyyy-MM-dd'),
            revenue: 0,
            orders: 0
          }));

          Object.values(data).forEach(payment => {
            const paymentDate = new Date(payment.thoiGian);
            if (paymentDate >= startDate && paymentDate <= endDate) {
              const amount = payment.tongTien;
              totalRevenue += amount;
              monthlyOrders++;

              // Cập nhật doanh thu theo phương thức thanh toán
              if (payment.hinhThucThanhToan === 'tien_mat') {
                cashRevenue += amount;
              } else if (payment.hinhThucThanhToan === 'chuyen_khoan') {
                transferRevenue += amount;
              }

              // Cập nhật doanh thu theo ngày
              const dayIndex = dailyRevenue.findIndex(
                day => day.date === format(paymentDate, 'yyyy-MM-dd')
              );
              if (dayIndex !== -1) {
                dailyRevenue[dayIndex].revenue += amount;
                dailyRevenue[dayIndex].orders++;
              }
            }
          });

          setRevenueData({
            totalRevenue,
            cashRevenue,
            transferRevenue,
            dailyRevenue,
            monthlyOrders,
            averageOrderValue: monthlyOrders > 0 ? totalRevenue / monthlyOrders : 0
          });
        }
      } catch (error) {
        console.error('Error calculating revenue:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const RevenueCard = ({ title, amount, icon, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.cardAmount, { color }]}>
        {amount.toLocaleString('vi-VN')}đ
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Báo cáo tháng {format(new Date(), 'MM/yyyy', { locale: vi })}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.summarySection}>
          <RevenueCard
            title="Tổng doanh thu"
            amount={revenueData.totalRevenue}
            icon="payments"
            color={colors.primary}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <RevenueCard
                title="Tiền mặt"
                amount={revenueData.cashRevenue}
                icon="money"
                color={colors.success}
              />
            </View>
            <View style={styles.halfWidth}>
              <RevenueCard
                title="Chuyển khoản"
                amount={revenueData.transferRevenue}
                icon="credit-card"
                color={colors.info}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <RevenueCard
                title="Số đơn hàng"
                amount={revenueData.monthlyOrders}
                icon="receipt"
                color={colors.warning}
              />
            </View>
            <View style={styles.halfWidth}>
              <RevenueCard
                title="Trung bình/đơn"
                amount={Math.round(revenueData.averageOrderValue)}
                icon="analytics"
                color={colors.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doanh thu theo ngày</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {revenueData.dailyRevenue.map((day, index) => (
              <View key={day.date} style={styles.dayCard}>
                <Text style={styles.dayDate}>
                  {format(new Date(day.date), 'dd/MM', { locale: vi })}
                </Text>
                <Text style={styles.dayRevenue}>
                  {day.revenue.toLocaleString('vi-VN')}đ
                </Text>
                <Text style={styles.dayOrders}>
                  {day.orders} đơn
                </Text>
              </View>
            ))}
          </ScrollView>
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
  },
  summarySection: {
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    elevation: 1,
  },
  dayDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayRevenue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  dayOrders: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default BaoCaoDoanhThu;
