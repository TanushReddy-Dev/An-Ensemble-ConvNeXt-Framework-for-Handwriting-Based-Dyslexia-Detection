import { supabase } from "../../lib/supabase.js";
import { cache } from "../../ui/queries.js";
import { redraw } from "../../ui/view.js";
import { clearWorkflow } from "../screening/Workflow.js";

const auth = {
  session: null,
  initializing: Boolean(supabase),
  error: "",
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    update(null);
  },
};

function update(session) {
  if (auth.session?.user.id !== session?.user.id) {
    cache.clear();
    clearWorkflow();
  }
  auth.session = session;
  auth.initializing = false;
  redraw();
}

export function restoreSession() {
  if (!supabase) return;
  let receivedEvent = false;
  supabase.auth.onAuthStateChange((_event, session) => {
    receivedEvent = true;
    update(session);
  });
  supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) auth.error = error.message;
      if (!receivedEvent) update(data.session);
    })
    .catch(() => {
      auth.error = "Your session could not be restored. Please sign in again.";
      if (!receivedEvent) update(null);
    });
}

export const useAuth = () => auth;
