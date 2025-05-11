"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component
import { useRouter } from 'next/navigation';

// Placeholder for UI components
const Input = ({ type, placeholder, value, onChange, className }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} />
);
const Button = ({ children, onClick, className, type = "button", disabled = false }) => (
  <button type={type} onClick={onClick} className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${className}`} disabled={disabled}>
    {children}
  </button>
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
  authorNickname: string; 
  authorAvatar?: string; 
  createdAt: string;
  status: string;
}

const DiaryCard = ({ diary }: { diary: Diary }) => {
  const router = useRouter();
  const displayImageSrc = diary.images && diary.images.length > 0 ? diary.images[0] : '/placeholder-image.png';
  const imageLoader = ({ src, width, quality }) => {
    // If it's an external URL (starts with http) or a placeholder, return it directly
    if (src.startsWith('http') || src.startsWith('/placeholder-image.png') || src.startsWith('/default-avatar.png')) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    // Otherwise, assume it's a relative path from the backend
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  const authorAvatarSrc = diary.author?.avatarUrl || '/default-avatar.png';

  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out" 
      onClick={() => router.push(`/m/diaries/${diary.id}`)}
    >
      <div className="relative w-full h-48">
        <Image 
            loader={imageLoader}
            src={displayImageSrc} 
            alt={diary.title} 
            layout="fill"
            objectFit="cover"
            onError={(e) => e.currentTarget.src = '/placeholder-image.png'} // Fallback for Next/Image is more complex, often handled by loader or placeholder
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1 truncate text-gray-800" title={diary.title}>{diary.title}</h3>
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <div className="relative w-5 h-5 rounded-full mr-2 overflow-hidden">
            <Image 
                loader={imageLoader}
                src={authorAvatarSrc} 
                alt={diary.author?.nickname || '作者'} 
                layout="fill"
                objectFit="cover"
            />
          </div>
          <span>{diary.author?.nickname || '匿名用户'}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">{new Date(diary.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

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
    setError('');
    try {
      const queryParams = new URLSearchParams({
        pageNumber: currentPage.toString(),
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
    } catch (err) {
      console.error("Fetch diaries error:", err);
      setError(err.message || '加载游记时发生错误。');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDiaries(1, searchTermTitle, searchTermAuthor);
  }, [fetchDiaries, searchTermTitle, searchTermAuthor]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); 
    setDiaries([]); 
    fetchDiaries(1, searchTermTitle, searchTermAuthor);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      fetchDiaries(page + 1, searchTermTitle, searchTermAuthor);
    }
  };
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6 sticky top-0 bg-gray-100 py-4 z-10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 sm:mb-0">旅游日记广场</h1>
            <div>
              {isLoggedIn ? (
                <>
                  <Button onClick={() => router.push('/m/diaries/publish')} className="mr-2 bg-green-500 hover:bg-green-600">发布游记</Button>
                  <Button onClick={() => router.push('/m/my-diaries')} className="bg-purple-500 hover:bg-purple-600">我的游记</Button>
                </>
              ) : (
                <Button onClick={() => router.push('/m/auth/login')} className="bg-blue-500 hover:bg-blue-600">登录/注册</Button>
              )}
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-2">
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
            <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600">搜索</Button>
          </form>
        </div>
      </header>

      {loading && diaries.length === 0 && <p className="text-center text-gray-600">加载中...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded">错误: {error}</p>}
      
      {!loading && diaries.length === 0 && !error && <p className="text-center text-gray-500">没有找到符合条件的游记。</p>}

      <div className="container mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {diaries.map(diary => (
          <DiaryCard key={diary.id} diary={diary} />
        ))}
      </div>

      {loading && diaries.length > 0 && <p className="text-center text-gray-600 mt-4">正在加载更多...</p>}
      {!loading && page < totalPages && (
        <div className="text-center mt-6">
          <Button onClick={loadMore} className="bg-gray-700 hover:bg-gray-800">
            加载更多
          </Button>
        </div>
      )}
      {!loading && page >= totalPages && diaries.length > 0 && (
         <p className="text-center text-gray-500 mt-6">已加载全部游记。</p>
      )}
    </div>
  );
}

