"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// --- Refined UI Components for Mobile (from previous optimizations) ---
const Input = ({ type = "text", placeholder, value, onChange, className = '', disabled = false, accept, multiple, ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    accept={accept}
    multiple={multiple}
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

const Button = ({ children, onClick, className = '', type = "button", disabled = false, variant = "primary", size = "normal", iconOnly = false, title }) => {
  const baseStyle = `font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 inline-flex items-center justify-center shadow-md active:shadow active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70`;
  const sizes = { small: `${iconOnly ? 'p-2' : 'px-3 py-1.5'} text-sm`, normal: `${iconOnly ? 'p-2.5' : 'px-5 py-2.5'} text-base`, large: `${iconOnly ? 'p-3' : 'px-7 py-3'} text-lg`};
  const variants = { primary: `bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500`, secondary: `bg-slate-200 hover:bg-slate-300 text-slate-700 focus:ring-slate-400 border border-slate-300`, danger: `bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`, success: `bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`, ghost: `bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400` };
  return (<button title={title} type={type} onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>);
};

const FileInputButton = ({ id, label, onChange, accept, multiple, disabled, className, currentFiles }) => (
  <div>
    <label htmlFor={id} className={`w-full inline-flex items-center justify-center px-5 py-2.5 text-base font-semibold rounded-lg shadow-sm border transition-colors duration-200 cursor-pointer ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'} ${className}`}>
      {/* <UploadIcon className="w-5 h-5 mr-2" /> // Placeholder for an upload icon */}
      <svg className="w-5 h-5 mr-2 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
      {label}
    </label>
    <input
      type="file"
      id={id}
      multiple={multiple}
      accept={accept}
      onChange={onChange}
      disabled={disabled}
      className="hidden" // Hide the default ugly input
    />
    {currentFiles && currentFiles.length > 0 && (
      <div className="mt-2 text-xs text-slate-500">
        已选择 {currentFiles.length} 个文件: {Array.from(currentFiles).map(f => f.name).join(", ")}
      </div>
    )}
    {currentFiles && !multiple && currentFiles.length === 1 && (
         <div className="mt-2 text-xs text-slate-500">
            已选择: {currentFiles[0].name}
        </div>
    )}
  </div>
);


const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_VIDEO_SIZE_MB = 50;

export default function PublishDiaryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => { /* ... (validation logic remains) ... */ 
    if (e.target.files) {
      if (e.target.files.length > MAX_IMAGES) { setError(`最多只能上传 ${MAX_IMAGES} 张图片。`); e.target.value = ""; setImages(null); return; }
      for (let i = 0; i < e.target.files.length; i++) { if (e.target.files[i].size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { setError(`图片 ${e.target.files[i].name} 大小超过 ${MAX_IMAGE_SIZE_MB}MB。`); e.target.value = ""; setImages(null); return; } }
      setImages(e.target.files); setError("");
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => { /* ... (validation logic remains) ... */ 
     if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > MAX_VIDEO_SIZE_MB * 1024 * 1024) { setError(`视频文件大小超过 ${MAX_VIDEO_SIZE_MB}MB。`); e.target.value = ""; setVideo(null); return; }
      setVideo(e.target.files[0]); setError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { /* ... (submit logic remains) ... */ 
    e.preventDefault(); setError(""); setLoading(true);
    if (!title.trim()) { setError("标题不能为空。"); setLoading(false); return; }
    if (title.trim().length > 100) { setError("标题长度不能超过100个字符。"); setLoading(false); return; }
    if (!content.trim()) { setError("内容不能为空。"); setLoading(false); return; }
    if (content.trim().length > 5000) { setError("内容长度不能超过5000个字符。"); setLoading(false); return; }
    if (!images || images.length === 0) { setError("至少需要上传一张图片。"); setLoading(false); return; }
    if (images.length > MAX_IMAGES) { setError(`最多只能上传 ${MAX_IMAGES} 张图片。`); setLoading(false); return; }

    const formData = new FormData();
    formData.append("title", title.trim()); formData.append("content", content.trim());
    if (images) { for (let i = 0; i < images.length; i++) { formData.append("images", images[i]); } }
    if (video) { formData.append("video", video); }
    const token = localStorage.getItem("token");
    if (!token) { setError("用户未登录，请先登录。"); router.push("/m/auth/login"); setLoading(false); return; }

    try {
      const res = await fetch("http://localhost:5000/api/diaries", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) { alert("游记发布成功！将跳转到我的游记页面。"); router.push("/m/my-diaries"); } 
      else { setError(data.message || "发布失败，请稍后再试。"); }
    } catch (err) { console.error("Publish diary error:", err); setError("发布过程中发生错误，请检查网络连接或联系管理员。"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 selection:bg-indigo-100">
      {/* Mobile-First Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm py-3.5 z-20">
        <div className="container mx-auto max-w-3xl px-4 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="small" className="!px-2 !py-1">
            <svg className="w-5 h-5 mr-0.5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            取消
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">
            发布新游记
          </h1>
          <div className="w-20 text-right"> {/* Placeholder or for a potential save draft button */}
            {/* <Button variant="ghost" size="small">草稿</Button> */}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl p-4 pt-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-5 text-sm" role="alert">
              <strong className="font-semibold">提示: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                标题 <span className="text-red-500">*</span> <span className="text-xs text-slate-500">(100字以内)</span>
              </label>
              <Input
                type="text"
                id="title"
                placeholder="给游记起个吸引人的标题吧"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1.5">
                内容 <span className="text-red-500">*</span> <span className="text-xs text-slate-500">(5000字以内)</span>
              </label>
              <Textarea
                id="content"
                placeholder="分享你的旅行故事、见闻和感悟..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10} // More rows for better mobile experience
                maxLength={5000}
              />
            </div>
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-slate-700 mb-1.5">
                上传图片 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-1.5">至少1张，最多{MAX_IMAGES}张，单张不超过{MAX_IMAGE_SIZE_MB}MB。支持 JPG, PNG, WEBP, GIF。</p>
              <FileInputButton
                id="images"
                label={images ? "重新选择图片" : "选择图片"}
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                currentFiles={images}
              />
            </div>
            <div>
              <label htmlFor="video" className="block text-sm font-medium text-slate-700 mb-1.5">
                上传视频 (可选)
              </label>
               <p className="text-xs text-slate-500 mb-1.5">最多1个，不超过{MAX_VIDEO_SIZE_MB}MB。支持 MP4, WEBM, OGG。</p>
              <FileInputButton
                id="video"
                label={video ? "重新选择视频" : "选择视频"}
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoChange}
                currentFiles={video ? [video] : null} // FileInputButton expects FileList-like or null
              />
            </div>
            <div className="pt-5">
              <Button type="submit" className="w-full py-3" variant="success" size="large" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    发布中...
                  </div>
                ) : "立即发布游记"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}