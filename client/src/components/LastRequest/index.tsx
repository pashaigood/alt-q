
import React, { useEffect, useState } from 'react';
import { api } from '../../utils/vscode';

const LastRequest = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {

    (async () => {
      const history = await api.history.get();
      setItems(history);
    })();

    const unsubscribe = api.history.changed(payload => {
      setItems(payload);
    })

    return () => {
      unsubscribe();
    }
  }, []);


  return (
    <>
      {items.map((item, index) => (
        <div key={index} style={{ padding: '0 10px' }}>
          <h3>Request:</h3>
          <pre style={{ userSelect: 'text' }}>{item.text}</pre>
          <h3>Response:</h3>
          <pre style={{ userSelect: 'text' }}>{item.result ? item.result : '...'}</pre>
        </div>
      ))}
    </>
  );
};

export default LastRequest;