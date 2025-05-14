"use client";

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// --- Refined UI Components for Mobile (from previous optimizations) ---
const Button = ({ children, onClick, className = '', type = "button", disabled = false, variant = "primary", size = "normal", isLoading = false }) => {
  const baseStyle = `font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 inline-flex items-center justify-center shadow-md active:shadow active:translate-y-px disabled:cursor-not-allowed`;
  const sizes = { small: `px-3 py-1.5 text-sm`, normal: `px-5 py-2.5 text-base`, large: `px-7 py-3 text-lg` };
  const variants = { primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500`, secondary: `bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400 border border-slate-300`, danger: `bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`, success: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`, ghost: `bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400` };
  
  const currentVariantStyle = variants[variant] || variants.primary;
  const disabledLoadingStyle = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${sizes[size]} ${currentVariantStyle} ${disabledLoadingStyle} ${className}`}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          处理中...
        </div>
      ) : children}
    </button>
  );
};

const Input = ({ type = "text", placeholder, value, onChange, className = '', name = '', disabled = false, readOnly = false, ...props }) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled || readOnly}
    readOnly={readOnly}
    className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-base ${readOnly ? 'bg-slate-100 cursor-default text-slate-500' : 'bg-white'} ${className}`}
    {...props}
  />
);

interface UserProfile { id: string; username: string; nickname: string; email: string; avatarUrl: string; role: string; }

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

  const imageLoader = ({ src, width, quality }) => { /* ... loader logic remains ... */ 
    if (src.startsWith('http') || src.startsWith('/placeholder-image.png') || src.startsWith('/default-avatar.png') || src.startsWith('blob:')) { return `${src}?w=${width}&q=${quality || 75}`; }
    return `http://localhost:5000${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}`;
  };

  const fetchUserProfile = useCallback(async () => { /* ... fetch logic remains ... */ 
    setLoading(true); setError(''); const token = localStorage.getItem('token');
    if (!token) { router.push('/m/auth/login'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/users/me', { headers: { 'Authorization': `Bearer ${token}`}});
      if (!res.ok) { const errData = await res.json(); if (res.status === 401 || res.status === 403) { localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/m/auth/login');} throw new Error(errData.message || '获取用户信息失败');}
      const data: UserProfile = await res.json(); setUser(data); setNickname(data.nickname); setAvatarPreview(data.avatarUrl || '/default-avatar.png');
    } catch (err) { console.error('Fetch profile error:', err); setError(err.message || '加载用户信息时发生错误。'); }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // Example: 2MB limit for avatar
          setError("头像文件大小不能超过 2MB。");
          setAvatarFile(null);
          // e.target.value = ""; // Not always reliable for clearing file input
          return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(''); // Clear previous errors
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { /* ... submit logic remains, ensure localStorage update is robust ... */ 
    e.preventDefault(); setSaving(true); setError(''); setSuccessMessage(''); const token = localStorage.getItem('token');
    if (!token) { setError("请先登录。"); setSaving(false); return; }

    try {
      let profileUpdated = false;
      // Update nickname if changed
      if (user && nickname.trim() && nickname.trim() !== user.nickname) {
        const profileUpdateRes = await fetch('http://localhost:5000/api/users/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ nickname: nickname.trim() })});
        if (!profileUpdateRes.ok) { const errData = await profileUpdateRes.json(); throw new Error(errData.message || '更新昵称失败');}
        const updatedUserData = await profileUpdateRes.json(); 
        setUser(prev => ({...prev!, ...updatedUserData})); 
        localStorage.setItem('user', JSON.stringify({...JSON.parse(localStorage.getItem('user') || '{}'), nickname: updatedUserData.nickname }));
        profileUpdated = true;
      }

      // Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData(); formData.append('avatar', avatarFile);
        const avatarUploadRes = await fetch("http://localhost:5000/api/users/me/avatar", { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`}, body: formData });
        if (!avatarUploadRes.ok) { const errData = await avatarUploadRes.json(); throw new Error(errData.message || '上传头像失败');}
        const avatarData = await avatarUploadRes.json(); 
        setUser(prev => ({...prev!, avatarUrl: avatarData.avatarUrl })); 
        setAvatarPreview(avatarData.avatarUrl.startsWith('http') ? avatarData.avatarUrl : `http://localhost:5000${avatarData.avatarUrl}`);
        setAvatarFile(null);
        localStorage.setItem('user', JSON.stringify({...JSON.parse(localStorage.getItem('user') || '{}'), avatarUrl: avatarData.avatarUrl }));
        profileUpdated = true;
      }
      if (profileUpdated) {
          setSuccessMessage('资料更新成功！');
      } else if (!avatarFile && user && nickname === user.nickname) {
          setSuccessMessage('资料未作更改。');
      }
      // setTimeout(() => setSuccessMessage(''), 3000); // Auto-clear success message
    } catch (err) { console.error('Save profile error:', err); setError(err.message || '保存资料时发生错误。'); }
    setSaving(false);
  };

  // --- Render States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-600 text-lg">加载用户资料...</p>
      </div>
    );
  }
  if (!user && !loading) { // Added !loading condition
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md w-full">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <p className="text-red-600 text-lg font-medium mb-1">加载失败</p>
            <p className="text-slate-600 text-sm mb-6">无法加载用户资料，请尝试重新登录。</p>
            <Button onClick={() => router.push("/m/auth/login")} variant="primary" className="w-full">前往登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-16 selection:bg-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm py-3.5 z-20">
        <div className="container mx-auto max-w-xl px-4 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="small" className="!px-2 !py-1">
            <svg className="w-5 h-5 mr-0.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            返回
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">
            我的资料
          </h1>
          <div className="w-20"> {/* Placeholder to balance title */} </div>
        </div>
      </header>

      <div className="container mx-auto max-w-xl p-4 pt-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                <strong className="font-semibold">错误: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col items-center space-y-3 pt-2 pb-4">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-200 shadow-md group cursor-pointer">
                  {avatarPreview && (
                    <Image
                      key={avatarPreview} // Force re-render if preview URL changes
                      loader={imageLoader}
                      src={avatarPreview}
                      alt="用户头像"
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                   <label htmlFor="avatarUpload" className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                        <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                   </label>
                </div>
                <input
                    id="avatarUpload"
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                />
                <label htmlFor="avatarUpload" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
                    更换头像
                </label>
                {avatarFile && <p className="text-xs text-slate-500">已选择: {avatarFile.name}</p>}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
                <Input type="text" name="username" value={user?.username || ''} readOnly />
                <p className="text-xs text-slate-400 mt-1">用户名注册后不可修改。</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
                <Input type="email" name="email" value={user?.email || ''} readOnly />
                <p className="text-xs text-slate-400 mt-1">邮箱用于登录和接收通知，暂不支持修改。</p>
              </div>

              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-1.5">
                  昵称 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nickname"
                  placeholder="设置一个友好的昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户角色</label>
                <Input type="text" value={user?.role || ''} readOnly />
              </div>

              <div className="pt-4">
                <Button type="submit" variant="success" className="w-full" size="large" isLoading={saving}>
                  保存更改
                </Button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}