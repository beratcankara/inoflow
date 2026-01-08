'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const id = `t_${Date.now()}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = 'pointer-events-auto';
  div.innerHTML = `
    <div class="mx-2 px-4 py-2 rounded-md shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800'
    }">${message}</div>
  `;
  root.appendChild(div);
  setTimeout(() => {
    div.classList.add('opacity-0');
    div.style.transition = 'opacity 300ms';
    setTimeout(() => root.removeChild(div), 320);
  }, 2500);
}

export default function ToastDebug() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? null : null;
}


