"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Placeholder for UI components (can be replaced with shadcn/ui or similar)
const Button = ({ children, onClick, className = '', type = "button", disabled = false, isLoading = false }) => (
  <button 
    type={type} 
    onClick={onClick} 
    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-150 ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={disabled || isLoading}
  >
    {isLoading ? '处理中...' : children}
  </button>
);

const Input = ({ type, placeholder, value, onChange, className = '', name = '' }) => (
  <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} />
);

interface UserProfile {
  id: string;
  username: string;
  nickname: string;
  email: string;
  avatarUrl: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith('http') || src.startsWith('/placeholder-image.png') || src.startsWith('/default-avatar.png') || src.startsWith('blob:')) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/m/auth/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/m/auth/login');
        }
        throw new Error(errData.message || '获取用户信息失败');
      }
      const data: UserProfile = await res.json();
      setUser(data);
      setNickname(data.nickname);
      setAvatarPreview(data.avatarUrl || '/default-avatar.png');
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.message || '加载用户信息时发生错误。');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    const token = localStorage.getItem('token');

    try {
      // Update nickname if changed
      if (user && nickname !== user.nickname) {
      const profileUpdateRes = await fetch('http://localhost:5000/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ nickname }),
        });
        if (!profileUpdateRes.ok) {
          const errData = await profileUpdateRes.json();
          throw new Error(errData.message || '更新昵称失败');
        }
        const updatedUser = await profileUpdateRes.json();
        setUser(prev => ({...prev, ...updatedUser})); // Update local user state
        // Update user in localStorage
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
            try {
                const storedUser = JSON.parse(storedUserStr);
                localStorage.setItem('user', JSON.stringify({...storedUser, nickname: updatedUser.nickname }));
            } catch (parseError) {
                console.error('Failed to parse user from localStorage for update:', parseError);
            }
        }
      }

      // Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarUploadRes = await fetch("http://localhost:5000/api/users/me/avatar", {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!avatarUploadRes.ok) {
          const errData = await avatarUploadRes.json();
          throw new Error(errData.message || '上传头像失败');
        }
        const avatarData = await avatarUploadRes.json();
        setUser(prev => ({...prev, avatarUrl: avatarData.avatarUrl }));
        setAvatarPreview(avatarData.avatarUrl.startsWith('http') ? avatarData.avatarUrl : `http://localhost:5000${avatarData.avatarUrl}`);
        setAvatarFile(null); // Clear file input after successful upload
         // Update user in localStorage
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
            try {
                const storedUser = JSON.parse(storedUserStr);
                localStorage.setItem('user', JSON.stringify({...storedUser, avatarUrl: avatarData.avatarUrl }));
            } catch (parseError) {
                console.error('Failed to parse user from localStorage for avatar update:', parseError);
            }
        }
      }
      setSuccessMessage('资料更新成功！');
      // Optionally, refetch profile to ensure consistency if backend modifies more data
      // fetchUserProfile(); 
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.message || '保存资料时发生错误。');
    }
    setSaving(false);
  };

  if (loading) return <p className="text-center text-gray-600 p-10">加载用户资料中...</p>;
  if (!user && !loading) return <p className="text-center text-red-500 bg-red-100 p-5 rounded">无法加载用户资料，请尝试重新登录。</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex justify-center items-start">
      <div className="container mx-auto max-w-lg bg-white rounded-xl shadow-xl overflow-hidden p-6 md:p-8">
        <Button onClick={() => router.back()} className="mb-6 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm px-3 py-1">返回</Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">我的资料</h1>
        
        {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded mb-4">错误: {error}</p>}
        {successMessage && <p className="text-center text-green-500 bg-green-100 p-3 rounded mb-4">{successMessage}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500 shadow-md">
              {avatarPreview && (
                <Image 
                  loader={imageLoader}
                  src={avatarPreview} 
                  alt="用户头像" 
                  layout="fill"
                  objectFit="cover"
                />
              )}
            </div>
            <div>
                <label htmlFor="avatarUpload" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-150">
                    选择新头像
                </label>
                <input 
                    id="avatarUpload" 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif" 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                />
            </div>
            {avatarFile && <p className="text-xs text-gray-500">已选择: {avatarFile.name}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">用户名 (不可修改)</label>
            <Input type="text" name="username" value={user?.username || ''} className="bg-gray-100" readOnly />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱 (不可修改)</label>
            <Input type="email" name="email" value={user?.email || ''} className="bg-gray-100" readOnly />
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <Input 
              type="text" 
              name="nickname" 
              placeholder="请输入您的昵称" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <Input type="text" value={user?.role || ''} className="bg-gray-100" readOnly />
          </div>

          <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" isLoading={saving} disabled={saving}>
            保存更改
          </Button>
        </form>
      </div>
    </div>
  );
}

