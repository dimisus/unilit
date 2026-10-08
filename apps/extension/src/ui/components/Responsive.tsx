import { useMemo } from 'react';

import { getUiType } from '../utils';
import { useExtensionIsInTab } from '../web/tabs';

export const APP_OVERLAY_ROOT_ID = 'unilit-app-overlay';

export const AppDimensions = (props) => {
  const { children, ...rest } = props;
  const extensionIsInTab = useExtensionIsInTab();
  const isSidePanel = getUiType().isSidePanel;

  const width = useMemo(() => {
    if (extensionIsInTab) {
      return '100vw';
    }
    return isSidePanel ? '100vw' : '357px';
  }, [extensionIsInTab, isSidePanel]);

  const height = useMemo(() => {
    if (extensionIsInTab) {
      return '100vh';
    }
    return isSidePanel ? '100vh' : '600px';
  }, [extensionIsInTab, isSidePanel]);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        isolation: 'isolate'
      }}>
      <div
        {...rest}
        style={{
          width: '100%',
          height: '100%',
          overscrollBehavior: 'contain',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
        {children}
      </div>
      <div
        id={APP_OVERLAY_ROOT_ID}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1100,
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};
