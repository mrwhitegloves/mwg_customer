// app/profile/profile-edit.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export const options = { headerShown: false };

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const data = res.data.user;
      setUser(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setProfileImage(data.profileImage || '');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Allow photo access to change profile picture' });
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingImage(true);
      const uri = result.assets[0].uri;
      setProfileImage(uri); // Show preview immediately

      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
        formData.append('upload_preset', 'mrwhitegloves_profile'); // Your Cloudinary unsigned preset

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const cloudData = await cloudRes.json();

        if (cloudData.secure_url) {
          setProfileImage(cloudData.secure_url);
          Toast.show({ type: 'success', text1: 'Uploaded', text2: 'Profile picture updated!' });
        }
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Try again' });
        setProfileImage(user?.profileImage || '');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Name is required' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/auth/me', {
        name: name.trim(),
        email: email.trim() || null,
        profileImage: profileImage || null,
      });

      setUser(res.data.user);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated!' });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: error.response?.data?.error || 'Try again',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#cc2e2e" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingBottom: insets.bottom, }} edges={['top']}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A202C' }}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ padding: 20, alignItems: 'center' }}>
            {/* Profile Image */}
            <TouchableOpacity onPress={pickImage} disabled={uploadingImage} style={{ marginBottom: 30 }}>
              <View style={{
                position: 'relative',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#F3F4F6',
                overflow: 'hidden',
                borderWidth: 4,
                borderColor: '#cc2e2e',
              }}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={50} color="#94A3B8" />
                  </View>
                )}
                {uploadingImage && (
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                )}
              </View>
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#cc2e2e',
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: '#FFF',
              }}>
                <Ionicons name="camera" size={18} color="#FFF" />
              </View>
            </TouchableOpacity>

            {/* Name */}
            <View style={{ width: '100%', marginBottom: 16, position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  fontSize: 17,
                  color: '#1A202C',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
              />
              <Ionicons name="person-circle-outline" size={22} color="#94A3B8" style={{ position: 'absolute', right: 18, top: 18 }} />
            </View>

            {/* Email */}
            <View style={{ width: '100%', marginBottom: 16, position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  fontSize: 17,
                  color: '#1A202C',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingRight: 50,
                }}
                value={email}
                onChangeText={setEmail}
                placeholder="Email (optional)"
                keyboardType="email-address"
                placeholderTextColor="#94A3B8"
              />
              <Ionicons name="mail-outline" size={22} color="#94A3B8" style={{ position: 'absolute', right: 18, top: 18 }} />
            </View>

            {/* Phone */}
            <View style={{ width: '100%', marginBottom: 16, position: 'relative' }}>
              <TextInput
                style={{
                  backgroundColor: '#eaeaeaff',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  fontSize: 17,
                  color: '#9b9b9bff',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
                value={phone}
                // onChangeText={setName}
                editable={false} 
                placeholder="Phone Number"
                placeholderTextColor="#94A3B8"
              />
              <Ionicons name="phone-portrait-outline" size={22} color="#94A3B8" style={{ position: 'absolute', right: 18, top: 18 }} />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={{
          padding: 20,
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        }}>
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={saving || uploadingImage}
            style={{
              backgroundColor: '#cc2e2e',
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: 'center',
              opacity: (saving || uploadingImage) ? 0.7 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFF' }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}