import { ref, set } from 'firebase/database';
import { db } from './firebase';

// Hàm khởi tạo cấu trúc dữ liệu
export const initializeDatabase = async () => {
  try {
    // Chỉ tạo tài khoản admin
    await set(ref(db, 'nhanvien/admin_gmail_com'), {
      email: 'admin@gmail.com',
      matKhau: 'admin123',
      hoTen: 'Admin',
      soDienThoai: '0123456789',
      chucVu: 'Quản lý',
      isStaff: true
    });

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Cấu trúc dữ liệu mẫu
export const sampleData = {
  nhanvien: {
    admin_gmail_com: {
      email: 'admin@gmail.com',
      matKhau: 'admin123',
      hoTen: 'Admin',
      soDienThoai: '0123456789',
      chucVu: 'Quản lý',
      isStaff: true
    }
  }
};
