"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

// Placeholder for UI components (e.g., from shadcn/ui)
const Input = ({ type, placeholder, value, onChange, className, accept, multiple }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} accept={accept} multiple={multiple} />
);
const Textarea = ({ placeholder, value, onChange, className, rows = 3 }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full ${className}`} rows={rows} />
);
const Button = ({ children, onClick, className, type = "button", disabled = false }) => (
  <button type={type} onClick={onClick} className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${className}`} disabled={disabled}>
    {children}
  </button>
);

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_MB = 5; // Max 5MB per image
const MAX_VIDEO_SIZE_MB = 50; // Max 50MB for video

export default function PublishDiaryPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > MAX_IMAGES) {
        setError(`最多只能上传 ${MAX_IMAGES} 张图片。`);
        e.target.value = ""; // Clear the selection
        setImages(null);
        return;
      }
      for (let i = 0; i < e.target.files.length; i++) {
        if (e.target.files[i].size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          setError(`图片 ${e.target.files[i].name} 大小超过 ${MAX_IMAGE_SIZE_MB}MB 限制。`);
          e.target.value = ""; // Clear the selection
          setImages(null);
          return;
        }
      }
      setImages(e.target.files);
      setError(""); // Clear error if validation passes
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setError(`视频文件大小超过 ${MAX_VIDEO_SIZE_MB}MB 限制。`);
        e.target.value = ""; // Clear the selection
        setVideo(null);
        return;
      }
      setVideo(e.target.files[0]);
      setError(""); // Clear error if validation passes
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!title.trim()) {
      setError("标题不能为空。");
      setLoading(false);
      return;
    }
    if (title.trim().length > 100) {
        setError("标题长度不能超过100个字符。");
        setLoading(false);
        return;
    }
    if (!content.trim()) {
      setError("内容不能为空。");
      setLoading(false);
      return;
    }
    if (content.trim().length > 5000) {
        setError("内容长度不能超过5000个字符。");
        setLoading(false);
        return;
    }
    if (!images || images.length === 0) {
      setError("至少需要上传一张图片。");
      setLoading(false);
      return;
    }
    if (images.length > MAX_IMAGES) {
      setError(`最多只能上传 ${MAX_IMAGES} 张图片。`);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }
    }

    if (video) {
      formData.append("video", video);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("用户未登录，请先登录。");
      router.push("/m/auth/login");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/diaries", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert("游记发布成功！将跳转到我的游记页面。");
        router.push("/m/my-diaries");
      } else {
        setError(data.message || "发布失败，请稍后再试。");
      }
    } catch (err) {
      console.error("Publish diary error:", err);
      setError("发布过程中发生错误，请检查网络连接或联系管理员。");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">发布新游记</h1>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-100 p-3 rounded text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">标题 (最多100字)</label>
            <Input
              type="text"
              id="title"
              placeholder="给你的游记起个名字吧"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">内容 (最多5000字)</label>
            <Textarea
              id="content"
              placeholder="记录下你的精彩瞬间..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">图片 (至少一张，最多{MAX_IMAGES}张，单张不超过{MAX_IMAGE_SIZE_MB}MB)</label>
            <Input
              type="file"
              id="images"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-1">视频 (可选，一个，不超过{MAX_VIDEO_SIZE_MB}MB)</label>
            <Input
              type="file"
              id="video"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleVideoChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
          <Button type="submit" className="w-full py-3 text-lg" disabled={loading}>
            {loading ? "发布中..." : "立即发布"}
          </Button>
        </form>
         <button 
            onClick={() => router.back()} 
            className="mt-4 text-sm text-gray-600 hover:text-gray-800 w-full text-center"
          >
            返回
          </button>
      </div>
    </div>
  );
}

