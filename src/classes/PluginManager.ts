import * as path from 'path';
import * as fs from 'fs';
import defaultPlugin from '../plugins/default';
import { Plugin } from '../types';

export default class PluginManager {
  private plugins: { [key: string]: Plugin } = {};

  loadPlugins(pluginRootFolder: string) {
    const pluginsFolder = path.join(__dirname, pluginRootFolder);

    fs.readdirSync(pluginsFolder).forEach((pluginFolder) => {
      if (pluginFolder === 'default') {
        return;
      }

      const pluginPath = path.join(pluginsFolder, pluginFolder);
      if (fs.lstatSync(pluginPath).isDirectory()) {
        const plugin = require(pluginPath).default;
        this.plugins[pluginFolder] = createPluginProxy(plugin);
      }
    });
  }

  getPlugin(name: string): Plugin {
    if (name in this.plugins) {
      return this.plugins[name];
    }
    console.warn(`Plugin ${name} not found. Using default plugin.`);
    return defaultPlugin;
  }
}

function createPluginProxy(plugin: Plugin): Plugin {
  return new Proxy(plugin, {
    get: (target: Plugin, property: keyof Plugin, receiver: any) => {
      if (property in target) {
        if (typeof target[property] === 'object' && target[property] !== null) {
          return createPluginProxy(target[property]);
        }
        return Reflect.get(target, property, receiver);
      }
      return Reflect.get(defaultPlugin, property);
    }
  });
}


