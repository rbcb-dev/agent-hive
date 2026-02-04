/**
 * Tests for ReviewSummary component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { ReviewSummary } from '../components/ReviewSummary';

describe('ReviewSummary', () => {
  it('renders verdict selector', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('✓ Approve')).toBeInTheDocument();
    expect(screen.getByText('✗ Request Changes')).toBeInTheDocument();
    expect(screen.getByText('💬 Comment')).toBeInTheDocument();
  });

  it('renders summary textarea', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    expect(screen.getByPlaceholderText(/summary/i)).toBeInTheDocument();
  });

  it('calls onSubmit with verdict and summary when submitted', () => {
    const onSubmit = vi.fn();
    render(
      <ReviewSummary
        onSubmit={onSubmit}
        isSubmitting={false}
      />
    );

    // Select verdict
    fireEvent.click(screen.getByText('✓ Approve'));
    
    // Enter summary
    const textarea = screen.getByPlaceholderText(/summary/i);
    fireEvent.change(textarea, { target: { value: 'LGTM!' } });
    
    // Submit
    fireEvent.click(screen.getByText('Submit Review'));
    
    expect(onSubmit).toHaveBeenCalledWith('approve', 'LGTM!');
  });

  it('disables submit button when no verdict selected', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    // antd Button wraps text in span, so we need to get the parent button
    const submitButton = screen.getByText('Submit Review').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when verdict is selected', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    fireEvent.click(screen.getByText('✓ Approve'));
    // antd Button wraps text in span, so we need to get the parent button
    const submitButton = screen.getByText('Submit Review').closest('button');
    expect(submitButton).not.toBeDisabled();
  });

  it('disables all inputs when submitting', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/summary/i);
    expect(textarea).toBeDisabled();
    
    // antd Button wraps text in span, so we need to get the parent button
    const submitButton = screen.getByText('Submitting…').closest('button');
    expect(submitButton).toBeDisabled();
  });

  it('highlights selected verdict', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    const approveLabel = screen.getByText('✓ Approve');
    fireEvent.click(approveLabel);
    
    // antd RadioGroup with button style uses ant-radio-button-wrapper-checked class
    expect(approveLabel.closest('label')).toHaveClass('ant-radio-button-wrapper-checked');
  });

  it('allows changing verdict', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    fireEvent.click(screen.getByText('✓ Approve'));
    fireEvent.click(screen.getByText('✗ Request Changes'));
    
    // antd RadioGroup with button style uses ant-radio-button-wrapper-checked class
    expect(screen.getByText('✗ Request Changes').closest('label')).toHaveClass('ant-radio-button-wrapper-checked');
    expect(screen.getByText('✓ Approve').closest('label')).not.toHaveClass('ant-radio-button-wrapper-checked');
  });
});
