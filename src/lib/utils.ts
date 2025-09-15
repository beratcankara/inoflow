import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}s ${minutes}d ${remainingSeconds}sn`;
  } else if (minutes > 0) {
    return `${minutes}d ${remainingSeconds}sn`;
  } else {
    return `${remainingSeconds}sn`;
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'bg-gray-100 text-gray-800';
    case 'NEW_STARTED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'IN_TESTING':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'NOT_STARTED':
      return 'Açık İşler';
    case 'NEW_STARTED':
      return 'Geliştirilmeye Hazır';
    case 'IN_PROGRESS':
      return 'Geliştirme Aşamasında';
    case 'IN_TESTING':
      return 'Teste Verilenler';
    case 'COMPLETED':
      return 'Tamamlananlar';
    default:
      return 'Bilinmiyor';
  }
}
