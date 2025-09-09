import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes: sadece auth sayfaları açık
        if (pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Protected routes require authentication
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/tasks')) {
          return !!token;
        }
        
        // Admin routes require ADMIN role
        if (pathname.startsWith('/admin')) {
          return !!token && token.role === 'ADMIN';
        }
        
        // Kök sayfa dahil diğer tüm sayfalar: auth zorunlu
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    // sadece koruman gereken yollar
    '/dashboard/:path*',
    '/tasks/:path*',
    '/admin/:path*',
    '/assigner/:path*',
    '/profile/:path*'
  ],
};
