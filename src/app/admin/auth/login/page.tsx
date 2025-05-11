"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder for UI components (e.g., from shadcn/ui)
const Input = ({ type, placeholder, value, onChange, className }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} />
);
const Button = ({ children, onClick, className, type = "button", disabled = false }) => (
  <button type={type} onClick={onClick} className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${className}`} disabled={disabled}>
    {children}
  </button>
);

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('用户名和密码不能为空。');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        
        const adminInfo = { id: data.id, username: data.username, nickname: data.nickname, role: data.role };
        localStorage.setItem('adminUser', JSON.stringify(adminInfo)); // Store admin user info


        router.push('/admin/dashboard'); // Redirect to admin dashboard
      } else {
        setError(data.message || '登录失败，请检查您的凭据。');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('登录过程中发生错误，请稍后再试。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="bg-gray-900 p-8 md:p-12 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">审核管理系统登录</h1>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-900 bg-opacity-50 p-3 rounded text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">用户名</label>
            <Input
              type="text"
              id="username"
              placeholder="请输入管理员用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">密码</label>
            <Input
              type="password"
              id="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button type="submit" className="w-full py-3 text-lg" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </Button>
        </form>
      </div>
    </div>
  );
}

