import { BadRequestException } from '@nestjs/common';
import { QueryOptimizerService } from './query-optimizer.service';

describe('QueryOptimizerService', () => {
  let service: QueryOptimizerService;

  beforeEach(() => {
    service = new QueryOptimizerService();
  });

  it('rejects empty queries', async () => {
    await expect(service.optimize({ query: '' })).rejects.toThrow(BadRequestException);
    await expect(service.optimize({ query: '   ' })).rejects.toThrow(BadRequestException);
  });

  it('rejects queries exceeding 200 characters', async () => {
    const longQuery = 'a'.repeat(201);
    await expect(service.optimize({ query: longQuery })).rejects.toThrow(BadRequestException);
  });

  it('corrects common typos and expands synonyms for multi-word queries', async () => {
    const plan = await service.optimize({
      query: 'cctv camra for police station',
      state: 'Uttar Pradesh',
    });

    expect(plan.original).toBe('cctv camra for police station');
    expect(plan.canonicalTerms[0]).toContain('camera');
    expect(plan.synonyms.length).toBeGreaterThan(0);
    expect(plan.synonyms).toContain('surveillance');
    expect(plan.hindiTerms).toContain('सीसीटीवी');
    expect(plan.stateHints).toContain('Uttar Pradesh');
    expect(plan.portalQueries['CPPP']).toBeDefined();
  });

  it('handles Hindi Devanagari input and transliterated keywords', async () => {
    const plan = await service.optimize({
      query: 'सुरक्षा गार्ड security',
      category: 'Security Services',
    });

    expect(plan.original).toBe('सुरक्षा गार्ड security');
    expect(plan.intent).toBe('services');
    expect(plan.hindiTerms).toContain('सुरक्षा');
    expect(plan.synonyms).toContain('guarding service');
  });

  it('classifies goods, services, and works intent accurately', async () => {
    const goodsPlan = await service.optimize({ query: 'laptop supply' });
    expect(goodsPlan.intent).toBe('goods');

    const servicesPlan = await service.optimize({ query: 'housekeeping maintenance' });
    expect(servicesPlan.intent).toBe('services');

    const worksPlan = await service.optimize({ query: 'road construction work' });
    expect(worksPlan.intent).toBe('works');
  });

  it('caches query plans by normalized query', async () => {
    const plan1 = await service.optimize({ query: 'cctv camera' });
    const plan2 = await service.optimize({ query: '  CCTV   camera  ' });
    expect(plan1).toEqual(plan2);
  });
});

