import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import {
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Type,
  Palette,
  Baseline,
} from "lucide-react";
import { useEffect, useState } from "react";

// Định nghĩa extension FontSize tùy chỉnh
import { Extension } from "@tiptap/core";
import { TextStyle } from "@tiptap/extension-text-style";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes: { fontSize?: string }) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
    };
  },
});

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}

const TiptapEditor = ({
  value,
  onChange,
  onUploadImage,
}: TiptapEditorProps) => {
  // Thêm state để quản lý kiểu bullet (mặc định là disc - dấu chấm đặc)
  const [bulletStyle, setBulletStyle] = useState("disc");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-none ml-4", // Để none để mình tự xử lý bằng CSS cho đẹp
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-decimal ml-4",
          },
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[350px] max-w-none p-5",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const fonts = [
    { label: "Mặc định", value: "" },
    { label: "Inter", value: "Inter" },
    { label: "Serif", value: "serif" },
    { label: "Monospace", value: "monospace" },
  ];

  const sizes = [
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "24px",
    "32px",
    "48px",
  ];

  // Danh sách các kiểu dấu đầu dòng theo yêu cầu của sếp bạn
  const bulletOptions = [
    { label: "● Chấm đặc", value: "disc" },
    { label: "○ Chấm rỗng", value: "circle" },
    { label: "■ Hình vuông", value: "square" },
    { label: "◆ Kim cương", value: "diamond" },
    { label: "✓ Dấu tích", value: "check" },
    { label: "➤ Mũi tên", value: "arrow" },
    { label: "➢ Mũi tên 2 màu", value: "arrow2" },
    { label: "★ Ngôi sao", value: "star" },
  ];

  return (
    <div className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
        {/* Font Family */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm mr-1">
          <Type size={14} className="text-slate-400" />
          <select
            className="text-xs font-medium text-slate-600 outline-none cursor-pointer bg-transparent"
            onChange={(e) =>
              editor.chain().focus().setFontFamily(e.target.value).run()
            }
            value={editor.getAttributes("textStyle").fontFamily || ""}
          >
            {fonts.map((f) => (
              <option key={f.label} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm mr-1">
          <Baseline size={14} className="text-slate-400" />
          <select
            className="text-xs font-medium text-slate-600 outline-none cursor-pointer bg-transparent w-16"
            onChange={(e) =>
              // @ts-ignore
              editor.chain().focus().setFontSize(e.target.value).run()
            }
            value={editor.getAttributes("textStyle").fontSize || ""}
          >
            <option value="">Size</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Text Color */}
        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-slate-200 shadow-sm mr-2">
          <Palette size={14} className="text-slate-400" />
          <input
            type="color"
            onInput={(e) =>
              editor
                .chain()
                .focus()
                .setColor((e.target as HTMLInputElement).value)
                .run()
            }
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="w-5 h-5 p-0 border-none rounded-full cursor-pointer overflow-hidden bg-transparent"
          />
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="ml-1 text-[10px] text-slate-400 hover:text-red-500 font-bold"
            title="Xóa màu"
          >
            ✕
          </button>
        </div>

        <div className="h-6 w-[1px] bg-slate-300 mx-1" />

        {/* Bullet Style Selector (MỚI) */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm mr-1">
          <List size={14} className="text-slate-400" />
          <select
            className="text-xs font-medium text-slate-600 outline-none cursor-pointer bg-transparent"
            onChange={(e) => setBulletStyle(e.target.value)}
            value={bulletStyle}
          >
            {bulletOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition ${
              editor.isActive("bold")
                ? "bg-indigo-600 text-white shadow-md"
                : "hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Bold size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition ${
              editor.isActive("italic")
                ? "bg-indigo-600 text-white shadow-md"
                : "hover:bg-slate-200 text-slate-600"
            }`}
          >
            <Italic size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition ${
              editor.isActive("bulletList")
                ? "bg-indigo-600 text-white shadow-md"
                : "hover:bg-slate-200 text-slate-600"
            }`}
          >
            <List size={18} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = async () => {
                if (input.files?.length) {
                  const file = input.files[0];
                  const url = await onUploadImage(file);
                  if (url) editor.chain().focus().setImage({ src: url }).run();
                }
              };
              input.click();
            }}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition"
          >
            <ImageIcon size={18} />
          </button>
        </div>
      </div>

      {/* Editor Content - Thêm class bulletStyle vào đây */}
      <div
        className={`bg-white overflow-y-auto custom-scrollbar bullet-type-${bulletStyle}`}
      >
        <EditorContent editor={editor} />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
  /* RESET & CẤU HÌNH CHUNG */
  .ProseMirror ul {
    list-style-type: none !important;
    padding-left: 1.5rem !important;
    margin: 1rem 0;
  }
  .ProseMirror ol {
    list-style-type: decimal !important;
    padding-left: 1.5rem !important;
    margin: 1rem 0;
  }
  .ProseMirror li {
    display: list-item !important;
    position: relative;
  }

  /* ĐỊNH NGHĨA TỪNG LOẠI BULLET THEO HÌNH ẢNH */
  
  /* 1. Chấm đặc */
  .bullet-type-disc ul li::before {
    content: "●";
    position: absolute;
    left: -1.2rem;
    font-size: 0.8rem;
    top: 0.1rem;
  }

  /* 2. Chấm rỗng */
  .bullet-type-circle ul li::before {
    content: "○";
    position: absolute;
    left: -1.2rem;
    font-size: 0.9rem;
  }

  /* 3. Hình vuông */
  .bullet-type-square ul li::before {
    content: "■";
    position: absolute;
    left: -1.2rem;
    font-size: 0.8rem;
  }

  /* 4. Hình kim cương */
  .bullet-type-diamond ul li::before {
    content: "◆";
    position: absolute;
    left: -1.3rem;
    font-size: 1rem;
    color: #4f46e5; /* Màu indigo cho đẹp */
  }

  /* 5. Dấu tích */
  .bullet-type-check ul li::before {
    content: "✓";
    position: absolute;
    left: -1.3rem;
    font-size: 1.1rem;
    font-weight: bold;
    color: #10b981; /* Màu xanh lá */
  }

  /* 6. Mũi tên */
  .bullet-type-arrow ul li::before {
    content: "➤";
    position: absolute;
    left: -1.3rem;
    font-size: 0.9rem;
    color: #64748b;
  }

  /* MỚI: Định nghĩa cho Mũi tên 2 màu (arrow2) */
  .bullet-type-arrow2 ul li::before {
    content: "➢";
    position: absolute;
    left: -1.3rem;
    font-size: 1.1rem;
    color: #4f46e5; /* Màu chính (Indigo) */
    text-shadow: 1px 1px 0px #f43f5e; /* Màu phụ (Hồng đỏ) tạo hiệu ứng 2 màu */
  }

  .bullet-type-star ul li::before {
    content: "★";
    position: absolute;
    left: -1.3rem;
    font-size: 1rem;
    color: #f59e0b; /* Màu vàng Gold rực rỡ */
    top: 0.1rem;
  }

  /* CSS CŨ CỦA BẠN */
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }
  .ProseMirror {
    outline: none !important;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e2e8f0;
    border-radius: 10px;
  }
`,
        }}
      />
    </div>
  );
};

export default TiptapEditor;
