import { ref, get, set } from 'firebase/database';
import { db } from '../../../config/firebase';

export const authService = {
  // Encode email để làm key an toàn cho database
  encodeEmail: (email) => {
    return email.replace(/[.@]/g, '_');
  },

  // Đăng nhập
  login: async (email, password) => {
    try {
      const encodedEmail = authService.encodeEmail(email);
      const userRef = ref(db, `nhanvien/${encodedEmail}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.matKhau === password) {
          return { success: true, user: { ...userData, id: encodedEmail } };
        }
      }
      return { success: false, message: 'Email hoặc mật khẩu không đúng' };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Kiểm tra quyền truy cập
  checkPermission: (user, requiredRole) => {
    return user && user.isStaff;
  }
};
