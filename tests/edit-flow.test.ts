import { describe, it, expect } from "vitest";
import { editReducer, type EditState } from "../src/lib/edit-state";
const initial: EditState = {
  movie: "Interstellar",
  draft: "Interstellar",
  editing: false,
  saving: false,
  error: null,
};
describe("optimistic edit flow", () => {
  it("opens editing and cancels without changing the saved movie", () => {
    const draft = editReducer(editReducer(initial, { type: "start" }), {
      type: "draft",
      value: "Arrival",
    });
    expect(editReducer(draft, { type: "cancel" })).toMatchObject(initial);
  });
  it("shows an optimistic movie and retains it on success", () => {
    const pending = editReducer(initial, { type: "save", movie: "Arrival" });
    expect(pending).toMatchObject({
      movie: "Arrival",
      saving: true,
      editing: false,
    });
    expect(
      editReducer(pending, { type: "success", movie: "Arrival" }),
    ).toMatchObject({ movie: "Arrival", saving: false });
  });
  it("rolls back to the original movie on API failure", () => {
    const pending = editReducer(initial, { type: "save", movie: "Arrival" });
    expect(
      editReducer(pending, {
        type: "failure",
        previous: "Interstellar",
        message: "Server error",
      }),
    ).toMatchObject({
      movie: "Interstellar",
      draft: "Interstellar",
      editing: true,
      saving: false,
      error: "Server error",
    });
  });
});
