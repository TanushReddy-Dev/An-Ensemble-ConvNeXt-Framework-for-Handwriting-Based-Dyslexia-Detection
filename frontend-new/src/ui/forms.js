import { redraw, viewValue } from "./view.js";

export const zodResolver = (schema) => schema;

export function useForm({ defaultValues = {}, resolver } = {}) {
  const form = viewValue("form", () => ({
    values: { ...defaultValues },
    errors: {},
    isSubmitting: false,
  }));
  return {
    register(name) {
      return {
        name,
        value: form.values[name] ?? "",
        onInput(event) {
          form.values[name] = event.target.value;
        },
      };
    },
    reset(values) {
      form.values = { ...values };
      form.errors = {};
      redraw();
    },
    setError(name, error) {
      form.errors[name] = error;
      redraw();
    },
    formState: form,
    handleSubmit(submit) {
      return async (event) => {
        event.preventDefault();
        if (form.isSubmitting) return;
        const values = {
          ...form.values,
          ...Object.fromEntries(new FormData(event.currentTarget)),
        };
        form.values = values;
        form.errors = {};
        const parsed = resolver?.safeParse(values);
        if (parsed && !parsed.success) {
          for (const error of parsed.error.issues)
            form.errors[error.path[0]] ??= { message: error.message };
          redraw();
          const first = Object.keys(form.errors)[0];
          event.currentTarget.elements.namedItem(first)?.focus();
          return;
        }
        form.isSubmitting = true;
        redraw();
        try {
          await submit(parsed?.data ?? values);
        } finally {
          form.isSubmitting = false;
          redraw();
        }
      };
    },
  };
}
