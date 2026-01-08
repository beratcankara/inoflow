'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/logo.png"
                alt="InoFlow"
                width={240}
                height={67}
                priority={false}
                sizes="(max-width: 768px) 160px, 240px"
                placeholder="empty"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 hover:scale-105 transition-all duration-200 font-medium">
              Dashboard
            </Link>
            <Link href="/tasks" className="text-gray-600 hover:text-blue-600 hover:scale-105 transition-all duration-200 font-medium">
              İşler
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="text-gray-600 hover:text-blue-600 hover:scale-105 transition-all duration-200 font-medium">
                Admin
              </Link>
            )}
            {(session?.user?.role === 'ASSIGNER' || session?.user?.role === 'ADMIN' || session?.user?.role === 'WORKER') && (
              <Link href="/assigner/clients" className="text-gray-600 hover:text-blue-600 hover:scale-105 transition-all duration-200 font-medium">
                Müşteriler
              </Link>
            )}
            {(session?.user?.role === 'ASSIGNER' || session?.user?.role === 'ADMIN') && (
              <Link href="/assigner/workers" className="text-gray-600 hover:text-blue-600 hover:scale-105 transition-all duration-200 font-medium">
                Çalışanlar
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <span className="text-gray-600">
                  Merhaba, {session.user?.name}
                </span>
                <Link
                  href="/profile"
                  className="bg-gray-100 hover:bg-gray-200 hover:scale-105 text-gray-800 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm"
                >
                  Profil
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 hover:scale-105 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Giriş Yap
              </Link>
            )}
            
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/tasks" className="text-gray-600 hover:text-blue-600 transition-colors">
                İşler
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
