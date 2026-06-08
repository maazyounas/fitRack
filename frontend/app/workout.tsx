import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function WorkoutAliasScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/workouts' as never);
  }, [router]);

  return null;
}