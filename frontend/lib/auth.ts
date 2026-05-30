import { NextRequest } from 'next/server';
export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Instead of querying prisma, fetch from external backend
    // Or just return the basic payload info for now
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role || 'USER',
    };
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  if (user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}

export function setAuthCookie(token: string) {
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400; ${
    process.env.NODE_ENV === 'production' ? 'Secure;' : ''
  }`;
}

export function clearAuthCookie() {
  return 'auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0;';
}
