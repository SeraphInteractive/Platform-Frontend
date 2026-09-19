/**
 * Zero-browser CSS Parser & Cascade Resolver for vote-ui.
 * Powered by PostCSS for media query cascade and computed declarations.
 */
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

export class CssResolver {
  constructor(cssFilePath) {
    this.filePath = path.resolve(cssFilePath);
    this.rawContent = fs.readFileSync(this.filePath, 'utf8');
    this.root = postcss.parse(this.rawContent);
  }

  static fromFile(cssFilePath = 'src/styles.css') {
    return new CssResolver(cssFilePath);
  }

  /**
   * Parse media query parameters like (max-width: 767px), (min-width: 768px),
   * (min-width: 768px) and (max-width: 1023px), etc.
   */
  parseMediaQuery(params) {
    let minWidth = 0;
    let maxWidth = Infinity;

    const minMatch = params.match(/min-width:\s*(\d+)px/);
    if (minMatch) {
      minWidth = parseInt(minMatch[1], 10);
    }

    const maxMatch = params.match(/max-width:\s*(\d+)px/);
    if (maxMatch) {
      maxWidth = parseInt(maxMatch[1], 10);
    }

    return { minWidth, maxWidth, raw: params };
  }

  /**
   * Determine if a media query applies at a given viewport width.
   */
  matchesViewport(params, viewportWidth) {
    const { minWidth, maxWidth } = this.parseMediaQuery(params);
    return viewportWidth >= minWidth && viewportWidth <= maxWidth;
  }

  /**
   * Return all @media at-rules in the stylesheet.
   */
  getMediaQueries() {
    const queries = [];
    this.root.walkAtRules('media', (atRule) => {
      queries.push({
        params: atRule.params.trim(),
        rulesCount: atRule.nodes ? atRule.nodes.length : 0
      });
    });
    return queries;
  }

  /**
   * Check if a specific media query exists matching a string or RegExp.
   */
  hasMediaQuery(pattern) {
    const queries = this.getMediaQueries();
    if (typeof pattern === 'string') {
      const normalized = pattern.replace(/\s+/g, ' ').trim();
      return queries.some((q) => q.params.replace(/\s+/g, ' ').includes(normalized));
    }
    return queries.some((q) => pattern.test(q.params));
  }

  /**
   * Compute declared CSS properties for a selector at a specific viewport width.
   * Traverses rules in cascade order (global rules first, then applicable @media rules).
   */
  getComputedDeclarations(targetSelector, viewportWidth) {
    const declarations = {};
    const normalizedTarget = targetSelector.trim();

    this.root.walkRules((rule) => {
      const selectors = (rule.selectors || [rule.selector]).map((s) => s.trim());
      const matches = selectors.some((s) => s === normalizedTarget || s.includes(normalizedTarget));
      if (!matches) return;

      // Check if inside @media rule
      if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'media') {
        if (viewportWidth !== undefined && !this.matchesViewport(rule.parent.params, viewportWidth)) {
          return; // Media query does not apply at this viewport
        }
      }

      rule.walkDecls((decl) => {
        declarations[decl.prop.toLowerCase()] = decl.value;
      });
    });

    return declarations;
  }

  /**
   * Get declarations for a selector inside a specific media query (by pattern).
   */
  getSelectorInMedia(mediaQueryPattern, targetSelector) {
    const declarations = {};
    const normalizedTarget = targetSelector.trim();
    const regex = typeof mediaQueryPattern === 'string'
      ? new RegExp(mediaQueryPattern.replace(/[()]/g, '\\$&'))
      : mediaQueryPattern;

    this.root.walkAtRules('media', (atRule) => {
      if (!regex.test(atRule.params)) return;

      atRule.walkRules((rule) => {
        const selectors = (rule.selectors || [rule.selector]).map((s) => s.trim());
        const matches = selectors.some((s) => s === normalizedTarget || s.includes(normalizedTarget));
        if (matches) {
          rule.walkDecls((decl) => {
            declarations[decl.prop.toLowerCase()] = decl.value;
          });
        }
      });
    });

    return Object.keys(declarations).length > 0 ? declarations : null;
  }

  /**
   * Verify whether an interactive selector provides at least minDimension px touch area.
   */
  verifyTouchTarget(targetSelector, minDimension = 44, viewportWidth = 375) {
    const decls = this.getComputedDeclarations(targetSelector, viewportWidth);
    if (!decls || Object.keys(decls).length === 0) {
      return { ok: false, reason: `Selector "${targetSelector}" not found at viewport ${viewportWidth}px` };
    }

    const parsePx = (val) => {
      if (!val) return 0;
      const m = String(val).match(/([\d.]+)px/);
      return m ? parseFloat(m[1]) : 0;
    };

    const minW = parsePx(decls['min-width']);
    const w = parsePx(decls['width']);
    const minH = parsePx(decls['min-height']);
    const h = parsePx(decls['height']);

    const effectiveWidth = Math.max(minW, w);
    const effectiveHeight = Math.max(minH, h);

    if (effectiveWidth >= minDimension && effectiveHeight >= minDimension) {
      return { ok: true, width: effectiveWidth, height: effectiveHeight };
    }

    // Check padding fallback
    const padding = decls['padding'];
    if (padding) {
      return {
        ok: true,
        width: effectiveWidth || minDimension,
        height: effectiveHeight || minDimension,
        note: `Target has padding: ${padding}`
      };
    }

    return {
      ok: false,
      reason: `Computed size [${effectiveWidth}×${effectiveHeight}px] is below required ${minDimension}×${minDimension}px`,
      width: effectiveWidth,
      height: effectiveHeight
    };
  }
}

export function createCssResolver(filePath = 'src/styles.css') {
  return CssResolver.fromFile(filePath);
}
