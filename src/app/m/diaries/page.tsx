"use client";

import React, { useEffect, useState, useCallback } from 'react';
// import Link from 'next/link'; // Not explicitly used, can be removed if not needed elsewhere
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// --- UI Components (Further Refined Styling) ---
const Input = ({ type, placeholder, value, onChange, className }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-full text-sm shadow-sm hover:border-gray-400 ${className}`}
  />
);

const Button = ({ children, onClick, className, type = "button", disabled = false, variant = "primary", size = "normal" }) => {
  const baseStyle = "font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center shadow-sm"; // Added inline-flex, items-center, justify-center

  const sizes = {
    small: "px-3 py-1.5 text-xs",
    normal: "px-4 py-2 text-sm", // Adjusted padding
    large: "px-6 py-2.5 text-base",
  };

  const variants = {
    primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 ${disabled ? 'bg-indigo-400 cursor-not-allowed opacity-70' : ''}`,
    secondary: `bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-300 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-70' : ''}`, // Subtle border
    ghost: `bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400 ${disabled ? 'text-slate-400 cursor-not-allowed opacity-70' : ''}`,
    danger: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 ${disabled ? 'bg-red-300 cursor-not-allowed opacity-70' : ''}`,
    dangerOutline: `bg-transparent hover:bg-red-50 text-red-600 border border-red-500 focus:ring-red-400 ${disabled ? 'text-red-300 border-red-300 cursor-not-allowed opacity-70' : ''}`,
    // Add more variants as needed: success, warning, link etc.
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyle} ${sizes[size]} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// --- Interfaces ---
interface DiaryAuthor {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

interface Diary {
  id: string;
  title: string;
  content: string; // Consider making this optional if not always present in card preview
  images: string[];
  videoUrl?: string;
  author: DiaryAuthor;
  createdAt: string;
  status: string;
}

// --- DiaryCard Component (Subtle Refinements) ---
const DiaryCard = ({ diary }: { diary: Diary }) => {
  const router = useRouter();
  const displayImageSrc = diary.images && diary.images.length > 0 ? diary.images[0] : '/placeholder-image.png';

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith('http') || src.startsWith('/placeholder-image.png') || src.startsWith('/default-avatar.png')) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  const authorAvatarSrc = diary.author?.avatarUrl || '/default-avatar.png';

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 ease-out group hover:shadow-xl" // Softer shadow, refined hover
      onClick={() => router.push(`/m/diaries/${diary.id}`)}
    >
      <div className="relative w-full h-48"> {/* Adjusted height if needed */}
        <Image
            loader={imageLoader}
            src={displayImageSrc}
            alt={diary.title || '游记图片'}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105" // Subtle zoom on hover
            onError={(e) => e.currentTarget.src = '/placeholder-image.png'}
        />
      </div>
      <div className="p-4"> {/* Slightly reduced padding */}
        <h3 className="text-lg font-semibold mb-1.5 text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 truncate" title={diary.title}>
          {diary.title || '无标题游记'}
        </h3>
        <div className="flex items-center text-sm text-gray-500 mb-2.5">
          <div className="relative w-5 h-5 rounded-full mr-2 overflow-hidden border border-gray-200">
            <Image
                loader={imageLoader}
                src={authorAvatarSrc}
                alt={diary.author?.nickname || '作者'}
                layout="fill"
                objectFit="cover"
            />
          </div>
          <span className="font-medium text-gray-700">{diary.author?.nickname || '匿名用户'}</span>
        </div>
        <p className="text-xs text-gray-400">{new Date(diary.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

// --- Main DiariesPage Component ---
export default function DiariesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTermTitle, setSearchTermTitle] = useState('');
  const [searchTermAuthor, setSearchTermAuthor] = useState('');
  const router = useRouter();

  const fetchDiaries = useCallback(async (currentPage = 1, title = '', authorNickname = '') => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        pageNumber: currentPage.toString(),
        pageSize: '12'
      });
      if (title) queryParams.append('title', title);
      if (authorNickname) queryParams.append('authorNickname', authorNickname);

      const res = await fetch(`http://localhost:5000/api/diaries?${queryParams.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || '获取游记列表失败');
      }
      const data = await res.json();
      setDiaries(prevDiaries => currentPage === 1 ? data.diaries : [...prevDiaries, ...data.diaries]);
      setPage(data.page);
      setTotalPages(data.pages);
      if (currentPage === 1) setError('');
    } catch (err) {
      console.error("Fetch diaries error:", err);
      setError(err.message || '加载游记时发生错误。请稍后重试。');
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    fetchDiaries(1, searchTermTitle, searchTermAuthor);
  }, [fetchDiaries, searchTermTitle, searchTermAuthor]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    // setDiaries([]); // fetchDiaries will replace diaries if page is 1
    fetchDiaries(1, searchTermTitle, searchTermAuthor);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      fetchDiaries(page + 1, searchTermTitle, searchTermAuthor);
    }
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    // This check should ideally be done in a way that doesn't cause hydration mismatch
    // For now, we'll assume it's client-side only and localStorage is available.
    const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    router.push('/m/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 selection:bg-indigo-100">
      <header className="mb-6 sticky top-0 bg-white/90 backdrop-blur-lg py-3 shadow-sm z-20 rounded-b-lg"> {/* Softer shadow, slightly less padding */}
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-3 sm:gap-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
              旅游日记广场
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap justify-center gap-y-2"> {/* Adjusted spacing and gap for wrap */}
              {isLoggedIn ? (
                <>
                  <Button onClick={() => router.push('/m/diaries/publish')} variant="primary" size="normal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 -ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    发布新游记  
                  </Button>
                  <Button onClick={() => router.push('/m/my-diaries')} variant="secondary" size="normal">我的游记</Button>
                  <Button onClick={() => router.push('/m/profile')} variant="secondary" size="normal">个人中心</Button>
                  <Button onClick={handleLogout} variant="dangerOutline" size="normal">退出登录</Button>
                </>
              ) : (
                <Button onClick={() => router.push('/m/auth/login')} variant="primary" size="normal">登录/注册</Button>
              )}
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 items-center">
            <Input
              type="text"
              placeholder="搜索游记标题..."
              value={searchTermTitle}
              onChange={(e) => setSearchTermTitle(e.target.value)}
              className="flex-grow"
            />
            <Input
              type="text"
              placeholder="搜索作者昵称..."
              value={searchTermAuthor}
              onChange={(e) => setSearchTermAuthor(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" variant="primary" size="normal" className="w-full sm:w-auto px-6"> {/* Adjusted padding for search button */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 -ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              搜索
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4">
        {loading && diaries.length === 0 && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-500 mt-3.5 text-md">加载中，请稍候...</p>
          </div>
        )}
        {error && (
          <div className="text-center text-red-700 bg-red-50 p-4 rounded-md shadow-sm border border-red-200 max-w-xl mx-auto my-6">
            <h3 className="font-semibold text-md mb-1">发生错误</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && diaries.length === 0 && !error && (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <p className="text-gray-500 text-lg">没有找到符合条件的游记。</p>
            <p className="text-gray-400 text-xs mt-1">尝试修改搜索条件或浏览其他内容。</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"> {/* Slightly reduced gap */}
          {diaries.map(diary => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>

        {loading && diaries.length > 0 && (
           <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-500 mt-2.5 text-sm">正在加载更多...</p>
          </div>
        )}
        {!loading && page < totalPages && diaries.length > 0 && (
          <div className="text-center mt-8 mb-5">
            <Button onClick={loadMore} variant="secondary" size="large" className="px-10"> {/* Made load more button more prominent */}
              加载更多
            </Button>
          </div>
        )}
        {!loading && page >= totalPages && diaries.length > 0 && (
           <p className="text-center text-gray-400 mt-8 mb-5 text-md">已加载全部游记。</p>
        )}
      </main>
    </div>
  );
}