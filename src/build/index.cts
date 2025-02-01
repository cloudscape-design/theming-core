import type * as indexEsm from  './index.js' with { "resolution-mode": "import" };

const buildThemedComponents: typeof indexEsm.buildThemedComponents = async (...args) => {
  const esmAPI = await import('./index.js');
  return esmAPI.buildThemedComponents(...args);
};

export = { buildThemedComponents };
