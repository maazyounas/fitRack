import { useUiStore } from '@/store/uiStore';

export function useFontScale() {
  return useUiStore((state) => state.fontScale);
}
