/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CrimeGPTDocumentStudio } from './App';
import React from 'react';

describe('CrimeGPTDocumentStudio', () => {
  it('clicks the export control and calls API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['dummy content']),
    } as any);

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    const createElementSpy = vi.spyOn(document, 'createElement');
    
    const mockCase = {
      case_id: 'case123',
      fir_no: 'FIR123',
      crime_type: 'Theft',
      crime_date: '2023-01-01T12:00:00Z',
      crime_location: 'Location',
      case_status: 'open',
      crime_narrative: 'A theft occurred',
      crime_lat: 0,
      crime_lon: 0,
      victim_address: 'Address'
    };

    render(<CrimeGPTDocumentStudio selectedCase={mockCase as any} />);

    const exportBtn = screen.getByText(/Export \.docx/i);
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/docs/generate', expect.objectContaining({
        method: 'POST',
      }));
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });
  });
});
