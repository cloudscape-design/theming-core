// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { loadThemeRegistry, ThemeTokens } from '../shared/theme-registry';

const MESSAGE_TYPE = 'awsui-theme-changed';

interface ThemeMessage {
  type: typeof MESSAGE_TYPE;
  payload: { tokens: ThemeTokens };
}

function isThemeMessage(data: unknown): data is ThemeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as any).type === MESSAGE_TYPE &&
    (data as any).payload?.tokens != null
  );
}

function broadcastToIframes(tokens: ThemeTokens): void {
  const iframes = document.querySelectorAll('iframe');
  const message: ThemeMessage = { type: MESSAGE_TYPE, payload: { tokens } };
  iframes.forEach((iframe) => {
    try {
      iframe.contentWindow?.postMessage(message, '*');
    } catch {
      // iframe may not be loaded yet
    }
  });
}

/**
 * Parent side: subscribes to the registry and broadcasts theme changes to all iframes.
 * Also observes the DOM for newly-added iframes and sends them the current theme.
 */
export function startThemeBroadcast(): () => void {
  const registry = loadThemeRegistry();
  let currentTokens: ThemeTokens | null = registry.getGlobalTheme();

  const unsubscribe = registry.onThemeChange((tokens) => {
    currentTokens = tokens;
    broadcastToIframes(tokens);
  });

  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    if (!currentTokens) return;
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLIFrameElement) {
          const sendTheme = () => {
            try {
              node.contentWindow?.postMessage({ type: MESSAGE_TYPE, payload: { tokens: currentTokens } }, '*');
            } catch {
              /* not ready */
            }
          };
          node.addEventListener('load', sendTheme, { once: true });
          sendTheme();
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    unsubscribe();
    observer.disconnect();
  };
}

/**
 * Child side (iframe): listens for theme messages and applies them to the local registry.
 */
export function startThemeListener(): () => void {
  const registry = loadThemeRegistry();

  const handler = (event: MessageEvent) => {
    if (isThemeMessage(event.data)) {
      registry.setGlobalTheme(event.data.payload.tokens);
    }
  };

  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}
