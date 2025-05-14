"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder for UI components (e.g., from shadcn/ui or custom)
const Button = ({ children, onClick, className = '', type = "button", disabled = false }) => (
  <button 
    type={type} 
    onClick={onClick} 
    className={`px-4 py-2 rounded font-semibold transition-colors duration-150 ${className}`} 
    disabled={disabled}
  >
    {children}
  </button>
);

const Select = ({ value, onChange, options, className = '' }) => (
  <select value={value} onChange={onChange} className={`border p-2 rounded ${className}`}>
    {options.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

interface DiaryAuthor {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

interface Diary {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  author: DiaryAuthor;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
}

const AdminDiaryRow = ({ diary, onApprove, onReject, onDelete }) => {
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const router = useRouter();

  const handleReject = () => {
    if (diary.status === 'pending' && !rejectReasonInput.trim()) {
      alert('请输入拒绝原因。');
      return;
    }
    onReject(diary.id, rejectReasonInput);
    setRejectReasonInput('');
  };
  
  const getStatusClass = (status) => {
    if (status === 'approved') return 'text-green-500';
    if (status === 'rejected') return 'text-red-500';
    if (status === 'pending') return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-750 transition-colors duration-150">
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-200 hover:text-blue-400 cursor-pointer truncate" title={diary.title} onClick={() => router.push(`/m/diaries/${diary.id}`)}>
            {diary.title}
        </div>
        <div className="text-xs text-gray-400">ID: {diary.id}</div>
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-300">{diary.author?.nickname || 'N/A'}</td>
      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-400">{new Date(diary.createdAt).toLocaleDateString()}</td>
      <td className={`py-3 px-4 whitespace-nowrap text-sm font-semibold ${getStatusClass(diary.status)}`}>
        {diary.status === 'pending' ? '待审核' : diary.status === 'approved' ? '已通过' : '已拒绝'}
        {diary.status === 'rejected' && diary.rejectReason && <div className="text-xs text-gray-500 mt-1">原因: {diary.rejectReason}</div>}
      </td>
      <td className="py-3 px-4 whitespace-nowrap text-sm">
        {diary.status === 'pending' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Button onClick={() => onApprove(diary.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs w-full sm:w-auto">通过</Button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 w-full sm:w-auto">
                <input 
                    type="text" 
                    placeholder="拒绝原因 (可选)" 
                    value={rejectReasonInput} 
                    onChange={(e) => setRejectReasonInput(e.target.value)} 
                    className="bg-gray-600 text-white border-gray-500 p-1.5 rounded text-xs w-full sm:w-auto focus:ring-red-500 focus:border-red-500"
                />
                <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white text-xs w-full sm:w-auto">拒绝</Button>
            </div>
          </div>
        )}
        {diary.status === 'approved' && (
             <Button onClick={() => onReject(diary.id, '管理员撤销通过')} className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">撤销通过</Button>
        )}
        {diary.status === 'rejected' && (
             <Button onClick={() => onApprove(diary.id)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">重新审核</Button>
        )}
      </td>
      <td className="py-3 px-4 whitespace-nowrap">
        <Button onClick={() => onDelete(diary.id)} className="bg-pink-600 hover:bg-pink-700 text-white text-xs">删除</Button>
      </td>
    </tr>
  );
};

const statusOptions = [
  { value: 'all', label: '所有状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

export default function AdminDashboardPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    if (!token || !user) {
      router.push('/admin/auth/login');
      return;
    }
    try {
        setAdminUser(JSON.parse(user));
    } catch (e) {
        console.error("Failed to parse admin user from localStorage", e);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin/auth/login');
    }
  }, [router]);

  const fetchAdminDiaries = useCallback(async (status = 'all') => {
    if (!localStorage.getItem('adminToken')) return;
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/admin/diaries';
      if (status !== 'all') {
        url += `?status=${status}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            router.push('/admin/auth/login');
        }
        throw new Error(errData.message || '获取游记列表失败');
      }
      const data = await res.json();
      if (data && data.diaries) {
        setDiaries(data.diaries);
      } else {
        setDiaries([]); // Set to empty array if data.diaries is not available
        console.error("Fetched data does not contain a 'diaries' array:", data);
      }

    } catch (err) {
      console.error("Fetch admin diaries error:", err);
      setError(err.message || '加载游记数据时发生错误。');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
        fetchAdminDiaries(filterStatus);
    }
  }, [fetchAdminDiaries, filterStatus]);

  const handleAction = async (actionType: 'approve' | 'reject' | 'delete', diaryId: string, reason?: string) => {
    if (!localStorage.getItem('adminToken')) return;
    setError('');
    const confirmMessage = actionType === 'delete' ? '确定要删除这篇游记吗？此操作会通知用户但游记本身会被软删除。' : 
                         actionType === 'approve' ? '确定要通过这篇游记吗？' : '确定要拒绝这篇游记吗？';
    if (!confirm(confirmMessage)) return;

    let url = `http://localhost:5000/api/admin/diaries/${diaryId}/${actionType}`;
    let method = 'PUT';
    const body: { rejectReason?: string } = {};

    if (actionType === 'reject' && reason) {
      body.rejectReason = reason;
    }
    if (actionType === 'delete') {
        method = 'DELETE';
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const errData = await res.json();
         if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            router.push('/admin/auth/login');
        }
        throw new Error(errData.message || `${actionType}操作失败`);
      }
      alert(`游记已成功${actionType === 'approve' ? '通过' : actionType === 'reject' ? '拒绝' : '删除'}。`);
      fetchAdminDiaries(filterStatus); // Refresh list
    } catch (err) {
      console.error(`${actionType} diary error:`, err);
      setError(err.message || `操作失败: ${err.message}`);
      alert(`操作失败: ${err.message}`);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/auth/login');
  };

  if (!adminUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white">加载用户信息中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-800 text-gray-100 p-4 md:p-8">
      <header className="mb-8">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-white mb-4 sm:mb-0">审核管理仪表盘</h1>
          <div className="flex items-center">
            <span className="text-gray-300 mr-4">欢迎, {adminUser?.username} ({adminUser?.role})</span>
            <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">退出登录</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl bg-gray-850 shadow-2xl rounded-lg p-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">游记审核列表</h2>
          <Select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)} 
            options={statusOptions} 
            className="bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading && <p className="text-center text-gray-400 py-5">加载审核列表中...</p>}
        {error && <p className="text-center text-red-400 bg-red-900 bg-opacity-50 p-3 rounded mb-4">错误: {error}</p>}
        
        {!loading && diaries.length === 0 && !error && (
          <p className="text-center text-gray-500 py-5">没有找到符合条件的游记。</p>
        )}

        {!loading && diaries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">标题 / ID</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">作者</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">发布日期</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">状态</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">审核操作</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">管理</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {diaries.map(diary => (
                  <AdminDiaryRow 
                    key={diary.id} 
                    diary={diary} 
                    onApprove={(id) => handleAction('approve', id)} 
                    onReject={(id, reason) => handleAction('reject', id, reason)} 
                    onDelete={(id) => handleAction('delete', id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

