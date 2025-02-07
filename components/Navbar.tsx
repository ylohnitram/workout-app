"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useWorkout } from "@/contexts/WorkoutContext"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

const ADMIN_EMAILS = ['mholy1983@gmail.com']

export function Navbar() {
  const { user, signOut } = useAuth()
  const { activeWorkout } = useWorkout()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      show: true
    },
    {
      label: "Aktivní trénink",
      href: "/progress",
      show: !!activeWorkout,
      className: "text-green-600"
    },
    {
      label: "Moje cviky",
      href: "/exercises",
      show: true
    },
    {
      label: "Správa systémových cviků",
      href: "/admin/exercises",
      show: isAdmin
    }
  ];

  const NavLink = ({ href, label, className = "" }: { href: string; label: string; className?: string }) => (
    <button 
      onClick={() => {
        router.push(href);
        setIsOpen(false);
      }}
      className={`${pathname === href ? 'text-primary font-semibold' : 'hover:text-gray-600'} ${className}`}
    >
      {label}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo a mobilní menu */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold mr-4">Workout Tracker</h1>
            <div className="sm:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems
                      .filter(item => item.show)
                      .map(item => (
                        <NavLink 
                          key={item.href} 
                          href={item.href} 
                          label={item.label}
                          className={item.className}
                        />
                      ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Navigační odkazy - desktop */}
          <div className="hidden sm:flex items-center space-x-8">
            {navItems
              .filter(item => item.show)
              .map(item => (
                <NavLink 
                  key={item.href} 
                  href={item.href} 
                  label={item.label}
                  className={item.className}
                />
              ))}
          </div>

          {/* Uživatelský profil */}
          {user && (
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline">{user.email}</span>
              <Button onClick={signOut}>Odhlásit se</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
