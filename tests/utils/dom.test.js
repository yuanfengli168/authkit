// tests/utils/dom.test.js — Unit tests for DOM utilities
import { describe, it, expect, beforeEach } from 'vitest';
import { ce, qs, qsa, injectStyles } from '../../utils/dom.js';

describe('utils/dom.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Remove any injected styles
    document.querySelectorAll('style[id^="ak-"]').forEach(s => s.remove());
  });

  describe('ce()', () => {
    it('should create an element with the given tag', () => {
      const el = ce('div');
      expect(el.tagName).toBe('DIV');
    });

    it('should set className', () => {
      const el = ce('div', { className: 'test-class' });
      expect(el.className).toBe('test-class');
    });

    it('should set attributes', () => {
      const el = ce('input', { type: 'text', placeholder: 'Enter value' });
      expect(el.getAttribute('type')).toBe('text');
      expect(el.getAttribute('placeholder')).toBe('Enter value');
    });

    it('should set style from object', () => {
      const el = ce('div', { style: { color: 'red', fontSize: '16px' } });
      expect(el.style.color).toBe('red');
      expect(el.style.fontSize).toBe('16px');
    });

    it('should add event listeners', () => {
      const handler = vi.fn();
      const el = ce('button', { onClick: handler }, 'Click');
      el.click();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should append text children', () => {
      const el = ce('p', {}, 'Hello world');
      expect(el.textContent).toBe('Hello world');
    });

    it('should append element children', () => {
      const child = ce('span', {}, 'inner');
      const el = ce('div', {}, child);
      expect(el.firstChild.tagName).toBe('SPAN');
    });

    it('should sanitize innerHTML to prevent XSS (Bug 14)', () => {
      const el = ce('div', { innerHTML: '<script>alert("xss")</script><p>Safe</p>' });
      expect(el.innerHTML).not.toContain('<script');
      expect(el.innerHTML).toContain('Safe');
    });

    it('should strip event handlers from innerHTML (Bug 14)', () => {
      const el = ce('div', { innerHTML: '<div onclick="alert(1)">Click</div>' });
      expect(el.innerHTML).not.toContain('onclick');
    });

    it('should allow safe SVG in innerHTML', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
      const el = ce('span', { innerHTML: svg });
      expect(el.innerHTML).toContain('svg');
      expect(el.innerHTML).toContain('circle');
    });

    it('should skip null children', () => {
      const el = ce('div', {}, null, 'text');
      expect(el.childNodes.length).toBe(1);
    });
  });

  describe('qs()', () => {
    it('should find an element by selector', () => {
      document.body.innerHTML = '<div id="test"><span class="inner">hi</span></div>';
      const result = qs('.inner');
      expect(result).toBeTruthy();
      expect(result.textContent).toBe('hi');
    });
  });

  describe('qsa()', () => {
    it('should find all elements by selector', () => {
      document.body.innerHTML = '<div class="item"></div><div class="item"></div>';
      const results = qsa('.item');
      expect(results.length).toBe(2);
    });
  });

  describe('injectStyles()', () => {
    it('should inject a style element with the given id', () => {
      injectStyles('test', '.test { color: red; }');
      const style = document.getElementById('ak-test');
      expect(style).toBeTruthy();
      expect(style.textContent).toContain('.test');
    });

    it('should not inject duplicate styles', () => {
      injectStyles('test-dup', '.test-dup { color: blue; }');
      injectStyles('test-dup', '.test-dup { color: blue; }');
      const styles = document.querySelectorAll('#ak-test-dup');
      expect(styles.length).toBe(1);
    });
  });
});