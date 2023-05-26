import React, { useState } from 'react';
import { render } from 'react-dom';
// import { AppTheme } from 'react-windows-ui';
// import { AppThemeProps } from 'react-windows-ui/dist/components/AppTheme';
// import "react-windows-ui/config/app-config.css";
// import "./win.css";
// import "react-windows-ui/icons/fonts/fonts.min.css";
import '@vscode/codicons/dist/codicon.css';
import './index.scss';
import RequestContext from './components/RequestContext/RequestContext';
import LastRequest from './components/LastRequest';

function App() {
  // const [mode, setMode] = useState<AppThemeProps['scheme']>('dark');

  let app = null;

  switch (appName) {
    case 'RequestContext':
      app = <RequestContext />
      break;
    case 'LastRequest':
      app = <LastRequest />
      break;
  }

  return (
    app
  )

  // return (
  //   <>
  //     <AppTheme
  //       scheme={mode}
  //     />
  //     {app}
  //   </>
  // )
}


render(<App />, document.getElementById("app"));
