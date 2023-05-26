import { Middleware } from '@reduxjs/toolkit';
import dataEvent from "../../events/DataEvent";
import { addFiles } from ".";

const fileStoreMiddleware: Middleware = (store) => {
  dataEvent.on('file-deps', ({ payload }) => {
    const { deps, file } = payload;
    store.dispatch(addFiles({ relativePath: file, files: deps }));
  });

  return (next: any) => (action: any) => next(action);
};

export default fileStoreMiddleware;