import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type APIPropType = {
  userInfo: [];
  setUserInfo: (item: []) => void;
};

export const userStore = create<APIPropType>()(
  persist(
    (set) => ({
      userInfo: [],
      setUserInfo: (item: []) => set({ userInfo: item }),
    }),
    {
      name: "employee_info",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
