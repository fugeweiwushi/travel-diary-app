"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image"; // Import Next.js Image component

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
  authorId: string;
  authorNickname: string;
  authorAvatar?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  rejectReason?: string;
}

// A simple image gallery component using Next/Image
const ImageGallery = ({ images, title }: { images: string[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  if (!images || images.length === 0) {
    return (
        <div className="relative w-full h-64 object-cover rounded-lg shadow-md mb-4 bg-gray-200">
            <Image 
                loader={imageLoader} 
                src="/placeholder-image.png" 
                alt="Placeholder" 
                layout="fill" 
                objectFit="cover" 
            />
        </div>
    );
  }

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative w-full mb-4">
        <div className="relative w-full h-auto max-h-[70vh] aspect-[4/3] rounded-lg shadow-md bg-gray-200 overflow-hidden">
            <Image 
                loader={imageLoader}
                src={images[currentIndex]} 
                alt={`${title} - Image ${currentIndex + 1}`}
                layout="fill"
                objectFit="contain"
                priority={currentIndex === 0} // Prioritize loading the first image
            />
        </div>
      {images.length > 1 && (
        <>
          <button 
            onClick={goToPrevious} 
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity duration-200 z-10"
          >
            &#10094;
          </button>
          <button 
            onClick={goToNext} 
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity duration-200 z-10"
          >
            &#10095;
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png") || src.startsWith("/default-avatar.png")) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user"); // Clear corrupted data
      }
    }
  }, []);

  const fetchDiaryDetail = useCallback(async () => {
    if (!id) {
      setError("游记ID无效。");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "获取游记详情失败");
      }
      const data = await res.json();
      setDiary(data);
    } catch (err) {
      console.error("Fetch diary detail error:", err);
      setError(err.message || "加载游记详情时发生错误。");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDiaryDetail();
  }, [fetchDiaryDetail]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: diary?.title,
        text: `来看看这篇精彩的游记: ${diary?.title}`,
        url: window.location.href,
      })
      .then(() => console.log("Successful share"))
      .catch((error) => console.log("Error sharing", error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("链接已复制到剪贴板！"))
        .catch(() => alert("复制链接失败。"));
    }
  };

  if (loading) return <p className="text-center text-gray-600 p-10">加载中...</p>;
  if (error) return <p className="text-center text-red-500 bg-red-100 p-5 rounded">错误: {error}</p>;
  if (!diary) return <p className="text-center text-gray-500 p-10">未找到该游记。</p>;

  const authorAvatarSrc = diary.author?.avatarUrl || "/default-avatar.png";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden">
        <header className="p-6 border-b border-gray-200">
          <Button onClick={() => router.back()} className="mb-4 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm px-3 py-1">返回</Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{diary.title}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <div className="relative w-8 h-8 rounded-full mr-3 overflow-hidden border border-gray-300">
                <Image 
                    loader={imageLoader}
                    src={authorAvatarSrc} 
                    alt={diary.author?.nickname || "作者"} 
                    layout="fill"
                    objectFit="cover"
                />
            </div>
            <span>作者: {diary.author?.nickname || "匿名用户"}</span>
            <span className="mx-2">|</span>
            <span>发布于: {new Date(diary.createdAt).toLocaleDateString()}</span>
          </div>
        </header>

        <article className="p-6">
          <ImageGallery images={diary.images} title={diary.title} />
          
          {diary.videoUrl && (
            <div className="my-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">相关视频</h2>
              <video 
                src={diary.videoUrl.startsWith("http") ? diary.videoUrl : `http://localhost:5000${diary.videoUrl}`}
                controls 
                className="w-full rounded-lg shadow-md max-h-[60vh] bg-black"
              >
                您的浏览器不支持视频播放。
              </video>
            </div>
          )}

          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {diary.content}
          </div>
        </article>

        <footer className="p-6 border-t border-gray-200 flex justify-end">
          <Button onClick={handleShare} className="bg-teal-500 hover:bg-teal-600">
            分享游记
          </Button>
          {currentUser && diary.authorId === currentUser.id && diary.status !== "approved" && (
             <Button onClick={() => router.push(`/m/diaries/edit/${diary.id}`)} className="ml-2 bg-yellow-500 hover:bg-yellow-600">
                编辑游记
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

