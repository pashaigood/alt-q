import PluginManager from "../classes/PluginManager";

export const pluginManager = new PluginManager();

const plugin = (pluginName: string) => {
  return pluginManager.getPlugin(pluginName);
}

plugin.activate = () => {
  pluginManager.loadPlugins('../plugins');
}

export default plugin;