"use client";

import React, { useEffect, useState, useCallback, useRef } from "react"; // Added useRef for potential swipe
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// Re-using the Button component from previous optimizations
const Button = ({ children, onClick, className = '', type = "button", disabled = false, variant = "primary", size = "normal", iconOnly = false, title }) => {
  const baseStyle = `font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 inline-flex items-center justify-center shadow-md active:shadow active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70`;
  const sizes = { small: `${iconOnly ? 'p-2' : 'px-3 py-1.5'} text-sm`, normal: `${iconOnly ? 'p-2.5' : 'px-5 py-2.5'} text-base`, large: `${iconOnly ? 'p-3' : 'px-7 py-3'} text-lg`};
  const variants = { primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500`, secondary: `bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400 border border-slate-300`, danger: `bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`, success: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`, ghost: `bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400`, teal: `bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-400`, yellow: `bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400` };
  return (<button title={title} type={type} onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>);
};

interface DiaryAuthor { id: string; nickname: string; avatarUrl?: string; }
interface Diary { id: string; title: string; content: string; images: string[]; videoUrl?: string; author: DiaryAuthor; authorId: string; /* authorNickname, authorAvatar likely redundant */ createdAt: string; status: "pending" | "approved" | "rejected"; rejectReason?: string; }

// --- Optimized ImageGallery for Mobile ---
const ImageGallery = ({ images, title }: { images: string[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // For swipe functionality (basic implementation, consider a library for robustness)
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const imageLoader = ({ src, width, quality }) => { /* ... loader ... */ 
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) { return `${src}?w=${width}&q=${quality || 75}`; }
    return `http://localhost:5000${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}`;
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full aspect-video bg-slate-200 rounded-lg shadow-md overflow-hidden mb-5"> {/* aspect-video for mobile placeholder */}
        <Image loader={imageLoader} src="/placeholder-image.png" alt="Placeholder" layout="fill" objectFit="cover" />
      </div>
    );
  }

  const goToPrevious = () => { const isFirstSlide = currentIndex === 0; const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1; setCurrentIndex(newIndex); };
  const goToNext = () => { const isLastSlide = currentIndex === images.length - 1; const newIndex = isLastSlide ? 0 : currentIndex + 1; setCurrentIndex(newIndex); };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStartX.current === 0 || touchEndX.current === 0) return; // No move
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 75) { goToNext(); } // Swiped left
    if (diff < -75) { goToPrevious(); } // Swiped right
    touchStartX.current = 0; // Reset
    touchEndX.current = 0;   // Reset
  };

  return (
    <div 
      className="relative w-full mb-5 touch-pan-y" // touch-pan-y to allow vertical scroll while capturing horizontal swipe
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full aspect-video rounded-lg shadow-lg bg-black overflow-hidden"> {/* Changed to aspect-video & bg-black for better image framing */}
        {images.map((imgSrc, index) => (
          <div
            key={imgSrc + index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0'}`}
          >
            <Image
              loader={imageLoader}
              src={imgSrc}
              alt={`${title} - 图 ${index + 1}`}
              layout="fill"
              objectFit="contain" // 'contain' is safer for various aspect ratios
              priority={index === 0}
              className="rounded-lg"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          {/* Buttons can be hidden on very small screens or styled differently if too intrusive */}
          <button onClick={goToPrevious} className="absolute top-1/2 left-1.5 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all z-20 sm:left-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goToNext} className="absolute top-1/2 right-1.5 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all z-20 sm:right-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50'} transition-all`}
                aria-label={`跳转到图片 ${index + 1}`}
              />
            ))}
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
  const [currentUser, setCurrentUser] = useState<{id: string} | null>(null); // Type for currentUser

  const imageLoader = ({ src, width, quality }) => { /* ... avatar loader ... */ 
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png") || src.startsWith("/default-avatar.png")) { return `${src}?w=${width}&q=${quality || 75}`; }
    return `http://localhost:5000${src.startsWith('/') ? '' : '/'}${src}?w=${width}&q=${quality || 75}`;
  };

  useEffect(() => { /* ... currentUser logic ... */ 
    const userStr = localStorage.getItem("user");
    if (userStr) { try { setCurrentUser(JSON.parse(userStr)); } catch (e) { localStorage.removeItem("user"); } }
  }, []);

  const fetchDiaryDetail = useCallback(async () => { /* ... fetch logic ... */ 
    if (!id) { setError("游记ID无效。"); setLoading(false); return; } setLoading(true); setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, { headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.message || "获取游记详情失败"); }
      const data = await res.json(); setDiary(data);
    } catch (err) { console.error("Fetch diary detail error:", err); setError(err.message || "加载游记详情时发生错误。"); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDiaryDetail(); }, [fetchDiaryDetail]);

  const handleShare = () => { /* ... share logic ... */ 
    if (navigator.share) { navigator.share({ title: diary?.title, text: `来看看这篇精彩的游记: ${diary?.title}`, url: window.location.href, }).catch((error) => console.log("Error sharing", error)); } 
    else { navigator.clipboard.writeText(window.location.href).then(() => alert("链接已复制到剪贴板！")).catch(() => alert("复制链接失败。"));}
  };

  // --- Render States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-600 text-lg">加载游记中...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md w-full">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            <p className="text-red-600 text-lg font-medium mb-1">加载失败</p>
            <p className="text-slate-600 text-sm mb-6">{error}</p>
            <Button onClick={() => router.back()} variant="secondary" className="w-full">返回上一页</Button>
        </div>
      </div>
    );
  }
  if (!diary) {
     return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-slate-500 text-lg">未找到该游记。</p>
         <Button onClick={() => router.back()} variant="secondary" className="mt-6">返回上一页</Button>
      </div>
    );
  }

  const authorAvatarSrc = diary.author?.avatarUrl || "/default-avatar.png";

  // --- Main Detail View ---
  return (
    <div className="min-h-screen bg-slate-100 selection:bg-indigo-100">
       {/* Mobile-First Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-lg shadow-sm py-3 z-20 border-b border-slate-200/80">
        <div className="container mx-auto max-w-4xl px-4 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="small" className="!px-1.5 !py-1 text-slate-700">
             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-base font-semibold text-slate-800 truncate px-2">
              {diary.title}
            </h1>
          </div>
          <Button onClick={handleShare} variant="ghost" size="small" className="!px-1.5 !py-1 text-slate-700">
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl bg-white md:rounded-b-xl md:shadow-lg md:mt-0 overflow-hidden">
        {/* Separated Title and Author for Mobile (visible below sticky header) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 md:hidden"> {/* Hide on md and up as it's in sticky header */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">{diary.title}</h1>
            <div className="flex items-center text-xs text-slate-500">
              <div className="relative w-7 h-7 rounded-full mr-2 overflow-hidden border border-slate-200">
                  <Image loader={imageLoader} src={authorAvatarSrc} alt={diary.author?.nickname || "作者"} layout="fill" objectFit="cover"/>
              </div>
              <span>作者: <span className="font-medium text-slate-600">{diary.author?.nickname || "匿名用户"}</span></span>
              <span className="mx-1.5 text-slate-400">•</span>
              <span>{new Date(diary.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
            </div>
        </div>

        <article className="p-4 sm:p-5 pb-8"> {/* Main content padding */}
          <ImageGallery images={diary.images} title={diary.title} />
          
          {diary.videoUrl && (
            <div className="my-6">
              <h2 className="text-lg font-semibold text-slate-700 mb-2">相关视频</h2>
              <div className="aspect-video w-full rounded-lg shadow-md overflow-hidden bg-black">
                <video
                  src={diary.videoUrl.startsWith("http") ? diary.videoUrl : `http://localhost:5000${diary.videoUrl}`}
                  controls
                  className="w-full h-full" // Ensure video fills its container
                  playsInline // Important for iOS
                  preload="metadata" // Good for performance
                >
                  您的浏览器不支持视频播放。
                </video>
              </div>
            </div>
          )}

          <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap break-words selection:bg-indigo-100 selection:text-indigo-800">
            {diary.content}
          </div>
        </article>

        {/* Footer actions, sticky or at the end */}
        {(currentUser && diary.authorId === currentUser.id && diary.status !== "approved") && (
            <footer className="sticky bottom-0 bg-white/90 backdrop-blur-md p-3 border-t border-slate-200 shadow-top-lg z-10">
                 <Button onClick={() => router.push(`/m/diaries/edit/${diary.id}`)} variant="yellow" className="w-full py-2.5">
                    编辑游记
                </Button>
            </footer>
        )}
      </div>
    </div>
  );
}