import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Italic, List, Image as ImageIcon } from "lucide-react";
import { useEffect } from "react"; // <--- Thêm useEffect

const TiptapEditor = ({ value, onChange, onUploadImage }: any) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Gửi dữ liệu lên cha khi có thay đổi
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  // --- QUAN TRỌNG: FIX LỖI VĂNG FOCUS & KHÔNG CẬP NHẬT ---
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Chỉ cập nhật nội dung nếu giá trị truyền vào khác với nội dung hiện tại của editor
      // Điều này ngăn chặn việc reset con trỏ chuột (focus) khi bạn đang gõ hoặc bấm nút format
      editor.commands.setContent(value);
    }
  }, [value, editor]);
  // -------------------------------------------------------

  if (!editor) return null;

  // Lưu ý: Đảm bảo các nút bấm Toolbar có type="button" để tránh trigger submit form của cha
  return (
    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border-b border-slate-100">
        <button
          type="button" // <--- Luôn thêm type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition ${editor.isActive("bold") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition ${editor.isActive("italic") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition ${editor.isActive("bulletList") ? "bg-indigo-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            // Logic upload ảnh của bạn giữ nguyên
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
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
