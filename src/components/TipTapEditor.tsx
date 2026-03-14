// import { useEditor, EditorContent } from "@tiptap/react";
// import Image from "@tiptap/extension-image";
// import { Bold, Italic, List, Image as ImageIcon } from "lucide-react";
// import { useEffect } from "react"; // <--- Thêm useEffect
// import StarterKit from "@tiptap/starter-kit";
// import { Color } from "@tiptap/extension-color";
// import FontFamily from "@tiptap/extension-font-family";
// import { TextStyle } from "@tiptap/extension-text-style";

// const TiptapEditor = ({ value, onChange, onUploadImage }: any) => {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Image.configure({
//         inline: true,
//         allowBase64: false,
//       }),
//       TextStyle, // Bắt buộc phải có cái này
//       Color, // Cho phép dùng màu
//       FontFamily, // Cho phép dùng font
//     ],
//     content: value,
//     onUpdate: ({ editor }) => {
//       // Gửi dữ liệu lên cha khi có thay đổi
//       onChange(editor.getHTML());
//     },
//     editorProps: {
//       attributes: {
//         class: "prose prose-sm focus:outline-none min-h-[200px] p-4",
//       },
//     },
//   });

//   // --- QUAN TRỌNG: FIX LỖI VĂNG FOCUS & KHÔNG CẬP NHẬT ---
//   useEffect(() => {
//     if (editor && value !== editor.getHTML()) {
//       // Chỉ cập nhật nội dung nếu giá trị truyền vào khác với nội dung hiện tại của editor
//       // Điều này ngăn chặn việc reset con trỏ chuột (focus) khi bạn đang gõ hoặc bấm nút format
//       editor.commands.setContent(value);
//     }
//   }, [value, editor]);
//   // -------------------------------------------------------

//   if (!editor) return null;

//   // Lưu ý: Đảm bảo các nút bấm Toolbar có type="button" để tránh trigger submit form của cha
//   return (
//     <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
//       <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border-b border-slate-100">
//         <button
//           type="button" // <--- Luôn thêm type="button"
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("bold") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <Bold size={18} />
//         </button>
//         <button
//           type="button"
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("italic") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <Italic size={18} />
//         </button>
//         <button
//           type="button"
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("bulletList") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <List size={18} />
//         </button>
//         <button
//           type="button"
//           onClick={(e) => {
//             e.preventDefault();
//             // Logic upload ảnh của bạn giữ nguyên
//             const input = document.createElement("input");
//             input.type = "file";
//             input.accept = "image/*";
//             input.onchange = async () => {
//               if (input.files?.length) {
//                 const file = input.files[0];
//                 const url = await onUploadImage(file);
//                 if (url) editor.chain().focus().setImage({ src: url }).run();
//               }
//             };
//             input.click();
//           }}
//           className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
//         >
//           <ImageIcon size={18} />
//         </button>
//       </div>

//       <EditorContent editor={editor} />
//     </div>
//   );
// };

// export default TiptapEditor;

// import { useEditor, EditorContent } from "@tiptap/react";
// import Image from "@tiptap/extension-image";
// import {
//   Bold,
//   Italic,
//   List,
//   Image as ImageIcon,
//   Type,
//   Palette,
//   Baseline,
// } from "lucide-react";
// import { useEffect } from "react";
// import StarterKit from "@tiptap/starter-kit";
// import { Color } from "@tiptap/extension-color";
// import FontFamily from "@tiptap/extension-font-family";
// import { TextStyle } from "@tiptap/extension-text-style";

// const TiptapEditor = ({ value, onChange, onUploadImage }: any) => {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Image.configure({
//         inline: true,
//         allowBase64: false,
//       }),
//       TextStyle,
//       Color,
//       FontFamily,
//     ],
//     content: value,
//     onUpdate: ({ editor }) => {
//       onChange(editor.getHTML());
//     },
//     editorProps: {
//       attributes: {
//         class: "prose prose-sm focus:outline-none min-h-[300px] max-w-none p-4",
//       },
//     },
//   });

//   useEffect(() => {
//     if (editor && value !== editor.getHTML()) {
//       // Dùng emit: false để ngăn chặn việc gọi lại onUpdate khi setContent
//       editor.commands.setContent(value, false);
//     }
//   }, [value, editor]);

//   if (!editor) return null;

//   const fonts = [
//     { label: "Default", value: "" },
//     { label: "Inter", value: "Inter" },
//     { label: "Comic Sans", value: "Comic Sans MS, Comic Sans" },
//     { label: "Serif", value: "serif" },
//     { label: "Monospace", value: "monospace" },
//   ];

//   return (
//     <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
//       {/* Toolbar */}
//       <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
//         {/* Font Family Selector */}
//         <div className="flex items-center gap-1 mr-2 px-2 border-r border-slate-200">
//           <Type size={16} className="text-slate-400" />
//           <select
//             className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
//             onChange={(e) =>
//               editor.chain().focus().setFontFamily(e.target.value).run()
//             }
//             value={editor.getAttributes("textStyle").fontFamily || ""}
//           >
//             {fonts.map((font) => (
//               <option key={font.label} value={font.value}>
//                 {font.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Text Color */}
//         <div className="flex items-center gap-1 mr-2 px-2 border-r border-slate-200 relative group">
//           <Palette size={16} className="text-slate-400" />
//           <input
//             type="color"
//             onInput={(e) =>
//               editor
//                 .chain()
//                 .focus()
//                 .setColor((e.target as HTMLInputElement).value)
//                 .run()
//             }
//             value={editor.getAttributes("textStyle").color || "#000000"}
//             className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent"
//             title="Chọn màu chữ"
//           />
//           <button
//             type="button"
//             onClick={() => editor.chain().focus().unsetColor().run()}
//             className="p-1 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-500"
//             title="Xóa màu"
//           >
//             X
//           </button>
//         </div>

//         {/* Basic Styles */}
//         <button
//           type="button"
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("bold") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <Bold size={18} />
//         </button>

//         <button
//           type="button"
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("italic") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <Italic size={18} />
//         </button>

//         <button
//           type="button"
//           onClick={() => editor.chain().focus().toggleBulletList().run()}
//           className={`p-2 rounded-lg transition ${editor.isActive("bulletList") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
//         >
//           <List size={18} />
//         </button>

//         {/* Image Upload */}
//         <button
//           type="button"
//           onClick={(e) => {
//             e.preventDefault();
//             const input = document.createElement("input");
//             input.type = "file";
//             input.accept = "image/*";
//             input.onchange = async () => {
//               if (input.files?.length) {
//                 const file = input.files[0];
//                 const url = await onUploadImage(file);
//                 if (url) editor.chain().focus().setImage({ src: url }).run();
//               }
//             };
//             input.click();
//           }}
//           className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
//         >
//           <ImageIcon size={18} />
//         </button>
//       </div>

//       {/* Editor Area */}
//       <div className="bg-white min-h-[300px] cursor-text">
//         <EditorContent editor={editor} />
//       </div>
//     </div>
//   );
// };

// export default TiptapEditor;

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
// import FontSize from "tiptap-extension-font-size"; // Extension cài thêm
import {
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Type,
  Palette,
  Baseline,
} from "lucide-react";
import { useEffect } from "react";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize, // Thêm vào đây
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition ${editor.isActive("bold") ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-200 text-slate-600"}`}
          >
            <Bold size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition ${editor.isActive("italic") ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-200 text-slate-600"}`}
          >
            <Italic size={18} />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition ${editor.isActive("bulletList") ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-200 text-slate-600"}`}
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

      {/* Editor Content */}
      <div className="bg-white overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>

      {/* <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
      `}</style> */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
