import React from "react";

/**
 * 3열 그리드 레이아웃 (md 이상에서 3열)
 * children에는 그리드 아이템들을 그대로 넣어 사용
 */
export default function GridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
    </div>
  );
}