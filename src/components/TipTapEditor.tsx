import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Bold, Italic, List, Image as ImageIcon } from "lucide-react"; // Sử dụng icon cho đẹp

const TiptapEditor = ({ value, onChange, onUploadImage }: any) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false, // Bắt buộc dùng URL để nhẹ database
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[200px]",
      },
    },
  });

  if (!editor) return null;

  const addImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        // Gọi hàm upload từ cha truyền vào
        const url = await onUploadImage(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    };
    input.click();
  };

  return (
    <div className="border-2 border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border-b border-slate-100">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg ${editor.isActive("bold") ? "bg-indigo-500 text-white" : "hover:bg-slate-200"}`}
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg ${editor.isActive("italic") ? "bg-indigo-500 text-white" : "hover:bg-slate-200"}`}
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg ${editor.isActive("bulletList") ? "bg-indigo-500 text-white" : "hover:bg-slate-200"}`}
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TiptapEditor;
