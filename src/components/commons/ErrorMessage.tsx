export default function ErrorMessage({
  error,
  setError,
}: {
  error: string;
  setError: (error: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/30 p-2 rounded">
      {error}
      <button
        onClick={() => setError(null)}
        className="ml-auto text-red-500 hover:text-red-700 cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
