"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// --- UI Components (Copied from previous refined version) ---
const Input = ({ type, placeholder, value, onChange, className }) => ( // Assuming Input might be needed later or for consistency
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 w-full text-sm shadow-sm hover:border-gray-400 ${className}`}
  />
);

const Button = ({ children, onClick, className, type = "button", disabled = false, variant = "primary", size = "normal" }) => {
  const baseStyle = "font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center shadow-sm";

  const sizes = {
    small: "px-3 py-1.5 text-xs",
    normal: "px-4 py-2 text-sm",
    large: "px-6 py-2.5 text-base",
  };

  const variants = {
    primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 ${disabled ? 'bg-indigo-400 cursor-not-allowed opacity-70' : ''}`,
    secondary: `bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-300 ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-70' : ''}`,
    ghost: `bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400 ${disabled ? 'text-slate-400 cursor-not-allowed opacity-70' : ''}`,
    danger: `bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 ${disabled ? 'bg-red-300 cursor-not-allowed opacity-70' : ''}`,
    dangerOutline: `bg-transparent hover:bg-red-50 text-red-600 border border-red-500 focus:ring-red-400 ${disabled ? 'text-red-300 border-red-300 cursor-not-allowed opacity-70' : ''}`,
    warningOutline: `bg-transparent hover:bg-yellow-50 text-yellow-600 border border-yellow-500 focus:ring-yellow-400 ${disabled ? 'text-yellow-300 border-yellow-300 cursor-not-allowed opacity-70' : ''}`,
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
  content: string;
  images: string[];
  videoUrl?: string;
  author: DiaryAuthor;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
}

// --- MyDiaryCard Component (Refined Styling) ---
const MyDiaryCard = ({ diary, onDelete }: { diary: Diary, onDelete: (id: string) => void }) => {
  const router = useRouter();
  const displayImageSrc = diary.images && diary.images.length > 0 ? diary.images[0] : "/placeholder-image.png";

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    // Assuming your backend serves images from a '/uploads' or similar path relative to its root
    return `http://localhost:5000${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}`;
  };

  const getStatusStyles = (status: "pending" | "approved" | "rejected") => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "rejected":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const statusText = {
    pending: "审核中",
    approved: "已通过",
    rejected: "未通过",
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-out group hover:shadow-xl">
      <div
        className="relative w-full h-44 cursor-pointer group" // Slightly reduced height
        onClick={() => router.push(`/m/diaries/${diary.id}`)}
      >
        <Image
          loader={imageLoader}
          src={displayImageSrc}
          alt={diary.title || "游记图片"}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          onError={(e) => e.currentTarget.src = '/placeholder-image.png'}
        />
      </div>
      <div className="p-3.5"> {/* Slightly reduced padding */}
        <div className="flex justify-between items-start mb-1.5">
          <h3
            className="text-md font-semibold text-gray-800 truncate cursor-pointer group-hover:text-indigo-600 transition-colors duration-300 flex-1 pr-2" // flex-1 to take available space
            title={diary.title}
            onClick={() => router.push(`/m/diaries/${diary.id}`)}
          >
            {diary.title || "无标题游记"}
          </h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusStyles(diary.status)}`}>
            {statusText[diary.status] || diary.status}
          </span>
        </div>
        {diary.status === "rejected" && diary.rejectReason && (
          <div className="text-xs text-red-600 mt-1 mb-2 p-1.5 bg-red-50 rounded-md border border-red-200">
            <span className="font-semibold">拒绝原因:</span> {diary.rejectReason}
          </div>
        )}
        <p className="text-xs text-gray-400 mb-2.5">
          创建于: {new Date(diary.createdAt).toLocaleDateString("zh-CN", { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
        <div className="flex justify-end space-x-2 pt-1 border-t border-slate-100 mt-2">
          {diary.status !== "approved" && ( // Can edit if pending or rejected
            <Button
              onClick={() => router.push(`/m/diaries/edit/${diary.id}`)}
              variant="warningOutline" // Or a more suitable variant
              size="small"
            >
              编辑
            </Button>
          )}
          <Button
            onClick={() => onDelete(diary.id)}
            variant="dangerOutline"
            size="small"
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Main MyDiariesPage Component ---
export default function MyDiariesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchMyDiaries = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setError("用户未登录，请先登录。");
      router.push("/m/auth/login");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/diaries/my", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "获取我的游记列表失败");
      }
      const data = await res.json();
      setDiaries(data);
    } catch (err) {
      console.error("Fetch my diaries error:", err);
      setError(err.message || "加载我的游记时发生错误。");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchMyDiaries();
  }, [fetchMyDiaries]);

  const handleDeleteDiary = async (id: string) => {
    // Consider using a custom modal for better UX instead of confirm/alert
    if (!confirm("确定要删除这篇游记吗？此操作不可恢复。")) {
      return;
    }
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setDiaries(prevDiaries => prevDiaries.filter(diary => diary.id !== id));
        // alert("游记删除成功！"); // Replace with a toast notification for better UX
      } else {
        const data = await res.json();
        setError(data.message || "删除游记失败。");
        // alert(`删除失败: ${data.message || "请重试"}`); // Replace with a toast
      }
    } catch (err) {
      console.error("Delete diary error:", err);
      setError("删除游记时发生错误。");
      // alert("删除游记时发生错误。"); // Replace with a toast
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 selection:bg-indigo-100">
      <header className="mb-6 sticky top-0 bg-white/90 backdrop-blur-lg py-3 shadow-sm z-20 rounded-b-lg">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 px-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">
            我的游记
          </h1>
          <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap justify-center gap-y-2">
            <Button onClick={() => router.push("/m/diaries/publish")} variant="primary" size="normal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 -ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                发布新游记
            </Button>
            <Button onClick={() => router.push("/m")} variant="secondary" size="normal"> {/* Changed to /m for main plaza */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 -ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                返回广场
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-500 mt-3.5 text-md">加载中...</p>
          </div>
        )}
        {error && !loading && ( // Show error only if not loading
          <div className="text-center text-red-700 bg-red-50 p-4 rounded-md shadow-sm border border-red-200 max-w-xl mx-auto my-6">
            <h3 className="font-semibold text-md mb-1">操作失败</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && diaries.length === 0 && !error && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-slate-500 text-xl mb-4">你还没有发布任何游记哦。</p>
            <Button onClick={() => router.push("/m/diaries/publish")} variant="primary" size="large">
              去发布第一篇游记
            </Button>
          </div>
        )}

        {!loading && diaries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {diaries.map(diary => (
              <MyDiaryCard key={diary.id} diary={diary} onDelete={handleDeleteDiary} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}