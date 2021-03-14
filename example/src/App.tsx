import { Component, For } from "solid-js";
import { createFormActions, Errors } from "solid-form-action";

function App() {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "row",
        "justify-content": "center",
      }}
    >
      <Form />
    </div>
  );
}
/*
declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      ['use:title']?: boolean;
      ['use:form']?: boolean;
    }
  }
}
*/
const Form: Component = () => {
  const {
    actions: { title, multiInput },
    listHelpers: { multiInputHelper },
    form,
    formState,
    errors,
    reset,
  } = createFormActions({
    // declare the initial values for each field
    initialValues: {
      title: "a title",
      // if it should be possible to have a list of inputs for a field,
      // enclose the initial value within an array.
      multiInput: [""],
    },
    // this function is called when the submit button is clicked,
    // if the returned `errs` object is empty, then `onSumbit` will be called,
    // otherwise, the `errors` state object is set to the value of `errs`.
    validate: (values) => {
      const errs: Errors<typeof values> = {};
      if (values.title.length === 0) {
        errs.title = "Title must not be empty";
      }
      for (const [index, input] of values.multiInput.entries()) {
        if (input.length === 0) {
          if (errs.multiInput === undefined) {
            errs.multiInput = [];
          }
          (errs.multiInput as string[])[index] =
            "this input must not be left empty!";
        }
      }
      return errs;
    },
    // if the errs object returned from the validation function is empty (when the form is submitted),
    // then the following function is called
    onSubmit: (values) => {
      alert(JSON.stringify(values));
    },
  });

  return (
    <form ref={form} style={{ display: "flex", "flex-direction": "column" }}>
      <label>
        Title:
        {/* set the value with formState(), this sets the initial value to the value specified in initialValues,
            and also acts as a mechanism to reset the form.  */}
        <input ref={title} value={formState.title} />
      </label>
      {/* show errors if applicable */}
      {errors.title ? (
        <small style={{ color: "red" }}>{errors.title}</small>
      ) : undefined}
      <For each={formState.multiInput}>
        {(item, index) => (
          <>
            <label>
              Multi Input:
              <input ref={(ref) => multiInput(ref, index())} value={item} />
              <button
                type="button"
                onClick={() => {
                  if (formState.multiInput.length > 1)
                    multiInputHelper.remove(index());
                }}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => {
                  multiInputHelper.add(index() + 1);
                }}
              >
                +
              </button>
            </label>
            {/* show errors if applicable */}
            {errors.multiInput?.[index()] ? (
              <small style={{ color: "red" }}>
                {errors.multiInput[index()]}
              </small>
            ) : undefined}
          </>
        )}
      </For>
      {/* the reset function resets the form to its initial state, using initialValues */}
      <button type="reset" onClick={reset}>
        Reset
      </button>
      {/* when the submit button is clicked, it triggers the `submit` event on the form, caught by the `form` action on the form */}
      <input type="submit" />
    </form>
  );
};

export default App;
