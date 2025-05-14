"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// --- Refined UI Components for Mobile ---
const Input = ({ type = "text", placeholder, value, onChange, className = '', disabled = false, ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-base ${className}`}
    {...props}
  />
);

const Textarea = ({ placeholder, value, onChange, className = '', rows = 5, disabled = false, ...props }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    disabled={disabled}
    className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-base resize-y ${className}`}
    {...props}
  ></textarea>
);

// Re-using the Button component from previous optimizations, with mobile-friendly defaults/adjustments
const Button = ({ children, onClick, className = '', type = "button", disabled = false, variant = "primary", size = "normal", iconOnly = false, title }) => {
  const baseStyle = `font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 inline-flex items-center justify-center shadow-md active:shadow active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70`; // ring-offset-slate-100 for lighter bg

  const sizes = { // Mobile-first sizes, can be made larger for "large" if needed
    small: `${iconOnly ? 'p-2' : 'px-3 py-1.5'} text-sm`,
    normal: `${iconOnly ? 'p-2.5' : 'px-5 py-2.5'} text-base`, // Default good for mobile buttons
    large: `${iconOnly ? 'p-3' : 'px-7 py-3'} text-lg`,
  };

  const variants = { // Variants suitable for a lighter theme on mobile form pages
    primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500`,
    secondary: `bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400 border border-slate-300`,
    danger: `bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`,
    success: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`, // Green for submit
    ghost: `bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400`,
  };
  return (<button title={title} type={type} onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>);
};


interface DiaryData {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  status?: string;
}

export default function EditDiaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [diaryStatus, setDiaryStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const imageLoader = ({ src, width, quality }) => { /* ... (loader logic remains) ... */ 
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) { return `${src}?w=${width}&q=${quality || 75}`; }
    return `http://localhost:5000${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}`;
  };


  const fetchDiaryForEdit = useCallback(async () => { /* ... (fetch logic remains mostly the same, ensure correct redirects and error handling) ... */ 
    if (!id) { setError("游记ID无效。"); setLoading(false); return; }
    setLoading(true); setError('');
    const token = localStorage.getItem("token");
    if (!token) { setError("用户未登录，无法编辑游记。"); setLoading(false); router.push("/m/auth/login"); return;}
    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) { const errData = await res.json(); if (res.status === 403) { setError(errData.message || "您无权编辑此游记，或此游记已被审核通过。"); } else { setError(errData.message || "获取游记详情失败"); } setLoading(false); return; }
      const data: DiaryData = await res.json();
      if (data.status === 'approved') { setError("已通过审核的游记不能编辑。"); setLoading(false); return; }
      setTitle(data.title); setContent(data.content); setCurrentImages(data.images || []); setVideoUrl(data.videoUrl || ''); setDiaryStatus(data.status || '');
    } catch (err) { console.error("Fetch diary for edit error:", err); setError(err.message || "加载游记数据时发生错误。"); }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchDiaryForEdit(); }, [fetchDiaryForEdit]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { /* ... (submit logic remains mostly the same) ... */ 
    e.preventDefault(); setError(''); setSubmitLoading(true);
    if (!title || !content) { setError('标题和内容不能为空。'); setSubmitLoading(false); return; }
    if (diaryStatus === 'approved') { setError("已通过审核的游记不能再次提交编辑。"); setSubmitLoading(false); return; }
    const token = localStorage.getItem("token");
    if (!token) { setError("认证失败，请重新登录。"); setSubmitLoading(false); return; }
    const payload = { title, content, videoUrl: videoUrl || null };
    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const responseData = await res.json();
      if (res.ok) { alert('游记更新成功！将跳转回我的游记列表。'); router.push('/m/my-diaries'); } else { setError(responseData.message || '更新游记失败。'); }
    } catch (err) { console.error('Update diary error:', err); setError('更新过程中发生错误，请稍后再试。'); }
    setSubmitLoading(false);
  };

  // --- Render States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-600 text-lg">加载游记数据中...</p>
      </div>
    );
  }

  const shouldBlockEditing = diaryStatus === 'approved' || (!id && !loading); // If ID is missing after load attempt
  if (error && shouldBlockEditing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md w-full">
          {/* <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-3" /> */}
           <svg className="w-12 h-12 text-red-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-red-600 text-lg font-medium mb-1">操作受限</p>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="secondary" className="w-full">
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Form ---
  return (
    <div className="min-h-screen bg-slate-100 pb-16 selection:bg-indigo-100">
      {/* Header for Mobile */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm py-3.5 z-20">
        <div className="container mx-auto max-w-3xl px-4 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="small" className="!px-2 !py-1">
            {/* <ChevronLeftIcon className="w-5 h-5 mr-1" /> */}
             <svg className="w-5 h-5 mr-0.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            取消
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">
            编辑游记
          </h1>
          <div className="w-16"> {/* Placeholder for potential right-side action, or to balance title */} </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl p-4 pt-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {error && !submitLoading && ( // Error display within the form
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm" role="alert">
                <strong className="font-semibold">错误: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                游记标题
              </label>
              <Input
                type="text"
                id="title"
                placeholder="例如：我的精彩日本之旅"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={diaryStatus === 'approved'}
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1.5">
                游记内容
              </label>
              <Textarea
                id="content"
                placeholder="详细记录您的旅行见闻与感受..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12} // Increased rows for better mobile editing
                disabled={diaryStatus === 'approved'}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">当前图片 (编辑模式暂不支持修改图片)</label>
              {currentImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 mb-2"> {/* Mobile: 2 columns is usually good */}
                  {currentImages.map((imgUrl, index) => (
                    <div key={index} className="relative aspect-video border rounded-lg overflow-hidden shadow-sm"> {/* aspect-video or aspect-square */}
                      <Image loader={imageLoader} src={imgUrl} alt={`当前图片 ${index + 1}`} layout="fill" objectFit="cover" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 py-2">暂无图片。</p>}
              {/* <p className="text-xs text-slate-400 mt-1">如需修改图片，请删除游记后重新发布。</p> */}
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-slate-700 mb-1.5">
                视频链接 (可选)
              </label>
              <Input
                type="url"
                id="videoUrl"
                placeholder=""
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={diaryStatus === 'approved'}
              />
            </div>

            <div className="pt-5">
              <Button 
                type="submit" 
                className="w-full py-3" 
                variant="success"
                size="large"
                disabled={submitLoading || diaryStatus === 'approved'}
              >
                {submitLoading ? '更新中...' : '确认更新游记'}
              </Button>
              {diaryStatus === 'approved' && (
                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md mt-3 text-center">提示：此游记已通过审核，内容不可再编辑。</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}