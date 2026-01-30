/**
 * Tests for ReviewSummary component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSummary } from '../components/ReviewSummary';

describe('ReviewSummary', () => {
  it('renders verdict selector', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Request Changes')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
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
    fireEvent.click(screen.getByText('Approve'));
    
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

    const submitButton = screen.getByText('Submit Review');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when verdict is selected', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    fireEvent.click(screen.getByText('Approve'));
    const submitButton = screen.getByText('Submit Review');
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
    
    const submitButton = screen.getByText('Submitting...');
    expect(submitButton).toBeDisabled();
  });

  it('highlights selected verdict', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);
    
    expect(approveButton.closest('button')).toHaveClass('selected');
  });

  it('allows changing verdict', () => {
    render(
      <ReviewSummary
        onSubmit={() => {}}
        isSubmitting={false}
      />
    );

    fireEvent.click(screen.getByText('Approve'));
    fireEvent.click(screen.getByText('Request Changes'));
    
    expect(screen.getByText('Request Changes').closest('button')).toHaveClass('selected');
    expect(screen.getByText('Approve').closest('button')).not.toHaveClass('selected');
  });
});
