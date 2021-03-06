import { onCleanup } from 'solid-js';
import { createStore, Store } from 'solid-js/store';

type InitialValues = { [key: string]: string | string[] };

export interface ActionFormProps<T extends InitialValues> {
  initialValues: T;
  validate: (values: T) => Partial<Errors<T>>;
  onSubmit: (values: T) => void;
}

export type Actions<T> = {
  [key in keyof T]: (el: HTMLInputElement | HTMLSelectElement, index?: number) => void;
}

export type Errors<T> = {
  [key in keyof T]?: string | string[] | undefined;
}

export type ListHelpers<T> = {
  [key in keyof T & string as `${key}Helper`]: T[key] extends any[] ? { add: (index: number) => void, remove: (index: number) => void } : never;
}

function clone<T extends InitialValues>(obj: T): T {
  const cloned: Partial<T> = {};
  for (const key in obj) {
    const value = obj[key];
    if (Array.isArray(value)) {
      cloned[key] = [...value] as typeof value;
    } else {
      cloned[key] = value;
    }
  }
  return cloned as T;
}

type returnType<T> = {
  formState: Store<T>;
  actions: Actions<T>;
  form: (el: HTMLFormElement) => void;
  errors: Store<Errors<T>>;
  listHelpers: ListHelpers<T>;
  reset: (event: MouseEvent) => void;
}

export function createFormActions<T extends InitialValues>(props: ActionFormProps<T>): returnType<T> {
  // Warning!
  // The type T is replaced everywhere internally with InitialValues, and casts to InitialValues.
  // This is because of an issue with the typings of setState in solid.
  const initialValues = clone(props.initialValues);
  const [formStore, setFormStore] = createStore(clone(initialValues) as InitialValues);
  const partialActions: Partial<Actions<InitialValues>> = {};
  const defaultErrors: Partial<Errors<InitialValues>> = {};
  let listHelpers: ListHelpers<InitialValues> = {};
  for (const key of Object.keys(initialValues) as Array<keyof InitialValues>) {
    // this cast was needed, because TS insists key might be a number. not needed using InitialValues instead of T though
    const val = initialValues[key as string];
    partialActions[key] = (el, index?: number) => {
      defaultErrors[key] = undefined;
      if (Array.isArray(val)) {
        el.value = val[0];
      } else {
        el.value = val;
      }
      const listener = (event: Event) => {
        if (index === undefined) {
          setFormStore(key, el.value);
        } else {
          const arr = [...formStore[key] as string[]];
          arr[index] = el.value;
          setFormStore(key, arr);
        }
      };
      el.addEventListener("change", listener);
      onCleanup(() => {
        el.removeEventListener("change", listener);
      });
    };
    if (Array.isArray(val)) {
      listHelpers = {
        ...listHelpers,
        [`${key}Helper`]: {
          add(index: number) {
            const list = formStore[key] as string[];
            setFormStore(key, [...list.slice(0, index), val[0], ...list.slice(index)]);
          },
          remove(index: number) {
            const list = formStore[key] as string[];
            list.splice(index, 1);
            setFormStore(key, [...list.slice(0, index), ...list.slice(index + 1)]);
          }
        }
      }
    }
  }
  const [errors, setErrors] = createStore<Errors<T>>({});
  const form = (el: HTMLFormElement) => {
    const listener = (event: Event) => {
      event.preventDefault();
      const errs = props.validate(formStore as T);
      setErrors({ ...defaultErrors, ...errs });
      if (Object.keys(errs).length == 0) {
        props.onSubmit(formStore as T);
      }
    };
    el.addEventListener("submit", listener);
    onCleanup(() => {
      el.removeEventListener("submit", listener);
    });
  }
  return {
    formState: formStore as Store<T>,
    actions: partialActions as Actions<T>,
    form,
    errors,
    listHelpers: listHelpers as ListHelpers<T>,
    reset: (event: MouseEvent) => {
      setErrors(defaultErrors);
      setFormStore(clone(initialValues));
      event.preventDefault();
    },
  };
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      form?: boolean;
    }
  }
}