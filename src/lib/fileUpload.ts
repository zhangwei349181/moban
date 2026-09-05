/**
 * 文件上传工具函数
 */

/**
 * 文件上传结果接口
 */
export interface FileUploadResult {
  success: boolean;
  url: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: number;
}

/**
 * 文件上传错误接口
 */
export interface FileUploadError {
  success: false;
  message: string;
}

/**
 * 上传文件到公共存储
 * @param file 要上传的文件
 * @param apiUrl API地址，默认为 chat123.goodsoftwarepro.com
 * @returns 上传结果
 */
export async function uploadFile(
  file: File,
  apiUrl: string = 'https://chat123.goodsoftwarepro.com/api/files/upload-public'
): Promise<FileUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
}

/**
 * 上传多个文件
 * @param files 文件列表
 * @param apiUrl API地址
 * @param onProgress 进度回调 (current: number, total: number)
 * @returns 上传结果列表
 */
export async function uploadFiles(
  files: File[],
  apiUrl: string = 'https://chat123.goodsoftwarepro.com/api/files/upload-public',
  onProgress?: (current: number, total: number) => void
): Promise<FileUploadResult[]> {
  const results: FileUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(files[i], apiUrl);
      results.push(result);
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      // 如果某个文件上传失败，继续上传其他文件
      console.error(`Failed to upload file ${files[i].name}:`, error);
      throw error; // 可以根据需求决定是否抛出错误或继续
    }
  }
  
  return results;
}

/**
 * 客户端导出
 */
export const clientFileUpload = {
  uploadFile,
  uploadFiles,
};

