export const pluginBasePath = "/plugins/redis";

export const withPluginBasePath = (path: string) => {
  if (!path) {
    return pluginBasePath;
  }
  if (path.startsWith("http")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${pluginBasePath}${normalized}`;
};
