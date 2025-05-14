"use client";

import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

// Placeholder for UI components (can be replaced with shadcn/ui or custom components)
const Input = ({ type, placeholder, value, onChange, className, ...props }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} className={`border p-2 rounded w-full bg-gray-50 text-gray-800 ${className}`} {...props} />
);
const Textarea = ({ placeholder, value, onChange, className, rows = 5, ...props }) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows} className={`border p-2 rounded w-full bg-gray-50 text-gray-800 ${className}`} {...props}></textarea>
);
const Button = ({ children, onClick, className, type = "button", disabled = false }) => (
  <button type={type} onClick={onClick} className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${className}`} disabled={disabled}>
    {children}
  </button>
);

interface DiaryData {
  id: string;
  title: string;
  content: string;
  images: string[];
  videoUrl?: string;
  status?: string; // To prevent editing approved diaries
}

export default function EditDiaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  // For new image uploads, you'd typically use a FileList state
  // const [newImages, setNewImages] = useState<FileList | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [diaryStatus, setDiaryStatus] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const imageLoader = ({ src, width, quality }) => {
    if (src.startsWith("http") || src.startsWith("/placeholder-image.png")) {
      return `${src}?w=${width}&q=${quality || 75}`;
    }
    return `http://localhost:5000${src}?w=${width}&q=${quality || 75}`;
  };

  const fetchDiaryForEdit = useCallback(async () => {
    if (!id) {
      setError("游记ID无效。");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem("token");

    if (!token) {
        setError("用户未登录，无法编辑游记。");
        setLoading(false);
        router.push("/m/auth/login"); // Redirect to login if not authenticated
        return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 403) {
            setError(errData.message || "您无权编辑此游记，或此游记已被审核通过。");
        } else {
            setError(errData.message || "获取游记详情失败");
        }
        setLoading(false);
        return;
      }
      const data: DiaryData = await res.json();
      if (data.status === 'approved') {
        setError("已通过审核的游记不能编辑。");
        setLoading(false);
        // Optionally redirect or disable form
        return;
      }
      setTitle(data.title);
      setContent(data.content);
      setCurrentImages(data.images || []);
      setVideoUrl(data.videoUrl || '');
      setDiaryStatus(data.status || '');

    } catch (err) {
      console.error("Fetch diary for edit error:", err);
      setError(err.message || "加载游记数据时发生错误。");
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchDiaryForEdit();
  }, [fetchDiaryForEdit]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    if (!title || !content) {
      setError('标题和内容不能为空。');
      setSubmitLoading(false);
      return;
    }
    
    if (diaryStatus === 'approved') {
        setError("已通过审核的游记不能再次提交编辑。");
        setSubmitLoading(false);
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        setError("认证失败，请重新登录。");
        setSubmitLoading(false);
        return;
    }

    // FormData is needed for file uploads. 
    // For simplicity, this example will just send JSON data for title, content, videoUrl.
    // Image updates would require more complex handling (uploading new, marking old for deletion).
    const payload = {
        title,
        content,
        videoUrl: videoUrl || null, // Send null if empty
        // images: would need to handle new image uploads and potentially send existing image URLs
    };

    try {
      const res = await fetch(`http://localhost:5000/api/diaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok) {
        alert('游记更新成功！将跳转回我的游记列表。');
        router.push('/m/my-diaries');
      } else {
        setError(responseData.message || '更新游记失败。');
      }
    } catch (err) {
      console.error('Update diary error:', err);
      setError('更新过程中发生错误，请稍后再试。');
    }
    setSubmitLoading(false);
  };

  if (loading) return <p className="text-center text-gray-600 p-10">加载游记数据中...</p>;
  // If there was an error that should prevent rendering the form (e.g. cannot edit approved)
  if (error && (diaryStatus === 'approved' || !id )) return <div className="min-h-screen bg-gray-50 p-4 md:p-8"><p className="text-center text-red-500 bg-red-100 p-5 rounded">错误: {error}</p><Button onClick={() => router.back()} className="mt-4 mx-auto block bg-gray-300 text-gray-700 hover:bg-gray-400">返回</Button></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="container mx-auto max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
        <header className="p-6 border-b border-gray-200">
          <Button onClick={() => router.back()} className="mb-4 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm px-3 py-1">取消编辑</Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">编辑游记</h1>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && !submitLoading && <p className="text-red-500 text-sm bg-red-100 p-3 rounded text-center">{error}</p>}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <Input
              type="text"
              id="title"
              placeholder="给您的游记起个响亮的标题吧"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">内容</label>
            <Textarea
              id="content"
              placeholder="分享您的旅行故事..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前图片</label>
            {currentImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {currentImages.map((imgUrl, index) => (
                  <div key={index} className="relative aspect-square border rounded overflow-hidden">
                    <Image loader={imageLoader} src={imgUrl} alt={`Current image ${index + 1}`} layout="fill" objectFit="cover" />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">暂无图片。</p>}
            {/* Add input for new image uploads here if needed */}
            {/* <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">上传新图片 (可选，会替换旧图片)</label>
            <Input type="file" id="images" multiple onChange={(e) => setNewImages(e.target.files)} /> */}
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">视频链接 (可选)</label>
            <Input
              type="url"
              id="videoUrl"
              placeholder="例如：https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full py-3 text-lg bg-green-600 hover:bg-green-700" disabled={submitLoading || diaryStatus === 'approved'}>
              {submitLoading ? '更新中...' : '确认更新'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

