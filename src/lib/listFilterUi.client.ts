/**
 * ListFilter 模板 UI：颜色属性选中态、fieldset 折叠（默认收缩）、分类子树展开
 */

function getSectionRoot(): HTMLElement | null {
  return document.querySelector('[data-listfilter-section]');
}

function bindColorSwatchLabels(root: HTMLElement): void {
  const inputs = root.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"][name="attribute_value_ids"]'
  );

  inputs.forEach((input) => {
    const label = input.closest('label');
    if (!label) return;

    const sync = () => {
      label.classList.toggle('listfilter-color-option--active', input.checked);
    };

    sync();
    input.addEventListener('change', sync);
  });
}

function groupHasActiveFilter(fieldset: HTMLFieldSetElement): boolean {
  if (fieldset.querySelector('input[type="checkbox"]:checked, input[type="radio"]:checked')) {
    return true;
  }

  for (const input of fieldset.querySelectorAll<HTMLInputElement>(
    'input[type="number"], input[type="text"]'
  )) {
    if (input.name === 'price_field_key') continue;
    if (input.value.trim()) return true;
  }

  return false;
}

function setFieldsetCollapsed(
  fieldset: HTMLFieldSetElement,
  legend: HTMLElement,
  collapsed: boolean
): void {
  fieldset.classList.toggle('listfilter-fieldset--collapsed', collapsed);
  legend.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function initCollapsibleFieldsets(root: HTMLElement): void {
  const fieldsets = root.querySelectorAll<HTMLFieldSetElement>(
    'fieldset[data-listfilter-collapsible]'
  );

  fieldsets.forEach((fieldset) => {
    const legend = fieldset.querySelector('legend');
    if (!legend || legend.dataset.listfilterCollapseBound === '1') return;

    legend.dataset.listfilterCollapseBound = '1';
    legend.classList.add('listfilter-collapsible-legend');
    legend.setAttribute('role', 'button');
    legend.setAttribute('tabindex', '0');
    setFieldsetCollapsed(fieldset, legend, !groupHasActiveFilter(fieldset));

    const toggle = () => {
      const collapsed = !fieldset.classList.contains('listfilter-fieldset--collapsed');
      setFieldsetCollapsed(fieldset, legend, collapsed);
    };

    legend.addEventListener('click', toggle);
    legend.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

function setCategoryExpanded(item: HTMLElement, items: HTMLElement[], expanded: boolean): void {
  const toggle = item.querySelector<HTMLElement>('[data-listfilter-cat-toggle]');
  if (toggle) toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  item.classList.toggle('is-expanded', expanded);

  const id = item.getAttribute('data-listfilter-cat-id') || '';
  for (const child of items) {
    if (child.getAttribute('data-listfilter-cat-parent') !== id) continue;
    child.hidden = !expanded;
    if (!expanded) setCategoryExpanded(child, items, false);
  }
}

function initCategoryTree(root: HTMLElement): void {
  const items = [...root.querySelectorAll<HTMLElement>('[data-listfilter-cat]')];
  if (!items.length) return;

  items.forEach((item) => {
    const toggle = item.querySelector<HTMLButtonElement>('[data-listfilter-cat-toggle]');
    if (!toggle || toggle.dataset.listfilterCatBound === '1') return;
    toggle.dataset.listfilterCatBound = '1';
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      setCategoryExpanded(item, items, !expanded);
    });
  });
}

export function initListFilterUi(): void {
  const root = getSectionRoot();
  if (!root) return;

  bindColorSwatchLabels(root);
  initCollapsibleFieldsets(root);
  initCategoryTree(root);
}

if (typeof document !== 'undefined') {
  (window as any).initListFilterUi = initListFilterUi;
}
