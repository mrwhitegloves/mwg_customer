import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // For avatar selection
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '../store/hooks';
import { updateUser } from '../store/slices/authSlice';

export default function ProfileFormScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState(null); // Local URI preview
  const [isLoading, setIsLoading] = useState(false);

  // Email validation regex
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ 
        type: 'info', 
        text1: 'Permission Denied', 
        text2: 'Please allow photo access to upload avatar',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Upload to Cloudinary via presigned URL and save profile
  const handleContinue = async () => {
    if (!fullName || !email || !isValidEmail(email)) {
      Toast.show({ type: 'error', text1: 'Invalid Input', text2: 'Enter valid name and email' });
      return;
    }
    setIsLoading(true);
    try {
      let profileImageUrl = '';

      // Step 1: If image selected, get presigned URL from backend and upload
      if (avatarUri) {
        // Get presigned upload details
        const presignResponse = await api.post(`/auth/avatar_upload_url`, { fileType: 'image/jpeg' });
        const { uploadUrl, publicId, imageUrl } = presignResponse.data;

        // Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: `${publicId}.jpg`,
        });
        formData.append('api_key', uploadUrl.split('api_key=')[1]?.split('&')[0]); // Extract if needed; Cloudinary signs it
        // Full upload to Cloudinary URL (fields in body)
        await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        profileImageUrl = imageUrl; // Final URL
      }

      // Step 2: Save profile (including image URL)
      const response = await api.post(`/auth/profile`, {
        name: fullName,
        email,
        profileImage: profileImageUrl,
      });
      dispatch(updateUser(response.data.user));
      const { redirect } = response.data;
      router.replace(redirect);
    } catch (error) {
      console.log('Profile Save Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save profile';
      Toast.show({ type: 'error', text1: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingBottom: insets.bottom }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <TouchableOpacity style={{ width: 44, height: 44, justifyContent: 'center' }} onPress={() => router.replace('/login')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        >
          {/* Title */}
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#333', marginBottom: 32, marginTop: 16 }}>Fill Your Profile</Text>

          {/* Avatar */}
          <View style={{ alignSelf: 'center', marginBottom: 32, position: 'relative' }}>
            <TouchableOpacity onPress={pickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 140, height: 140, borderRadius: 70 }} />
              ) : (
                <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={60} color="#CCC" />
                </View>
              )}
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' }}>
                <Ionicons name="pencil" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 }}>
            <TextInput
              style={{ flex: 1, fontSize: 16, color: '#333' }}
              placeholder="Full Name"
              placeholderTextColor="#CCC"
              value={fullName}
              onChangeText={setFullName}
            />
            <Ionicons name="pencil" size={20} color="#999" />
          </View>

          {/* Email */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 }}>
            <TextInput
              style={{ flex: 1, fontSize: 16, color: '#333' }}
              placeholder="Email"
              placeholderTextColor="#CCC"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Ionicons name="mail-outline" size={20} color="#999" />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
          <TouchableOpacity 
            style={{ backgroundColor: '#2ECC71', borderRadius: 24, paddingVertical: 16, alignItems: 'center', opacity: isLoading ? 0.7 : 1 }}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}