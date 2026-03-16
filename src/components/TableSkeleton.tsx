import React from "react";

const TableSkeleton = () => {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-6 border-b border-slate-50"
        >
          <div className="h-4 bg-slate-200 rounded w-12"></div>
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
          <div className="h-8 bg-slate-100 rounded-full w-16"></div>
          <div className="h-8 bg-slate-100 rounded-xl w-32"></div>
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;
