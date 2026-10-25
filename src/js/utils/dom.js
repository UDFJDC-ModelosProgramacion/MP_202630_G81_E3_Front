export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === 'class') {
      node.className = String(value);
    } else if (name.startsWith('on') && typeof value === 'function') {
      node.addEventListener(name.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(name, value === true ? '' : String(value));
    }
  }
  node.append(...children.flat().filter((child) => child !== null && child !== false));
  return node;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function getQueryParam(name, search = window.location.search) {
  return new URLSearchParams(search).get(name);
}
