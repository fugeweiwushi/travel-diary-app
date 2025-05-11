"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image"; // Import Next.js Image component
import { useRouter } from "next/navigation";

// Placeholder for UI components
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
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
}

const MyDiaryCard = ({ diary, onDelete }: { diary: Diary, onDelete: (id: string) => void }) => {
  const router = useRouter();
  const displayImageSrc = diary.images && diary.images.length > 0 ? diary.images[0] : "/placeholder-image.png";

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div 
        className="relative w-full h-48 cursor-pointer" 
        onClick={() => router.push(`/m/diaries/${diary.id}`)}
      >
        <Image 
          loader={imageLoader}
          src={displayImageSrc}
          alt={diary.title} 
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
            <h3 
                className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600" 
                title={diary.title}
                onClick={() => router.push(`/m/diaries/${diary.id}`)}
            >
                {diary.title}
            </h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(diary.status)}`}>
                {diary.status === "pending" ? "审核中" : diary.status === "approved" ? "已通过" : "未通过"}
            </span>
        </div>
        {diary.status === "rejected" && diary.rejectReason && (
          <p className="text-xs text-red-600 mb-2">原因: {diary.rejectReason}</p>
        )}
        <p className="text-xs text-gray-400 mb-3">创建于: {new Date(diary.createdAt).toLocaleDateString()}</p>
        <div className="flex justify-end space-x-2">
          {diary.status !== "approved" && (
            <Button 
              onClick={() => router.push(`/m/diaries/edit/${diary.id}`)} 
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1"
            >
              编辑
            </Button>
          )}
          <Button 
            onClick={() => onDelete(diary.id)} 
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function MyDiariesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchMyDiaries = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
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
        setDiaries(diaries.filter(diary => diary.id !== id));
        alert("游记删除成功！");
      } else {
        const data = await res.json();
        setError(data.message || "删除游记失败。");
        alert(`删除失败: ${data.message || "请重试"}`);
      }
    } catch (err) {
      console.error("Delete diary error:", err);
      setError("删除游记时发生错误。");
      alert("删除游记时发生错误。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">我的游记</h1>
          <div>
            <Button onClick={() => router.push("/m/diaries/publish")} className="bg-green-500 hover:bg-green-600 mr-2">发布新游记</Button>
            <Button onClick={() => router.push("/m/diaries")} className="bg-gray-500 hover:bg-gray-600">返回广场</Button>
          </div>
        </div>
      </header>

      {loading && <p className="text-center text-gray-600">加载中...</p>}
      {error && <p className="text-center text-red-500 bg-red-100 p-3 rounded">错误: {error}</p>}
      
      {!loading && diaries.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg mb-4">你还没有发布任何游记哦。</p>
          <Button onClick={() => router.push("/m/diaries/publish")} className="bg-green-500 hover:bg-green-600">
            去发布第一篇游记
          </Button>
        </div>
      )}

      {!loading && diaries.length > 0 && (
        <div className="container mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {diaries.map(diary => (
            <MyDiaryCard key={diary.id} diary={diary} onDelete={handleDeleteDiary} />
          ))}
        </div>
      )}
    </div>
  );
}

