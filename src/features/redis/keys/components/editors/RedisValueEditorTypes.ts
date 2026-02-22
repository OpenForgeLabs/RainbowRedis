export type RedisValueEditorHandle = {
  getValue: () => unknown;
  hasErrors?: () => boolean;
};
