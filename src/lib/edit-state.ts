export type EditState = {
  movie: string;
  draft: string;
  editing: boolean;
  saving: boolean;
  error: string | null;
};
export type EditAction =
  | { type: "start" }
  | { type: "draft"; value: string }
  | { type: "cancel" }
  | { type: "save"; movie: string }
  | { type: "success"; movie: string }
  | { type: "failure"; previous: string; message: string };
export function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case "start":
      return { ...state, editing: true, draft: state.movie, error: null };
    case "draft":
      return { ...state, draft: action.value, error: null };
    case "cancel":
      return { ...state, editing: false, draft: state.movie, error: null };
    case "save":
      return {
        ...state,
        movie: action.movie,
        draft: action.movie,
        editing: false,
        saving: true,
        error: null,
      };
    case "success":
      return {
        ...state,
        movie: action.movie,
        draft: action.movie,
        saving: false,
      };
    case "failure":
      return {
        ...state,
        movie: action.previous,
        draft: action.previous,
        editing: true,
        saving: false,
        error: action.message,
      };
  }
}
