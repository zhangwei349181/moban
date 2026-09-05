/** Post 区块 Tab 切换（配合 HTML 中 data-post-tab / data-post-panel） */
export function initPostSectionTabs(root: ParentNode = document): void {
  const sections =
    root instanceof HTMLElement && root.matches('[data-post-slot]')
      ? [root]
      : Array.from(root.querySelectorAll<HTMLElement>('[data-post-slot], [data-post-section]'));

  sections.forEach((section) => {
    if (section.dataset.postTabsBound === '1') return;

    const tabs = section.querySelectorAll<HTMLElement>('[data-post-tab]');
    const panels = section.querySelectorAll<HTMLElement>('[data-post-panel]');
    if (!tabs.length || !panels.length) return;

    section.dataset.postTabsBound = '1';

    panels.forEach((panel) => {
      if (!panel.hasAttribute('data-active')) panel.hidden = true;
    });

    tabs.forEach((btn) => {
      if (btn.getAttribute('aria-selected') == null) {
        btn.setAttribute('aria-selected', btn.hasAttribute('data-active') ? 'true' : 'false');
      }

      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-post-tab');
        if (!id) return;

        tabs.forEach((tab) => {
          const active = tab === btn;
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.toggleAttribute('data-active', active);
        });

        panels.forEach((panel) => {
          const active = panel.getAttribute('data-post-panel') === id;
          panel.hidden = !active;
          panel.toggleAttribute('data-active', active);
        });
      });
    });
  });
}
