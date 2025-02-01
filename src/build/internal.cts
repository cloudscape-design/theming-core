import type * as internalEsm from  './internal.js' with { "resolution-mode": "import" };

const buildStyles: typeof internalEsm.buildStyles = async (...args) => {
  const esmAPI = await import('./internal.js');
  return esmAPI.buildStyles(...args);
};

const buildThemedComponentsInternal: typeof internalEsm.buildThemedComponentsInternal = async (...args) => {
  const esmAPI = await import('./internal.js');
  return esmAPI.buildThemedComponentsInternal(...args);
};

export = { buildThemedComponentsInternal, buildStyles };
