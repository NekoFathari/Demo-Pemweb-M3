import type { AppState } from "@/lib/types";

export function seedState(): AppState {
  return {
    queueTypes: [
      { id: "A", code: "A", name: "Teller", active: true },
      { id: "B", code: "B", name: "CS", active: true },
    ],
    tickets: [],
  };
}
