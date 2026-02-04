/**
 * InlineThread component - Displays a thread inline below a code line
 * with annotations, reply input, and resolve functionality.
 *
 * Uses antd Card, Flex, TextArea, Button, and Typography primitives.
 */

import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import type { ReviewThread, ReviewAnnotation } from 'hive-core';
import { Card, Flex, TextArea, Button, Typography } from '../primitives';

const { Text, Paragraph } = Typography;

export interface InlineThreadProps {
  /** The thread to display */
  thread: ReviewThread;
  /** Called when user submits a reply */
  onReply: (threadId: string, body: string) => void;
  /** Called when user resolves the thread */
  onResolve: (threadId: string) => void;
  /** Called when user closes the inline thread view */
  onClose: () => void;
}

function AnnotationItem({ annotation }: { annotation: ReviewAnnotation }): React.ReactElement {
  const isLLM = annotation.author.type === 'llm';

  return (
    <Flex vertical gap={4} className={`inline-annotation ${isLLM ? 'annotation-llm' : 'annotation-human'}`}>
      <Flex justify="space-between" align="center" className="annotation-header">
        <Flex gap={8} align="center">
          <Text strong className="annotation-author">{annotation.author.name}</Text>
          {isLLM ? <Text type="secondary" className="annotation-badge">AI</Text> : null}
        </Flex>
        <Text type="secondary" style={{ fontSize: 11 }} className="annotation-time">
          {new Date(annotation.createdAt).toLocaleString()}
        </Text>
      </Flex>
      <Paragraph style={{ margin: 0 }} className="annotation-body">{annotation.body}</Paragraph>
      {annotation.suggestion ? (
        <div className="annotation-suggestion">
          <Text type="secondary" className="suggestion-label">Suggestion:</Text>
          <pre className="suggestion-code">{annotation.suggestion.replacement}</pre>
        </div>
      ) : null}
    </Flex>
  );
}

export function InlineThread({
  thread,
  onReply,
  onResolve,
  onClose,
}: InlineThreadProps): React.ReactElement {
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(thread.id, replyText.trim());
      setReplyText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleReply();
    }
  };

  const isResolved = thread.status === 'resolved';

  return (
    <Card
      size="small"
      className={`inline-thread ${isResolved ? 'thread-resolved' : ''}`}
      data-testid="inline-thread"
    >
      <Flex vertical gap="small">
        {/* Header with status and actions */}
        <Flex justify="space-between" align="center" className="inline-thread-header">
          <Text type="secondary" className="thread-status-label">
            {isResolved ? 'Resolved' : 'Open'}
          </Text>
          <Flex gap={8} className="inline-thread-actions">
            {!isResolved ? (
              <Button
                type="link"
                size="small"
                onClick={() => onResolve(thread.id)}
                className="btn-resolve"
                aria-label="Mark thread as resolved"
              >
                Resolve
              </Button>
            ) : null}
            <Button
              type="text"
              size="small"
              onClick={onClose}
              className="btn-close"
              aria-label="Close thread"
            >
              ×
            </Button>
          </Flex>
        </Flex>

        {/* Annotations list */}
        <Flex vertical gap={8} className="inline-thread-annotations">
          {thread.annotations.map((annotation) => (
            <AnnotationItem key={annotation.id} annotation={annotation} />
          ))}
        </Flex>

        {/* Reply input */}
        <Flex vertical gap={8} className="inline-thread-reply">
          <label htmlFor={`reply-input-${thread.id}`} className="visually-hidden">
            Reply to thread
          </label>
          <Flex gap="small">
            <TextArea
              id={`reply-input-${thread.id}`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply…"
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{ flex: 1 }}
              className="reply-input"
              aria-describedby={`reply-hint-${thread.id}`}
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="btn-reply"
              aria-label="Reply"
            >
              Reply
            </Button>
          </Flex>
          <span id={`reply-hint-${thread.id}`} className="visually-hidden">
            Press Cmd+Enter to submit
          </span>
        </Flex>
      </Flex>
    </Card>
  );
}
