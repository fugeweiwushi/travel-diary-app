"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// 考虑引入一些图标库，例如 heroicons 或 react-icons
// import { EyeIcon, CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon, ChevronDownIcon, UserCircleIcon, LogoutIcon } from '@heroicons/react/24/outline';


// --- UI Components (微调以适应PC优化) ---
const Button = ({ children, onClick, className = '', type = "button", disabled = false, variant = "primary", size = "normal", iconOnly = false, title }) => {
  const baseStyle = `font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 inline-flex items-center justify-center shadow-md active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60`;
  
  const sizes = {
    xs: `${iconOnly ? 'p-1.5' : 'px-2.5 py-1'} text-xs`,
    small: `${iconOnly ? 'p-2' : 'px-3.5 py-1.5'} text-sm`,
    normal: `${iconOnly ? 'p-2.5' : 'px-4 py-2'} text-sm`,
    large: `${iconOnly ? 'p-3' : 'px-6 py-2.5'} text-base`,
  };

  const variants = {
    primary: `bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500`,
    secondary: `bg-slate-700 hover:bg-slate-600 text-slate-200 focus:ring-slate-500 border border-slate-600`,
    danger: `bg-red-600 hover:bg-red-500 text-white focus:ring-red-500`,
    success: `bg-green-600 hover:bg-green-500 text-white focus:ring-green-500`,
    warning: `bg-yellow-500 hover:bg-yellow-600 text-slate-900 focus:ring-yellow-400`, // text-slate-900 for better contrast on yellow
    info: `bg-sky-500 hover:bg-sky-400 text-white focus:ring-sky-400`,
    pink: `bg-pink-500 hover:bg-pink-400 text-white focus:ring-pink-400`,
    ghost: `bg-transparent hover:bg-slate-750 text-slate-300 focus:ring-slate-600`,
    outlineDanger: `bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10 focus:ring-red-500`,
    outlineSuccess: `bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10 focus:ring-green-500`,
  };

  return (<button title={title} type={type} onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>);
};

const Select = ({ value, onChange, options, className = '', disabled = false, icon }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`appearance-none border border-slate-600 bg-slate-700 text-slate-100 py-2.5 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm hover:border-slate-500 w-full ${icon ? 'pl-10 pr-8' : 'px-4 pr-8'} ${className}`}
    >
      {options.map(option => (<option key={option.value} value={option.value} className="bg-slate-800 text-slate-100">{option.label}</option>))}
    </select>
    {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">{icon}</div>}
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
      {/* <ChevronDownIcon className="h-5 w-5" /> */}
       <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
    </div>
  </div>
);

const Input = ({ type = "text", placeholder, value, onChange, className = '', disabled = false, icon }) => (
  <div className="relative">
    {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">{icon}</div>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`border border-slate-600 bg-slate-700 text-slate-100 py-2 rounded-lg shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm hover:border-slate-500 w-full ${icon ? 'pl-10' : 'px-3'} ${className}`}
    />
  </div>
);


// --- Interfaces ---
interface DiaryAuthor { id: string; nickname: string; avatarUrl?: string; }
interface Diary { id: string; title: string; content: string; images: string[]; videoUrl?: string; author: DiaryAuthor; createdAt: string; status: "pending" | "approved" | "rejected"; rejectReason?: string; }

// --- AdminDiaryRow Component (PC Style Update) ---
const AdminDiaryRow = ({ diary, onApprove, onReject, onDelete }) => {
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const router = useRouter(); // Still useful for diary link

  const handleRejectAttempt = () => { /* ... (逻辑不变) ... */ 
    const reasonToSubmit = rejectReasonInput.trim();
    if (diary.status === 'pending' && reasonToSubmit === "") { alert('待审核的游记，请输入拒绝原因。'); return; }
    onReject(diary.id, reasonToSubmit);
  };

  const getStatusPill = (status) => {
    let pillClass = 'px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap';
    let icon = null;
    let text = '';

    if (status === 'approved') {
      pillClass += ' bg-green-700/80 text-green-100'; text = '已通过';
      // icon = <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />;
    } else if (status === 'rejected') {
      pillClass += ' bg-red-700/80 text-red-100'; text = '已拒绝';
      // icon = <XCircleIcon className="w-3.5 h-3.5 mr-1" />;
    } else if (status === 'pending') {
      pillClass += ' bg-yellow-600/80 text-yellow-100'; text = '待审核';
      // icon = <PencilIcon className="w-3.5 h-3.5 mr-1" />;
    } else {
      pillClass += ' bg-slate-600 text-slate-100'; text = status;
    }
    return <span className={pillClass}>{icon}{text}</span>;
  };

  return (
    <tr className="border-b border-slate-700/70 hover:bg-slate-800 transition-colors duration-150 group">
      <td className="py-3.5 px-5">
        <div
          className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 cursor-pointer transition-colors truncate block max-w-sm"
          title={diary.title}
          onClick={() => window.open(`/m/diaries/${diary.id}`, '_blank')} // PC: open in new tab
        >
          {diary.title || <span className="text-slate-500 italic">无标题</span>}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">ID: {diary.id}</div>
      </td>
      <td className="py-3.5 px-5 text-sm text-slate-300 whitespace-nowrap">{diary.author?.nickname || 'N/A'}</td>
      <td className="py-3.5 px-5 text-sm text-slate-400 whitespace-nowrap">
        {new Date(diary.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </td>
      <td className="py-3.5 px-5 whitespace-nowrap">
        {getStatusPill(diary.status)}
        {diary.status === 'rejected' && diary.rejectReason && (
          <div className="text-xs text-slate-500 mt-1.5 max-w-xs truncate" title={diary.rejectReason}>
            原因: {diary.rejectReason}
          </div>
        )}
      </td>
      <td className="py-3.5 px-5 whitespace-nowrap">
        {diary.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button onClick={() => onApprove(diary.id)} variant="success" size="xs" title="通过">
              {/* <CheckCircleIcon className="w-4 h-4 mr-1" /> */}
              通过
            </Button>
            <div className="flex items-center gap-1.5 min-w-[220px]">
                <Input
                    placeholder="拒绝原因 (必填)"
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    className="text-xs py-1 px-2 flex-grow focus:ring-red-500 focus:border-red-500"
                />
                <Button onClick={handleRejectAttempt} variant="outlineDanger" size="xs" title="拒绝">
                    {/* <XCircleIcon className="w-4 h-4 mr-1" /> */}
                    拒绝
                </Button>
            </div>
          </div>
        )}
        {diary.status === 'approved' && (
             <Button onClick={() => onReject(diary.id, '管理员撤销通过')} variant="warning" size="xs" title="撤销通过">撤销</Button>
        )}
        {diary.status === 'rejected' && (
             <Button onClick={() => onApprove(diary.id)} variant="info" size="xs" title="重新审核">重审</Button>
        )}
      </td>
      <td className="py-3.5 px-5 whitespace-nowrap">
        <Button onClick={() => onDelete(diary.id)} variant="ghost" size="xs" iconOnly title="删除游记">
            {/* <TrashIcon className="w-4 h-4 text-pink-500 hover:text-pink-400" /> */}
             <span className="text-pink-500 hover:text-pink-400">删除</span>
        </Button>
      </td>
    </tr>
  );
};

const statusOptions = [ { value: 'all', label: '所有状态' }, { value: 'pending', label: '待审核' }, { value: 'approved', label: '已通过' }, { value: 'rejected', label: '已拒绝' }];

// --- AdminDashboardPage (PC Style Update) ---
export default function AdminDashboardPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const router = useRouter();

  useEffect(() => { /* ... (逻辑不变) ... */ 
    const token = typeof window !== "undefined" ? localStorage.getItem('adminToken') : null;
    const userJson = typeof window !== "undefined" ? localStorage.getItem('adminUser') : null;
    if (!token || !userJson) { router.push('/admin/auth/login'); return; }
    try { setAdminUser(JSON.parse(userJson)); } catch (e) { console.error("Failed to parse admin user", e); localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); router.push('/admin/auth/login');}
  }, [router]);

  const fetchAdminDiaries = useCallback(async (status = 'all', pageNum = 1) => { // Added pageNum for potential pagination later
    const token = localStorage.getItem('adminToken'); if (!token) return; setLoading(true); setError('');
    try {
      let url = `http://localhost:5000/api/admin/diaries?pageNumber=${pageNum}`; // Example for pagination
      if (status !== 'all') { url += `&status=${status}`; }
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) { const errData = await res.json(); if (res.status === 401 || res.status === 403) { localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); router.push('/admin/auth/login'); } throw new Error(errData.message || '获取游记列表失败'); }
      const data = await res.json(); 
      setDiaries(Array.isArray(data.diaries) ? data.diaries : Array.isArray(data) ? data : []);
      // setTotalPages(data.pages); // For pagination
    } catch (err) { console.error("Fetch admin diaries error:", err); setError(err.message || '加载游记数据时发生错误。'); setDiaries([]); }
    setLoading(false);
  }, [router]);

  useEffect(() => { if (localStorage.getItem('adminToken')) { fetchAdminDiaries(filterStatus); } }, [fetchAdminDiaries, filterStatus]);

  const handleAction = async (actionType: 'approve' | 'reject' | 'delete', diaryId: string, reason?: string) => { /* ... (逻辑不变) ... */ 
    const token = localStorage.getItem('adminToken'); if (!token) return; setError('');
    const confirmMessages = { delete: '确定要删除这篇游记吗？此操作会通知用户但游记本身会被软删除。', approve: '确定要通过这篇游记吗？', reject: '确定要拒绝这篇游记吗？' };
    if (!confirm(confirmMessages[actionType])) return;
    let url = `http://localhost:5000/api/admin/diaries/${diaryId}/${actionType}`; let method = 'PUT'; const body: { rejectReason?: string } = {};
    if (actionType === 'reject') { const processedReason = (typeof reason === 'string' ? reason.trim() : ''); if (processedReason === '') { alert('拒绝原因不能为空。'); setError('拒绝原因不能为空。'); return; } body.rejectReason = processedReason;}
    if (actionType === 'delete') { method = 'DELETE';}
    const requestBody = Object.keys(body).length > 0 ? JSON.stringify(body) : undefined;
    try {
      const res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: requestBody,});
      const responseText = await res.text(); 
      if (!res.ok) { let errData; try { errData = JSON.parse(responseText); } catch (e) { errData = { message: responseText || `${actionType}操作失败` }; } if (res.status === 401 || res.status === 403) {localStorage.removeItem('adminToken');localStorage.removeItem('adminUser');router.push('/admin/auth/login');} throw new Error(errData.message || `${actionType}操作失败`);}
      alert(`游记已成功${actionType === 'approve' ? '通过' : actionType === 'reject' ? '拒绝' : '删除'}。`);
      fetchAdminDiaries(filterStatus);
    } catch (err) { const errorMessage = err.message || `操作失败`; setError(errorMessage); alert(`操作失败: ${errorMessage}`);}
  };
  
  const handleLogout = () => { /* ... (逻辑不变) ... */ localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); setAdminUser(null); router.push('/admin/auth/login'); };

  if (!adminUser && typeof window !== "undefined" && !localStorage.getItem('adminToken')) { return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 text-lg">正在重定向到登录页面...</div>; }
  if (!adminUser) { return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 text-lg">正在加载管理员信息...</div>; }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 selection:bg-indigo-500 selection:text-white flex flex-col">
      <header className="sticky top-0 bg-slate-800/70 backdrop-blur-xl py-4 shadow-2xl z-30 border-b border-slate-700/50">
        <div className="container mx-auto max-w-screen-xl flex items-center justify-between gap-4 px-6 lg:px-8"> {/* max-w-screen-xl for wider PC layout */}
          <h1 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
            审核管理中心
          </h1>
          <div className="flex items-center space-x-4">
            {/* <UserCircleIcon className="w-7 h-7 text-slate-400" /> */}
            <span className="text-slate-300 text-sm hidden md:inline">欢迎, <span className="font-medium">{adminUser?.username}</span> ({adminUser?.role})</span>
            <Button onClick={handleLogout} variant="outlineDanger" size="small" title="退出登录">
              {/* <LogoutIcon className="w-4 h-4 mr-1.5" /> */}
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-screen-xl py-6 lg:py-8 px-6 lg:px-8">
        <div className="bg-slate-850 shadow-2xl rounded-xl p-6 lg:p-8">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-700/50 pb-5">
            <h2 className="text-xl lg:text-2xl font-semibold text-slate-100">游记审核列表</h2>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={statusOptions}
              className="w-full md:w-56" // More specific width for PC
              // icon={<FilterIcon className="w-4 h-4"/>}
            />
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-indigo-500 mb-4"></div>
              <p className="text-lg">正在加载审核列表...</p>
            </div>
          )}
          {error && !loading && (
            <div className="text-center text-red-300 bg-red-700/30 p-4 rounded-lg my-6 border border-red-600">
              <p className="font-semibold text-lg mb-1">:( 操作时发生错误</p>,
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {!loading && diaries.length === 0 && !error && (
             <div className="text-center text-slate-500 py-16">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600/70 mx-auto mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}> {/* Softer icon stroke */}
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5H19.5M8.25 12H19.5M8.25 16.5H19.5M3.75 7.5H5.25M3.75 12H5.25M3.75 16.5H5.25" />
                </svg>
                <p className="text-xl mb-1">暂无数据</p>
                <p className="text-sm">没有找到符合当前筛选条件的游记。</p>
             </div>
          )}

          {!loading && diaries.length > 0 && (
            <div className="overflow-x-auto shadow-lg rounded-lg border border-slate-700/50">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">标题 / ID</th>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">作者</th>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">发布日期</th>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[300px]">审核操作</th>
                    <th className="py-3.5 px-5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">管理</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-850 divide-y divide-slate-700/50">
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
          {/* Pagination can be added here */}
        </div>
      </main>
       <footer className="text-center py-4 text-xs text-slate-600 border-t border-slate-700/50 mt-auto">
            © {new Date().getFullYear()} 管理后台
       </footer>
    </div>
  );
}