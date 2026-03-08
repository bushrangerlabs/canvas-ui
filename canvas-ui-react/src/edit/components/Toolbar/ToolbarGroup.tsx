/**
 * ToolbarGroup - MUI-based toolbar group component
 * Renders a labeled group with multi-row layout support
 */

import { Box, Button, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import React from 'react';
import type { ToolbarGroup, ToolbarItem } from './types';

const styles = {
  toolbarBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0px 10px',
  },
  toolbarLabel: {
    fontSize: '72%',
    opacity: 0.8,
    paddingTop: '4px',
  },
  toolbarItems: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  },
  toolbarCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  toolbarRow: {
    display: 'flex',
    flexDirection: 'row',
  },
};

interface ToolbarGroupComponentProps {
  group: ToolbarGroup;
  last?: boolean;
}

const renderItem = (item: ToolbarItem, index: number): React.ReactElement | null => {
  if (item.hide) return null;

  switch (item.type) {
    case 'icon-button':
      const button = (
        <IconButton
          key={index}
          onClick={item.onAction}
          disabled={item.disabled}
          size="small"
          sx={{
            color: item.selected ? 'primary.main' : 'inherit',
            backgroundColor: item.selected ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
          }}
        >
          {item.icon}
        </IconButton>
      );
      return item.tooltip ? (
        <Tooltip key={index} title={item.tooltip}>
          {button}
        </Tooltip>
      ) : (
        button
      );

    case 'button':
      return (
        <Button
          key={index}
          onClick={item.onAction}
          disabled={item.disabled}
          variant={item.variant || 'text'}
          size="small"
        >
          {item.text}
        </Button>
      );

    case 'text':
      return (
        <Typography key={index} variant="body2" sx={{ px: 1, py: 0.5 }}>
          {item.text}
        </Typography>
      );
    
    case 'custom':
      return <Box key={index}>{item.render()}</Box>;

    case 'divider':
      return <Divider key={index} orientation="vertical" flexItem sx={{ mx: 1 }} />;

    default:
      return null;
  }
};

const renderItems = (
  items: ToolbarItem[][] | ToolbarItem[] | ToolbarItem,
  groupIndex: number,
): React.ReactElement => {
  // Single item
  if (!Array.isArray(items)) {
    return <Box key={groupIndex} sx={styles.toolbarRow}>{renderItem(items, 0)}</Box>;
  }

  // Check if it's a 2D array (rows of items)
  if (items.length > 0 && Array.isArray(items[0])) {
    // Multiple rows
    return (
      <Box key={groupIndex} sx={styles.toolbarCol}>
        {(items as ToolbarItem[][]).map((row, rowIndex) => (
          <Box key={rowIndex} sx={styles.toolbarRow}>
            {row.map((item, itemIndex) => renderItem(item, itemIndex))}
          </Box>
        ))}
      </Box>
    );
  }

  // Single row of items
  return (
    <Box key={groupIndex} sx={styles.toolbarRow}>
      {(items as ToolbarItem[]).map((item, itemIndex) => renderItem(item, itemIndex))}
    </Box>
  );
};

export const ToolbarGroupComponent: React.FC<ToolbarGroupComponentProps> = ({ group, last }) => {
  return (
    <Box sx={{ ...styles.toolbarBlock, borderRight: last ? 'none' : styles.toolbarBlock.borderRight }}>
      <Box sx={styles.toolbarItems}>
        {group.items.map((items, index) => renderItems(items, index))}
      </Box>
      <Typography sx={styles.toolbarLabel}>{group.name}</Typography>
    </Box>
  );
};
