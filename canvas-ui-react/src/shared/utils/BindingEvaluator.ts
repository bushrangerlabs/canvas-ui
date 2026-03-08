/**
 * BindingEvaluator - Parse and evaluate entity binding expressions
 *
 * Inspired by ioBroker VIS bindings. Supports:
 *
 * Simple:
 *   {sensor.temp.state}               → entity state
 *   {sensor.temp.attributes.unit}     → attribute
 *   {sensor.temp.ts}                  → last_updated as ms timestamp
 *   {sensor.temp.lc}                  → last_changed as ms timestamp
 *
 * Operation pipeline:
 *   {sensor.temp;round(1)}°C          → round to 1 decimal, append unit
 *   {sensor.temp;*(1.8);+(32)}        → Celsius → Fahrenheit
 *   {light.x.state;array(off,on)}     → map number index to label
 *   {sensor.x;min(0);max(100)}        → clamp value
 *   {sensor.x;floor} {sensor.x;ceil}
 *   {sensor.x;sqrt} {sensor.x;pow(2)}
 *   {sensor.x;hex} {sensor.x;HEX2}   → hex conversion
 *   {sensor.x;date(hh:mm)}            → format date
 *   {sensor.x;json(key.sub)}          → navigate JSON
 *   {sensor.x;formatValue(2)}         → locale-style decimal
 *
 * Multi-variable JS expression:
 *   {h:sensor.a.state;w:sensor.b.state;Math.sqrt(h*h+w*w)}
 *   Temperature is {t:sensor.temp.state;Math.round(t*1.8+32)}°F
 *
 * Special bindings (anywhere in the string):
 *   {view}  {wname}  {wid}  → placeholder (returns empty, extend as needed)
 *
 * Color template example:
 *   #{r;/(100);*(255);HEX2}{g;/(100);*(255);HEX2}{b;/(100);*(255);HEX2}
 */

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export class BindingEvaluator {
  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Check if a value contains binding syntax.
   */
  static hasBinding(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /\{[^{}]+\}/.test(value);
  }

  /**
   * Extract entity IDs referenced in a binding expression.
   * e.g. "{light.living_room.state}" → ["light.living_room"]
   */
  static extractEntityIds(expression: string): string[] {
    const entityIds: string[] = [];
    const regex = /\{([a-z_][a-z0-9_]*\.[a-z0-9_]+)/gi;
    let match;
    while ((match = regex.exec(expression)) !== null) {
      const entityId = match[1];
      if (!entityIds.includes(entityId)) {
        entityIds.push(entityId);
      }
    }
    return entityIds;
  }

  /**
   * Evaluate a binding expression against the current entity state map.
   * Returns the typed value (number, boolean, string) or the original
   * expression if no binding is present.
   */
  static evaluate(expression: any, entities: Record<string, EntityState>): any {
    if (typeof expression !== 'string' || !this.hasBinding(expression)) {
      return expression;
    }

    try {
      // Collect all {…} blocks and their evaluated results
      const replacements: Array<{ match: string; value: any }> = [];

      // Regex: match {…} but not {{…}} (CSS/style blocks)
      const regex = /(?<!\{)\{([^{}]+)\}(?!\})/g;
      let match;

      while ((match = regex.exec(expression)) !== null) {
        const fullMatch = match[0];   // e.g. "{sensor.temp;round(1)}"
        const inner    = match[1];   // e.g. "sensor.temp;round(1)"

        const value = this.parseBindingContent(inner, entities);
        replacements.push({ match: fullMatch, value });
      }

      if (replacements.length === 0) return expression;

      // If the entire expression is a single binding, return the typed value
      if (replacements.length === 1 && expression === replacements[0].match) {
        return replacements[0].value;
      }

      // Otherwise perform string substitutions
      let result = expression;
      for (const { match: m, value } of replacements) {
        result = result.replace(m, String(value ?? ''));
      }

      // If the result looks like a pure comparison/math expression, evaluate it
      if (/[=!><]/.test(result) || /[+\-*/]/.test(result)) {
        const evaled = this.evaluateExpression(result);
        if (evaled !== result) return evaled;
      }

      return result;
    } catch (error) {
      console.error('BindingEvaluator error:', error, expression);
      return expression;
    }
  }

  /**
   * Format for display in the inspector.
   */
  static formatBindingDisplay(expression: string): string {
    const entityIds = this.extractEntityIds(expression);
    if (entityIds.length === 0) return expression;
    return `🔗 ${entityIds.join(', ')}`;
  }

  // ─── Core Parsing ────────────────────────────────────────────────────────────

  /**
   * Parse the content between { } and return a resolved value.
   *
   * Two forms:
   *   1. Multi-variable: "h:sensor.a.state;w:sensor.b.state;Math.sqrt(h*h+w*w)"
   *   2. Pipeline:       "sensor.temp.state;round(1)"
   */
  private static parseBindingContent(
    inner: string,
    entities: Record<string, EntityState>
  ): any {
    const parts = inner.split(';');

    // ── Multi-variable detection ──────────────────────────────────────────────
    // Parts before the expression are of the form  varName:entity.path
    const varAssignments: Array<{ name: string; path: string }> = [];
    let firstNonVar = 0;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i].trim();
      const colon = part.indexOf(':');
      if (colon > 0) {
        const name = part.substring(0, colon).trim();
        const path = part.substring(colon + 1).trim();
        if (/^[a-zA-Z_]\w*$/.test(name)) {
          varAssignments.push({ name, path });
          firstNonVar = i + 1;
          continue;
        }
      }
      break;
    }

    if (varAssignments.length > 0) {
      const jsExpr = parts.slice(firstNonVar).join(';').trim();
      const vars: Record<string, any> = {};
      for (const va of varAssignments) {
        vars[va.name] = this.resolvePath(va.path, entities);
      }
      try {
        const fn = new Function(...Object.keys(vars), `return (${jsExpr})`);
        return fn(...Object.values(vars));
      } catch (e) {
        console.error('[BindingEvaluator] multi-var error:', e, inner);
        return undefined;
      }
    }

    // ── Single-entity pipeline ────────────────────────────────────────────────
    const entityPath = parts[0].trim();
    let value: any = this.resolvePath(entityPath, entities);

    for (let i = 1; i < parts.length; i++) {
      value = this.applyOperation(value, parts[i].trim());
    }

    return value;
  }

  // ─── Path Resolution ─────────────────────────────────────────────────────────

  /**
   * Resolve an entity dot-path to a value.
   *
   * Supported paths:
   *   domain.name              → state
   *   domain.name.state        → state
   *   domain.name.ts           → last_updated ms
   *   domain.name.lc           → last_changed ms
   *   domain.name.attributes.x → attribute x
   *   domain.name.ack          → (returns undefined – not a HA concept)
   */
  private static resolvePath(path: string, entities: Record<string, EntityState>): any {
    const parts = path.split('.');

    // Need at least domain.name
    if (parts.length < 2) return undefined;

    const entityId = `${parts[0]}.${parts[1]}`;
    const entity   = entities[entityId];

    if (!entity) return undefined;

    if (parts.length === 2)                            return entity.state;
    if (parts[2] === 'state')                          return entity.state;
    if (parts[2] === 'ts')                             return new Date(entity.last_updated).getTime();
    if (parts[2] === 'lc')                             return new Date(entity.last_changed).getTime();
    if (parts[2] === 'last_updated')                   return entity.last_updated;
    if (parts[2] === 'last_changed')                   return entity.last_changed;

    if (parts[2] === 'attributes' && parts.length > 3) {
      let v: any = entity.attributes;
      for (let i = 3; i < parts.length; i++) {
        v = v?.[parts[i]];
        if (v === undefined) return undefined;
      }
      return v;
    }

    // Allow shorthand: sensor.temp.unit_of_measurement (map to attributes)
    const shortAttr = entity.attributes?.[parts[2]];
    if (shortAttr !== undefined) return shortAttr;

    return undefined;
  }

  // ─── Operation Pipeline ──────────────────────────────────────────────────────

  /**
   * Apply one ioBroker-style operation to a value.
   *
   * Full list: * + - / % round round(N) hex hex2 HEX HEX2
   *            min(N) max(N) floor ceil sqrt pow pow(N)
   *            date(fmt) momentDate(fmt) array(a,b,c)
   *            json(path) formatValue(N) random(R)
   */
  private static applyOperation(value: any, op: string): any {
    const num = parseFloat(String(value));

    // ── Arithmetic with argument: *(4)  +(4.5)  -(1)  /(2)  %(5) ─────────────
    const arith = op.match(/^([+\-*/%])\(([^)]+)\)$/);
    if (arith) {
      const n = parseFloat(arith[2]);
      switch (arith[1]) {
        case '*': return num * n;
        case '+': return num + n;
        case '-': return num - n;
        case '/': return n !== 0 ? num / n : 0;
        case '%': return num % n;
      }
    }

    // ── round / round(N) ─────────────────────────────────────────────────────
    if (op === 'round') return Math.round(num);
    const roundN = op.match(/^round\((\d+)\)$/);
    if (roundN) return parseFloat(num.toFixed(parseInt(roundN[1], 10)));

    // ── floor / ceil / sqrt ──────────────────────────────────────────────────
    if (op === 'floor') return Math.floor(num);
    if (op === 'ceil')  return Math.ceil(num);
    if (op === 'sqrt')  return Math.sqrt(num);

    // ── pow / pow(N) ────────────────────────────────────────────────────────
    if (op === 'pow') return Math.pow(num, 2);
    const powN = op.match(/^pow\(([^)]+)\)$/);
    if (powN) return Math.pow(num, parseFloat(powN[1]));

    // ── hex / HEX / hex2 / HEX2 ─────────────────────────────────────────────
    if (op === 'hex')  return Math.round(num).toString(16).toLowerCase();
    if (op === 'HEX')  return Math.round(num).toString(16).toUpperCase();
    if (op === 'hex2') {
      const h = Math.round(num).toString(16).toLowerCase();
      return h.length < 2 ? '0' + h : h;
    }
    if (op === 'HEX2') {
      const h = Math.round(num).toString(16).toUpperCase();
      return h.length < 2 ? '0' + h : h;
    }

    // ── min(N) — if value < N, return N ─────────────────────────────────────
    const minN = op.match(/^min\(([^)]+)\)$/);
    if (minN) return Math.max(parseFloat(minN[1]), num);

    // ── max(N) — if value > N, return N ─────────────────────────────────────
    const maxN = op.match(/^max\(([^)]+)\)$/);
    if (maxN) return Math.min(parseFloat(maxN[1]), num);

    // ── array(el0,el1,el2) ───────────────────────────────────────────────────
    const arr = op.match(/^array\((.+)\)$/);
    if (arr) {
      const elements = arr[1].split(',');
      const idx = Math.round(num);
      return (idx >= 0 && idx < elements.length) ? elements[idx].trim() : String(value);
    }

    // ── date(format) ────────────────────────────────────────────────────────
    const dateFmt = op.match(/^date\(([^)]*)\)$/);
    if (dateFmt) return this.formatDate(value, dateFmt[1]);

    // ── momentDate(format) — same as date for our purposes ──────────────────
    const momentFmt = op.match(/^momentDate\(([^)]*)\)$/);
    if (momentFmt) return this.formatDate(value, momentFmt[1]);

    // ── json(path.sub) ───────────────────────────────────────────────────────
    const jsonPath = op.match(/^json\(([^)]+)\)$/);
    if (jsonPath) {
      try {
        const obj = typeof value === 'string' ? JSON.parse(value) : value;
        return jsonPath[1].split('.').reduce((acc: any, k: string) => acc?.[k], obj);
      } catch { return undefined; }
    }

    // ── formatValue(N) ───────────────────────────────────────────────────────
    if (op === 'formatValue') return parseFloat(num.toFixed(2));
    const fvN = op.match(/^formatValue\((\d+)\)$/);
    if (fvN) return parseFloat(num.toFixed(parseInt(fvN[1], 10)));

    // ── random(R) / random ───────────────────────────────────────────────────
    if (op === 'random') return Math.random();
    const rndN = op.match(/^random\(([^)]+)\)$/);
    if (rndN) return Math.random() * parseFloat(rndN[1]);

    // Unknown op — pass value through unchanged
    return value;
  }

  // ─── Date Formatting ─────────────────────────────────────────────────────────

  /**
   * Format a date value using ioBroker-style tokens:
   * YYYY MM DD hh mm ss sss
   */
  private static formatDate(value: any, format: string): string {
    let d: Date;
    if (value instanceof Date)          d = value;
    else if (typeof value === 'number') d = new Date(value);
    else                                d = new Date(String(value));

    if (isNaN(d.getTime())) return String(value);
    if (!format)            return d.toLocaleString();

    return format
      .replace('YYYY', String(d.getFullYear()))
      .replace('MM',   String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD',   String(d.getDate()).padStart(2, '0'))
      .replace('hh',   String(d.getHours()).padStart(2, '0'))
      .replace('mm',   String(d.getMinutes()).padStart(2, '0'))
      .replace('ss',   String(d.getSeconds()).padStart(2, '0'))
      .replace('sss',  String(d.getMilliseconds()).padStart(3, '0'));
  }

  // ─── Expression Evaluation ──────────────────────────────────────────────────

  /**
   * Safely evaluate basic math/comparison expressions after binding substitution.
   */
  private static evaluateExpression(expr: string): any {
    try {
      const safe = expr.replace(/\s/g, '');
      if (!/^[\d.+\-*/%()>=<!&|'"truefalse]+$/i.test(safe)) return expr;
      const normalized = expr.replace(/==/g, '===').replace(/!=/g, '!==');
      return new Function(`return (${normalized})`)();
    } catch {
      return expr;
    }
  }
}

