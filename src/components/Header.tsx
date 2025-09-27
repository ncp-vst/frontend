// src/components/Header.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/stores/userStore";

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "rounded-lg px-3 py-2 text-sm md:text-base transition",
        "hover:bg-orange-50 hover:text-orange-600",
        isActive ? "bg-orange-500 text-white" : "text-gray-700",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  
  const logout = () => {
    setUser(null);
  }

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur shadow-md ring-1 ring-black/5">
      <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <Link href="/" className="justify-self-start flex items-center gap-2 font-semibold text-xl">
          <span className="text-orange-500">🥘</span>
          <span>냉장고요리</span>
        </Link>

        <nav className="justify-self-center flex items-center gap-2 md:gap-4 font-semibold">
          <NavItem href="/">홈</NavItem>
          <NavItem href="/recipes">요리 추천</NavItem>
          <NavItem href="/mealplan">식단 관리</NavItem>
        </nav>

        <div className="justify-self-end hidden md:block">
	  {user ? (<Link href="/auth" onClick={logout} className="text-sm text-gray-600 hover:text-orange-600">로그아웃</Link>)
		  :
		  (<Link href="/auth" className="text-sm text-gray-600 hover:text-orange-600">로그인</Link>)
	  }	  
        </div>
      </div>
    </header>
  );
}
