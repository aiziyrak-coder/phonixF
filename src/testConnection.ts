import { auth } from '../services/apiService';

export async function testConnection() {
  try {
    console.log('Testing connection to backend...');
    
    // Test login
    // NOTE: Test parollar olib tashlandi - production'da faqat haqiqiy parollar ishlatiladi
    console.log('Testing login...');
    // Login test o'chirildi - production'da haqiqiy foydalanuvchi ma'lumotlari kerak
    throw new Error('Test login o\'chirildi - production\'da haqiqiy foydalanuvchi ma\'lumotlari kerak');
    
    console.log('Login successful!', loginResponse.data);
    
    // Test getting profile
    console.log('Testing profile...');
    const profileResponse = await auth.getProfile();
    console.log('Profile:', profileResponse.data);
    
    return {
      success: true,
      message: 'Connection test successful!',
      data: {
        login: loginResponse.data,
        profile: profileResponse.data
      }
    };
  } catch (error: any) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      message: error.response?.data?.detail || error.message,
      error: error.response?.data || error.message
    };
  }
}