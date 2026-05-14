'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Hammer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Inventario', icon: Package, href: '/dashboard/inventory' },
  { name: 'Punto de Venta', icon: ShoppingCart, href: '/dashboard/punto-de-venta' },
  { name: 'Usuarios', icon: Users, href: '/dashboard/users' },
  { name: 'Configuración', icon: Settings, href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "h-screen sticky top-0 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl shrink-0">
            <Hammer className="w-6 h-6 text-primary" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg tracking-tight truncate">GrupoJenta</span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 hover:bg-slate-50 rounded-lg text-muted-foreground transition-colors mb-2"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-all cursor-pointer",
          isCollapsed && "justify-center"
        )}>
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
        </div>
      </div>
    </div>
  );
}
