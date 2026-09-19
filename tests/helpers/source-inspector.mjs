/**
 * TSX/JSX AST Inspector for vote-ui.
 * Powered by @babel/parser for semantic component structural auditing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

export class SourceInspector {
  constructor(componentFilePath) {
    this.filePath = path.resolve(componentFilePath);
    this.rawCode = fs.readFileSync(this.filePath, 'utf8');
    this.ast = parse(this.rawCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  }

  static fromFile(componentFilePath) {
    return new SourceInspector(componentFilePath);
  }

  walk(visitor) {
    const traverse = (node, parent) => {
      if (!node || typeof node !== 'object') return;
      visitor(node, parent);
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((c) => traverse(c, node));
        } else if (child && typeof child === 'object') {
          traverse(child, node);
        }
      }
    };
    traverse(this.ast, null);
  }

  /**
   * Find all JSX elements matching a given tag name (e.g. 'video', 'button', 'table').
   */
  findJsxElements(tagName) {
    const elements = [];
    this.walk((node) => {
      if (node.type === 'JSXElement') {
        const nameNode = node.openingElement?.name;
        const currentTagName = nameNode?.name || (nameNode?.property ? `${nameNode.object?.name}.${nameNode.property?.name}` : null);
        if (tagName === '*' || currentTagName === tagName) {
          const attributes = {};
          for (const attr of node.openingElement.attributes) {
            if (attr.type === 'JSXAttribute') {
              const attrName = attr.name.name;
              let attrVal = true;
              if (attr.value) {
                if (attr.value.type === 'StringLiteral') {
                  attrVal = attr.value.value;
                } else if (attr.value.type === 'JSXExpressionContainer') {
                  attrVal = attr.value.expression;
                }
              }
              attributes[attrName] = attrVal;
            }
          }
          elements.push({
            node,
            tagName: currentTagName,
            attributes,
            loc: node.loc?.start
          });
        }
      }
    });
    return elements;
  }

  /**
   * Find JSX elements that contain a specific class name in their className attribute.
   */
  findElementsByClassName(className) {
    const elements = [];
    this.walk((node) => {
      if (node.type === 'JSXElement') {
        const clsAttr = node.openingElement.attributes.find(
          (a) => a.type === 'JSXAttribute' && a.name?.name === 'className'
        );
        if (clsAttr && clsAttr.value) {
          let classValue = '';
          if (clsAttr.value.type === 'StringLiteral') {
            classValue = clsAttr.value.value;
          } else if (clsAttr.value.type === 'JSXExpressionContainer') {
            // Check template literal or string in expression
            const expr = clsAttr.value.expression;
            if (expr.type === 'StringLiteral') {
              classValue = expr.value;
            } else if (expr.type === 'TemplateLiteral') {
              classValue = expr.quasis.map((q) => q.value.raw).join(' ');
            }
          }
          if (classValue.includes(className)) {
            elements.push({ node, classValue });
          }
        }
      }
    });
    return elements;
  }

  /**
   * Extract all import declarations from the file.
   */
  findImports() {
    const imports = [];
    this.walk((node) => {
      if (node.type === 'ImportDeclaration') {
        imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map((s) => ({
            name: s.local.name,
            type: s.type,
            imported: s.imported?.name || null
          }))
        });
      }
    });
    return imports;
  }

  /**
   * Check if the raw source code contains a pattern.
   */
  containsPattern(pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(this.rawCode);
    }
    return this.rawCode.includes(pattern);
  }
}

export function parseComponentAst(filePath) {
  return SourceInspector.fromFile(filePath);
}
