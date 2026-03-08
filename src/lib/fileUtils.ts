import { FileText, File, Image, Video, Music, Archive, Code, FileSpreadsheet, Presentation } from 'lucide-react';
import React from 'react';

export function getFileIcon(fileName: string): React.ReactElement {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return React.createElement(FileText, { className: "h-4 w-4 text-red-500" });
    case 'doc':
    case 'docx':
      return React.createElement(FileText, { className: "h-4 w-4 text-blue-500" });
    case 'xls':
    case 'xlsx':
      return React.createElement(FileSpreadsheet, { className: "h-4 w-4 text-green-500" });
    case 'ppt':
    case 'pptx':
      return React.createElement(Presentation, { className: "h-4 w-4 text-orange-500" });
    case 'txt':
    case 'rtf':
      return React.createElement(FileText, { className: "h-4 w-4 text-gray-500" });
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return React.createElement(Image, { className: "h-4 w-4 text-purple-500" });
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return React.createElement(Video, { className: "h-4 w-4 text-pink-500" });
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return React.createElement(Music, { className: "h-4 w-4 text-indigo-500" });
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return React.createElement(Archive, { className: "h-4 w-4 text-yellow-500" });
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
      return React.createElement(Code, { className: "h-4 w-4 text-cyan-500" });
    default:
      return React.createElement(File, { className: "h-4 w-4 text-gray-500" });
  }
}

export function getFileTypeColor(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'text-red-500';
    case 'doc':
    case 'docx':
      return 'text-blue-500';
    case 'xls':
    case 'xlsx':
      return 'text-green-500';
    case 'ppt':
    case 'pptx':
      return 'text-orange-500';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return 'text-purple-500';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return 'text-pink-500';
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return 'text-indigo-500';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return 'text-yellow-500';
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'py':
    case 'java':
    case 'cpp':
    case 'c':
    case 'php':
    case 'rb':
    case 'go':
    case 'rs':
      return 'text-cyan-500';
    default:
      return 'text-gray-500';
  }
}

export function truncateFileName(fileName: string, maxLength: number = 20) {
  if (fileName.length <= maxLength) return fileName;
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
  return `${truncatedName}...${extension}`;
}
