export interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
}

export interface UserWithPassword extends User {
  password: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: 'admin' | 'viewer';
  iat?: number;
  exp?: number;
}
