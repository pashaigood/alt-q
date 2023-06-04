import React, { useEffect, useState } from 'react';
// import { Button, Checkbox } from 'react-windows-ui';
import { DepFile } from '../../../../src/features/fileStore/types';
import { api } from '../../utils/vscode';
import ListItem from '../../widgets/ListItem';
import { VSCodeButton, VSCodeCheckbox } from '@vscode/webview-ui-toolkit/react';
import ActionButton from '../../widgets/ActionButton';

const RequestContext: React.FC = () => {
  const [autoItems, setAutoItems] = useState<DepFile[]>([]);
  useEffect(() => {
    api.deps.get().then(setAutoItems);

    return api.deps.changed((items) => {
      setAutoItems(items);
    });

  }, []);

  const [manualDeps, setManualItems] = useState<DepFile[]>([]);

  useEffect(() => {
    api.manualDeps.get().then(setManualItems);

    return api.manualDeps.changed(setManualItems);
  }, []);

  console.log(manualDeps);
  

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: autoItems.length ? '1' : undefined,
        overflow: 'auto',

      }}>
        {autoItems.map(item => (
          <ListItem
            key={item.id}
            title={item.value}
            right={
              <VSCodeCheckbox
                key={item.enabled + ''}
                checked={item.enabled}
                onClick={() => {
                  api.manualDeps.setEditable(item.id, 'auto');
                }}
              />
            }
          />
        ))}
      </div>
      <div
        style={{
          display: manualDeps.length === 0 ? 'none' : 'block',
          flex: '1',
          overflow: 'auto'
        }}
      >
        {manualDeps.map(item => (
          <ListItem
            key={item.id}
            title={item.value}
            right={
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <ActionButton
                  appearance='icon'
                  onClick={() => {
                    api.manualDeps.delete(item.id);
                  }}
                ><span className='codicon codicon-chrome-close' /></ActionButton>
                <VSCodeCheckbox
                  key={item.enabled + ''}
                  checked={item.enabled}
                  onClick={() => {
                    api.manualDeps.setEditable(item.id, 'auto');
                  }}
                />
              </div>
            }
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', padding: '1.5em' }}>
        <VSCodeButton
          style={{ width: '100%' }}
          appearance='secondary'
          onClick={() => {
            api.manualDeps.selectFile();
          }}
          children={"Add dependence"}
        />
      </div>
    </div>
  );
};


const FixedVSCodeCheckbox = React.memo((props: React.ComponentProps<typeof VSCodeCheckbox>) => {
  const [state, setState] = React.useState(Math.random());

  return (
    <VSCodeCheckbox
      key={state + ''}
      {...props}
      // onClick={(event) => {
      //   props.onChange?.(event);
      // }}
      onChange={() => {
        setState(Math.random());
      }}
    />
  )
})

export default React.memo(RequestContext);