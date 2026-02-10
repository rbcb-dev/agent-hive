/**
 * ThreadList component - List of review threads with status
 * Uses Flex + Card layout with VirtualList for large lists (>50 items)
 */

import React from 'react';
import { Flex, Card, Typography, VirtualList } from '../primitives';
import type { ThreadSummary } from '../types';

const { Text, Paragraph } = Typography;

export interface ThreadListProps {
  threads: ThreadSummary[];
  selectedThread: string | null;
  onSelectThread: (threadId: string) => void;
}

const ITEM_HEIGHT = 88;
const LIST_HEIGHT = 400;
const VIRTUAL_LIST_THRESHOLD = 50;

function getStatusColor(status: ThreadSummary['status']): string {
  switch (status) {
    case 'open':
      return 'var(--vscode-charts-yellow, #cca700)';
    case 'resolved':
      return 'var(--vscode-charts-green, #388a34)';
    case 'outdated':
      return 'var(--vscode-descriptionForeground, #999999)';
    default:
      return 'var(--vscode-foreground)';
  }
}

interface ThreadItemProps {
  thread: ThreadSummary;
  selected: boolean;
  onSelect: () => void;
}

function ThreadItem({
  thread,
  selected,
  onSelect,
}: ThreadItemProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSelect();
    }
  };

  return (
    <Card
      size="small"
      hoverable
      className={`thread-list-item ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      style={{ marginBottom: 8 }}
    >
      <Flex
        vertical
        gap="small"
        className="thread-item-content"
        style={{ cursor: 'pointer' }}
      >
        <div
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          style={{ outline: 'none' }}
        >
          <Flex
            justify="space-between"
            align="center"
            className="thread-header"
          >
            {thread.uri && (
              <Text className="thread-file" style={{ fontSize: 12 }}>
                {thread.uri}
              </Text>
            )}
            <Text
              className="thread-status"
              style={{ color: getStatusColor(thread.status), fontSize: 12 }}
            >
              {thread.status}
            </Text>
          </Flex>
          <Paragraph
            ellipsis={{ rows: 2 }}
            className="thread-preview"
            style={{ margin: '4px 0', fontSize: 13 }}
          >
            {thread.firstLine}
          </Paragraph>
          <Flex className="thread-meta" justify="end">
            <Text className="comment-count" style={{ fontSize: 11 }}>
              {thread.commentCount}
            </Text>
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}

export function ThreadList({
  threads,
  selectedThread,
  onSelectThread,
}: ThreadListProps): React.ReactElement {
  if (threads.length === 0) {
    return (
      <div className="thread-list thread-list-empty">
        <p>No comments yet</p>
      </div>
    );
  }

  // Use VirtualList for large lists (>50 items)
  if (threads.length > VIRTUAL_LIST_THRESHOLD) {
    return (
      <VirtualList
        data={threads}
        height={LIST_HEIGHT}
        itemHeight={ITEM_HEIGHT}
        itemKey="id"
        className="thread-list"
      >
        {(thread) => (
          <ThreadItem
            thread={thread}
            selected={thread.id === selectedThread}
            onSelect={() => onSelectThread(thread.id)}
          />
        )}
      </VirtualList>
    );
  }

  // Simple Flex layout for small lists
  return (
    <Flex vertical className="thread-list">
      {threads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          selected={thread.id === selectedThread}
          onSelect={() => onSelectThread(thread.id)}
        />
      ))}
    </Flex>
  );
}
