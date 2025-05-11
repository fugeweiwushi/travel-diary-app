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

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('请输入用户名和密码');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Assuming the token is returned in data.token
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.id, username: data.username, nickname: data.nickname, role: data.role, avatarUrl: data.avatarUrl }));
        // Redirect to homepage or dashboard
        router.push('/m'); // Redirect to mobile homepage for now
      } else {
        setError(data.message || '登录失败，请检查您的凭据。');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录过程中发生错误，请稍后再试。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">用户登录</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <Input
              type="text"
              id="username"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <Input
              type="password"
              id="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          还没有账户？{' '}
          <a href="/m/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}

