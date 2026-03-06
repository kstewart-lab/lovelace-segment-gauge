/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Xe = globalThis, Ct = Xe.ShadowRoot && (Xe.ShadyCSS === void 0 || Xe.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, At = Symbol(), Dt = /* @__PURE__ */ new WeakMap();
let un = class {
  constructor(e, t, n) {
    if (this._$cssResult$ = !0, n !== At) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ct && e === void 0) {
      const n = t !== void 0 && t.length === 1;
      n && (e = Dt.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && Dt.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const to = (i) => new un(typeof i == "string" ? i : i + "", void 0, At), hn = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((n, o, r) => n + ((s) => {
    if (s._$cssResult$ === !0) return s.cssText;
    if (typeof s == "number") return s;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + s + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + i[r + 1], i[0]);
  return new un(t, i, At);
}, no = (i, e) => {
  if (Ct) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const n = document.createElement("style"), o = Xe.litNonce;
    o !== void 0 && n.setAttribute("nonce", o), n.textContent = t.cssText, i.appendChild(n);
  }
}, Gt = Ct ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const n of e.cssRules) t += n.cssText;
  return to(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: oo, defineProperty: io, getOwnPropertyDescriptor: ro, getOwnPropertyNames: so, getOwnPropertySymbols: ao, getPrototypeOf: lo } = Object, ce = globalThis, Wt = ce.trustedTypes, co = Wt ? Wt.emptyScript : "", bt = ce.reactiveElementPolyfillSupport, ze = (i, e) => i, yt = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? co : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, pn = (i, e) => !oo(i, e), Vt = { attribute: !0, type: String, converter: yt, reflect: !1, useDefault: !1, hasChanged: pn };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), ce.litPropertyMetadata ?? (ce.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Me = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ?? (this.l = [])).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Vt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const n = Symbol(), o = this.getPropertyDescriptor(e, n, t);
      o !== void 0 && io(this.prototype, e, o);
    }
  }
  static getPropertyDescriptor(e, t, n) {
    const { get: o, set: r } = ro(this.prototype, e) ?? { get() {
      return this[t];
    }, set(s) {
      this[t] = s;
    } };
    return { get: o, set(s) {
      const a = o == null ? void 0 : o.call(this);
      r == null || r.call(this, s), this.requestUpdate(e, a, n);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Vt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ze("elementProperties"))) return;
    const e = lo(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ze("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ze("properties"))) {
      const t = this.properties, n = [...so(t), ...ao(t)];
      for (const o of n) this.createProperty(o, t[o]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [n, o] of t) this.elementProperties.set(n, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, n] of this.elementProperties) {
      const o = this._$Eu(t, n);
      o !== void 0 && this._$Eh.set(o, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const n = new Set(e.flat(1 / 0).reverse());
      for (const o of n) t.unshift(Gt(o));
    } else e !== void 0 && t.push(Gt(e));
    return t;
  }
  static _$Eu(e, t) {
    const n = t.attribute;
    return n === !1 ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var e;
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (e = this.constructor.l) == null || e.forEach((t) => t(this));
  }
  addController(e) {
    var t;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(e), this.renderRoot !== void 0 && this.isConnected && ((t = e.hostConnected) == null || t.call(e));
  }
  removeController(e) {
    var t;
    (t = this._$EO) == null || t.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return no(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    var e;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (e = this._$EO) == null || e.forEach((t) => {
      var n;
      return (n = t.hostConnected) == null ? void 0 : n.call(t);
    });
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    var e;
    (e = this._$EO) == null || e.forEach((t) => {
      var n;
      return (n = t.hostDisconnected) == null ? void 0 : n.call(t);
    });
  }
  attributeChangedCallback(e, t, n) {
    this._$AK(e, n);
  }
  _$ET(e, t) {
    var r;
    const n = this.constructor.elementProperties.get(e), o = this.constructor._$Eu(e, n);
    if (o !== void 0 && n.reflect === !0) {
      const s = (((r = n.converter) == null ? void 0 : r.toAttribute) !== void 0 ? n.converter : yt).toAttribute(t, n.type);
      this._$Em = e, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(e, t) {
    var r, s;
    const n = this.constructor, o = n._$Eh.get(e);
    if (o !== void 0 && this._$Em !== o) {
      const a = n.getPropertyOptions(o), d = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((r = a.converter) == null ? void 0 : r.fromAttribute) !== void 0 ? a.converter : yt;
      this._$Em = o;
      const c = d.fromAttribute(t, a.type);
      this[o] = c ?? ((s = this._$Ej) == null ? void 0 : s.get(o)) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, t, n, o = !1, r) {
    var s;
    if (e !== void 0) {
      const a = this.constructor;
      if (o === !1 && (r = this[e]), n ?? (n = a.getPropertyOptions(e)), !((n.hasChanged ?? pn)(r, t) || n.useDefault && n.reflect && r === ((s = this._$Ej) == null ? void 0 : s.get(e)) && !this.hasAttribute(a._$Eu(e, n)))) return;
      this.C(e, t, n);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: n, reflect: o, wrapped: r }, s) {
    n && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(e) && (this._$Ej.set(e, s ?? t ?? this[e]), r !== !0 || s !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), o === !0 && this._$Em !== e && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var n;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [r, s] of this._$Ep) this[r] = s;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [r, s] of o) {
        const { wrapped: a } = s, d = this[r];
        a !== !0 || this._$AL.has(r) || d === void 0 || this.C(r, void 0, s, d);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), (n = this._$EO) == null || n.forEach((o) => {
        var r;
        return (r = o.hostUpdate) == null ? void 0 : r.call(o);
      }), this.update(t)) : this._$EM();
    } catch (o) {
      throw e = !1, this._$EM(), o;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    var t;
    (t = this._$EO) == null || t.forEach((n) => {
      var o;
      return (o = n.hostUpdated) == null ? void 0 : o.call(n);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t) => this._$ET(t, this[t]))), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
Me.elementStyles = [], Me.shadowRootOptions = { mode: "open" }, Me[ze("elementProperties")] = /* @__PURE__ */ new Map(), Me[ze("finalized")] = /* @__PURE__ */ new Map(), bt == null || bt({ ReactiveElement: Me }), (ce.reactiveElementVersions ?? (ce.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Oe = globalThis, qt = (i) => i, Ze = Oe.trustedTypes, Kt = Ze ? Ze.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, mn = "$lit$", ae = `lit$${Math.random().toFixed(9).slice(2)}$`, fn = "?" + ae, uo = `<${fn}>`, $e = document, He = () => $e.createComment(""), je = (i) => i === null || typeof i != "object" && typeof i != "function", Nt = Array.isArray, ho = (i) => Nt(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", _t = `[ 	
\f\r]`, Ie = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Yt = /-->/g, Qt = />/g, ge = RegExp(`>|${_t}(?:([^\\s"'>=/]+)(${_t}*=${_t}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Xt = /'/g, Zt = /"/g, gn = /^(?:script|style|textarea|title)$/i, bn = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), x = bn(1), se = bn(2), ye = Symbol.for("lit-noChange"), $ = Symbol.for("lit-nothing"), Jt = /* @__PURE__ */ new WeakMap(), _e = $e.createTreeWalker($e, 129);
function _n(i, e) {
  if (!Nt(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Kt !== void 0 ? Kt.createHTML(e) : e;
}
const po = (i, e) => {
  const t = i.length - 1, n = [];
  let o, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", s = Ie;
  for (let a = 0; a < t; a++) {
    const d = i[a];
    let c, u, h = -1, m = 0;
    for (; m < d.length && (s.lastIndex = m, u = s.exec(d), u !== null); ) m = s.lastIndex, s === Ie ? u[1] === "!--" ? s = Yt : u[1] !== void 0 ? s = Qt : u[2] !== void 0 ? (gn.test(u[2]) && (o = RegExp("</" + u[2], "g")), s = ge) : u[3] !== void 0 && (s = ge) : s === ge ? u[0] === ">" ? (s = o ?? Ie, h = -1) : u[1] === void 0 ? h = -2 : (h = s.lastIndex - u[2].length, c = u[1], s = u[3] === void 0 ? ge : u[3] === '"' ? Zt : Xt) : s === Zt || s === Xt ? s = ge : s === Yt || s === Qt ? s = Ie : (s = ge, o = void 0);
    const f = s === ge && i[a + 1].startsWith("/>") ? " " : "";
    r += s === Ie ? d + uo : h >= 0 ? (n.push(c), d.slice(0, h) + mn + d.slice(h) + ae + f) : d + ae + (h === -2 ? a : f);
  }
  return [_n(i, r + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), n];
};
class Fe {
  constructor({ strings: e, _$litType$: t }, n) {
    let o;
    this.parts = [];
    let r = 0, s = 0;
    const a = e.length - 1, d = this.parts, [c, u] = po(e, t);
    if (this.el = Fe.createElement(c, n), _e.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (o = _e.nextNode()) !== null && d.length < a; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const h of o.getAttributeNames()) if (h.endsWith(mn)) {
          const m = u[s++], f = o.getAttribute(h).split(ae), _ = /([.?@])?(.*)/.exec(m);
          d.push({ type: 1, index: r, name: _[2], strings: f, ctor: _[1] === "." ? fo : _[1] === "?" ? go : _[1] === "@" ? bo : ot }), o.removeAttribute(h);
        } else h.startsWith(ae) && (d.push({ type: 6, index: r }), o.removeAttribute(h));
        if (gn.test(o.tagName)) {
          const h = o.textContent.split(ae), m = h.length - 1;
          if (m > 0) {
            o.textContent = Ze ? Ze.emptyScript : "";
            for (let f = 0; f < m; f++) o.append(h[f], He()), _e.nextNode(), d.push({ type: 2, index: ++r });
            o.append(h[m], He());
          }
        }
      } else if (o.nodeType === 8) if (o.data === fn) d.push({ type: 2, index: r });
      else {
        let h = -1;
        for (; (h = o.data.indexOf(ae, h + 1)) !== -1; ) d.push({ type: 7, index: r }), h += ae.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const n = $e.createElement("template");
    return n.innerHTML = e, n;
  }
}
function Ae(i, e, t = i, n) {
  var s, a;
  if (e === ye) return e;
  let o = n !== void 0 ? (s = t._$Co) == null ? void 0 : s[n] : t._$Cl;
  const r = je(e) ? void 0 : e._$litDirective$;
  return (o == null ? void 0 : o.constructor) !== r && ((a = o == null ? void 0 : o._$AO) == null || a.call(o, !1), r === void 0 ? o = void 0 : (o = new r(i), o._$AT(i, t, n)), n !== void 0 ? (t._$Co ?? (t._$Co = []))[n] = o : t._$Cl = o), o !== void 0 && (e = Ae(i, o._$AS(i, e.values), o, n)), e;
}
class mo {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: n } = this._$AD, o = ((e == null ? void 0 : e.creationScope) ?? $e).importNode(t, !0);
    _e.currentNode = o;
    let r = _e.nextNode(), s = 0, a = 0, d = n[0];
    for (; d !== void 0; ) {
      if (s === d.index) {
        let c;
        d.type === 2 ? c = new Be(r, r.nextSibling, this, e) : d.type === 1 ? c = new d.ctor(r, d.name, d.strings, this, e) : d.type === 6 && (c = new _o(r, this, e)), this._$AV.push(c), d = n[++a];
      }
      s !== (d == null ? void 0 : d.index) && (r = _e.nextNode(), s++);
    }
    return _e.currentNode = $e, o;
  }
  p(e) {
    let t = 0;
    for (const n of this._$AV) n !== void 0 && (n.strings !== void 0 ? (n._$AI(e, n, t), t += n.strings.length - 2) : n._$AI(e[t])), t++;
  }
}
class Be {
  get _$AU() {
    var e;
    return ((e = this._$AM) == null ? void 0 : e._$AU) ?? this._$Cv;
  }
  constructor(e, t, n, o) {
    this.type = 2, this._$AH = $, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = o, this._$Cv = (o == null ? void 0 : o.isConnected) ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && (e == null ? void 0 : e.nodeType) === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = Ae(this, e, t), je(e) ? e === $ || e == null || e === "" ? (this._$AH !== $ && this._$AR(), this._$AH = $) : e !== this._$AH && e !== ye && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ho(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== $ && je(this._$AH) ? this._$AA.nextSibling.data = e : this.T($e.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    var r;
    const { values: t, _$litType$: n } = e, o = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = Fe.createElement(_n(n.h, n.h[0]), this.options)), n);
    if (((r = this._$AH) == null ? void 0 : r._$AD) === o) this._$AH.p(t);
    else {
      const s = new mo(o, this), a = s.u(this.options);
      s.p(t), this.T(a), this._$AH = s;
    }
  }
  _$AC(e) {
    let t = Jt.get(e.strings);
    return t === void 0 && Jt.set(e.strings, t = new Fe(e)), t;
  }
  k(e) {
    Nt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let n, o = 0;
    for (const r of e) o === t.length ? t.push(n = new Be(this.O(He()), this.O(He()), this, this.options)) : n = t[o], n._$AI(r), o++;
    o < t.length && (this._$AR(n && n._$AB.nextSibling, o), t.length = o);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    var n;
    for ((n = this._$AP) == null ? void 0 : n.call(this, !1, !0, t); e !== this._$AB; ) {
      const o = qt(e).nextSibling;
      qt(e).remove(), e = o;
    }
  }
  setConnected(e) {
    var t;
    this._$AM === void 0 && (this._$Cv = e, (t = this._$AP) == null || t.call(this, e));
  }
}
class ot {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, n, o, r) {
    this.type = 1, this._$AH = $, this._$AN = void 0, this.element = e, this.name = t, this._$AM = o, this.options = r, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(new String()), this.strings = n) : this._$AH = $;
  }
  _$AI(e, t = this, n, o) {
    const r = this.strings;
    let s = !1;
    if (r === void 0) e = Ae(this, e, t, 0), s = !je(e) || e !== this._$AH && e !== ye, s && (this._$AH = e);
    else {
      const a = e;
      let d, c;
      for (e = r[0], d = 0; d < r.length - 1; d++) c = Ae(this, a[n + d], t, d), c === ye && (c = this._$AH[d]), s || (s = !je(c) || c !== this._$AH[d]), c === $ ? e = $ : e !== $ && (e += (c ?? "") + r[d + 1]), this._$AH[d] = c;
    }
    s && !o && this.j(e);
  }
  j(e) {
    e === $ ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class fo extends ot {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === $ ? void 0 : e;
  }
}
class go extends ot {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== $);
  }
}
class bo extends ot {
  constructor(e, t, n, o, r) {
    super(e, t, n, o, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = Ae(this, e, t, 0) ?? $) === ye) return;
    const n = this._$AH, o = e === $ && n !== $ || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, r = e !== $ && (n === $ || o);
    o && this.element.removeEventListener(this.name, this, n), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    var t;
    typeof this._$AH == "function" ? this._$AH.call(((t = this.options) == null ? void 0 : t.host) ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class _o {
  constructor(e, t, n) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    Ae(this, e);
  }
}
const vt = Oe.litHtmlPolyfillSupport;
vt == null || vt(Fe, Be), (Oe.litHtmlVersions ?? (Oe.litHtmlVersions = [])).push("3.3.2");
const vo = (i, e, t) => {
  const n = (t == null ? void 0 : t.renderBefore) ?? e;
  let o = n._$litPart$;
  if (o === void 0) {
    const r = (t == null ? void 0 : t.renderBefore) ?? null;
    n._$litPart$ = o = new Be(e.insertBefore(He(), r), r, void 0, t ?? {});
  }
  return o._$AI(i), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ve = globalThis;
let Ce = class extends Me {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = vo(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var e;
    super.connectedCallback(), (e = this._$Do) == null || e.setConnected(!0);
  }
  disconnectedCallback() {
    var e;
    super.disconnectedCallback(), (e = this._$Do) == null || e.setConnected(!1);
  }
  render() {
    return ye;
  }
};
var dn;
Ce._$litElement$ = !0, Ce.finalized = !0, (dn = ve.litElementHydrateSupport) == null || dn.call(ve, { LitElement: Ce });
const xt = ve.litElementPolyfillSupport;
xt == null || xt({ LitElement: Ce });
(ve.litElementVersions ?? (ve.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const xo = { ATTRIBUTE: 1 }, $o = (i) => (...e) => ({ _$litDirective$: i, values: e });
let yo = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, n) {
    this._$Ct = e, this._$AM = t, this._$Ci = n;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
};
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const vn = "important", wo = " !" + vn, So = $o(class extends yo {
  constructor(i) {
    var e;
    if (super(i), i.type !== xo.ATTRIBUTE || i.name !== "style" || ((e = i.strings) == null ? void 0 : e.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(i) {
    return Object.keys(i).reduce((e, t) => {
      const n = i[t];
      return n == null ? e : e + `${t = t.includes("-") ? t : t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${n};`;
    }, "");
  }
  update(i, [e]) {
    const { style: t } = i.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(e)), this.render(e);
    for (const n of this.ft) e[n] == null && (this.ft.delete(n), n.includes("-") ? t.removeProperty(n) : t[n] = null);
    for (const n in e) {
      const o = e[n];
      if (o != null) {
        this.ft.add(n);
        const r = typeof o == "string" && o.endsWith(wo);
        n.includes("-") || r ? t.setProperty(n, r ? o.slice(0, -11) : o, r ? vn : "") : t[n] = o;
      }
    }
    return ye;
  }
});
function en(i, e, t) {
  const n = new Event(e, { bubbles: !0, cancelable: !1, composed: !0 });
  n.detail = t, i.dispatchEvent(n);
}
const ko = {
  fireEvent(i, e, t) {
    en(i, e, t);
  },
  navigate(i) {
    window.history.pushState(null, "", i), en(window, "location-changed", { replace: !1 });
  },
  openUrl(i) {
    window.open(i, "_blank", "noopener,noreferrer");
  }
};
class Mo {
  constructor(e, t) {
    this.holdMs = 500, this.held = !1, this.holdTimer = null, this.host = e, this.getConfig = t.getConfig, this.getHass = t.getHass, this.getEntityId = t.getEntityId, this.env = {
      ...ko,
      ...t.env ?? {}
    }, e.addEventListener("pointerdown", (n) => this.onDown(n)), e.addEventListener("pointerup", (n) => this.onUp(n)), e.addEventListener("pointercancel", () => this.clearHold()), e.addEventListener("pointerleave", () => this.clearHold()), e.addEventListener("contextmenu", (n) => n.preventDefault()), e.addEventListener("dblclick", () => this.onDblClick());
  }
  onDown(e) {
    e.button === 0 && (this.held = !1, this.clearHold(), this.holdTimer = window.setTimeout(() => {
      this.held = !0, this.doAction("hold_action");
    }, this.holdMs));
  }
  onUp(e) {
    if (e.button !== 0) return;
    const t = this.held;
    this.clearHold(), t || this.doAction("tap_action");
  }
  onDblClick() {
    this.clearHold(), this.doAction("double_tap_action");
  }
  clearHold() {
    this.holdTimer && (window.clearTimeout(this.holdTimer), this.holdTimer = null);
  }
  doAction(e) {
    var a;
    const t = this.getConfig(), n = this.getHass(), o = this.getEntityId();
    if (!t || !n || !o) return;
    const r = (a = t.actions) == null ? void 0 : a[e], s = (r == null ? void 0 : r.action) ?? "none";
    if (s !== "none")
      switch (s) {
        case "more-info":
          this.env.fireEvent(this.host, "hass-more-info", { entityId: o });
          break;
        case "navigate": {
          const d = r.navigation_path;
          if (!d) return;
          this.env.navigate(d);
          break;
        }
        case "url": {
          const d = r.url_path;
          if (!d) return;
          this.env.openUrl(d);
          break;
        }
        case "toggle":
          n.callService("homeassistant", "toggle", { entity_id: o });
          break;
        case "call-service": {
          const d = r.service;
          if (!d) return;
          const [c, u] = String(d).split(".", 2);
          if (!c || !u) return;
          n.callService(c, u, r.service_data ?? {});
          break;
        }
      }
  }
}
const l = {
  type: "custom:segment-gauge",
  entity: "",
  content: {
    name: "",
    show_name: !0,
    show_state: !0,
    show_icon: !0,
    icon: void 0,
    icon_color: {
      mode: "theme",
      value: void 0
    }
  },
  data: {
    min: 0,
    max: 100,
    precision: null,
    unit: ""
  },
  layout: {
    mode: "horizontal",
    split_pct: 50,
    gauge_alignment: "center_bar",
    content_spacing: 0
  },
  style: {
    card: "default",
    debug_layout: !1
  },
  levels: [],
  bar: {
    show: !0,
    height: 8,
    edge: "rounded",
    radius: null,
    color_mode: "stepped",
    fill_mode: "cumulative",
    track: {
      background: void 0,
      intensity: 50
    },
    segments: {
      mode: "off",
      width: 0,
      gap: 0,
      segments_per_level: 1
    },
    snapping: {
      fill: "off",
      color: "off"
    }
  },
  pointer: {
    show: !0,
    size: 8,
    color_mode: "custom",
    color: "#ffffff",
    angle: 90,
    y_offset: 0
  },
  scale: {
    show: !1,
    placement: "below",
    spacing: "even",
    y_offset: 0,
    ticks: {
      major_count: 5,
      minor_per_major: 0,
      height_major: 12,
      height_minor: 8,
      color_mode: "theme",
      color: void 0
    },
    labels: {
      show: !0,
      precision: null,
      size: 12,
      y_offset: 0,
      color_mode: "theme",
      color: void 0
    }
  },
  actions: {
    tap_action: { action: "more-info" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" }
  }
};
function ne(i) {
  return !!i && typeof i == "object" && !Array.isArray(i);
}
function Je(i, e) {
  if (!ne(i))
    return e === void 0 ? i : e;
  const t = {};
  for (const [n, o] of Object.entries(i))
    ne(o) ? t[n] = Je(o, void 0) : Array.isArray(o) ? t[n] = [...o] : t[n] = o;
  if (!ne(e)) return t;
  for (const [n, o] of Object.entries(e)) {
    if (o === void 0) continue;
    const r = i[n];
    ne(r) && ne(o) ? t[n] = Je(r, o) : t[n] = o;
  }
  return t;
}
function xn(i, e) {
  if (!ne(i))
    return e === void 0 ? i : e;
  const t = Array.isArray(i) ? [...i] : { ...i };
  if (!ne(e)) return t;
  for (const [n, o] of Object.entries(e)) {
    const r = i[n];
    ne(r) && ne(o) ? t[n] = xn(r, o) : t[n] = o;
  }
  return t;
}
function G(i, e, t) {
  return Number.isNaN(i) ? e : Math.min(t, Math.max(e, i));
}
function Ue(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "horizontal" ? "horizontal" : e === "vertical" ? "vertical" : e === "stacked" ? "stacked" : "horizontal";
}
function it(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "center" || e === "bottom" || e === "below" || e === "top" ? e : "below";
}
function rt(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "levels" ? "levels" : "even";
}
function st(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "center_labels" ? "center_labels" : "center_bar";
}
function at(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "theme" ? "theme" : e === "state" ? "state" : e === "level" ? "level" : e === "custom" ? "custom" : "theme";
}
function $n(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "gradient" ? "gradient" : e === "level" ? "level" : e === "custom" ? "custom" : l.pointer.color_mode ?? "custom";
}
function Et(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "theme" ? "theme" : e === "gradient" ? "gradient" : e === "stepped" ? "stepped" : e === "level" ? "level" : e === "custom" ? "custom" : l.scale.labels.color_mode ?? "theme";
}
function yn(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "contrast" ? "contrast" : Et(e);
}
function lt(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "gradient" ? "gradient" : e === "stepped" ? "stepped" : e === "current_level" ? "current_level" : l.bar.color_mode ?? "stepped";
}
function ct(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "current_segment" ? "current_segment" : e === "cumulative" ? "cumulative" : l.bar.fill_mode ?? "cumulative";
}
function dt(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "off" ? "off" : e === "down" ? "down" : e === "nearest" ? "nearest" : e === "up" ? "up" : "off";
}
function ut(i) {
  const e = (i ?? "").toString().trim().toLowerCase();
  return e === "off" ? "off" : e === "level" ? "level" : e === "midpoint" ? "midpoint" : e === "high" ? "high" : e === "low" ? "low" : "off";
}
function wn(i) {
  const e = Number(i);
  return Number.isFinite(e) ? e : null;
}
function Sn(i, e, t) {
  const n = (i ?? []).map((o) => ({
    value: wn(o == null ? void 0 : o.value),
    color: String((o == null ? void 0 : o.color) ?? "").trim(),
    icon: String((o == null ? void 0 : o.icon) ?? "").trim() || void 0
  })).filter((o) => o.value !== null && o.color.length > 0).map((o) => ({ value: o.value, color: o.color, icon: o.icon })).sort((o, r) => o.value - r.value);
  return n.length === 0 ? [] : (n[0].value > e && n.unshift({ value: e, color: n[0].color, icon: n[0].icon }), n[n.length - 1].value < t && n.push({ value: t, color: n[n.length - 1].color, icon: n[n.length - 1].icon }), n);
}
function xe(i, e, t) {
  var r;
  if (!i || i.length === 0) return t;
  const n = [...i].sort((s, a) => s.value - a.value);
  let o = ((r = n[0]) == null ? void 0 : r.color) ?? t;
  for (const s of n)
    if (e >= s.value) o = s.color;
    else break;
  return o;
}
function le(i, e) {
  return e == null && (e = Math.abs(i - Math.round(i)) < 1e-9 ? 0 : 1), i.toFixed(e);
}
function Co(i, e) {
  var n, o;
  const t = (n = i.data) == null ? void 0 : n.unit;
  return t != null && String(t).length > 0 ? String(t) : String(((o = e == null ? void 0 : e.attributes) == null ? void 0 : o.unit_of_measurement) ?? "");
}
function Ao(i, e, t) {
  return t != null ? Number(t) : e === "rounded" ? Math.round(i / 2) : 0;
}
function No(i, e) {
  return !i || i.state === "unavailable" || i.state === "unknown" || e == null;
}
function Eo(i) {
  var u, h, m, f, _;
  const e = Je(l, i), t = e.layout ?? l.layout, n = Ue(t.mode), o = st(t.gauge_alignment);
  e.layout = {
    ...t,
    mode: n,
    gauge_alignment: o
  }, (u = e.content) != null && u.icon_color && (e.content.icon_color.mode = at(e.content.icon_color.mode)), e.pointer && (e.pointer.color_mode = $n(e.pointer.color_mode)), e.bar && (e.bar.color_mode = lt(e.bar.color_mode), e.bar.fill_mode = ct(e.bar.fill_mode)), (h = e.bar) != null && h.snapping && (e.bar.snapping.fill = dt(e.bar.snapping.fill), e.bar.snapping.color = ut(e.bar.snapping.color)), (m = e.bar) != null && m.segments && delete e.bar.segments.subdivisions_per_level;
  const r = e.scale ?? l.scale, { gap: s, ...a } = r, d = it(r.placement), c = rt(r.spacing);
  return e.scale = {
    ...a,
    placement: d,
    spacing: c
  }, (f = e.scale) != null && f.ticks && (e.scale.ticks.color_mode = yn(e.scale.ticks.color_mode)), (_ = e.scale) != null && _.labels && (e.scale.labels.color_mode = Et(e.scale.labels.color_mode)), e;
}
function Po(i, e, t) {
  return {
    left: Math.ceil(i / 2 + t),
    right: Math.ceil(e / 2 + t)
  };
}
const To = {
  requestFrame(i) {
    return window.requestAnimationFrame(i);
  },
  cancelFrame(i) {
    window.cancelAnimationFrame(i);
  },
  queryTrack(i) {
    var e;
    return ((e = i == null ? void 0 : i.querySelector) == null ? void 0 : e.call(i, ".track")) ?? null;
  },
  readTrackWidth(i) {
    const e = i.getBoundingClientRect();
    return Math.round(e.width || i.clientWidth || 0);
  },
  queryLabelMeasureNodes(i) {
    var n, o;
    const e = ((n = i == null ? void 0 : i.querySelector) == null ? void 0 : n.call(i, ".measure.min")) ?? null, t = ((o = i == null ? void 0 : i.querySelector) == null ? void 0 : o.call(i, ".measure.max")) ?? null;
    return !e || !t ? null : { minEl: e, maxEl: t };
  },
  readElementWidth(i) {
    return i.getBoundingClientRect().width;
  },
  createResizeObserver(i) {
    return new ResizeObserver(i);
  }
}, Lo = /* @__PURE__ */ new Set([
  "type",
  "entity",
  "content",
  "style",
  "layout",
  "data",
  "levels",
  "bar",
  "pointer",
  "scale",
  "actions",
  // Lovelace host fields that can appear on custom cards and should not warn.
  "grid_options",
  "view_layout",
  "visibility"
]), Ro = /* @__PURE__ */ new Set(["mode", "split_pct", "gauge_alignment", "content_spacing"]), Io = /* @__PURE__ */ new Set(["show", "size", "angle", "y_offset", "color_mode", "color"]), zo = /* @__PURE__ */ new Set(["show", "placement", "spacing", "y_offset", "ticks", "labels"]), Oo = /* @__PURE__ */ new Set(["major_count", "minor_per_major", "height_minor", "height_major", "color_mode", "color"]), Ho = /* @__PURE__ */ new Set(["show", "precision", "size", "y_offset", "color_mode", "color"]), jo = /* @__PURE__ */ new Set(["mode", "width", "gap", "segments_per_level"]), Fo = /* @__PURE__ */ new Set(["value", "color", "icon"]);
function B(i) {
  return !!i && typeof i == "object" && !Array.isArray(i);
}
function we(i, e, t, n, o) {
  for (const r of Object.keys(e))
    o != null && o.has(r) || t.has(r) || n.push(`Unknown field "${i}${r}"`);
}
function H(i, e, t, n) {
  e != null && (typeof e != "string" || !t.includes(e)) && n.push(`Invalid value "${String(e)}" for ${i} (allowed: ${t.join(" | ")})`);
}
function Pt(i) {
  const e = [];
  if (!B(i)) return { warnings: e };
  for (const u of Object.keys(i))
    Lo.has(u) || e.push(`Unknown field "${u}"`);
  const t = B(i.layout) ? i.layout : void 0;
  t && (we("layout.", t, Ro, e), H("layout.mode", t.mode, ["horizontal", "vertical", "stacked"], e), H("layout.gauge_alignment", t.gauge_alignment, ["center_bar", "center_labels"], e));
  const n = B(i.pointer) ? i.pointer : void 0;
  n && (we("pointer.", n, Io, e), H("pointer.color_mode", n.color_mode, ["gradient", "level", "custom"], e));
  const o = B(i.bar) ? i.bar : void 0;
  if (o) {
    H("bar.edge", o.edge, ["rounded", "square"], e), H("bar.color_mode", o.color_mode, ["stepped", "gradient", "current_level"], e), H("bar.fill_mode", o.fill_mode, ["cumulative", "current_segment"], e);
    const u = B(o.segments) ? o.segments : void 0;
    u && (we("segments.", u, jo, e, /* @__PURE__ */ new Set(["subdivisions_per_level"])), "subdivisions_per_level" in u && e.push('Removed legacy field "subdivisions_per_level"'), H("segments.mode", u.mode, ["off", "level", "fixed"], e));
    const h = B(o.snapping) ? o.snapping : void 0;
    h && (H("snapping.fill", h.fill, ["off", "down", "nearest", "up"], e), H("snapping.color", h.color, ["off", "level", "midpoint", "high", "low"], e));
  }
  const r = B(i.scale) ? i.scale : void 0;
  if (r) {
    we("scale.", r, zo, e, /* @__PURE__ */ new Set(["gap"])), "gap" in r && e.push('Removed legacy field "scale.gap"'), H("scale.placement", r.placement, ["below", "bottom", "center", "top"], e), H("scale.spacing", r.spacing, ["even", "levels"], e);
    const u = B(r.ticks) ? r.ticks : void 0;
    u && (we("scale.ticks.", u, Oo, e), H("scale.ticks.color_mode", u.color_mode, ["theme", "gradient", "stepped", "level", "custom", "contrast"], e));
    const h = B(r.labels) ? r.labels : void 0;
    h && (we("scale.labels.", h, Ho, e), H("scale.labels.color_mode", h.color_mode, ["theme", "gradient", "stepped", "level", "custom"], e));
  }
  const s = i.levels;
  Array.isArray(s) && s.forEach((u, h) => {
    if (B(u))
      for (const m of Object.keys(u))
        Fo.has(m) || e.push(`Unknown field "levels[${h}].${m}"`);
  });
  const a = B(i.content) ? i.content : void 0;
  a && B(a.icon_color) && H("content.icon_color.mode", a.icon_color.mode, ["theme", "state", "level", "custom"], e);
  const d = B(i.style) ? i.style : void 0;
  d && H("style.card", d.card, ["default", "plain"], e);
  const c = B(i.actions) ? i.actions : void 0;
  if (c) {
    const u = ["none", "more-info", "toggle", "navigate", "url", "call-service"], h = B(c.tap_action) ? c.tap_action : void 0, m = B(c.hold_action) ? c.hold_action : void 0, f = B(c.double_tap_action) ? c.double_tap_action : void 0;
    h && H("actions.tap_action.action", h.action, u, e), m && H("actions.hold_action.action", m.action, u, e), f && H("actions.double_tap_action.action", f.action, u, e);
  }
  return { warnings: e };
}
function Bo(i, e) {
  if (i <= 0 || e <= 0) return [0, 100];
  const t = e / i * 100;
  if (t <= 0) return [0, 100];
  const n = [0];
  for (let o = t; o < 100; o += t) n.push(o);
  return n.push(100), n;
}
function Uo(i, e, t, n = 1) {
  var _, p;
  if (!i || i.length < 2) return [0, 100];
  const o = Math.max(1, Math.floor(Number(n) || 1)), r = Number.isFinite(e) ? e : ((_ = i[0]) == null ? void 0 : _.value) ?? 0, s = Number.isFinite(t) ? t : ((p = i[i.length - 1]) == null ? void 0 : p.value) ?? 100, a = Math.min(r, s), d = Math.max(r, s), c = d - a || 1, u = i.map((b) => b.value).filter((b) => Number.isFinite(b) && b > a && b < d).map((b) => G((b - a) / c * 100, 0, 100)).filter((b) => b > 0 && b < 100).sort((b, v) => b - v), m = [0, ...u.filter((b, v) => v === 0 || b !== u[v - 1]), 100];
  if (o <= 1) return m;
  const f = [0];
  for (let b = 0; b < m.length - 1; b++) {
    const v = m[b], w = m[b + 1], y = (w - v) / o;
    for (let S = 1; S < o; S++)
      f.push(v + y * S);
    f.push(w);
  }
  return f.map((b) => G(b, 0, 100)).sort((b, v) => b - v).filter((b, v, w) => v === 0 || Math.abs(b - w[v - 1]) > 1e-9);
}
function Do(i, e, t) {
  if (!e || e.length === 0) return i;
  const n = [...e].sort((o, r) => o - r);
  if (t === "down")
    return n.filter((o) => o <= i).pop() ?? 0;
  if (t === "up")
    return n.find((o) => o >= i) ?? 100;
  if (t === "nearest") {
    let o = n[0], r = Math.abs(i - o);
    for (const s of n) {
      const a = Math.abs(i - s);
      a < r && (r = a, o = s);
    }
    return o;
  }
  return i;
}
const kn = 12, wt = 1.2, Go = 2, Wo = 4;
function Vo(i, e, t, n) {
  const o = G(n, 0, 100);
  if (i !== "current_segment" || e === "off" || t.length < 2)
    return { start: 0, end: o };
  const r = [...t].sort((s, a) => s - a);
  if (o <= r[0]) return { start: r[0], end: r[1] };
  if (o >= r[r.length - 1]) return { start: r[r.length - 2], end: r[r.length - 1] };
  for (let s = 0; s < r.length - 1; s++) {
    const a = r[s], d = r[s + 1];
    if (o <= d) return { start: a, end: d };
  }
  return { start: 0, end: o };
}
function qo(i, e, t, n, o) {
  if (i.length === 0) return [{ offset: 0, color: n }, { offset: 100, color: n }];
  const r = t - e || 1, s = (c) => G((c - e) / r * 100, 0, 100);
  if (o === "gradient") return i.map((c) => ({ offset: s(c.value), color: c.color }));
  if (o === "current_level") return [{ offset: 0, color: n }, { offset: 100, color: n }];
  const a = [];
  for (let c = 0; c < i.length - 1; c++) {
    const u = i[c], h = i[c + 1], m = s(u.value), f = s(h.value);
    a.push({ offset: m, color: u.color }, { offset: f, color: u.color });
  }
  const d = i[i.length - 1];
  return a.push({ offset: s(d.value), color: d.color }), a;
}
function Ko(i) {
  let e = 0;
  for (let t = 0; t < i.length; t++) {
    const n = i[t];
    if (n === "(") e++;
    else if (n === ")") e = Math.max(0, e - 1);
    else if (n === "," && e === 0) return [i.slice(0, t).trim(), i.slice(t + 1).trim()];
  }
  return [i.trim(), ""];
}
function St(i, e, t = 0) {
  const n = e.trim();
  if (!n || t > 8 || !n.startsWith("var(") || !n.endsWith(")")) return n;
  const o = n.slice(4, -1).trim(), [r, s] = Ko(o);
  if (r.startsWith("--")) {
    const a = i.getPropertyValue(r).trim();
    if (a) return St(i, a, t + 1);
  }
  return s ? St(i, s, t + 1) : n;
}
function tn(i, e) {
  return !e || !e.includes("var(") ? e : St(i, e);
}
function Ne(i) {
  const e = i.trim();
  if (e.startsWith("#")) {
    const n = e.length === 4 ? `#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}` : e;
    if (n.length === 7)
      return {
        r: parseInt(n.slice(1, 3), 16),
        g: parseInt(n.slice(3, 5), 16),
        b: parseInt(n.slice(5, 7), 16)
      };
  }
  const t = e.match(/rgba?\(([^)]+)\)/i);
  if (t) {
    const n = t[1].split(",").map((o) => Number(o.trim()));
    if (n.length >= 3 && n.every((o) => Number.isFinite(o)))
      return { r: n[0], g: n[1], b: n[2] };
  }
  return null;
}
function Yo(i, e, t) {
  return {
    r: Math.round(i.r + (e.r - i.r) * t),
    g: Math.round(i.g + (e.g - i.g) * t),
    b: Math.round(i.b + (e.b - i.b) * t)
  };
}
function nn(i) {
  return i ? (0.2126 * i.r + 0.7152 * i.g + 0.0722 * i.b) / 255 > 0.5 ? "#000000" : "#ffffff" : null;
}
function Qo(i, e, t, n, o) {
  const r = i.length ? i : [{ value: e, color: n }, { value: t, color: n }];
  let s = r[0], a = r[r.length - 1];
  for (let p = 0; p < r.length - 1; p++)
    if (o >= r[p].value && o <= r[p + 1].value) {
      s = r[p], a = r[p + 1];
      break;
    }
  const d = Ne(s.color), c = Ne(a.color);
  if (!d || !c) return xe(i, o, n);
  const u = a.value === s.value ? 0 : (o - s.value) / (a.value - s.value), h = (p, b) => Math.round(p + (b - p) * u), m = h(d.r, c.r).toString(16).padStart(2, "0"), f = h(d.g, c.g).toString(16).padStart(2, "0"), _ = h(d.b, c.b).toString(16).padStart(2, "0");
  return `#${m}${f}${_}`;
}
function kt(i, e, t, n, o, r) {
  return i === "current_level" || i === "level" ? r : i === "stepped" ? xe(t, e, r) : i === "gradient" ? Qo(t, n, o, r, e) : r;
}
function Xo(i) {
  var h, m;
  const { content: e, levels: t, min: n, max: o, valueNum: r } = i, s = at((h = e == null ? void 0 : e.icon_color) == null ? void 0 : h.mode), a = Number.isFinite(r) ? G(r, n, o) : n;
  let d;
  for (const f of t)
    if (a >= f.value) d = f;
    else break;
  const c = (d == null ? void 0 : d.icon) ?? (e == null ? void 0 : e.icon);
  let u;
  return s === "custom" && ((m = e == null ? void 0 : e.icon_color) != null && m.value) ? u = String(e.icon_color.value) : s === "theme" ? u = "var(--primary-color)" : s === "level" && (u = xe(t, a, "var(--primary-color)")), { icon: c, source: s, styleColor: u };
}
function Zo(i) {
  const { levels: e, min: t, max: n, lowValue: o, highValue: r, fallbackColor: s } = i;
  if (e.length < 2) return s;
  const a = (m) => (m - t) / (n - t || 1) * 100, d = [];
  for (let m = 0; m < e.length - 1; m++) {
    const f = e[m].value, _ = e[m + 1].value;
    _ <= f || d.push({
      start: f,
      end: _,
      color: e[m].color,
      leftPct: Math.min(a(f), a(_))
    });
  }
  let c = -1, u = Number.POSITIVE_INFINITY, h = null;
  for (const m of d) {
    const f = Math.max(0, Math.min(r, m.end) - Math.max(o, m.start));
    (f > c || Math.abs(f - c) < 1e-9 && m.leftPct < u) && (c = f, u = m.leftPct, h = m.color);
  }
  return h ?? s;
}
function Jo(i) {
  const { colorQuant: e, segmentMode: t, segmentBoundaries: n, min: o, max: r, levels: s, colorAtValue: a } = i;
  if (e === "off" || t === "off") return null;
  const d = [];
  for (let u = 0; u < n.length - 1; u++) {
    const h = n[u], m = n[u + 1];
    m > h && d.push({ a: h, b: m });
  }
  if (d.length === 0) return null;
  const c = (u) => o + (r - o || 1) * (u / 100);
  return d.map(({ a: u, b: h }) => {
    const m = c(u), f = c(h), _ = Math.max(Math.min(m, f), Math.min(o, r)), p = Math.min(Math.max(m, f), Math.max(o, r)), b = (_ + p) / 2;
    let v = a(b);
    return e === "low" ? v = a(_) : e === "high" ? v = a(p) : e === "level" && (v = Zo({
      levels: s,
      min: o,
      max: r,
      lowValue: _,
      highValue: p,
      fallbackColor: a(b)
    })), { start: u, end: h, color: v };
  });
}
function ei(i) {
  const {
    tickMode: e,
    labelMode: t,
    tickCustom: n,
    labelCustom: o,
    levels: r,
    min: s,
    max: a,
    currentColor: d,
    fillWindow: c,
    scaleLayout: u,
    scaleOffset: h,
    showBar: m,
    barHeight: f,
    barTop: _,
    trackIntensity: p,
    cardBgRgb: b,
    trackBgRgb: v,
    colorAtValue: w
  } = i, y = e === "contrast" ? Ne(d) : null, S = e === "contrast" && v && y ? Yo(v, y, p / 100) : v ?? y, C = (g) => {
    if (!m || f <= 0 || u.mode === "below") return !1;
    const P = g ? u.tickTopMajor : u.tickTop, R = g ? u.tickHeightMajor : u.tickHeight, A = P + R / 2 + h;
    return A >= _ && A <= _ + f;
  };
  return {
    tickColorFor: (g, P, R) => {
      if (e === "theme") return null;
      if (e === "custom") return n || null;
      if (e === "contrast") {
        if (!C(R))
          return nn(b ?? v ?? y) ?? null;
        const N = P >= c.start && P <= c.end ? Ne(w(g)) ?? y : S ?? y;
        return nn(N) ?? null;
      }
      return kt(e, g, r, s, a, d);
    },
    labelColorFor: (g) => t === "theme" ? null : t === "custom" ? o || null : kt(t, g, r, s, a, d)
  };
}
function ti(i) {
  const { segmentMode: e, levels: t, min: n, max: o, trackWidth: r, segWidthRaw: s, gapWidthRaw: a, subdivisionsPerLevelRaw: d, pointerLeft: c, fillQuant: u } = i, h = G(Math.floor(Number(d) || 1), 1, 200), m = Math.max(0, s), f = Math.max(0, a);
  let _ = 0, p = 0, b = !1, v = [], w = [0, 100];
  e === "fixed" && m > 0 ? (p = Math.min(f, Math.max(0, m - 1)), _ = m - p, b = _ > 0 && p > 0, r > 0 && (w = Bo(r, m))) : e === "level" && t.length > 1 && (w = Uo(t, n, o, h), f > 0 && (p = f, v = w.slice(1, -1)));
  const y = u === "off" || e === "off" || e === "fixed" && r <= 0 ? c : Do(c, w, u);
  return {
    blockSizePx: _,
    gapPx: p,
    striped: b,
    levelGaps: v,
    segmentBoundaries: w,
    fillPct: G(y, 0, 100)
  };
}
function ni(i, e, t, n, o) {
  if (!(i === "fixed" && e && t > 0 && n > 0)) return [];
  const r = n / t * 100;
  return o.slice(1).map((s) => {
    const a = Math.max(0, s - r), d = Math.min(r, 100 - a);
    return d > 0 ? { x: a, width: d } : null;
  }).filter((s) => !!s);
}
function oi(i) {
  var Te;
  const { config: e, min: t, max: n, barHeight: o, barTop: r, barVisible: s, trackHeight: a } = i, d = e.scale ?? l.scale, c = e.data ?? l.data, u = d.ticks ?? l.scale.ticks, h = d.labels ?? l.scale.labels;
  if (!d.show)
    return {
      ticks: [],
      style: "",
      className: "",
      height: 0,
      mode: "below",
      labelsOn: !1,
      tickTop: 0,
      tickHeight: 0,
      tickTopMajor: 0,
      tickHeightMajor: 0
    };
  const m = Math.max(
    2,
    Math.min(40, Math.round(Number(u.major_count ?? l.scale.ticks.major_count) || 0))
  ), f = Math.max(
    0,
    Math.min(9, Math.round(Number(u.minor_per_major ?? l.scale.ticks.minor_per_major) || 0))
  ), _ = n - t || 1, p = h.show !== !1, b = h.precision ?? c.precision ?? null, v = Math.max(8, Math.round(Number(h.size ?? l.scale.labels.size ?? kn))), w = Math.ceil(v * wt), y = [];
  if (rt(d.spacing ?? l.scale.spacing) === "levels" && (((Te = e.levels) == null ? void 0 : Te.length) ?? 0) > 0) {
    const M = (e.levels ?? []).map((k) => ({ value: Number(k == null ? void 0 : k.value) })).filter((k) => Number.isFinite(k.value)).map((k) => k.value).filter((k) => k >= t && k <= n).concat([t, n]).sort((k, L) => k - L), Y = M.filter((k, L) => L === 0 || k !== M[L - 1]).map((k) => ({ value: k }));
    if (Y.length === 0)
      for (let k = 0; k < m; k++) {
        const L = m === 1 ? 0 : k / (m - 1), q = t + L * _;
        if (y.push({ pos: L * 100, major: !0, label: p ? le(q, b) : void 0 }), k < m - 1 && f > 0)
          for (let oe = 1; oe <= f; oe++) {
            const te = (k + oe / (f + 1)) / (m - 1);
            y.push({ pos: te * 100, major: !1 });
          }
      }
    else
      for (let k = 0; k < Y.length; k++) {
        const L = Y[k].value, q = _ === 0 ? 0 : (L - t) / _;
        if (y.push({
          pos: G(q, 0, 1) * 100,
          major: !0,
          label: p ? le(L, b) : void 0
        }), k < Y.length - 1 && f > 0) {
          const te = Y[k + 1].value - L;
          for (let Le = 1; Le <= f; Le++) {
            const ie = L + te * Le / (f + 1), ht = _ === 0 ? 0 : (ie - t) / _;
            y.push({ pos: G(ht, 0, 1) * 100, major: !1 });
          }
        }
      }
  } else
    for (let M = 0; M < m; M++) {
      const Y = m === 1 ? 0 : M / (m - 1), k = t + Y * _;
      if (y.push({ pos: Y * 100, major: !0, label: p ? le(k, b) : void 0 }), M < m - 1 && f > 0)
        for (let L = 1; L <= f; L++) {
          const q = (M + L / (f + 1)) / (m - 1);
          y.push({ pos: q * 100, major: !1 });
        }
    }
  const C = it(d.placement ?? l.scale.placement), g = C === "center", P = C === "bottom", R = C === "top", A = C === "below" ? 0 : r, N = g ? "var(--primary-text-color)" : "var(--secondary-text-color)", E = g ? N : "var(--primary-text-color)", V = g ? "0 0 4px rgba(0,0,0,0.6)" : "none", j = 3, T = 2;
  let U = Math.max(1, Math.round(Number(u.height_minor ?? l.scale.ticks.height_minor))), z = Math.max(1, Math.round(Number(u.height_major ?? l.scale.ticks.height_major))), D = 0, O = 0, I = 0, F = 0;
  if (C === "below") {
    const M = Math.round(Math.max(U, z) / 2 + 4);
    D = Math.max(0, Math.round(M - T / 2)), O = Math.max(0, Math.round(M - U / 2)), I = Math.max(0, Math.round(M - z / 2)), F = M + j;
  } else if (P) {
    const M = s ? A + o : Math.max(A + o, U, z);
    D = Math.max(0, Math.round(M - T)), O = Math.max(0, Math.round(M - U)), I = Math.max(0, Math.round(M - z)), F = M + j;
  } else if (R) {
    const M = A;
    D = Math.max(0, Math.round(M)), O = Math.max(0, Math.round(M)), I = Math.max(0, Math.round(M)), F = A + o + j;
  } else if (g) {
    const M = s ? Math.round(A + o / 2) : Math.max(Math.round(A + o / 2), Math.round(Math.max(U, z) / 2));
    D = Math.max(0, Math.round(M - T / 2)), O = Math.max(0, Math.round(M - U / 2)), I = Math.max(0, Math.round(M - z / 2)), F = A + o + j;
  }
  const de = Math.max(D + T, O + U, I + z), Ee = A + o, Pe = (R || g) && s ? Ee + j : de + j;
  F = Math.round(Pe);
  const ue = Number(h.y_offset ?? l.scale.labels.y_offset ?? 0);
  Number.isFinite(ue) && (F = Math.round(F + ue));
  const he = p ? w + Go : 0;
  let ee = p ? Math.max(D + z, F + he) : Math.max(D + z, O + z);
  if (!s && C !== "below" && a > 0) {
    const M = Math.min(D, O, I, F), k = Math.max(
      D + T,
      O + U,
      I + z,
      p ? F + he : 0
    ) - M, L = (a - k) / 2, q = Math.round(L - M);
    D += q, O += q, I += q, F += q, ee = Math.max(
      D + T,
      O + U,
      I + z,
      p ? F + he : 0
    );
  }
  const K = C === "below" ? "" : C, pe = [
    `--mb-scale-color:${N}`,
    `--mb-scale-color-strong:${E}`,
    `--mb-scale-shadow:${V}`,
    `--mb-scale-height:${ee}px`,
    `--mb-scale-line-top:${D}px`,
    `--mb-tick-top:${O}px`,
    `--mb-tick-height:${U}px`,
    `--mb-tick-height-major:${z}px`,
    `--mb-tick-top-major:${I}px`,
    `--mb-label-top:${F}px`,
    `--mb-label-font-size:${v}px`,
    `--mb-label-line-height:${wt}`
  ].join(";");
  return {
    ticks: y,
    style: pe,
    className: K,
    height: ee,
    mode: C,
    labelsOn: p,
    tickTop: O,
    tickHeight: U,
    tickTopMajor: I,
    tickHeightMajor: z
  };
}
function ii(i) {
  const { config: e, valueNum: t, unavailable: n, trackWidth: o, measuredInsetLeft: r, measuredInsetRight: s, baseSpacing: a, gaugeEdgeInsetPx: d } = i, c = e.layout ?? l.layout, u = Ue(c.mode), h = u === "horizontal" ? "inline" : u === "vertical" ? "below" : "stacked", m = u === "horizontal" ? "center_labels" : st(c.gauge_alignment), _ = !!(e.style ?? l.style).debug_layout, p = e.bar ?? l.bar, b = e.pointer ?? l.pointer, v = e.scale ?? l.scale, w = e.data ?? l.data, y = Number(w.min ?? 0), S = Number(w.max ?? 100), C = S - y, P = (n || C === 0 ? 0 : G((t - y) / C, 0, 1)) * 100, R = Number(p.height ?? l.bar.height), A = p.edge ?? l.bar.edge, N = p.show ?? l.bar.show, E = N ? R : 0, V = Ao(R, A, p.radius ?? null), j = e.levels ?? [], T = Sn(j, y, S), U = lt(p.color_mode), z = xe(T, t ?? y, "var(--info-color)"), D = qo(T, y, S, z, U), O = G(Number(b.size ?? l.pointer.size), 0, 100), I = Math.max(4, Math.round(O * 0.6)), F = Number(b.angle ?? l.pointer.angle ?? 30), de = G(F, 10, 90), Ee = Number(b.y_offset ?? l.pointer.y_offset ?? 0), Pe = G(Ee, -100, 100), ue = Math.max(1, Math.tan(de * Math.PI / 360) * I), he = -I + Pe, ee = -I, K = Math.max(0, -ee), pe = Math.max(0, ee + I - E), Te = he + K, M = b.color_mode ?? l.pointer.color_mode ?? "custom", Y = (() => {
    if (M === "custom") return String(b.color ?? l.pointer.color ?? "#ffffff");
    if (M === "gradient") {
      const me = t ?? y, re = T.length ? T : [{ value: y, color: "var(--primary-text-color)" }, { value: S, color: "var(--primary-text-color)" }];
      let Re = re[0], qe = re[re.length - 1];
      for (let Q = 0; Q < re.length - 1; Q++)
        if (me >= re[Q].value && me <= re[Q + 1].value) {
          Re = re[Q], qe = re[Q + 1];
          break;
        }
      const Ut = (Q) => {
        const fe = Q.trim();
        return fe.startsWith("#") && fe.length === 7 ? { r: parseInt(fe.slice(1, 3), 16), g: parseInt(fe.slice(3, 5), 16), b: parseInt(fe.slice(5, 7), 16) } : null;
      }, Ke = Ut(Re.color), Ye = Ut(qe.color);
      if (!Ke || !Ye) return xe(T, me, "var(--primary-text-color)");
      const Xn = qe.value === Re.value ? 0 : (me - Re.value) / (qe.value - Re.value), gt = (Q, fe) => Math.round(Q + (fe - Q) * Xn), Zn = gt(Ke.r, Ye.r).toString(16).padStart(2, "0"), Jn = gt(Ke.g, Ye.g).toString(16).padStart(2, "0"), eo = gt(Ke.b, Ye.b).toString(16).padStart(2, "0");
      return `#${Zn}${Jn}${eo}`;
    }
    return xe(T, t ?? y, "var(--primary-text-color)");
  })(), k = Number(c.split_pct ?? l.layout.split_pct), L = Number.isFinite(k) ? G(k, 5, 95) : l.layout.split_pct, q = Number((L / 100).toFixed(4)), oe = Number(((100 - L) / 100).toFixed(4)), te = !!v.show, Le = K + E + pe, ie = oi({
    config: e,
    min: y,
    max: S,
    barHeight: E,
    barTop: K,
    barVisible: !!N,
    trackHeight: Le
  }), ht = te && ie.mode === "below" ? Wo : 0, Tn = te ? Number(v.y_offset ?? l.scale.y_offset ?? 0) : 0, Ln = te && ie.labelsOn && ie.mode !== "below" ? Math.max(ie.height - (E + K), 0) : 0;
  let De = 0, Ge = 0;
  if (te && ie.labelsOn)
    if (m === "center_bar") {
      const me = Math.max(r, s);
      De = me, Ge = me;
    } else
      De = r, Ge = s;
  const We = p.segments ?? l.bar.segments, Lt = p.snapping ?? l.bar.snapping, Rt = ct(p.fill_mode ?? l.bar.fill_mode), It = p.track ?? l.bar.track, Ve = We.mode ?? l.bar.segments.mode, zt = Number(We.width ?? l.bar.segments.width), Rn = Number(We.gap ?? l.bar.segments.gap), In = Number(We.segments_per_level ?? l.bar.segments.segments_per_level ?? 1), Ot = dt(Lt.fill ?? l.bar.snapping.fill ?? "off"), zn = ut(Lt.color ?? l.bar.snapping.color ?? "off"), pt = It.background ?? "var(--ha-card-background, var(--card-background-color, #000))", Ht = Math.max(0, Math.min(100, Number(It.intensity ?? l.bar.track.intensity))), jt = pt, On = Math.max(0, Math.min(1, Ht / 100)), Hn = Math.max(0, zt), jn = ti({
    segmentMode: Ve,
    levels: T,
    min: y,
    max: S,
    trackWidth: o,
    segWidthRaw: zt,
    gapWidthRaw: Rn,
    subdivisionsPerLevelRaw: In,
    pointerLeft: P,
    fillQuant: Ot
  }), { blockSizePx: Fn, gapPx: mt, striped: Bn, levelGaps: Un, segmentBoundaries: ft, fillPct: Dn } = jn, Gn = Vo(Rt, Ve, ft, Dn), Wn = ni(Ve, Bn, o, mt, ft), Ft = v.ticks ?? l.scale.ticks, Bt = v.labels ?? l.scale.labels, Vn = Ft.color_mode ?? l.scale.ticks.color_mode ?? "theme", qn = Bt.color_mode ?? l.scale.labels.color_mode ?? "theme", Kn = Ft.color, Yn = Bt.color, Qn = {
    "--mb-block-size": `${Fn}px`,
    "--mb-block-gap": `${mt}px`,
    "--mb-gap-color": jt,
    "--mb-track-bg": pt,
    "--mb-pointer-size": `${O}px`,
    "--mb-pointer-height": `${I}px`,
    "--mb-pointer-half-base": `${ue}px`,
    "--mb-pointer-color": Y,
    "--mb-pointer-top": `${Te}px`,
    "--mb-pointer-pad-top": `${K}px`,
    "--mb-pointer-pad-bottom": `${pe}px`,
    "--mb-edge-inset": `${h === "below" || h === "stacked" ? d : 0}px`,
    "--mb-inline-trailing-inset": `${h === "inline" ? d : 0}px`,
    "--mb-grid-cols": `auto minmax(0, ${q}fr) minmax(0, ${oe}fr)`,
    "--mb-grid-cols-text-only": `minmax(0, ${q}fr) minmax(0, ${oe}fr)`,
    "--mb-content-gap": `${Math.max(0, Math.round(a))}px`,
    "--mb-inset-left": `${De}px`,
    "--mb-inset-right": `${Ge}px`,
    "--mb-radius": `${V}px`,
    "--mb-label-font-size": `${Math.max(
      8,
      Math.round(Number((v.labels ?? l.scale.labels).size ?? l.scale.labels.size ?? kn))
    )}px`,
    "--mb-label-line-height": `${wt}`
  };
  return {
    layoutClass: h,
    gaugeAlignment: m,
    debugLayout: _,
    min: y,
    max: S,
    range: C,
    pointerLeft: P,
    splitPct: L,
    legendFr: q,
    barFr: oe,
    showBar: N,
    hideBar: !N,
    rawHeight: R,
    height: E,
    radius: V,
    levels: T,
    colorMode: U,
    currentColor: z,
    gradStops: D,
    pointerSize: O,
    pointerHeight: I,
    pointerHalfBase: ue,
    pointerTop: Te,
    pointerPadTop: K,
    pointerPadBottom: pe,
    pointerColor: Y,
    scaleShow: te,
    scaleLayout: ie,
    scaleGap: ht,
    scaleOffset: Tn,
    scaleReserve: Ln,
    insetLeft: De,
    insetRight: Ge,
    segmentMode: Ve,
    fillMode: Rt,
    fillQuant: Ot,
    colorQuant: zn,
    segWidth: Hn,
    gapPx: mt,
    levelGaps: Un,
    segmentBoundaries: ft,
    fillWindow: Gn,
    fixedGapRects: Wn,
    trackBg: pt,
    trackIntensity: Ht,
    trackOpacity: On,
    gapColor: jt,
    tickMode: Vn,
    labelMode: qn,
    tickCustom: Kn,
    labelCustom: Yn,
    styleVars: Qn
  };
}
const $t = 12, on = 1.2, ri = 4, rn = -1;
function si(i) {
  const e = (n) => n && typeof n == "object" && n.action && n.action !== "none", t = i.actions ?? {};
  return e(t.tap_action) || e(t.hold_action) || e(t.double_tap_action);
}
const ai = 10, tt = class tt extends Ce {
  constructor() {
    super(...arguments), this._config = null, this._valueNum = null, this._measureRaf = 0, this._lastMeasureKey = "", this._insetLeft = 0, this._insetRight = 0, this._trackWidth = 0, this._trackObserverRaf = 0, this._measureAdapter = To;
  }
  setConfig(e) {
    if (!e || !e.entity) throw new Error("segment-gauge: 'entity' is required");
    const t = Pt(e);
    for (const n of t.warnings)
      console.warn("segment-gauge:", n);
    this._config = Eo(e), this._actionCtl || (this._actionCtl = new Mo(this, {
      getConfig: () => this._config,
      getHass: () => this.hass ?? null,
      getEntityId: () => {
        var n;
        return ((n = this._config) == null ? void 0 : n.entity) ?? null;
      }
    }));
  }
  updated(e) {
    var t, n;
    e.has("hass") && this.hass && ((t = this._config) != null && t.entity) && (this._stateObj = this.hass.states[this._config.entity], this._valueNum = wn((n = this._stateObj) == null ? void 0 : n.state)), this._syncTrackWidthFromDom(), this._scheduleInsetMeasure(), this._ensureTrackObserver();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._trackObserver && (this._trackObserver.disconnect(), this._trackObserver = void 0), this._trackObserverRaf && (this._measureAdapter.cancelFrame(this._trackObserverRaf), this._trackObserverRaf = 0);
  }
  _ensureTrackObserver() {
    if (this._trackObserver) return;
    const e = this._measureAdapter.queryTrack(this.renderRoot);
    if (!e) {
      this._trackObserverRaf || (this._trackObserverRaf = this._measureAdapter.requestFrame(() => {
        this._trackObserverRaf = 0, this._ensureTrackObserver();
      }));
      return;
    }
    this._trackObserver = this._measureAdapter.createResizeObserver((t) => {
      const n = t[0], o = Math.round(n.contentRect.width);
      o > 0 && o !== this._trackWidth && (this._trackWidth = o, this.requestUpdate());
    }), this._trackObserver.observe(e);
  }
  _syncTrackWidthFromDom() {
    var o, r, s;
    if ((((s = (r = (o = this._config) == null ? void 0 : o.bar) == null ? void 0 : r.segments) == null ? void 0 : s.mode) ?? l.bar.segments.mode) !== "fixed") return;
    const t = this._measureAdapter.queryTrack(this.renderRoot);
    if (!t) return;
    const n = this._measureAdapter.readTrackWidth(t);
    n > 0 && n !== this._trackWidth && (this._trackWidth = n, this.requestUpdate());
  }
  _scheduleInsetMeasure() {
    var f, _, p;
    const e = this._config;
    if (!e) return;
    const t = e.scale ?? l.scale, n = t.labels ?? l.scale.labels, o = !!t.show, r = n.show !== !1;
    if (!o || !r) {
      this._lastMeasureKey = "", this._setInsets(0, 0);
      return;
    }
    const s = Number(((f = e.data) == null ? void 0 : f.min) ?? l.data.min), a = Number(((_ = e.data) == null ? void 0 : _.max) ?? l.data.max), d = n.precision ?? ((p = e.data) == null ? void 0 : p.precision) ?? l.data.precision, c = le(s, d ?? null), u = le(a, d ?? null), h = Math.max(8, Math.round(Number(n.size ?? l.scale.labels.size ?? $t))), m = `${c}|${u}|${h}`;
    m === this._lastMeasureKey && this._insetLeft > 0 && this._insetRight > 0 || (this._lastMeasureKey = m, this._measureRaf && this._measureAdapter.cancelFrame(this._measureRaf), this._measureRaf = this._measureAdapter.requestFrame(() => {
      this._measureRaf = 0;
      const b = this._measureAdapter.queryLabelMeasureNodes(this.renderRoot);
      if (!b) return;
      const v = this._measureAdapter.readElementWidth(b.minEl), w = this._measureAdapter.readElementWidth(b.maxEl), { left: y, right: S } = Po(v, w, ri);
      this._setInsets(y, S);
    }));
  }
  _setInsets(e, t) {
    e === this._insetLeft && t === this._insetRight || (this._insetLeft = e, this._insetRight = t);
  }
  _renderIcon(e, t, n) {
    var d, c, u, h;
    const o = t.content ?? l.content, r = Xo({
      content: o,
      levels: (n == null ? void 0 : n.levels) ?? Sn(
        t.levels ?? [],
        ((d = t.data) == null ? void 0 : d.min) ?? l.data.min,
        ((c = t.data) == null ? void 0 : c.max) ?? l.data.max
      ),
      min: (n == null ? void 0 : n.min) ?? Number(((u = t.data) == null ? void 0 : u.min) ?? l.data.min),
      max: (n == null ? void 0 : n.max) ?? Number(((h = t.data) == null ? void 0 : h.max) ?? l.data.max),
      valueNum: Number.isFinite(Number(e == null ? void 0 : e.state)) ? Number(e == null ? void 0 : e.state) : null
    }), s = r.styleColor ? { color: r.styleColor } : {}, a = Object.keys(s).length ? So(s) : $;
    return r.icon ? x`<ha-icon .icon=${r.icon} style=${a}></ha-icon>` : x`<ha-state-icon
      .hass=${this.hass}
      .stateObj=${e}
      ?stateColor=${r.source === "state"}
      style=${a}
    ></ha-state-icon>`;
  }
  _renderScaleMeasurers(e, t, n) {
    var h;
    const o = e.scale ?? l.scale, r = o.labels ?? l.scale.labels, s = !!o.show, a = r.show !== !1;
    if (!s || !a) return $;
    const d = r.precision ?? ((h = e.data) == null ? void 0 : h.precision) ?? l.data.precision, c = le(t, d ?? null), u = le(n, d ?? null);
    return x`
      <span class="measure min">${c}</span>
      <span class="measure max">${u}</span>
    `;
  }
  _themePx(e, t) {
    const n = getComputedStyle(this), o = n.getPropertyValue(e).trim();
    if (!o) return t;
    const r = Number(o);
    if (Number.isFinite(r)) return r;
    const s = (a, d) => {
      const c = Number.parseFloat(a);
      return Number.isFinite(c) ? a.endsWith("rem") || a.endsWith("em") ? c * d : a.endsWith("px") ? c : t : t;
    };
    if (o.endsWith("rem")) {
      const a = getComputedStyle(document.documentElement).fontSize.trim() || "16px";
      return s(o, Number.parseFloat(a) || t);
    }
    if (o.endsWith("em")) {
      const a = n.fontSize.trim() || "16px";
      return s(o, Number.parseFloat(a) || t);
    }
    return o.endsWith("px") ? s(o, t) : t;
  }
  _renderScaleTemplate(e) {
    const { showScale: t, scaleLayout: n, min: o, range: r, tickColorFor: s, labelColorFor: a } = e;
    return t ? x`
      <div class="scale ${n.className}" style=${n.style}>
        <div class="scale-line"></div>
        ${n.ticks.map((d) => {
      const c = o + (r || 1) * (d.pos / 100), u = s(c, d.pos, d.major), h = `left:${d.pos}%${u ? `;background:${u}` : ""}`, m = d.major && d.label ? a(c) : null, f = `left:${d.pos}%${m ? `;color:${m}` : ""}`;
      return x`
            <div class="tick ${d.major ? "major" : ""}" style=${h}></div>
            ${d.major && d.label ? x`<div class="label" style=${f}>${d.label}</div>` : $}
          `;
    })}
      </div>
    ` : $;
  }
  _renderBarColorField(e) {
    const { colorQuant: t, segmentMode: n, segmentBoundaries: o, min: r, max: s, levels: a, colorAtValue: d, gradId: c } = e, u = Jo({
      colorQuant: t,
      segmentMode: n,
      segmentBoundaries: o,
      min: r,
      max: s,
      levels: a,
      colorAtValue: d
    });
    return !u || u.length === 0 ? se`<rect x="0" y="0" width="100%" height="100%" fill=${`url(#${c})`}></rect>` : u.map(
      (h) => se`<rect x="${h.start}%" y="0" width="${h.end - h.start}%" height="100%" fill=${h.color}></rect>`
    );
  }
  _renderBarGapRects(e) {
    const { segmentMode: t, fixedGapRects: n, gapPx: o, levelGaps: r, trackBg: s } = e;
    return t === "fixed" && n.length ? n.map(
      (a) => se`<rect x="${a.x}%" y="0" width="${a.width}%" height="100%" fill=${s}></rect>`
    ) : t === "level" && o > 0 ? r.map((a) => se`<rect x="${a}%" y="0" width=${o} height="100%" fill=${s}></rect>`) : $;
  }
  _renderBarSvg(e) {
    if (e.hideBar) return $;
    const t = this._renderBarColorField({
      colorQuant: e.colorQuant,
      segmentMode: e.segmentMode,
      trackWidth: e.trackWidth,
      segWidth: e.segWidth,
      segmentBoundaries: e.segmentBoundaries,
      min: e.min,
      max: e.max,
      range: e.range,
      levels: e.levels,
      colorAtValue: e.colorAtValue,
      gradId: e.gradId
    }), n = this._renderBarGapRects({
      segmentMode: e.segmentMode,
      fixedGapRects: e.fixedGapRects,
      gapPx: e.gapPx,
      levelGaps: e.levelGaps,
      trackBg: e.trackBg
    });
    return se`<svg
      class="bar-svg"
      width="100%"
      height=${e.height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id=${e.barClipId}>
          <rect x="0" y="0" width="100%" height="100%" rx=${e.radius} ry=${e.radius}></rect>
        </clipPath>
        <clipPath id=${e.fillClipId}>
          <rect
            x="${e.fillStartPct}%"
            y="0"
            width="${Math.max(0, e.fillPct - e.fillStartPct)}%"
            height="100%"
          ></rect>
        </clipPath>
        <linearGradient id=${e.gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          ${e.gradStops.map((o) => se`<stop offset="${o.offset}%" stop-color="${o.color}"></stop>`)}
        </linearGradient>
      </defs>
      <g clip-path=${`url(#${e.barClipId})`}>
        <rect x="0" y="0" width="100%" height="100%" fill=${e.trackBg}></rect>
        ${e.trackOpacity > 0 ? se`<g opacity=${e.trackOpacity}>${t} ${n}</g>` : $}
        ${e.fillPct > e.fillStartPct ? se`<g clip-path=${`url(#${e.fillClipId})`}>${t} ${n}</g>` : $}
      </g>
    </svg>`;
  }
  renderSegmentGauge() {
    var ee;
    const e = this._config, t = e.content ?? l.content, n = e.data ?? l.data, o = e.pointer ?? l.pointer, r = e.layout ?? l.layout, s = this._stateObj, a = No(s, this._valueNum), d = t.name, c = (ee = s == null ? void 0 : s.attributes) == null ? void 0 : ee.friendly_name, u = d && String(d).trim().length > 0 ? d : c ?? e.entity, h = Co(e, s), m = a ? "unavailable" : `${le(this._valueNum, n.precision ?? null)}${h ? " " + h : ""}`, f = this._themePx(
      "--segment-gauge-content-gap",
      ai
    ), _ = this._themePx(
      "--segment-gauge-padding",
      this._themePx("--ha-card-padding", 10)
    ), p = t.show_icon ?? l.content.show_icon, b = t.show_name ?? l.content.show_name, v = t.show_state ?? l.content.show_state, w = b || v, y = Math.max(0, Math.round(_ + (p ? rn : 0))), S = Number(
      r.content_spacing ?? l.layout.content_spacing ?? 0
    ), C = Number.isFinite(S) ? G(S, -48, 48) : 0, g = ii({
      config: e,
      valueNum: this._valueNum,
      unavailable: a,
      trackWidth: this._trackWidth,
      measuredInsetLeft: this._insetLeft,
      measuredInsetRight: this._insetRight,
      baseSpacing: f,
      gaugeEdgeInsetPx: y
    }), P = g.layoutClass === "stacked" ? 0 : C, R = P !== 0 ? `margin-left:${P}px;` : "", A = g.layoutClass !== "inline" ? "" : p && w ? " inline-icon-text" : p ? " inline-icon-only" : w ? " inline-text-only" : " inline-bar-only", N = `wrap ${g.layoutClass}${A}${g.debugLayout ? " debug-layout" : ""} ${a ? "unavailable" : ""}${si(e) ? " interactive" : ""}`, E = getComputedStyle(this), V = (K) => kt(g.colorMode, K, g.levels, g.min, g.max, g.currentColor), j = g.tickMode === "contrast" ? tn(E, "var(--ha-card-background, var(--card-background-color, #000))") : "", T = g.tickMode === "contrast" ? Ne(j) : null, U = g.tickMode === "contrast" ? tn(E, g.trackBg) : g.trackBg, z = g.tickMode === "contrast" ? Ne(U) : null, { tickColorFor: D, labelColorFor: O } = ei({
      tickMode: g.tickMode,
      labelMode: g.labelMode,
      tickCustom: g.tickCustom,
      labelCustom: g.labelCustom,
      levels: g.levels,
      min: g.min,
      max: g.max,
      currentColor: g.currentColor,
      fillWindow: g.fillWindow,
      scaleLayout: g.scaleLayout,
      scaleOffset: g.scaleOffset,
      showBar: g.showBar,
      barHeight: g.height,
      barTop: g.pointerPadTop,
      trackIntensity: g.trackIntensity,
      cardBgRgb: T,
      trackBgRgb: z,
      colorAtValue: V
    }), I = this._renderScaleTemplate({
      showScale: g.scaleShow,
      scaleLayout: g.scaleLayout,
      min: g.min,
      range: g.range,
      tickColorFor: D,
      labelColorFor: O
    }), F = Object.entries(g.styleVars).map(([K, pe]) => `${K}:${pe}`).join(";"), de = this._svgId ?? (this._svgId = `mb-${Math.random().toString(36).slice(2, 10)}`), Ee = `${de}-grad`, Pe = `${de}-bar-clip`, ue = `${de}-fill-clip`, he = o.show ?? l.pointer.show;
    return x`
      <div class=${N} style=${F}>
        ${p ? x`<div class="icon">${this._renderIcon(s, e, g)}</div>` : $}
        ${w ? x`<div class="text" style=${R}>
              ${b ? x`<div class="name">${u}</div>` : $}
              ${v ? x`<div class="state">${m}</div>` : $}
            </div>` : $}

        <div class="bar">
          <div
            class="bar-stack"
            style=${`--mb-scale-gap:${g.scaleGap}px; --mb-scale-offset:${g.scaleOffset}px; --mb-scale-reserve:${g.scaleReserve}px;`}
          >
            <div class="inner">
                  <div class="track-wrap">
                    <div
                      class="track"
                      style=${`height:${g.height}px; border-radius:${g.radius}px;${g.hideBar ? "background:transparent; box-shadow:none;" : ""}`}
                    >
                      ${this._renderBarSvg({
      hideBar: g.hideBar,
      height: g.height,
      radius: g.radius,
      fillStartPct: g.fillWindow.start,
      fillPct: g.fillWindow.end,
      barClipId: Pe,
      fillClipId: ue,
      gradId: Ee,
      gradStops: g.gradStops,
      trackBg: g.trackBg,
      trackOpacity: g.trackOpacity,
      colorQuant: g.colorQuant,
      segmentMode: g.segmentMode,
      trackWidth: this._trackWidth,
      segWidth: g.segWidth,
      segmentBoundaries: g.segmentBoundaries,
      min: g.min,
      max: g.max,
      range: g.range,
      levels: g.levels,
      colorAtValue: V,
      fixedGapRects: g.fixedGapRects,
      gapPx: g.gapPx,
      levelGaps: g.levelGaps
    })}
                    </div>
                    ${a || !he ? $ : x`<div class="pointer triangle" style="left:${g.pointerLeft}%;"></div>`}
                  </div>
              ${I}
            </div>
          </div>
          ${g.scaleShow ? this._renderScaleMeasurers(e, g.min, g.max) : $}
        </div>
      </div>
    `;
  }
  getCardSize() {
    var t;
    return Ue((t = (this._config ?? l).layout) == null ? void 0 : t.mode) === "horizontal" ? 1 : 2;
  }
};
tt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _stateObj: { state: !0 },
  _valueNum: { state: !0 },
  _insetLeft: { state: !0 },
  _insetRight: { state: !0 }
}, tt.styles = hn`
    :host {
      display: block;
    }

    .wrap {
      display: grid;
      cursor: default;
      gap: 8px;
      align-items: center;
    }

    .wrap.inline.inline-icon-text {
      grid-template-columns: var(--mb-grid-cols, auto minmax(0, 1fr) minmax(0, 3fr));
      grid-template-areas: "icon text bar";
    }

    .wrap.inline.inline-icon-only {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas: "icon bar";
    }

    .wrap.inline.inline-text-only {
      grid-template-columns: var(--mb-grid-cols-text-only, minmax(0, 1fr) minmax(0, 3fr));
      grid-template-areas: "text bar";
    }

    .wrap.inline.inline-bar-only {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "bar";
    }

    .wrap.inline,
    .wrap.below {
      column-gap: var(--mb-content-gap, 10px);
    }

    .wrap.interactive {
      cursor: pointer;
    }

    .wrap.debug-layout {
      outline: 1px dashed rgba(255, 255, 255, 0.35);
      outline-offset: -1px;
      background: rgba(255, 255, 255, 0.02);
    }

    .wrap.below {
      grid-template-columns: auto 1fr;
      grid-template-areas:
        "icon text"
        "bar bar";
    }

    .wrap.stacked {
      grid-template-columns: 1fr;
      grid-template-areas:
        "icon"
        "text"
        "bar";
      justify-items: center;
    }

    .wrap.inline .icon,
    .wrap.below .icon {
      width: 36px;
      height: 36px;
      margin: ${rn}px;
    }

    .icon {
      grid-area: icon;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wrap.debug-layout .icon {
      outline: 1px solid rgba(0, 200, 255, 0.9);
      outline-offset: -1px;
      background: rgba(0, 200, 255, 0.08);
    }

    .text {
      grid-area: text;
      min-width: 0;
    }

    .wrap.debug-layout .text {
      outline: 1px solid rgba(255, 208, 64, 0.9);
      outline-offset: -1px;
      background: rgba(255, 208, 64, 0.08);
    }


    .wrap.stacked .text {
      text-align: center;
    }

    .name {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
      color: var(--primary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .state {
      margin-top: 2px;
      font-size: 12px;
      line-height: 1.2;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .bar {
      grid-area: bar;
      position: relative;
      box-sizing: border-box;
      padding-left: var(--mb-edge-inset, 0px);
      padding-right: var(--mb-edge-inset, 0px);
    }

    .wrap.debug-layout .bar {
      outline: 1px solid rgba(255, 128, 32, 0.9);
      outline-offset: -1px;
      background: rgba(255, 128, 32, 0.06);
    }

    .wrap.below .bar,
    .wrap.stacked .bar {
      justify-self: stretch;
      width: 100%;
    }

    .wrap.inline .bar {
      padding-right: var(--mb-inline-trailing-inset, 0px);
    }

    .bar-stack {
      display: flex;
      flex-direction: column;
      position: relative;
      padding-bottom: var(--mb-scale-reserve, 0px);
      box-sizing: border-box;
    }

    .wrap.debug-layout .bar-stack {
      outline: 1px dashed rgba(180, 120, 255, 0.9);
      outline-offset: -1px;
      background: rgba(180, 120, 255, 0.05);
    }

    .inner {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--mb-scale-gap, 6px);
      width: 100%;
      padding-left: var(--mb-inset-left, 0px);
      padding-right: var(--mb-inset-right, 0px);
      box-sizing: border-box;
    }

    .wrap.debug-layout .inner {
      outline: 1px dashed rgba(0, 255, 170, 0.9);
      outline-offset: -1px;
      background: rgba(0, 255, 170, 0.05);
    }

    .track-wrap {
      position: relative;
      width: 100%;
      padding-top: var(--mb-pointer-pad-top, 0px);
      padding-bottom: var(--mb-pointer-pad-bottom, 0px);
    }

    .wrap.debug-layout .track-wrap {
      outline: 1px dashed rgba(80, 200, 255, 0.8);
      outline-offset: -1px;
    }

    .track {
      position: relative;
      width: 100%;
      overflow: hidden;
      background: var(--mb-track-bg, var(--divider-color));
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    }

    .wrap.debug-layout .track {
      outline: 1px solid rgba(255, 96, 96, 0.95);
      outline-offset: -1px;
    }

    .bar-svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .pointer {
      position: absolute;
      top: var(--mb-pointer-top, -6px);
      transform: translateX(-50%);
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
      pointer-events: none;
      z-index: 3;
    }

    .pointer.triangle {
      width: 0;
      height: 0;
      border-left: var(--mb-pointer-half-base) solid transparent;
      border-right: var(--mb-pointer-half-base) solid transparent;
      border-top: var(--mb-pointer-height) solid var(--mb-pointer-color);
    }


    .unavailable {
      opacity: 0.55;
      filter: grayscale(0.2);
    }

    .scale {
      width: 100%;
      position: relative;
      height: var(--mb-scale-height, 20px);
      color: var(--mb-scale-color, var(--secondary-text-color));
      font-size: var(--mb-label-font-size, ${$t}px);
      line-height: var(--mb-label-line-height, ${on});
      pointer-events: none;
      box-sizing: border-box;
      padding: 0;
      transform: translateY(var(--mb-scale-offset, 0px));
    }

    .wrap.debug-layout .scale {
      outline: 1px dashed rgba(120, 220, 255, 0.9);
      outline-offset: -1px;
      background: rgba(120, 220, 255, 0.04);
    }

    .scale.center,
    .scale.bottom,
    .scale.top {
      position: absolute;
      left: var(--mb-inset-left, 0px);
      right: var(--mb-inset-right, 0px);
      top: 0;
      width: auto;
      height: var(--mb-scale-height, 20px);
      overflow: visible;
    }

    .scale-line {
      position: absolute;
      left: 0;
      right: 0;
      top: var(--mb-scale-line-top, 10px);
      height: 2px;
      background: var(--divider-color);
      opacity: 0.7;
    }

    .tick {
      position: absolute;
      transform: translateX(-50%);
      width: 1px;
      background: var(--mb-scale-color, var(--secondary-text-color));
      height: var(--mb-tick-height, 8px);
      top: var(--mb-tick-top, 6px);
      opacity: 0.9;
    }

    .tick.major {
      width: 2px;
      background: var(--mb-scale-color-strong, var(--primary-text-color));
      height: var(--mb-tick-height-major, 12px);
      top: var(--mb-tick-top-major, 4px);
    }

    .label {
      position: absolute;
      top: var(--mb-label-top, 18px);
      white-space: nowrap;
      color: var(--mb-scale-color, var(--secondary-text-color));
      text-shadow: var(--mb-scale-shadow, none);
      transform: translateX(-50%);
    }

    .wrap.debug-layout .label {
      outline: 1px dotted rgba(255, 255, 255, 0.35);
      outline-offset: 0;
    }

    .measure {
      position: absolute;
      visibility: hidden;
      white-space: nowrap;
      pointer-events: none;
      font-size: var(--mb-label-font-size, ${$t}px);
      line-height: var(--mb-label-line-height, ${on});
      font-weight: normal;
      letter-spacing: normal;
      left: 0;
      top: 0;
    }
  `;
let et = tt;
class li extends et {
  render() {
    var s, a;
    if (!this._config) return x``;
    const e = ((s = this._config.style) == null ? void 0 : s.card) ?? l.style.card, t = !!((a = this._config.style) != null && a.debug_layout), n = e === "plain" ? "background: none; box-shadow: none; border: none;" : "", o = t ? "outline:1px dashed rgba(64, 180, 255, 0.95); outline-offset:-1px; background:rgba(64, 180, 255, 0.06);" : "", r = t ? "outline:1px dashed rgba(120, 255, 170, 0.95); outline-offset:-1px; background:rgba(120, 255, 170, 0.04);" : "";
    return x`
      <ha-card style=${n}>
        <div
          style=${`padding: var(--segment-gauge-padding, var(--ha-card-padding, 10px)); display:flex; align-items:center; box-sizing:border-box; ${o}`}
        >
          <div style=${`width:100%; ${r}`}>
            ${this.renderSegmentGauge()}
          </div>
        </div>
      </ha-card>
    `;
  }
  static getConfigElement() {
    return document.createElement("segment-gauge-editor");
  }
  static getStubConfig() {
    return {
      entity: "",
      data: {
        min: 0,
        max: 100
      },
      layout: {
        mode: "horizontal"
      },
      content: {
        show_icon: !0,
        show_name: !0,
        show_state: !0,
        icon_color: { mode: "theme" }
      },
      bar: {
        height: 6,
        edge: "rounded"
      },
      pointer: {
        color: "#ffffff"
      },
      levels: [{ value: 0, color: "#03a9f4" }]
    };
  }
}
function ci() {
  const i = "segment-gauge";
  customElements.get(i) || customElements.define(i, li);
}
class di extends et {
  render() {
    return this._config ? x`${this.renderSegmentGauge()}` : x``;
  }
}
function ui() {
  const i = "segment-gauge-row";
  customElements.get(i) || customElements.define(i, di);
}
function X(i) {
  if (!(!i || typeof i != "object" || Array.isArray(i)))
    return i;
}
function hi(i) {
  const e = X(i.content) ? { ...i.content } : {}, t = X(i.layout) ? { ...i.layout } : {}, n = X(i.data) ? { ...i.data } : {}, o = X(i.bar) ? { ...i.bar } : void 0, r = X(i.pointer) ? { ...i.pointer } : void 0, s = X(i.scale) ? { ...i.scale } : void 0;
  X(e.icon_color) && (e.icon_color = { ...e.icon_color }, e.icon_color.mode = at(e.icon_color.mode)), o && (o.color_mode = lt(o.color_mode), o.fill_mode = ct(o.fill_mode), X(o.segments) && (o.segments = { ...o.segments }, delete o.segments.subdivisions_per_level)), o != null && o.snapping && (o.snapping = {
    ...o.snapping,
    fill: dt(o.snapping.fill),
    color: ut(o.snapping.color)
  }), r && (r.color_mode = $n(r.color_mode));
  const a = {
    ...t,
    mode: Ue(t.mode),
    gauge_alignment: st(t.gauge_alignment)
  }, d = X(s == null ? void 0 : s.ticks) ? { ...s == null ? void 0 : s.ticks, color_mode: yn((s == null ? void 0 : s.ticks).color_mode) } : s == null ? void 0 : s.ticks, c = X(s == null ? void 0 : s.labels) ? { ...s == null ? void 0 : s.labels, color_mode: Et((s == null ? void 0 : s.labels).color_mode) } : s == null ? void 0 : s.labels, { gap: u, ...h } = s ?? {}, m = {
    ...h,
    placement: it(s == null ? void 0 : s.placement),
    spacing: rt(s == null ? void 0 : s.spacing),
    ticks: d,
    labels: c
  };
  return {
    ...i,
    content: e,
    data: n,
    layout: a,
    bar: o,
    pointer: r,
    scale: m
  };
}
function J(i) {
  var t;
  const e = i;
  return e != null && e.detail && "value" in e.detail ? e.detail.value : (t = e == null ? void 0 : e.target) == null ? void 0 : t.value;
}
function pi(i) {
  var t, n;
  const e = i;
  return typeof ((t = e == null ? void 0 : e.target) == null ? void 0 : t.checked) == "boolean" ? e.target.checked : typeof ((n = e == null ? void 0 : e.detail) == null ? void 0 : n.value) == "boolean" ? e.detail.value : !!J(i);
}
function Z(i) {
  return Mn(J(i));
}
function Mn(i) {
  const e = Number(i);
  return Number.isFinite(e) ? e : null;
}
function Qe(i, e = {}) {
  let t = i;
  return e.round && (t = Math.round(t)), typeof e.min == "number" && (t = Math.max(e.min, t)), typeof e.max == "number" && (t = Math.min(e.max, t)), t;
}
function Se(i) {
  const e = String(i ?? "");
  return e === "" ? void 0 : e;
}
function ke(i) {
  return String(i ?? "");
}
function be(i, e) {
  if (i.length === 0) return {};
  let t = { [i[i.length - 1]]: e };
  for (let n = i.length - 2; n >= 0; n -= 1)
    t = { [i[n]]: t };
  return t;
}
function sn(i) {
  if (!i) return;
  const e = i.trim();
  if (!e) return;
  if (e.startsWith("#")) {
    if (e.length === 4) {
      const n = e[1], o = e[2], r = e[3];
      return `#${n}${n}${o}${o}${r}${r}`.toLowerCase();
    }
    if (e.length === 7) return e.toLowerCase();
  }
  const t = e.match(/rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d\\.]+))?\\)/i);
  if (t) {
    const n = (o) => Math.min(255, Math.max(0, parseInt(o, 10) || 0)).toString(16).padStart(2, "0");
    return `#${n(t[1])}${n(t[2])}${n(t[3])}`;
  }
}
function an(i) {
  const e = i.trim().toLowerCase();
  if (!e.startsWith("#")) return null;
  const t = e.length === 4 ? `#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}` : e;
  if (t.length !== 7) return null;
  const n = parseInt(t.slice(1, 3), 16), o = parseInt(t.slice(3, 5), 16), r = parseInt(t.slice(5, 7), 16);
  return [n, o, r].every((s) => Number.isFinite(s)) ? { r: n, g: o, b: r } : null;
}
function Cn(i, e, t) {
  const n = (o) => Math.min(255, Math.max(0, Math.round(o))).toString(16).padStart(2, "0");
  return `#${n(i)}${n(e)}${n(t)}`;
}
function ln(i, e, t) {
  i /= 255, e /= 255, t /= 255;
  const n = Math.max(i, e, t), o = Math.min(i, e, t), r = n - o;
  let s = 0, a = 0;
  const d = (n + o) / 2;
  if (r !== 0) {
    switch (a = r / (1 - Math.abs(2 * d - 1)), n) {
      case i:
        s = (e - t) / r % 6;
        break;
      case e:
        s = (t - i) / r + 2;
        break;
      default:
        s = (i - e) / r + 4;
    }
    s *= 60, s < 0 && (s += 360);
  }
  return { h: s, s: a * 100, l: d * 100 };
}
function An(i, e, t) {
  e /= 100, t /= 100;
  const n = (1 - Math.abs(2 * t - 1)) * e, o = i % 360 / 60, r = n * (1 - Math.abs(o % 2 - 1));
  let s = 0, a = 0, d = 0;
  o >= 0 && o < 1 ? (s = n, a = r) : o < 2 ? (s = r, a = n) : o < 3 ? (a = n, d = r) : o < 4 ? (a = r, d = n) : o < 5 ? (s = r, d = n) : (s = n, d = r);
  const c = t - n / 2;
  return { r: (s + c) * 255, g: (a + c) * 255, b: (d + c) * 255 };
}
function Nn(i) {
  const e = Math.floor(i() * 360), t = 65 + i() * 20, n = 55 + i() * 15, o = An(e, t, n);
  return Cn(o.r, o.g, o.b);
}
function mi(i, e, t) {
  const n = an(i), o = an(e);
  if (!n || !o) return Nn(t);
  const r = ln(n.r, n.g, n.b), s = ln(o.r, o.g, o.b);
  let a = s.h - r.h;
  a > 180 && (a -= 360), a < -180 && (a += 360);
  const d = (s.h + a + 360) % 360, c = Math.min(90, Math.max(40, s.s)), u = Math.min(75, Math.max(35, s.l)), h = An(d, c, u);
  return Cn(h.r, h.g, h.b);
}
function fi(i, e) {
  var o, r;
  if (i.length === 0) return "#00ff00";
  if (i.length === 1) return Nn(e);
  const t = sn((o = i[i.length - 2]) == null ? void 0 : o.color) ?? "#00ff00", n = sn((r = i[i.length - 1]) == null ? void 0 : r.color) ?? "#00ff00";
  return mi(t, n, e);
}
function gi(i) {
  return Array.isArray(i) ? i : [];
}
function bi(i, e) {
  const t = e.random ?? Math.random, n = Number.isFinite(e.min) ? e.min : 0, o = Number.isFinite(e.max) ? e.max : 100, r = Number(e.precision), s = i.slice(), a = s.reduce((u, h) => Number.isFinite(h.value) ? Math.max(u, h.value) : u, n), d = o - n;
  let c = s.length === 0 ? n : a + (d > 0 ? d * 0.2 : 0);
  if (Number.isFinite(r) && r >= 0) {
    const u = 10 ** r;
    c = Math.floor(c * u) / u;
  }
  return Number.isFinite(n) && Number.isFinite(o) && (c = Math.max(n, Math.min(o, c))), s.push({ value: c, color: fi(s, t) }), s;
}
function _i(i, e) {
  const t = i.slice();
  return t.splice(e, 1), t;
}
function vi(i, e, t) {
  const n = i.slice(), o = n[e] ?? { value: 0, color: "#00ff00" };
  return n[e] = { ...o, ...t }, n;
}
function W(i, e, t = {}) {
  if (!i || typeof i != "object" || Array.isArray(i)) return i;
  const n = {}, o = new Set(e);
  for (const r of e) {
    const s = i[r];
    s !== void 0 && (n[r] = t[r] ? t[r](s) : s);
  }
  for (const [r, s] of Object.entries(i))
    s === void 0 || o.has(r) || (n[r] = t[r] ? t[r](s) : s);
  return n;
}
function En(i) {
  return W(i, ["type", "entity", "content", "style", "layout", "data", "levels", "bar", "pointer", "scale", "actions"], {
    content: (c) => W(c, ["name", "show_icon", "show_name", "show_state", "icon", "icon_color"], {
      icon_color: (u) => W(u, ["mode", "value"])
    }),
    data: (c) => W(c, ["min", "max", "precision", "unit"]),
    layout: (c) => W(c, ["mode", "split_pct", "gauge_alignment", "content_spacing"]),
    bar: (c) => W(c, ["show", "height", "edge", "radius", "color_mode", "fill_mode", "track", "segments", "snapping"], {
      track: (u) => W(u, ["background", "intensity"]),
      segments: (u) => W(u, ["mode", "width", "gap", "segments_per_level"]),
      snapping: (u) => W(u, ["fill", "color"])
    }),
    pointer: (c) => W(c, ["show", "size", "angle", "y_offset", "color_mode", "color"]),
    scale: (c) => W(c, ["show", "placement", "y_offset", "spacing", "ticks", "labels"], {
      ticks: (u) => W(u, ["color_mode", "color", "major_count", "minor_per_major", "height_major", "height_minor"]),
      labels: (u) => W(u, ["show", "precision", "size", "y_offset", "color_mode", "color"])
    }),
    actions: (c) => W(c, ["tap_action", "hold_action", "double_tap_action"]),
    style: (c) => W(c, ["card", "debug_layout"])
  }) ?? i;
}
function xi(i) {
  const e = En(i);
  return {
    config: e,
    warnings: Pt(e).warnings
  };
}
function Tt(i, e) {
  return xi(xn(i, e));
}
function cn(i) {
  return i === "tap_action" ? { action: "more-info" } : { action: "none" };
}
function Pn(i, e) {
  return !e || typeof e != "object" || typeof e.action != "string" ? cn(i) : e;
}
function $i(i, e, t) {
  var r;
  const o = { ...Pn(e, (r = i.actions) == null ? void 0 : r[e]), ...t };
  return Tt(i, { actions: { [e]: o } });
}
function yi(i, e) {
  return Tt(i, { levels: e });
}
function wi(i, e) {
  i.dispatchEvent(
    new CustomEvent("config-changed", {
      detail: { config: e },
      bubbles: !0,
      composed: !0
    })
  );
}
const Si = "segment-gauge editor", ki = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "stacked", label: "Stacked" }
], Mi = [
  { value: "default", label: "Default" },
  { value: "plain", label: "Plain" }
], Ci = [
  { value: "theme", label: "Theme" },
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Smooth gradient" },
  { value: "level", label: "Current level only" },
  { value: "custom", label: "Custom" }
], Ai = [
  { value: "theme", label: "Theme" },
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Smooth gradient" },
  { value: "level", label: "Current level only" },
  { value: "contrast", label: "Auto contrast" },
  { value: "custom", label: "Custom" }
], Ni = [
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" }
], Ei = [
  { value: "stepped", label: "Stepped (per level)" },
  { value: "gradient", label: "Gradient" },
  { value: "current_level", label: "Current level only" }
], Pi = [
  { value: "cumulative", label: "Cumulative" },
  { value: "current_segment", label: "Current segment only" }
], Ti = [
  { value: "none", label: "None" },
  { value: "more-info", label: "More info" },
  { value: "toggle", label: "Toggle" },
  { value: "navigate", label: "Navigate" },
  { value: "url", label: "Open URL" },
  { value: "call-service", label: "Call service" }
], nt = class nt extends Ce {
  constructor() {
    super(...arguments), this._warnings = [], this._autoEntityPicked = !1, this._closeGuardInstalled = !1, this._entityFilter = (e) => {
      var s, a;
      if (!this.hass) return !0;
      const t = e && typeof e == "object" && typeof e.state == "string" ? e : (s = this.hass.states) == null ? void 0 : s[typeof e == "string" ? e : e == null ? void 0 : e.entity_id];
      if (!t || t.entity_id && t.entity_id === ((a = this._config) == null ? void 0 : a.entity)) return !0;
      const n = String(t.state ?? ""), o = Number(n);
      if (Number.isFinite(o)) return !0;
      const r = (t.entity_id || "").split(".")[0];
      return ["sensor", "number", "input_number"].includes(r) && Number.isFinite(Number(t.state));
    }, this._addStop = () => {
      var t, n, o;
      if (!this._config) return;
      const e = this._config;
      this._setStops(
        bi(this._stops(), {
          min: Number(((t = e == null ? void 0 : e.data) == null ? void 0 : t.min) ?? l.data.min),
          max: Number(((n = e == null ? void 0 : e.data) == null ? void 0 : n.max) ?? l.data.max),
          precision: (o = e == null ? void 0 : e.data) == null ? void 0 : o.precision
        })
      );
    };
  }
  connectedCallback() {
    super.connectedCallback(), this._installCloseGuard();
  }
  disconnectedCallback() {
    this._removeCloseGuard(), super.disconnectedCallback();
  }
  _installCloseGuard() {
    if (this._closeGuardInstalled) return;
    this._closeGuardInstalled = !0;
    const e = /* @__PURE__ */ new Set(["closed"]), t = (n) => {
      var u, h, m;
      if (!e.has(n.type)) return;
      const o = (u = n.composedPath) == null ? void 0 : u.call(n);
      if (!o || !o.length) return;
      const r = o[0], s = ((r == null ? void 0 : r.tagName) || "").toString().toLowerCase(), a = (r != null && r.classList ? Array.from(r.classList).join(" ") : "").toString();
      !(s.includes("mwc-menu-surface") || s.includes("ha-menu") || a.includes("mdc-menu-surface")) || !o.includes(this) || (n.stopPropagation(), (h = n.stopImmediatePropagation) == null || h.call(n), (m = n.preventDefault) == null || m.call(n));
    };
    this.addEventListener("closed", t, { capture: !1 }), this._closeGuardHandler = t;
  }
  _renderSubheader(e) {
    return x`<div class="subheader">${e}</div>`;
  }
  _renderGroupTitle(e) {
    return x`<div class="group-title">${e}</div>`;
  }
  _renderInlinePanel(e, t, n) {
    return x`
      <ha-expansion-panel
        class="inline-panel"
        .expanded=${t}
        @expanded-changed=${(o) => {
      var s, a, d;
      if (o.target !== o.currentTarget) return;
      const r = ((s = o.detail) == null ? void 0 : s.value) ?? ((a = o.detail) == null ? void 0 : a.expanded) ?? ((d = o.target) == null ? void 0 : d.expanded);
      e === "Levels" ? this._levelsExpanded = !!r : e === "Bar" ? this._barExpanded = !!r : e === "Pointer" ? this._pointerExpanded = !!r : e === "Scale" && (this._scaleExpanded = !!r);
    }}
      >
        <span slot="header" class="inline-panel-header">${e}</span>
        <div class="inline-panel-content">${n}</div>
      </ha-expansion-panel>
    `;
  }
  _renderGaugeSectionPanel(e, t, n) {
    return x`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${(o) => {
      var s, a, d;
      if (o.target !== o.currentTarget) return;
      const r = ((s = o.detail) == null ? void 0 : s.value) ?? ((a = o.detail) == null ? void 0 : a.expanded) ?? ((d = o.target) == null ? void 0 : d.expanded);
      e === "Levels" ? this._levelsExpanded = !!r : e === "Bar" ? this._barExpanded = !!r : e === "Pointer" ? this._pointerExpanded = !!r : e === "Scale" && (this._scaleExpanded = !!r);
    }}
      >
        <span slot="header" class="panel-header">${e}</span>
        <div class="section-panel-content">${n}</div>
      </ha-expansion-panel>
    `;
  }
  _removeCloseGuard() {
    this._closeGuardHandler && (this.removeEventListener("closed", this._closeGuardHandler, !0), this._closeGuardHandler = void 0, this._closeGuardInstalled = !1);
  }
  _isLevelsModified(e) {
    const t = e.levels;
    if (!Array.isArray(t) || t.length === 0) return !1;
    if (t.length === 1) {
      const n = t[0], o = Number(n == null ? void 0 : n.value) === 0, s = String((n == null ? void 0 : n.color) ?? "").trim().toLowerCase() === "#03a9f4", a = !(n != null && n.icon);
      if (o && s && a) return !1;
    }
    return !0;
  }
  _isBarModified(e) {
    var m, f, _, p, b, v;
    const t = e.bar ?? {};
    if (t.show !== void 0 && t.show !== l.bar.show || t.edge !== void 0 && t.edge !== l.bar.edge || t.height !== void 0 && Number(t.height) !== Number(l.bar.height) || t.color_mode !== void 0 && t.color_mode !== l.bar.color_mode || t.fill_mode !== void 0 && t.fill_mode !== l.bar.fill_mode) return !0;
    const n = (m = t.track) == null ? void 0 : m.intensity;
    if (n !== void 0 && Number(n) !== Number(l.bar.track.intensity)) return !0;
    const o = (f = t.track) == null ? void 0 : f.background;
    if (o !== void 0) {
      const w = this._gapColorDefault(), y = this._cssColorToHex(o);
      if (!y || y.toLowerCase() !== w.toLowerCase()) return !0;
    }
    if ((((_ = t.segments) == null ? void 0 : _.mode) ?? l.bar.segments.mode) !== l.bar.segments.mode) return !0;
    const s = (p = t.segments) == null ? void 0 : p.width;
    if (s !== void 0 && Number(s) !== Number(l.bar.segments.width)) return !0;
    const a = (b = t.segments) == null ? void 0 : b.gap;
    if (a !== void 0 && Number(a) !== Number(l.bar.segments.gap)) return !0;
    const d = (v = t.segments) == null ? void 0 : v.segments_per_level;
    if (d !== void 0 && Number(d) !== Number(l.bar.segments.segments_per_level))
      return !0;
    const c = t.snapping, u = c == null ? void 0 : c.fill;
    if (u !== void 0 && u !== l.bar.snapping.fill) return !0;
    const h = c == null ? void 0 : c.color;
    return h !== void 0 && h !== l.bar.snapping.color;
  }
  _isScaleModified(e) {
    var c, u, h, m, f, _, p, b, v, w, y, S;
    const t = e.scale ?? {};
    if (t.show !== void 0 && t.show !== l.scale.show || ((c = t.labels) == null ? void 0 : c.show) !== void 0 && t.labels.show !== l.scale.labels.show || t.placement !== void 0 && t.placement !== l.scale.placement) return !0;
    const n = t.spacing;
    if (n !== void 0 && n !== l.scale.spacing) return !0;
    const o = (u = t.ticks) == null ? void 0 : u.major_count;
    if (o !== void 0 && Number(o) !== Number(l.scale.ticks.major_count)) return !0;
    const r = (h = t.ticks) == null ? void 0 : h.minor_per_major;
    if (r !== void 0 && Number(r) !== Number(l.scale.ticks.minor_per_major)) return !0;
    const s = t.y_offset;
    if (s !== void 0 && Number(s) !== Number(l.scale.y_offset) || ((m = t.labels) == null ? void 0 : m.precision) !== void 0 && Number(t.labels.precision) !== Number(l.scale.labels.precision) || ((f = t.labels) == null ? void 0 : f.size) !== void 0 && Number(t.labels.size) !== Number(l.scale.labels.size)) return !0;
    const a = (_ = t.labels) == null ? void 0 : _.y_offset;
    if (a !== void 0 && Number(a) !== Number(l.scale.labels.y_offset) || ((p = t.ticks) == null ? void 0 : p.height_major) !== void 0 && Number(t.ticks.height_major) !== Number(l.scale.ticks.height_major))
      return !0;
    const d = (b = t.ticks) == null ? void 0 : b.height_minor;
    return d !== void 0 && Number(d) !== Number(l.scale.ticks.height_minor) || ((v = t.ticks) == null ? void 0 : v.color_mode) !== void 0 && t.ticks.color_mode !== l.scale.ticks.color_mode || ((w = t.ticks) == null ? void 0 : w.color) !== void 0 && String(t.ticks.color).trim().length > 0 || ((y = t.labels) == null ? void 0 : y.color_mode) !== void 0 && t.labels.color_mode !== l.scale.labels.color_mode || ((S = t.labels) == null ? void 0 : S.color) !== void 0 && String(t.labels.color).trim().length > 0;
  }
  _isPointerModified(e) {
    const t = e.pointer ?? {};
    if (t.show !== void 0 && t.show !== l.pointer.show || t.size !== void 0 && Number(t.size) !== Number(l.pointer.size) || t.color_mode !== void 0 && t.color_mode !== l.pointer.color_mode || t.color !== void 0 && String(t.color).trim() !== String(l.pointer.color).trim() || t.angle !== void 0 && Number(t.angle) !== Number(l.pointer.angle)) return !0;
    const n = t.y_offset;
    return n !== void 0 && Number(n) !== Number(l.pointer.y_offset);
  }
  setConfig(e) {
    const t = !this._config;
    this._warnings = [...Pt(e).warnings];
    const n = En(hi(e));
    this._config = n, t && (this._levelsExpanded = this._isLevelsModified(n), this._barExpanded = this._isBarModified(n), this._pointerExpanded = this._isPointerModified(n), this._scaleExpanded = this._isScaleModified(n));
  }
  updated(e) {
    if (super.updated(e), this.hass && this._config && !this._config.entity && !this._autoEntityPicked) {
      const t = this._pickDefaultEntity();
      t && (this._autoEntityPicked = !0, this._updatePath(["entity"], t));
    }
  }
  _splitPct(e) {
    var n;
    const t = Number(((n = e.layout) == null ? void 0 : n.split_pct) ?? l.layout.split_pct);
    return Number.isFinite(t) ? Math.round(t) : l.layout.split_pct;
  }
  _onSplitChange(e) {
    const t = Z(e);
    t !== null && (this._setSplitPct(t), e.stopPropagation());
  }
  _setSplitPct(e) {
    this._updatePath(["layout", "split_pct"], Qe(e, { min: 5, max: 95 }));
  }
  _pickDefaultEntity() {
    const e = this.hass;
    if (!e) return;
    const t = Object.keys(e.states).sort();
    for (const n of t)
      if (this._entityFilter(n)) return n;
  }
  _gapColorDefault() {
    var o;
    const t = (o = getComputedStyle(this).getPropertyValue("--card-background-color")) == null ? void 0 : o.trim();
    return this._cssColorToHex(t) ?? "#000000";
  }
  _primaryColorDefault() {
    var o;
    const t = (o = getComputedStyle(this).getPropertyValue("--primary-color")) == null ? void 0 : o.trim();
    return this._cssColorToHex(t) ?? "#03a9f4";
  }
  _primaryTextColorDefault() {
    var o;
    const t = (o = getComputedStyle(this).getPropertyValue("--primary-text-color")) == null ? void 0 : o.trim();
    return this._cssColorToHex(t) ?? "#ffffff";
  }
  _resolveIconColor(e) {
    var n, o, r, s, a, d;
    const t = at(((o = (n = e.content) == null ? void 0 : n.icon_color) == null ? void 0 : o.mode) ?? l.content.icon_color.mode);
    if (t === "custom")
      return this._cssColorToHex((s = (r = e.content) == null ? void 0 : r.icon_color) == null ? void 0 : s.value) ?? this._primaryColorDefault();
    if (t === "theme") return this._primaryColorDefault();
    if (t === "level") {
      const c = e.entity, u = c && this.hass ? this.hass.states[c] : void 0, h = Number(u == null ? void 0 : u.state), m = Number(((a = e.data) == null ? void 0 : a.min) ?? l.data.min), f = Number(((d = e.data) == null ? void 0 : d.max) ?? l.data.max), _ = Number.isFinite(h) ? Math.min(f, Math.max(m, h)) : m, p = e.levels ?? l.levels, b = xe(p, _, this._primaryColorDefault());
      return this._cssColorToHex(b) ?? this._primaryColorDefault();
    }
    return this._primaryColorDefault();
  }
  _gapColorValue(e) {
    var o, r, s;
    const t = this._gapColorDefault(), n = (r = (o = e == null ? void 0 : e.bar) == null ? void 0 : o.track) == null ? void 0 : r.background;
    return ((s = this._cssColorToHex(n)) == null ? void 0 : s.trim()) || t;
  }
  _cssColorToHex(e) {
    if (!e) return;
    const t = e.trim();
    if (!t) return;
    if (t.startsWith("#")) {
      if (t.length === 4) {
        const o = t[1], r = t[2], s = t[3];
        return `#${o}${o}${r}${r}${s}${s}`.toLowerCase();
      }
      if (t.length === 7) return t.toLowerCase();
    }
    const n = t.match(/rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d\\.]+))?\\)/i);
    if (n) {
      const o = (r) => Math.min(255, Math.max(0, parseInt(r, 10) || 0)).toString(16).padStart(2, "0");
      return `#${o(n[1])}${o(n[2])}${o(n[3])}`;
    }
  }
  _commitUpdate(e, t) {
    this._config = e, this._warnings = [...t], wi(this, e);
  }
  _update(e) {
    if (!this._config) return;
    const t = Tt(this._config, e);
    this._commitUpdate(t.config, t.warnings);
  }
  _updatePath(e, t) {
    this._update(be(e, t));
  }
  _onToggle(e) {
    return (t) => this._updatePath(e, pi(t));
  }
  _onSelect(e) {
    return (t) => this._updatePath(e, t);
  }
  _onTextInput(e, t = !1) {
    return (n) => {
      const o = J(n);
      this._updatePath(e, t ? Se(o) : ke(o));
    };
  }
  _onNumberInput(e, t = {}) {
    return (n) => {
      const o = Z(n);
      if (o === null) {
        t.fallback !== void 0 && this._updatePath(e, t.fallback);
        return;
      }
      this._updatePath(e, Qe(o, t));
    };
  }
  _updateAction(e, t) {
    if (!this._config) return;
    const n = $i(this._config, e, t);
    this._commitUpdate(n.config, n.warnings);
  }
  _onActionText(e, t) {
    return (n) => this._updateAction(e, { [t]: ke(J(n)) });
  }
  _onActionMode(e) {
    return (t) => this._updateAction(e, { action: t });
  }
  _onServiceDataChange(e, t) {
    if (t = String(t ?? "").trim(), !t) {
      this._updateAction(e, { service_data: {} });
      return;
    }
    try {
      const n = JSON.parse(t);
      n && typeof n == "object" && this._updateAction(e, { service_data: n });
    } catch {
    }
  }
  _stops() {
    var e;
    return gi((e = this._config) == null ? void 0 : e.levels);
  }
  _setStops(e) {
    if (!this._config) return;
    const t = yi(this._config, e);
    this._commitUpdate(t.config, t.warnings);
  }
  _removeStop(e) {
    this._setStops(_i(this._stops(), e));
  }
  _updateStop(e, t) {
    this._setStops(vi(this._stops(), e, t));
  }
  _normalizeLayoutValue(e) {
    return Ue(e);
  }
  _normalizeGaugeAlignment(e) {
    return st(e);
  }
  _normalizeScalePlacement(e) {
    return it(e);
  }
  _normalizeScaleTickSpacing(e) {
    return rt(e);
  }
  _renderNativeSelect(e, t, n, o, r = !1, s) {
    var d;
    const a = n.some((c) => c.value === t) ? t : ((d = n[0]) == null ? void 0 : d.value) ?? "";
    return x`
      <div class="field">
        <ha-select
          .label=${e ?? ""}
          .value=${a}
          .disabled=${r}
          fixedMenuPosition
          naturalMenuWidth
          @selected=${(c) => o(c.target.value)}
          @closed=${(c) => c.stopPropagation()}
        >
          ${n.map((c) => x`<ha-list-item .value=${c.value}>${c.label}</ha-list-item>`)}
        </ha-select>
        ${s ? x`<div class="row-desc">${s}</div>` : $}
      </div>
    `;
  }
  _renderColorField(e, t, n, o) {
    const r = this._primaryColorDefault(), s = String(t ?? "").trim(), a = s.startsWith("#") && s.length === 7 ? s : r;
    return x`
      <div class="color-field">
        <input
          type="color"
          aria-label=${e}
          title=${e}
          .value=${a}
          ?disabled=${n}
          @input=${(c) => o(c.target.value || r)}
          style="width:22px; height:22px; padding:0; border:0; background:transparent; cursor:pointer;"
        />
        <ha-textfield
          .label=${e}
          .value=${a}
          placeholder="#03a9f4"
          ?disabled=${n}
          @change=${(c) => o(c.target.value || r)}
        ></ha-textfield>
      </div>
    `;
  }
  _offsetDisplay(e) {
    const t = Number(e ?? 0);
    return Number.isFinite(t) ? String(t) : "0";
  }
  _offsetFromInput(e, t, n, o) {
    const r = Mn(e);
    return r === null ? o : Math.max(t, Math.min(n, r));
  }
  _renderVerticalColorField(e, t, n) {
    const o = String(t ?? "").trim(), r = o.startsWith("#") && o.length === 7 ? o : "#000000";
    return x`
      <div style="display:flex; flex-direction:column; align-items:flex-start;">
        <ha-textfield
          .label=${e}
          .value=${r}
          placeholder="#03a9f4"
          @change=${(s) => n(s.target.value || void 0)}
        ></ha-textfield>
        <input
          type="color"
          aria-label=${e}
          title=${e}
          .value=${r}
          @input=${(s) => n(s.target.value)}
          style="padding:0; border:0; background:transparent; cursor:pointer; margin-top:2px;"
        />
      </div>
    `;
  }
  _renderActionEditor(e, t) {
    var a;
    if (!this._config) return $;
    const n = Pn(e, (a = this._config.actions) == null ? void 0 : a[e]), o = n.action === "navigate", r = n.action === "url", s = n.action === "call-service";
    return x`
      <div class="panel">
        ${this._renderNativeSelect("Action", n.action, Ti, this._onActionMode(e))}

        ${o ? x`<ha-textfield
              label="Navigation path"
              .value=${n.navigation_path ?? ""}
              @input=${this._onActionText(e, "navigation_path")}
            ></ha-textfield>` : $}

        ${r ? x`<ha-textfield
              label="URL"
              .value=${n.url_path ?? ""}
              @input=${this._onActionText(e, "url_path")}
            ></ha-textfield>` : $}

        ${s ? x`<ha-textfield
              label="Service (domain.service)"
              .value=${n.service ?? ""}
              @input=${this._onActionText(e, "service")}
            ></ha-textfield>` : $}

        ${s ? x`<ha-textfield
              label="Service data (JSON)"
              .value=${JSON.stringify(n.service_data ?? {}, null, 0)}
              @change=${(d) => this._onServiceDataChange(e, ke(J(d)))}
            ></ha-textfield>` : $}

      </div>
    `;
  }
  render() {
    var u, h, m;
    if (!this.hass || !this._config) return $;
    const e = Je(l, this._config), t = e.content ?? l.content, n = e.data ?? l.data, o = e.layout ?? l.layout, r = this._normalizeLayoutValue((u = e.layout) == null ? void 0 : u.mode), s = r === "horizontal" ? "center_labels" : this._normalizeGaugeAlignment((h = e.layout) == null ? void 0 : h.gauge_alignment), a = e.bar ?? l.bar, d = e.pointer ?? l.pointer, c = e.scale ?? l.scale;
    return x`
      ${this._warnings.length ? x`<div class="warnings">
            ${this._warnings.map((f) => x`<ha-alert alert-type="warning">${f}</ha-alert>`)}
          </div>` : $}

      <div class="section-card">
        <div class="section-title">Entity</div>
        <ha-entity-picker
          .hass=${this.hass}
          .value=${e.entity ?? ""}
          .disabled=${!1}
          .entityFilter=${this._entityFilter}
          allow-custom-entity
          @value-changed=${(f) => this._updatePath(["entity"], J(f))}
        ></ha-entity-picker>
      </div>

      <ha-expansion-panel expanded outlined>
        <span slot="header" class="panel-header">Content</span>
        <div class="panel">
          <div class="toggle-row">
            <ha-formfield label="Show name">
              <ha-switch
                .checked=${t.show_name ?? !0}
                @change=${this._onToggle(["content", "show_name"])}
              ></ha-switch>
            </ha-formfield>

            <ha-formfield label="Show state">
              <ha-switch
                .checked=${t.show_state ?? !0}
                @change=${this._onToggle(["content", "show_state"])}
              ></ha-switch>
            </ha-formfield>

            <ha-formfield label="Show icon">
              <ha-switch
                .checked=${t.show_icon ?? l.content.show_icon}
                @change=${this._onToggle(["content", "show_icon"])}
              ></ha-switch>
            </ha-formfield>
          </div>

          <ha-textfield
            label="Name"
            .value=${t.name ?? ""}
            placeholder="Detected from entity"
            .disabled=${!(t.show_name ?? !0)}
            @input=${this._onTextInput(["content", "name"], !0)}
          ></ha-textfield>

          <div class="row2">
            ${(() => {
      var _, p, b;
      const f = !(t.show_icon ?? l.content.show_icon);
      return x`
                <ha-icon-picker
                  label="Icon"
                  .hass=${this.hass}
                  .value=${t.icon ?? ""}
                  .disabled=${f}
                  @value-changed=${this._onTextInput(["content", "icon"], !0)}
                ></ha-icon-picker>

                ${this._renderNativeSelect(
        "Icon color",
        ((_ = t.icon_color) == null ? void 0 : _.mode) ?? l.content.icon_color.mode,
        [
          { value: "theme", label: "Theme" },
          { value: "state", label: "State" },
          { value: "level", label: "Level" },
          { value: "custom", label: "Custom" }
        ],
        (v) => {
          const w = be(["content", "icon_color", "mode"], v);
          v === "custom" && (w.content.icon_color.value = this._resolveIconColor(e)), this._update(w);
        },
        f
      )}

                ${((p = t.icon_color) == null ? void 0 : p.mode) === "custom" ? this._renderColorField(
        "Custom",
        ((b = t.icon_color) == null ? void 0 : b.value) ?? "",
        f,
        (v) => this._updatePath(["content", "icon_color", "value"], Se(v))
      ) : x`<div></div>`}
              `;
    })()}
          </div>

          ${this._renderSubheader("Style")}
          <div class="row2">
            ${this._renderNativeSelect(
      "Card style",
      ((m = e.style) == null ? void 0 : m.card) ?? l.style.card ?? "default",
      Mi,
      this._onSelect(["style", "card"])
    )}
            <div></div>
          </div>

          ${this._renderSubheader("Layout")}
          <div class="row3">
            ${this._renderNativeSelect(
      "Content layout",
      r,
      ki,
      this._onSelect(["layout", "mode"])
    )}
            ${r === "horizontal" ? x`
                  <div class="slider-block span2">
                    <label class="slider-label">Icon and text width %</label>
                    <ha-slider
                      labeled
                      pin
                      min="5"
                      max="95"
                      step="1"
                      .value=${this._splitPct(e)}
                      @value-changed=${(f) => this._onSplitChange(f)}
                      @change=${(f) => this._onSplitChange(f)}
                    ></ha-slider>
                    <div class="row-desc small">The gauge uses the remaining width.</div>
                  </div>
                ` : x`<div></div><div></div>`}
          </div>
          <div class="row2">
            ${this._renderNativeSelect(
      "Gauge alignment",
      s,
      [
        { value: "center_bar", label: "Center (bar)" },
        { value: "center_labels", label: "Center (labels)" }
      ],
      this._onSelect(["layout", "gauge_alignment"]),
      r === "horizontal"
    )}
            <ha-textfield
              label="Content spacing (px)"
              type="number"
              .value=${String(
      o.content_spacing ?? l.layout.content_spacing ?? 0
    )}
              @input=${this._onNumberInput(["layout", "content_spacing"], {
      fallback: l.layout.content_spacing ?? 0,
      min: -48,
      max: 48
    })}
              @change=${this._onNumberInput(["layout", "content_spacing"], {
      fallback: l.layout.content_spacing ?? 0,
      min: -48,
      max: 48
    })}
            ></ha-textfield>
          </div>
          <div class="row-desc">Horizontal spacing between icon and text.</div>
        </div>
      </ha-expansion-panel>

      <ha-expansion-panel expanded outlined>
        <span slot="header" class="panel-header">Data</span>
        <div class="panel">
          <div class="row3">
            <ha-textfield
              label="Minimum"
              type="number"
              .value=${String(n.min ?? 0)}
              @change=${this._onNumberInput(["data", "min"], { fallback: 0 })}
            ></ha-textfield>
            <ha-textfield
              label="Maximum"
              type="number"
              .value=${String(n.max ?? 100)}
              @change=${this._onNumberInput(["data", "max"], { fallback: 100 })}
            ></ha-textfield>
            <ha-textfield
              label="Precision"
              type="number"
              .value=${n.precision ?? ""}
              placeholder="Auto"
              @change=${(f) => {
      const _ = Z(f);
      this._updatePath(["data", "precision"], _ ?? null);
    }}
            ></ha-textfield>
          </div>
          <ha-textfield
            label="Unit"
            .value=${n.unit ?? ""}
            placeholder="Detected from entity"
            @change=${this._onTextInput(["data", "unit"])}
          ></ha-textfield>
        </div>
      </ha-expansion-panel>

      ${(() => {
      const f = this._levelsExpanded ?? this._isLevelsModified(e);
      return this._renderGaugeSectionPanel(
        "Levels",
        f,
        x`
                <div class="stops">
                  ${this._stops().map(
          (_, p) => x`
                      <div class="stopRow">
                        <ha-textfield
                          class="stop-compact"
                          label="Value"
                          type="number"
                          .value=${String(_.value)}
                          @change=${(b) => {
            const v = Z(b);
            v !== null && this._updateStop(p, { value: v });
          }}
                        ></ha-textfield>

                        <div class="stop-color">
                          ${this._renderVerticalColorField(
            "Color",
            String(_.color),
            (b) => this._updateStop(p, { color: b })
          )}
                        </div>

                        <ha-icon-picker
                          class="stop-icon"
                          label="Icon"
                          .hass=${this.hass}
                          .value=${_.icon ?? ""}
                          @value-changed=${(b) => this._updateStop(p, { icon: Se(J(b)) })}
                        ></ha-icon-picker>

                        <button class="icon-btn danger" aria-label="Remove level" title="Remove level" @click=${() => this._removeStop(p)}>
                          &#10005;
                        </button>
                      </div>
                    `
        )}
                </div>

                <div class="stopActions">
                  <div class="row-desc">Use levels to map values to colors and icons (optional). The last level applies to all higher values.</div>
                  <button class="add-btn" aria-label="Add level" title="Add level" @click=${this._addStop}>
                    <span class="icon-plus">+</span> <span>Add level</span>
                  </button>
                </div>
              `
      );
    })()}

      ${(() => {
      var _;
      const f = this._barExpanded ?? this._isBarModified(e);
      return this._renderGaugeSectionPanel(
        "Bar",
        f,
        x`
                <div class="toggle-row">
                  <ha-formfield label="Show bar">
                    <ha-switch
                      .checked=${a.show ?? l.bar.show}
                      @change=${this._onToggle(["bar", "show"])}
                    ></ha-switch>
                  </ha-formfield>
                </div>
                ${a.show ?? l.bar.show ? x`
                      <div class="row2">
                        ${this._renderNativeSelect(
          "End shape",
          a.edge ?? l.bar.edge ?? "rounded",
          Ni,
          (p) => this._update(
            be(["bar"], p === "square" ? { edge: p, radius: null } : { edge: p })
          )
        )}
                        <ha-textfield
                          label="End radius (px)"
                          type="number"
                          min="0"
                          max="100"
                          .disabled=${(a.edge ?? l.bar.edge ?? "rounded") === "square"}
                          .value=${a.radius === null || a.radius === void 0 ? "" : String(a.radius)}
                          @change=${(p) => {
          const b = Z(p), v = b !== null ? Math.max(0, Math.min(100, b)) : null;
          this._updatePath(["bar", "radius"], v);
        }}
                        ></ha-textfield>
                      </div>
                      <div class="row2">
                        <ha-textfield
                          label="Height (px)"
                          type="number"
                          min="0"
                          max="100"
                          .value=${String(a.height ?? l.bar.height ?? 8)}
                          @change=${this._onNumberInput(["bar", "height"], { fallback: 8, min: 0, max: 100 })}
                        ></ha-textfield>
                      ${this._renderNativeSelect(
          "Color mode",
          lt(a.color_mode ?? l.bar.color_mode),
          Ei,
          this._onSelect(["bar", "color_mode"])
        )}
                      </div>
                      <div class="row-desc small">Leave End radius blank to use End shape default.</div>
                      ${this._renderGroupTitle("Track")}
                      <div class="row-desc">Track is the unfilled portion of the bar.</div>
                      <div class="row3">
                        ${this._renderVerticalColorField("Color", this._gapColorValue(e), (p) => {
          const b = this._gapColorDefault();
          this._updatePath(["bar", "track", "background"], p && p !== b ? p : void 0);
        })}
                        <div class="slider-block span2">
                          <label class="slider-label">Intensity</label>
                          <ha-slider
                            labeled
                            pin
                            min="0"
                            max="100"
                            step="1"
                            .value=${Number(((_ = a.track) == null ? void 0 : _.intensity) ?? l.bar.track.intensity)}
                            .disabled=${!(a.show ?? l.bar.show)}
                            @value-changed=${(p) => {
          const b = Z(p);
          b !== null && this._updatePath(["bar", "track", "intensity"], Qe(b, { min: 0, max: 100 }));
        }}
                            @change=${(p) => {
          const b = Z(p);
          b !== null && this._updatePath(["bar", "track", "intensity"], Qe(b, { min: 0, max: 100 }));
        }}
                          ></ha-slider>
                          <div class="row-desc small">0 = invisible, 100 = bar color</div>
                        </div>
                      </div>
                      ${this._renderGroupTitle("Segments")}
                      ${(() => {
          var w, y, S, C, g, P, R;
          const p = ((w = a.segments) == null ? void 0 : w.mode) ?? l.bar.segments.mode, b = a.show ?? l.bar.show, v = b && p !== "off";
          return x`
                          <div class="row3">
                            ${this._renderNativeSelect(
            "Segment mode",
            p,
            [
              { value: "off", label: "Off" },
              { value: "level", label: "Level-aligned" },
              { value: "fixed", label: "Fixed width" }
            ],
            this._onSelect(["bar", "segments", "mode"]),
            !b
          )}
                            ${p === "fixed" && b ? x`
                                  <ha-textfield
                                    label="Segment width (px)"
                                    type="number"
                                    min="0"
                                    .value=${String(((y = a.segments) == null ? void 0 : y.width) ?? l.bar.segments.width)}
                                    @change=${(A) => {
            var T;
            const N = Z(A), E = N !== null ? Math.max(0, N) : l.bar.segments.width, V = E > 0 ? Math.max(0, E - 1) : 0, j = Math.min(((T = a.segments) == null ? void 0 : T.gap) ?? l.bar.segments.gap, V);
            this._update(be(["bar", "segments"], { width: E, gap: j }));
          }}
                                  ></ha-textfield>
                                ` : p === "level" && b ? x`
                                  <ha-textfield
                                    label="Segments per level"
                                    type="number"
                                    min="1"
                                    max="20"
                                    .value=${String(
            ((S = a.segments) == null ? void 0 : S.segments_per_level) ?? l.bar.segments.segments_per_level ?? 1
          )}
                                    @change=${(A) => {
            const N = Z(A), E = N !== null ? G(Math.floor(N), 1, 20) : l.bar.segments.segments_per_level ?? 1;
            this._updatePath(["bar", "segments", "segments_per_level"], E);
          }}
                                  ></ha-textfield>
                                ` : x`<div></div>`}
                            ${v ? x`
                                  <ha-textfield
                                    label="Gap width (px)"
                                    type="number"
                                    min="0"
                                    .max=${String(
            Math.max(
              0,
              p === "fixed" ? (((C = a.segments) == null ? void 0 : C.width) ?? l.bar.segments.width ?? 0) - 1 : Number.MAX_SAFE_INTEGER
            )
          )}
                                    .value=${String(((g = a.segments) == null ? void 0 : g.gap) ?? l.bar.segments.gap)}
                                    @change=${(A) => {
            var T;
            const N = Z(A), E = Number(((T = a.segments) == null ? void 0 : T.width) ?? l.bar.segments.width ?? 0), V = p === "fixed" ? E > 0 ? Math.max(0, E - 1) : 0 : Number.MAX_SAFE_INTEGER;
            let j = N !== null ? Math.max(0, N) : l.bar.segments.gap;
            j = Math.min(j, V), p === "fixed" && E <= 0 && (j = 0), this._updatePath(["bar", "segments", "gap"], j);
          }}
                                  ></ha-textfield>
                                ` : x`<div></div>`}
                          </div>
                          ${v ? x`
                                ${this._renderGroupTitle("Snapping")}
                                <div class="row-desc">Snap fill length and/or color to segment geometry.</div>
                                <div class="row3">
                                  ${this._renderNativeSelect(
            "Fill mode",
            ct(a.fill_mode ?? l.bar.fill_mode),
            Pi,
            this._onSelect(["bar", "fill_mode"]),
            !1
          )}
                                  ${this._renderNativeSelect(
            "Snap fill",
            dt(
              ((P = a.snapping) == null ? void 0 : P.fill) ?? l.bar.snapping.fill
            ),
            [
              { value: "off", label: "Off" },
              { value: "down", label: "Down" },
              { value: "nearest", label: "Nearest" },
              { value: "up", label: "Up" }
            ],
            this._onSelect(["bar", "snapping", "fill"]),
            !1
          )}
                                  ${this._renderNativeSelect(
            "Snap color",
            ut(
              ((R = a.snapping) == null ? void 0 : R.color) ?? l.bar.snapping.color
            ),
            [
              { value: "off", label: "Off" },
              { value: "level", label: "Level" },
              { value: "midpoint", label: "Midpoint" },
              { value: "high", label: "High" },
              { value: "low", label: "Low" }
            ],
            this._onSelect(["bar", "snapping", "color"]),
            !1
          )}
                                </div>
                              ` : $}
                        `;
        })()}
                    ` : $}
              `
      );
    })()}

      ${(() => {
      const f = this._pointerExpanded ?? this._isPointerModified(e);
      return this._renderGaugeSectionPanel(
        "Pointer",
        f,
        x`
                <div class="toggle-row">
                  <ha-formfield label="Show pointer">
                    <ha-switch
                      .checked=${d.show ?? l.pointer.show}
                      @change=${this._onToggle(["pointer", "show"])}
                    ></ha-switch>
                  </ha-formfield>
                </div>
                ${d.show ?? l.pointer.show ? x`
                      <div class="row3">
                        <ha-textfield
                          label="Size (px)"
                          type="number"
                          min="0"
                          max="100"
                          .value=${String(d.size ?? l.pointer.size ?? 8)}
                          @change=${this._onNumberInput(["pointer", "size"], { fallback: l.pointer.size ?? 8, min: 0, max: 100 })}
                        ></ha-textfield>

                        <ha-textfield
                          label="Angle"
                          type="number"
                          min="10"
                          max="90"
                          .value=${String(d.angle ?? l.pointer.angle ?? 90)}
                          @change=${this._onNumberInput(["pointer", "angle"], { fallback: l.pointer.angle ?? 90, min: 10, max: 90 })}
                        ></ha-textfield>

                        <ha-textfield
                          label="Vertical offset (px)"
                          type="number"
                          min="-100"
                          max="100"
                          .value=${this._offsetDisplay(d.y_offset ?? l.pointer.y_offset ?? 0)}
                          @change=${(_) => {
          const p = this._offsetFromInput(ke(J(_)), -100, 100, l.pointer.y_offset ?? 0);
          this._updatePath(["pointer", "y_offset"], p);
        }}
                        ></ha-textfield>
                      </div>

                      <div class="row2">
                        ${this._renderNativeSelect(
          "Color",
          d.color_mode ?? l.pointer.color_mode,
          [
            { value: "level", label: "Current level" },
            { value: "gradient", label: "Smooth gradient" },
            { value: "custom", label: "Custom" }
          ],
          (_) => {
            const p = be(["pointer", "color_mode"], _);
            _ === "custom" && !(d.color ?? "") && (p.pointer.color = this._primaryTextColorDefault()), this._update(p);
          },
          !1
        )}
                      </div>
                      ${d.color_mode === "custom" ? this._renderColorField(
          "Custom",
          d.color ?? this._primaryTextColorDefault(),
          !1,
          (_) => this._updatePath(["pointer", "color"], Se(_))
        ) : $}
                    ` : $}
              `
      );
    })()}

      ${(() => {
      var _, p, b, v, w, y;
      const f = this._scaleExpanded ?? this._isScaleModified(e);
      return this._renderGaugeSectionPanel(
        "Scale",
        f,
        x`
                <div class="scale-grid">
                  <div class="scale-group">
                    <ha-formfield label="Show scale">
                      <ha-switch
                        .checked=${!!c.show}
                        @change=${this._onToggle(["scale", "show"])}
                      ></ha-switch>
                    </ha-formfield>
                    ${c.show ? x`
                          <div class="row2">
                            ${this._renderNativeSelect(
          "Placement",
          c.placement ?? l.scale.placement,
          [
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
            { value: "center", label: "Center" },
            { value: "below", label: "Below" }
          ],
          this._onSelect(["scale", "placement"]),
          !1
        )}
                            <ha-textfield
                              label="Vertical offset (px)"
                              type="number"
                              min="-24"
                              max="24"
                              .value=${this._offsetDisplay(c.y_offset ?? l.scale.y_offset ?? 0)}
                              @change=${(S) => {
          const C = this._offsetFromInput(
            ke(J(S)),
            -24,
            24,
            l.scale.y_offset ?? 0
          );
          this._updatePath(["scale", "y_offset"], C);
        }}
                            ></ha-textfield>
                          </div>

                          <div class="row2">
                            ${this._renderNativeSelect(
          "Tick spacing",
          c.spacing ?? l.scale.spacing,
          [
            { value: "even", label: "Even" },
            { value: "levels", label: "Level-aligned" }
          ],
          this._onSelect(["scale", "spacing"]),
          !1
        )}
                            <div></div>
                          </div>

                          <div class="row2">
                            ${(() => {
          var C;
          const S = c.spacing ?? l.scale.spacing;
          return x`
                            <ha-textfield
                              label="Major tick count"
                              type="number"
                              min="2"
                              max="26"
                              .value=${String(((C = c.ticks) == null ? void 0 : C.major_count) ?? l.scale.ticks.major_count)}
                              .disabled=${S === "levels"}
                              @change=${this._onNumberInput(["scale", "ticks", "major_count"], {
            fallback: l.scale.ticks.major_count
          })}
                            ></ha-textfield>
                              `;
        })()}
                            <ha-textfield
                              label="Minor ticks per major"
                              type="number"
                              min="0"
                              max="9"
                              .value=${String(((_ = c.ticks) == null ? void 0 : _.minor_per_major) ?? l.scale.ticks.minor_per_major)}
                              @change=${this._onNumberInput(["scale", "ticks", "minor_per_major"], {
          fallback: l.scale.ticks.minor_per_major
        })}
                            ></ha-textfield>
                          </div>
                          ${(c.spacing ?? l.scale.spacing) === "levels" ? x`<div class="row-desc">Major ticks come from level boundaries when spacing is Level-aligned.</div>` : $}

                          <div class="row2">
                            <ha-textfield
                              label="Major tick height (px)"
                              type="number"
                              min="1"
                              max="40"
                              .value=${String(((p = c.ticks) == null ? void 0 : p.height_major) ?? l.scale.ticks.height_major)}
                              @change=${this._onNumberInput(["scale", "ticks", "height_major"], {
          fallback: l.scale.ticks.height_major
        })}
                            ></ha-textfield>
                            <ha-textfield
                              label="Minor tick height (px)"
                              type="number"
                              min="1"
                              max="40"
                              .value=${String(((b = c.ticks) == null ? void 0 : b.height_minor) ?? l.scale.ticks.height_minor)}
                              @change=${this._onNumberInput(["scale", "ticks", "height_minor"], {
          fallback: l.scale.ticks.height_minor
        })}
                            ></ha-textfield>
                          </div>

                          ${(() => {
          var C, g;
          const S = ((C = c.ticks) == null ? void 0 : C.color_mode) ?? l.scale.ticks.color_mode;
          return x`
                              <div class="row2">
                                ${this._renderNativeSelect(
            "Tick color",
            S,
            Ai,
            (P) => {
              var A;
              const R = be(["scale", "ticks", "color_mode"], P);
              P === "custom" && !(((A = c.ticks) == null ? void 0 : A.color) ?? "") && (R.scale.ticks.color = this._primaryTextColorDefault()), this._update(R);
            },
            !c.show
          )}
                                ${S === "custom" ? this._renderColorField(
            "Custom",
            ((g = c.ticks) == null ? void 0 : g.color) ?? "",
            !c.show,
            (P) => this._updatePath(["scale", "ticks", "color"], Se(P))
          ) : x`<div></div>`}
                              </div>
                            `;
        })()}
                        ` : $}
                  </div>

                  <div class="scale-group">
                    <ha-formfield label="Show labels">
                      <ha-switch
                        .checked=${((v = c.labels) == null ? void 0 : v.show) ?? !0}
                        .disabled=${!c.show}
                        @change=${this._onToggle(["scale", "labels", "show"])}
                      ></ha-switch>
                    </ha-formfield>
                    ${c.show && (((w = c.labels) == null ? void 0 : w.show) ?? !0) ? x`<div class="row-desc">Labels use the same scale positions as major ticks.</div>` : $}

                    ${c.show && (((y = c.labels) == null ? void 0 : y.show) ?? !0) ? (() => {
          var C, g, P, R, A;
          const S = ((C = c.labels) == null ? void 0 : C.color_mode) ?? l.scale.labels.color_mode;
          return x`
                            <div class="row3">
                              <ha-textfield
                                label="Precision"
                                type="number"
                                min="0"
                                max="6"
                                .value=${String(((g = c.labels) == null ? void 0 : g.precision) ?? "")}
                                placeholder="Use value precision"
                                @change=${this._onNumberInput(["scale", "labels", "precision"], {
            fallback: l.scale.labels.precision
          })}
                              ></ha-textfield>
                              <ha-textfield
                                label="Size (px)"
                                type="number"
                                min="8"
                                max="24"
                                .value=${String(((P = c.labels) == null ? void 0 : P.size) ?? l.scale.labels.size ?? 12)}
                                @change=${this._onNumberInput(["scale", "labels", "size"], {
            fallback: l.scale.labels.size ?? 12,
            min: 8,
            max: 24
          })}
                              ></ha-textfield>
                              <ha-textfield
                                label="Vertical offset (px)"
                                type="number"
                                min="-24"
                                max="24"
                                .value=${this._offsetDisplay(((R = c.labels) == null ? void 0 : R.y_offset) ?? l.scale.labels.y_offset ?? 0)}
                                @change=${(N) => {
            const E = this._offsetFromInput(
              ke(J(N)),
              -24,
              24,
              l.scale.labels.y_offset ?? 0
            );
            this._updatePath(["scale", "labels", "y_offset"], E);
          }}
                              ></ha-textfield>
                              ${this._renderNativeSelect(
            "Color",
            S,
            Ci,
            (N) => {
              var V;
              const E = be(["scale", "labels", "color_mode"], N);
              N === "custom" && !(((V = c.labels) == null ? void 0 : V.color) ?? "") && (E.scale.labels.color = this._primaryTextColorDefault()), this._update(E);
            },
            !c.show
          )}
                            </div>

                            <div class="row2">
                              ${S === "custom" ? this._renderColorField(
            "Custom",
            ((A = c.labels) == null ? void 0 : A.color) ?? "",
            !c.show,
            (N) => this._updatePath(["scale", "labels", "color"], Se(N))
          ) : x`<div></div>`}
                              <div></div>
                            </div>
                          `;
        })() : $}
                  </div>
                </div>
              `
      );
    })()}

      <ha-expansion-panel outlined>
        <span slot="header" class="panel-header">Interactions</span>
        <div class="panel">
          <div class="section-title">Tap</div>
          ${this._renderActionEditor("tap_action", "Tap behaviour")}
          <div class="section-title">Hold</div>
          ${this._renderActionEditor("hold_action", "Hold behaviour")}
          <div class="section-title">Double tap</div>
          ${this._renderActionEditor("double_tap_action", "Double tap behaviour")}
        </div>
      </ha-expansion-panel>

      <div class="build-tag">${Si}</div>
    `;
  }
};
nt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _warnings: { state: !0 }
}, nt.styles = hn`
    :host {
      display: block;
      padding: 8px;
      color: var(--primary-text-color);
    }

    ha-entity-picker,
    ha-icon-picker,
    ha-textfield {
      width: 100%;
      min-width: 0;
    }

    .section-card {
      background: var(--ha-card-background, var(--card-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      box-shadow: var(--ha-card-box-shadow, none);
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--primary-text-color);
    }

    .panel-header {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .subheader {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      margin: 4px 0;
    }

    .group-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      margin: 6px 0 2px;
    }

    .panel {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px;
    }

    ha-expansion-panel {
      --expansion-panel-content-padding: 0 0 12px 0;
      margin-bottom: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }

    ha-expansion-panel[expanded] {
      border-color: var(--primary-color);
    }

    ha-expansion-panel.inline-panel {
      --expansion-panel-content-padding: 0;
      --expansion-panel-summary-padding: 0;
      border: none;
      border-radius: 0;
      margin: 0;
      background: transparent;
    }

    ha-expansion-panel.inline-panel[expanded] {
      border-color: transparent;
    }

    .inline-panel-header {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      padding: 2px 0;
      line-height: 1.1;
    }

    .inline-panel-content {
      display: grid;
      gap: 8px;
    }

    .section-panel-content {
      padding: 12px;
      display: grid;
      gap: 8px;
    }

    .row2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-items: end;
    }

    .row3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      align-items: end;
    }

    .scale-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .scale-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .full {
      grid-column: 1 / -1;
    }

    .span2 {
      grid-column: span 2;
    }

    .slider-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
    }


    .slider-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .toggle-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .stops {
      display: grid;
      gap: 10px;
      margin-top: 4px;
    }

    .stopRow {
      display: grid;
      grid-template-columns: 120px 100px 160px 32px;
      gap: 2px;
      align-items: start;
      background: var(--ha-card-background, var(--card-background-color));
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px;
    }
    .stopRow .stop-compact {
      width: 120px;
    }
    .stopRow .stop-color {
      width: 100%;
    }
    .stopRow .stop-color ha-textfield {
      width: 100%;
      max-width: 84px;
    }
    .stopRow .stop-color input[type="color"] {
      width: 84px;
      height: 16px;
    }
    .stopRow .stop-icon {
      width: 100%;
    }
    .stopRow .icon-btn {
      justify-self: end;
    }

    @media (max-width: 600px) {
      .row2,
      .row3 {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .scale-grid {
        display: flex;
        flex-direction: column;
      }

      .stopRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stopRow .stop-compact,
      .stopRow .stop-color {
        flex: 1 1 120px;
        min-width: 0;
        max-width: 100%;
      }

      .stopRow .stop-icon {
        flex: 1 1 calc(100% - 40px);
        min-width: 0;
        max-width: 100%;
      }

      .stopRow .stop-color ha-textfield,
      .stopRow .stop-color input[type="color"] {
        width: 100%;
        max-width: 100%;
      }

      .stopRow > * {
        min-width: 0;
      }

      .stopRow .icon-btn {
        flex: 0 0 32px;
        align-self: center;
        margin-left: 0;
      }
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--error-color);
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      padding: 0;
      transition: background 120ms ease, transform 120ms ease;
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: scale(1.02);
    }
    .icon-btn:active {
      transform: scale(0.98);
    }

    .stopActions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: 6px;
    }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--primary-color);
      background: rgba(0, 0, 0, 0.05);
      color: var(--primary-color);
      cursor: pointer;
      font: inherit;
      transition: background 120ms ease, transform 120ms ease;
    }
    .add-btn:hover {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
    }
    .add-btn:active {
      transform: scale(0.99);
    }

    .danger {
      color: var(--error-color);
    }

    .row-desc,
    .help,
    .small {
      font-size: 12px;
      color: var(--secondary-text-color);
      line-height: 1.3;
    }

    .icon-plus {
      font-size: 18px;
      line-height: 1;
      display: inline-block;
    }

    .build-tag {
      margin-top: 8px;
      font-size: 11px;
      color: var(--secondary-text-color);
      text-align: right;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }
    .field ha-select {
      width: 100%;
    }

    .align-right {
      justify-self: end;
    }

    .color-field {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      width: 100%;
    }

    .warnings {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
    }
  `;
let Mt = nt;
function Li() {
  const i = "segment-gauge-editor";
  customElements.get(i) || customElements.define(i, Mt);
}
function Ri(i = {}) {
  const { registerCustomCardEntry: e = !0 } = i;
  if (Li(), ci(), ui(), !e || typeof window > "u") return;
  const t = {
    type: "segment-gauge",
    name: "Segment Gauge",
    description: "Compact gauge card with levels, segments, scale, and pointer."
  };
  window.customCards = window.customCards || [], window.customCards.some((o) => o.type === t.type) || window.customCards.push(t);
}
Ri();
export {
  Ri as registerSegmentGaugeElements
};
//# sourceMappingURL=segment-gauge.js.map
