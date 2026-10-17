import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';
import { sanitizeRecipes, type ListRecipe } from './list';

interface ShoppingState {
  recipes: ListRecipe[];
  /** True once localStorage has been read; render counts only after this to avoid hydration mismatches. */
  hydrated: boolean;
  /** Adds the recipe, or updates it when it is already on the list. */
  save: (recipe: ListRecipe) => void;
  remove: (slug: string) => void;
  toggleHave: (slug: string, index: number) => void;
  clear: () => void;
}

export const useShoppingList = create<ShoppingState>()(
  persist(
    (set) => ({
      recipes: [],
      hydrated: false,
      save: (recipe) =>
        set((s) => ({
          recipes: s.recipes.some((r) => r.slug === recipe.slug)
            ? s.recipes.map((r) => (r.slug === recipe.slug ? recipe : r))
            : [...s.recipes, recipe],
        })),
      remove: (slug) => set((s) => ({ recipes: s.recipes.filter((r) => r.slug !== slug) })),
      toggleHave: (slug, index) =>
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.slug === slug ? { ...r, have: r.have.includes(index) ? r.have.filter((i) => i !== index) : [...r.have, index] } : r,
          ),
        })),
      clear: () => set({ recipes: [] }),
    }),
    {
      name: 'mago-shopping-list',
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ recipes: s.recipes }),
      migrate: (persisted) => ({ recipes: sanitizeRecipes((persisted as { recipes?: unknown } | null)?.recipes) }),
      merge: (persisted, current) => ({ ...current, recipes: sanitizeRecipes((persisted as { recipes?: unknown } | null)?.recipes) }),
      // Read from the browser after mount so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useShoppingList.setState({ hydrated: true }),
    },
  ),
);

/** Reads the saved list once on the client; returns whether that has happened yet. */
export function useHydratedShoppingList(): boolean {
  const hydrated = useShoppingList((s) => s.hydrated);
  useEffect(() => {
    if (!useShoppingList.persist.hasHydrated()) void useShoppingList.persist.rehydrate();
  }, []);
  return hydrated;
}
