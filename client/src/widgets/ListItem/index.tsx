import React from 'react';

type Props = {
  link?: string
  left?: React.ReactNode;
  right?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
};

const headingStyle = { padding: 0, margin: 0 }

const ListItem: React.FC<Props> = (props: Props) => {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--vscode-sideBarSectionHeader-border)'
      }}
    >
      <div
        style={{
          display: 'flex',
          padding: '.5em .7em',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            alignItems: 'center'
          }}
        >
          <h3 style={headingStyle}>{props.title}</h3>
          <h4 style={headingStyle}>{props.subtitle}</h4>
        </div>
        <div>
          {props.right}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListItem);

