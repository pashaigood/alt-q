import { Plugin } from "../../types";

const defaultPlugin: Plugin = {
  deps: {
    get: (fileContent: string) => {
      // Default behavior
      console.warn('Default plugin used. No operation performed.');
      return [];
    },
    resolve: (fileContent: string) => {
      return null;
    }
  }
};

export default defaultPlugin;