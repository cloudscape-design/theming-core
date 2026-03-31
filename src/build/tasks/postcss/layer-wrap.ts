// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { PluginCreator, AtRule as AtRuleType } from 'postcss';

export interface LayerWrapOptions {
  layerName: string;
}

const creator: PluginCreator<LayerWrapOptions> = (
  { layerName = 'awsui-components' } = { layerName: 'awsui-components' },
) => {
  return {
    postcssPlugin: 'postcss-layer-wrap',
    OnceExit(root, { AtRule }) {
      // Skip if already wrapped in a single @layer
      if (
        root.nodes.length === 1 &&
        root.nodes[0].type === 'atrule' &&
        (root.nodes[0] as AtRuleType).name === 'layer'
      ) {
        return;
      }

      const layer = new AtRule({ name: 'layer', params: layerName });
      layer.append(root.nodes);
      root.removeAll();
      root.append(layer);
    },
  };
};

creator.postcss = true;

export default creator;
