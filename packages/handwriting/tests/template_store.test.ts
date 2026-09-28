import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateStore } from '../src/template_store';

describe('TemplateStore (Profiles and Multi-Example Storage)', () => {
  let store: TemplateStore;

  beforeEach(() => {
    store = TemplateStore.getInstance();
    store.resetProfileToDefaults('profesor');
    store.resetProfileToDefaults('estudiante');
    store.resetProfileToDefaults('default');
  });

  it('initializes with default, profesor and estudiante profiles', () => {
    const profiles = store.getProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(3);
    expect(profiles.some((p) => p.name === 'Profesor')).toBe(true);
    expect(profiles.some((p) => p.name === 'Estudiante')).toBe(true);
  });

  it('allows adding multiple examples for the same symbol', () => {
    store.setActiveProfile('profesor');

    // Example 1 of symbol 'x'
    const xExample1 = [
      [{ x: 10, y: 10 }, { x: 50, y: 50 }],
      [{ x: 50, y: 10 }, { x: 10, y: 50 }],
    ];
    store.addExample('x', 'x', xExample1);

    // Example 2 of symbol 'x' (cursive or single stroke)
    const xExample2 = [
      [{ x: 12, y: 12 }, { x: 48, y: 48 }],
      [{ x: 48, y: 12 }, { x: 12, y: 48 }],
    ];
    store.addExample('x', 'x', xExample2);

    const examples = store.getExamplesForSymbol('x', 'profesor');
    expect(examples.length).toBe(2);
    expect(examples[0].symbol).toBe('x');
    expect(examples[1].symbol).toBe('x');
  });

  it('can delete a specific example or clear all examples for a symbol', () => {
    store.setActiveProfile('estudiante');

    const s1 = [[{ x: 10, y: 20 }, { x: 30, y: 20 }]];
    const t1 = store.addExample('-', '-', s1);
    store.addExample('-', '-', s1);

    expect(store.getExamplesForSymbol('-', 'estudiante').length).toBe(2);

    // Remove one example
    const removed = store.removeExample(t1.id);
    expect(removed).toBe(true);
    expect(store.getExamplesForSymbol('-', 'estudiante').length).toBe(1);

    // Clear symbol
    store.clearExamplesForSymbol('-', 'estudiante');
    expect(store.getExamplesForSymbol('-', 'estudiante').length).toBe(0);
  });

  it('supports creating a new custom profile', () => {
    const newProf = store.createProfile('Tutor Matemáticas');
    expect(newProf.name).toBe('Tutor Matemáticas');
    expect(store.getActiveProfile().id).toBe(newProf.id);
    expect(store.getProfiles().some((p) => p.name === 'Tutor Matemáticas')).toBe(true);
  });
});
