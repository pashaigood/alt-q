import React, { useState, useEffect, useRef, memo } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

type Props = React.ComponentProps<typeof VSCodeButton>;

function ActionButton(props: Props) {
  const { onClick, style, ...otherProps } = props;
  const [isFirstClick, setIsFirstClick] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsFirstClick(false);
      }
    }

    if (isFirstClick) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFirstClick]);

  const handleClick = (event: React.MouseEvent) => {
    if (!isFirstClick) {
      setIsFirstClick(true);
    } else {
      if (onClick) {
        onClick(event);
      }
    }
  }

  const buttonStyle = isFirstClick ? { ...style, backgroundColor: 'var(--vscode-inputValidation-errorBorder)' } : style;

  return (
    <VSCodeButton ref={buttonRef} {...otherProps} onClick={handleClick} style={buttonStyle} />
  )
}

export default memo(ActionButton);
