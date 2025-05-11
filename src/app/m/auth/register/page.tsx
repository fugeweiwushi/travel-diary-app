"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder for UI components (e.g., from shadcn/ui)
const Input = ({ type, placeholder, value, onChange, className }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} />
);
const Button = ({ children, onClick, className, type = "button", disabled = false }) => (
  <button type={type} onClick={onClick} className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${className}`} disabled={disabled}>
    {children}
  </button>
);

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !nickname || !password || !confirmPassword) {
      setError('所有字段均为必填项');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少为6位');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, nickname, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Optionally, log the user in directly or redirect to login page
        alert('注册成功！请登录。'); // Simple alert for now
        router.push('/m/auth/login');
      } else {
        setError(data.message || '注册失败，请检查您输入的信息。');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('注册过程中发生错误，请稍后再试。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">用户注册</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <Input
              type="text"
              id="username"
              placeholder="请输入用户名 (字母和数字)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <Input
              type="text"
              id="nickname"
              placeholder="请输入昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <Input
              type="password"
              id="password"
              placeholder="请输入密码 (至少6位)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <Input
              type="password"
              id="confirmPassword"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          已有账户？{' '}
          <a href="/m/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            立即登录
          </a>
        </p>
      </div>
    </div>
  );
}

