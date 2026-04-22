import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AiChatModal() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/coach' as any);
  }, [router]);

  return null;
}
