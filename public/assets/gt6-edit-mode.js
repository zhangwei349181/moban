/**
 * GT6 网站可视化编辑 — 全局编辑态 + 组件编辑 postMessage
 * - ?editmode=1 开启，?editmode=0 关闭；未带参数时沿用 sessionStorage
 * - 同 tab 内跳转其它页面仍保持编辑态，直至访问 ?editmode=0
 */
(function (global) {
  'use strict';

  var SOURCE = 'gt6-website-editor';
  var STORAGE_KEY = 'gt6_edit_mode';
  var MSG_EDIT_COMPONENT = 'editComponent';
  var MSG_EDIT_PAGE = 'editPage';
  var MSG_ADD_PAGE = 'addPage';
  var MSG_ADD_COMPONENT = 'addComponent';
  var MSG_EDIT_LAYOUT = 'editLayout';
  var MSG_EDIT_CHROME_SHELL = 'editChromeShell';
  var MSG_NAVIGATION = 'navigation';

  function parseEditModeParam() {
    try {
      var v = new URLSearchParams(global.location.search).get('editmode');
      if (v == null || v === '') return null;
      v = String(v).trim().toLowerCase();
      if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
      if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  function readStoredEditMode() {
    try {
      return global.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function writeStoredEditMode(on) {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
  }

  function resolveEditMode() {
    var param = parseEditModeParam();
    if (param !== null) return param;
    return readStoredEditMode();
  }

  function applyEditMode(on) {
    var root = global.document.documentElement;
    root.classList.toggle('gt6-edit-mode', on);
    root.dataset.gt6EditMode = on ? '1' : '0';
    writeStoredEditMode(on);
    global.__GT6_EDIT_MODE__ = on;
  }

  function getPageCode() {
    var root = global.document.documentElement;
    return (root.dataset.gt6PageCode || '').trim();
  }

  function postToParent(type, payload) {
    if (global.parent === global) return;
    try {
      global.parent.postMessage(
        {
          source: SOURCE,
          type: type,
          payload: payload || {},
        },
        '*'
      );
    } catch (e) {
      console.warn('[gt6-edit-mode] postMessage failed', e);
    }
  }

  function notifyNavigation() {
    if (!global.__GT6_EDIT_MODE__) return;
    postToParent(MSG_NAVIGATION, {
      href: global.location.href,
      pathname: global.location.pathname,
      pageCode: getPageCode(),
    });
  }

  function onEditChromeShellClick(btn) {
    var part = btn.closest('[data-chrome-part][data-chrome-nested="1"]');
    if (!part) return;
    var componentName = (part.getAttribute('data-gt6-component-name') || part.getAttribute('data-chrome-part') || '').trim();
    var componentId = (part.getAttribute('data-gt6-component-id') || '').trim();
    var normalizedCode = (part.getAttribute('data-gt6-normalized-code') || componentName).trim();
    var chromeKind = (part.getAttribute('data-gt6-chrome-kind') || '').trim();

    postToParent(MSG_EDIT_CHROME_SHELL, {
      componentName: componentName,
      componentId: componentId,
      normalizedCode: normalizedCode,
      chromeKind: chromeKind,
      href: global.location.href,
    });
  }

  function injectChromeNestedEditChrome() {
    global.document.querySelectorAll('.gt6-chrome-nested-edit-chrome').forEach(function (el) {
      el.remove();
    });
    if (!global.__GT6_EDIT_MODE__) return;

    global.document.querySelectorAll('[data-chrome-part][data-chrome-nested="1"]').forEach(function (part) {
      if (part.querySelector('.gt6-chrome-nested-edit-chrome')) return;
      var label = part.getAttribute('data-gt6-chrome-edit-label') || '';
      var chrome = global.document.createElement('div');
      chrome.className = 'gt6-slot-edit-chrome gt6-chrome-nested-edit-chrome';
      chrome.setAttribute('aria-hidden', 'true');
      var line = global.document.createElement('span');
      line.className = 'gt6-slot-edit-line';
      line.setAttribute('aria-hidden', 'true');
      var editBtn = global.document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'gt6-slot-edit-btn';
      editBtn.setAttribute('data-gt6-action', 'edit-chrome-shell');
      editBtn.textContent = label;
      chrome.appendChild(line);
      chrome.appendChild(editBtn);
      part.appendChild(chrome);
    });
  }

  function onEditComponentClick(btn) {
    var slot = btn.closest('.gt6-page-component-slot');
    if (!slot) return;
    var pageCode =
      (slot.dataset.gt6PageCode || getPageCode() || '').trim();
    var componentName = (slot.dataset.gt6ComponentName || '').trim();
    var componentId = (slot.dataset.gt6ComponentId || '').trim();
    var normalizedCode = (slot.dataset.gt6NormalizedCode || '').trim();

    postToParent(MSG_EDIT_COMPONENT, {
      pageCode: pageCode,
      componentName: componentName,
      componentId: componentId,
      normalizedCode: normalizedCode,
      href: global.location.href,
    });
  }

  function onEditPageClick(btn) {
    var block = btn.closest('.gt6-page-markdown-block');
    var pageCode = (block && block.dataset.gt6PageCode
      ? block.dataset.gt6PageCode
      : getPageCode() || ''
    ).trim();

    postToParent(MSG_EDIT_PAGE, {
      pageCode: pageCode,
      href: global.location.href,
      pathname: global.location.pathname,
    });
  }

  function onAddPageClick() {
    postToParent(MSG_ADD_PAGE, {
      pageCode: getPageCode(),
      href: global.location.href,
      pathname: global.location.pathname,
    });
  }

  function onAddComponentClick() {
    postToParent(MSG_ADD_COMPONENT, {
      pageCode: getPageCode(),
      href: global.location.href,
      pathname: global.location.pathname,
    });
  }

  function onEditLayoutClick() {
    postToParent(MSG_EDIT_LAYOUT, {
      componentName: 'layout',
      normalizedCode: 'layout',
      pageCode: getPageCode(),
      href: global.location.href,
      pathname: global.location.pathname,
    });
  }

  function bindEditButtons() {
    global.document.addEventListener('click', function (ev) {
      var target = ev.target;
      if (!target || !target.closest) return;
      if (!global.__GT6_EDIT_MODE__) return;

      var chromeShellBtn = target.closest('[data-gt6-action="edit-chrome-shell"]');
      if (chromeShellBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onEditChromeShellClick(chromeShellBtn);
        return;
      }

      var componentBtn = target.closest('[data-gt6-action="edit-component"]');
      if (componentBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onEditComponentClick(componentBtn);
        return;
      }

      var pageBtn = target.closest('[data-gt6-action="edit-page"]');
      if (pageBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onEditPageClick(pageBtn);
        return;
      }

      var layoutBtn = target.closest('[data-gt6-action="edit-layout"]');
      if (layoutBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onEditLayoutClick();
        return;
      }

      var addPageBtn = target.closest('[data-gt6-action="add-page"]');
      if (addPageBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onAddPageClick();
        return;
      }

      var addBtn = target.closest('[data-gt6-action="add-component"]');
      if (addBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        onAddComponentClick();
      }
    });
  }

  /** 首屏同步：在解析 HTML 后尽快执行，减少无编辑态样式闪烁 */
  function scheduleChromeEditChromeInject() {
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', injectChromeNestedEditChrome, { once: false });
    } else {
      injectChromeNestedEditChrome();
    }
  }

  function bootstrap() {
    applyEditMode(resolveEditMode());
    bindEditButtons();
    scheduleChromeEditChromeInject();
    global.document.addEventListener('astro:page-load', injectChromeNestedEditChrome);
    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', notifyNavigation);
    } else {
      notifyNavigation();
    }
  }

  bootstrap();
})(typeof window !== 'undefined' ? window : globalThis);
